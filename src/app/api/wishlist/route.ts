export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import type { Product, Variant, WishlistItem } from "@prisma/client";
import { db } from "@/lib/db";
import type { ProductDTO, VariantDTO, WishlistItemDTO } from "@/lib/types";

type ProductWithVariants = Product & { variants: Variant[] };
type WishlistItemWithProduct = WishlistItem & { product: ProductWithVariants };

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

function mapWishlistItem(item: WishlistItemWithProduct): WishlistItemDTO {
  return { id: item.id, product: mapProduct(item.product) };
}

const wishlistInclude = {
  product: { include: { variants: true } },
} as const;

export async function GET(request: Request) {
  const sessionId = new URL(request.url).searchParams.get("sessionId");
  if (!sessionId) {
    return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
  }

  const items = await db.wishlistItem.findMany({
    where: { sessionId },
    include: wishlistInclude,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ items: items.map(mapWishlistItem) });
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

  const product = await db.product.findUnique({ where: { id: productId } });
  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const item = await db.wishlistItem.upsert({
    where: { sessionId_productId: { sessionId, productId } },
    update: {},
    create: { sessionId, productId },
    include: wishlistInclude,
  });

  return NextResponse.json({ item: mapWishlistItem(item) }, { status: 201 });
}

export async function DELETE(request: Request) {
  const id = new URL(request.url).searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const existing = await db.wishlistItem.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Wishlist item not found" }, { status: 404 });
  }

  await db.wishlistItem.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
