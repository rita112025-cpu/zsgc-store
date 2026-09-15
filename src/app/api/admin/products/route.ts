export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import type { Product, Variant } from "@prisma/client";
import { db } from "@/lib/db";
import { ADMIN_KEY, type ProductDTO, type VariantDTO } from "@/lib/types";

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

const productInclude = { variants: true } as const;

function isAdmin(request: Request): boolean {
  return request.headers.get("x-admin-key") === ADMIN_KEY;
}

function slugify(value: string): string {
  return (
    value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "product"
  );
}

async function uniqueSlug(base: string): Promise<string> {
  let candidate = base;
  while (await db.product.findUnique({ where: { slug: candidate } })) {
    candidate = `${base}-${Math.random().toString(36).slice(2, 7)}`;
  }
  return candidate;
}

export async function GET(request: Request) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const products = await db.product.findMany({
    include: productInclude,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ products: products.map(mapProduct) });
}

export async function POST(request: Request) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (
    !body ||
    typeof body.name !== "string" ||
    !body.name.trim() ||
    typeof body.category !== "string" ||
    !body.category.trim() ||
    !Number.isInteger(body.priceCents) ||
    (body.priceCents as number) < 0
  ) {
    return NextResponse.json(
      { error: "name, category and integer priceCents >= 0 are required" },
      { status: 400 }
    );
  }

  const baseSlug = slugify(
    typeof body.slug === "string" && body.slug ? body.slug : body.name
  );
  const slug = await uniqueSlug(baseSlug);

  const product = await db.product.create({
    data: {
      name: body.name.trim(),
      slug,
      category: body.category.trim(),
      priceCents: body.priceCents as number,
      description:
        typeof body.description === "string" ? body.description : "",
      image: typeof body.image === "string" ? body.image : "",
      badge: typeof body.badge === "string" && body.badge ? body.badge : null,
      subscription: body.subscription === true,
      active: body.active === undefined ? true : body.active === true,
    },
    include: productInclude,
  });

  return NextResponse.json({ product: mapProduct(product) }, { status: 201 });
}

export async function PATCH(request: Request) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body.id !== "string" || !body.id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const existing = await db.product.findUnique({ where: { id: body.id } });
  if (!existing) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const data: Record<string, unknown> = {};
  if (typeof body.name === "string" && body.name.trim()) data.name = body.name.trim();
  if (typeof body.category === "string" && body.category.trim())
    data.category = body.category.trim();
  if (Number.isInteger(body.priceCents) && (body.priceCents as number) >= 0)
    data.priceCents = body.priceCents;
  if (typeof body.description === "string") data.description = body.description;
  if (typeof body.image === "string") data.image = body.image;
  if (body.badge === null || typeof body.badge === "string") data.badge = body.badge;
  if (typeof body.subscription === "boolean") data.subscription = body.subscription;
  if (typeof body.active === "boolean") data.active = body.active;
  if (typeof body.rating === "number" && Number.isFinite(body.rating))
    data.rating = body.rating;
  if (typeof body.slug === "string" && body.slug) data.slug = slugify(body.slug);

  const product = await db.product.update({
    where: { id: body.id },
    data,
    include: productInclude,
  });

  return NextResponse.json({ product: mapProduct(product) });
}

export async function PUT(request: Request) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body.id !== "string" || !body.id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }
  if (!Array.isArray(body.variants)) {
    return NextResponse.json(
      { error: "variants array is required" },
      { status: 400 }
    );
  }

  const existing = await db.product.findUnique({ where: { id: body.id } });
  if (!existing) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  // Normalize + de-duplicate on (color, size) to respect the compound unique.
  const byKey = new Map<
    string,
    { color: string; size: string; stock: number; priceDelta: number }
  >();
  for (const v of body.variants) {
    const color = typeof v?.color === "string" ? v.color : "";
    const size = typeof v?.size === "string" ? v.size : "";
    const stock = Number.isInteger(v?.stock) && (v?.stock as number) >= 0 ? v.stock : 0;
    const priceDelta = Number.isInteger(v?.priceDelta) ? v.priceDelta : 0;
    byKey.set(`${color}||${size}`, { color, size, stock, priceDelta });
  }

  const product = await db.$transaction(async (tx) => {
    await tx.variant.deleteMany({ where: { productId: body.id } });
    for (const v of byKey.values()) {
      await tx.variant.create({ data: { productId: body.id, ...v } });
    }
    return tx.product.findUniqueOrThrow({
      where: { id: body.id },
      include: productInclude,
    });
  });

  return NextResponse.json({ product: mapProduct(product) });
}

export async function DELETE(request: Request) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = new URL(request.url).searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const existing = await db.product.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  // Hard delete. OrderItem/Subscription rows reference the product without
  // cascade in the schema, so remove those first; Variant/CartItem/WishlistItem
  // cascade automatically.
  await db.$transaction([
    db.orderItem.deleteMany({ where: { productId: id } }),
    db.subscription.deleteMany({ where: { productId: id } }),
    db.product.delete({ where: { id } }),
  ]);

  return NextResponse.json({ ok: true });
}
