export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import type { Order, OrderItem } from "@prisma/client";
import { db } from "@/lib/db";
import type { OrderDTO, OrderItemDTO } from "@/lib/types";

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

export async function GET(request: Request) {
  const sessionId = new URL(request.url).searchParams.get("sessionId");
  if (!sessionId) {
    return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
  }

  const orders = await db.order.findMany({
    where: { sessionId },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ orders: orders.map(mapOrder) });
}
