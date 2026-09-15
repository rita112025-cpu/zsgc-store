export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import type { CartItem, Product, Variant } from "@prisma/client";
import { db } from "@/lib/db";
import type { CartItemDTO, ProductDTO, VariantDTO } from "@/lib/types";

type ProductWithVariants = Product & { variants: Variant[] };
type CartItemWithRelations = CartItem & {
  product: ProductWithVariants;
  variant: Variant | null;
};

function mapVariant(v: Variant): VariantDTO {
  return {
    id: v.id,
    color: v.color,
    size: v.size,
    stock: v.stock,
    priceDelta: v.priceDelta,
  };
}

function mapProduct(p: ProductWithVariants): ProductDTO {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    description: p.description,
    category: p.category,
    priceCents: p.priceCents,
    image: p.image,
    badge: p.badge,
    subscription: p.subscription,
    rating: p.rating,
    active: p.active,
    variants: p.variants.map(mapVariant),
  };
}

function mapCartItem(item: CartItemWithRelations): CartItemDTO {
  return {
    id: item.id,
    quantity: item.quantity,
    product: mapProduct(item.product),
    variant: item.variant ? mapVariant(item.variant) : null,
  };
}

const cartInclude = {
  product: { include: { variants: true } },
  variant: true,
} as const;

export async function GET(request: Request) {
  const sessionId = new URL(request.url).searchParams.get("sessionId");
  if (!sessionId) {
    return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
  }

  const items = await db.cartItem.findMany({
    where: { sessionId },
    include: cartInclude,
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ items: items.map(mapCartItem) });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (
    !body ||
    typeof body.sessionId !== "string" ||
    !body.sessionId ||
    typeof body.productId !== "string" ||
    !body.productId
  ) {
    return NextResponse.json(
      { error: "sessionId and productId are required" },
      { status: 400 }
    );
  }

  const { sessionId, productId } = body as { sessionId: string; productId: string };
  const variantId =
    typeof body.variantId === "string" && body.variantId ? body.variantId : null;
  const quantity =
    Number.isInteger(body.quantity) && (body.quantity as number) > 0
      ? (body.quantity as number)
      : 1;

  const product = await db.product.findUnique({ where: { id: productId } });
  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  if (variantId) {
    const variant = await db.variant.findUnique({ where: { id: variantId } });
    if (!variant || variant.productId !== productId) {
      return NextResponse.json(
        { error: "Variant not found for this product" },
        { status: 400 }
      );
    }
  }

  // Prisma rejects `variantId: null` inside the compound-unique where input,
  // so upsert manually: (sessionId, productId, variantId) is unique per schema.
  const existing = await db.cartItem.findFirst({
    where: { sessionId, productId, variantId: variantId ?? null },
  });

  const item = existing
    ? await db.cartItem.update({
        where: { id: existing.id },
        data: { quantity: { increment: quantity } },
        include: cartInclude,
      })
    : await db.cartItem.create({
        data: { sessionId, productId, variantId, quantity },
        include: cartInclude,
      });

  return NextResponse.json({ item: mapCartItem(item) }, { status: 201 });
}

export async function PATCH(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body.id !== "string" || !body.id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const quantity = Number(body.quantity);
  if (!Number.isInteger(quantity)) {
    return NextResponse.json(
      { error: "quantity must be an integer" },
      { status: 400 }
    );
  }

  const existing = await db.cartItem.findUnique({
    where: { id: body.id },
    include: cartInclude,
  });
  if (!existing) {
    return NextResponse.json({ error: "Cart item not found" }, { status: 404 });
  }

  // quantity <= 0 removes the item
  if (quantity <= 0) {
    await db.cartItem.delete({ where: { id: body.id } });
    return NextResponse.json({ item: null });
  }

  const item = await db.cartItem.update({
    where: { id: body.id },
    data: { quantity },
    include: cartInclude,
  });

  return NextResponse.json({ item: mapCartItem(item) });
}

export async function DELETE(request: Request) {
  const id = new URL(request.url).searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const existing = await db.cartItem.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Cart item not found" }, { status: 404 });
  }

  await db.cartItem.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
