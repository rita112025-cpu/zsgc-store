export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import type {
  CartItem,
  EmailLog,
  GiftCard,
  Order,
  OrderItem,
  Product,
  Variant,
} from "@prisma/client";
import { db } from "@/lib/db";
import {
  convertCentsToMajor,
  formatMoney,
  getCurrency,
  type CurrencyCode,
} from "@/lib/currency";
import type { EmailLogDTO, OrderDTO, OrderItemDTO } from "@/lib/types";

/** Thrown inside the transaction to roll back with a 400 user-facing error. */
class CheckoutError extends Error {}

type ProductWithVariants = Product & { variants: Variant[] };
type CartItemWithRelations = CartItem & {
  product: ProductWithVariants;
  variant: Variant | null;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function variantLabel(v: Variant | null): string {
  if (!v) return "";
  return [v.color, v.size].filter(Boolean).join(" / ");
}

function mapOrderItem(i: OrderItem): OrderItemDTO {
  return {
    id: i.id,
    productId: i.productId,
    name: i.name,
    variantLabel: i.variantLabel,
    unitPriceCents: i.unitPriceCents,
    quantity: i.quantity,
  };
}

function mapOrder(o: Order & { items: OrderItem[] }): OrderDTO {
  return {
    id: o.id,
    email: o.email,
    subtotalCents: o.subtotalCents,
    loyaltyCents: o.loyaltyCents,
    giftCardCents: o.giftCardCents,
    totalCents: o.totalCents,
    currency: o.currency,
    totalMajor: o.totalMajor,
    status: o.status,
    giftCardCode: o.giftCardCode,
    loyaltyPointsUsed: o.loyaltyPointsUsed,
    hasSubscription: o.hasSubscription,
    createdAt: o.createdAt.toISOString(),
    items: o.items.map(mapOrderItem),
  };
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body.sessionId !== "string" || !body.sessionId) {
    return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
  }

  const sessionId = body.sessionId as string;
  const email = typeof body.email === "string" ? body.email.trim() : "";
  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json(
      { error: "A valid email address is required" },
      { status: 400 }
    );
  }

  const currencyInfo = getCurrency(
    typeof body.currency === "string" && body.currency ? body.currency : "USD"
  );
  const currency: CurrencyCode = currencyInfo.code;

  const useLoyalty = body.useLoyalty === true;

  // Gift card pre-validation (fast 400s before opening a transaction)
  const rawCode = typeof body.giftCardCode === "string" ? body.giftCardCode.trim() : "";
  let giftCard: GiftCard | null = null;
  if (rawCode) {
    giftCard = await db.giftCard.findUnique({ where: { code: rawCode } });
    if (!giftCard && rawCode !== rawCode.toUpperCase()) {
      // be forgiving about casing
      giftCard = await db.giftCard.findUnique({ where: { code: rawCode.toUpperCase() } });
    }
    if (!giftCard) {
      return NextResponse.json({ error: "Invalid gift card code" }, { status: 400 });
    }
    if (giftCard.balanceCents <= 0) {
      return NextResponse.json(
        { error: "Gift card has no remaining balance" },
        { status: 400 }
      );
    }
  }

  let checkout;
  try {
    checkout = await db.$transaction(async (tx) => {
      // ---- Validate cart -------------------------------------------------
      const items: CartItemWithRelations[] = await tx.cartItem.findMany({
        where: { sessionId },
        include: { product: { include: { variants: true } }, variant: true },
        orderBy: { createdAt: "asc" },
      });
      if (items.length === 0) {
        throw new CheckoutError("Your cart is empty");
      }

      // ---- Totals ----------------------------------------------------------
      const subtotal = items.reduce(
        (sum, i) =>
          sum + (i.product.priceCents + (i.variant ? i.variant.priceDelta : 0)) * i.quantity,
        0
      );

      // Loyalty: lazily create the account with 250 welcome points so a
      // first-time customer can redeem immediately (earned before deduction).
      let account = await tx.loyaltyAccount.findUnique({ where: { sessionId } });
      if (!account) {
        account = await tx.loyaltyAccount.create({
          data: { sessionId, points: 250 },
        });
      }
      const points = account.points;

      const loyaltyDiscount = useLoyalty ? Math.min(points * 5, subtotal) : 0;
      const pointsUsed = useLoyalty
        ? Math.min(points, Math.ceil(loyaltyDiscount / 5))
        : 0;

      const remainingAfterLoyalty = subtotal - loyaltyDiscount;
      const giftCardDeduction = giftCard
        ? Math.min(giftCard.balanceCents, remainingAfterLoyalty)
        : 0;
      const grandTotal = subtotal - loyaltyDiscount - giftCardDeduction;

      // ---- Stock guard: never drop below 0 --------------------------------
      for (const item of items) {
        if (item.variantId && item.variant) {
          const res = await tx.variant.updateMany({
            where: { id: item.variant.id, stock: { gte: item.quantity } },
            data: { stock: { decrement: item.quantity } },
          });
          if (res.count === 0) {
            throw new CheckoutError(
              `Insufficient stock for ${item.product.name} (${variantLabel(item.variant) || "default"})`
            );
          }
        }
      }

      // ---- Order + snapshot items ------------------------------------------
      const hasSubscription = items.some((i) => i.product.subscription);
      const order = await tx.order.create({
        data: {
          sessionId,
          email,
          subtotalCents: subtotal,
          loyaltyCents: loyaltyDiscount,
          giftCardCents: giftCardDeduction,
          totalCents: grandTotal,
          currency,
          totalMajor: convertCentsToMajor(grandTotal, currency),
          status: "paid",
          giftCardCode: giftCard ? giftCard.code : null,
          loyaltyPointsUsed: pointsUsed,
          hasSubscription,
          items: {
            create: items.map((i) => ({
              productId: i.productId,
              name: i.product.name,
              variantLabel: variantLabel(i.variant),
              unitPriceCents: i.product.priceCents + (i.variant ? i.variant.priceDelta : 0),
              quantity: i.quantity,
            })),
          },
        },
        include: { items: true },
      });

      // ---- Gift card ledger + balance --------------------------------------
      let giftCardRemainingCents: number | null = null;
      if (giftCard) {
        giftCardRemainingCents = giftCard.balanceCents - giftCardDeduction;
        if (giftCardDeduction > 0) {
          await tx.giftCardTransaction.create({
            data: {
              giftCardId: giftCard.id,
              amountCents: -giftCardDeduction,
              orderId: order.id,
              note: `Redeemed on order ${order.id}`,
            },
          });
          await tx.giftCard.update({
            where: { id: giftCard.id },
            data: {
              balanceCents: giftCardRemainingCents,
              status: giftCardRemainingCents === 0 ? "redeemed" : "active",
            },
          });
        }
      }

      // ---- Loyalty: deduct used points, earn floor(subtotal / 100) ---------
      const earned = Math.floor(subtotal / 100);
      const loyaltyBalance = Math.max(0, points - pointsUsed) + earned;
      await tx.loyaltyAccount.update({
        where: { id: account.id },
        data: { points: loyaltyBalance },
      });

      // ---- Subscriptions for subscription-eligible products ----------------
      const subscriptionProductIds = [
        ...new Set(items.filter((i) => i.product.subscription).map((i) => i.productId)),
      ];
      for (const productId of subscriptionProductIds) {
        const existing = await tx.subscription.findFirst({
          where: { sessionId, productId },
        });
        if (!existing) {
          await tx.subscription.create({
            data: { sessionId, productId, interval: "monthly", status: "active" },
          });
        }
      }

      // ---- Order confirmation email ----------------------------------------
      const lines = items.map(
        (i) =>
          `- ${i.product.name}${variantLabel(i.variant) ? ` (${variantLabel(i.variant)})` : ""} x ${i.quantity} — ${formatMoney(
            i.product.priceCents + (i.variant ? i.variant.priceDelta : 0),
            currency
          )}`
      );
      const emailBody = [
        `Thanks for your order, ${email}!`,
        "",
        `Order ID: ${order.id}`,
        "",
        "Items:",
        ...lines,
        "",
        `Subtotal: ${formatMoney(subtotal, currency)}`,
        loyaltyDiscount > 0 ? `Loyalty discount: -${formatMoney(loyaltyDiscount, currency)}` : null,
        giftCardDeduction > 0
          ? `Gift card (${giftCard ? giftCard.code : ""}): -${formatMoney(giftCardDeduction, currency)}`
          : null,
        `Total: ${formatMoney(grandTotal, currency)}`,
      ]
        .filter((l): l is string => l !== null)
        .join("\n");

      await tx.emailLog.create({
        data: {
          to: email,
          subject: "Your ZSGC Store order is confirmed",
          body: emailBody,
          kind: "order_confirmation",
          sessionId,
        },
      });

      // ---- Clear the cart ---------------------------------------------------
      await tx.cartItem.deleteMany({ where: { sessionId } });

      return { order, giftCardRemainingCents, loyaltyBalance, pointsUsed, earned, subtotal, loyaltyDiscount, giftCardDeduction, grandTotal };
    });
  } catch (err) {
    if (err instanceof CheckoutError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    throw err;
  }

  const { order, ...rest } = checkout;

  return NextResponse.json({
    checkout: {
      order: mapOrder(order),
      giftCardRemainingCents: rest.giftCardRemainingCents,
      loyalty: {
        used: rest.pointsUsed,
        earned: rest.earned,
        balance: rest.loyaltyBalance,
      },
      totals: {
        subtotalCents: rest.subtotal,
        loyaltyCents: rest.loyaltyDiscount,
        giftCardCents: rest.giftCardDeduction,
        grandTotalCents: rest.grandTotal,
        currency,
        totalMajor: convertCentsToMajor(rest.grandTotal, currency),
      },
    },
  });
}
