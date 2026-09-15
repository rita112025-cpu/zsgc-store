export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import type { Product, Variant } from "@prisma/client";
import { db } from "@/lib/db";
import type { ProductDTO, VariantDTO } from "@/lib/types";

type ProductWithVariants = Product & { variants: Variant[] };

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

export async function GET() {
  const products = await db.product.findMany({
    where: { active: true },
    include: { variants: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ products: products.map(mapProduct) });
}
