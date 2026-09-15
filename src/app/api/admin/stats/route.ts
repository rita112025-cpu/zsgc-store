export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ADMIN_KEY, type StatsDTO } from "@/lib/types";

const DAY_MS = 24 * 60 * 60 * 1000;
const WINDOW_DAYS = 14;
const LOW_STOCK_THRESHOLD = 5;
const TOP_PRODUCTS_LIMIT = 5;
const LOW_STOCK_LIMIT = 10;

function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function variantLabelText(color: string, size: string): string {
  return [color, size].filter(Boolean).join(" / ") || "Default";
}

export async function GET(request: Request) {
  if (request.headers.get("x-admin-key") !== ADMIN_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [orders, orderItems, variants, products, activeSubscriptions] =
    await Promise.all([
      db.order.findMany({ orderBy: { createdAt: "desc" } }),
      db.orderItem.findMany(),
      db.variant.findMany({
        include: { product: { select: { id: true, name: true } } },
      }),
      db.product.findMany({ select: { id: true, category: true } }),
      db.subscription.count({ where: { status: "active" } }),
    ]);

  // ---- Totals ------------------------------------------------------------
  const revenueCents = orders.reduce((sum, o) => sum + o.totalCents, 0);
  const orderCount = orders.length;
  const unitsSold = orderItems.reduce((sum, i) => sum + i.quantity, 0);
  const lowStockVariants = variants.filter((v) => v.stock <= LOW_STOCK_THRESHOLD);

  const stats: StatsDTO = {
    totals: {
      revenueCents,
      orders: orderCount,
      aovCents: orderCount > 0 ? Math.round(revenueCents / orderCount) : 0,
      unitsSold,
      lowStockCount: lowStockVariants.length,
      activeSubscriptions,
    },
    revenueByDay: [],
    topProducts: [],
    categorySplit: [],
    lowStock: [],
  };

  // ---- Revenue by day: last 14 days incl. today, missing days filled with 0
  const byDay = new Map<string, { revenueCents: number; orders: number }>();
  const now = new Date();
  for (let i = WINDOW_DAYS - 1; i >= 0; i--) {
    byDay.set(dayKey(new Date(now.getTime() - i * DAY_MS)), {
      revenueCents: 0,
      orders: 0,
    });
  }
  for (const o of orders) {
    const entry = byDay.get(dayKey(o.createdAt));
    if (entry) {
      entry.revenueCents += o.totalCents;
      entry.orders += 1;
    }
  }
  stats.revenueByDay = [...byDay.entries()].map(([date, v]) => ({
    date,
    revenueCents: v.revenueCents,
    orders: v.orders,
  }));

  // ---- Top products: grouped by OrderItem name -----------------------------
  const productMap = new Map<string, { name: string; units: number; revenueCents: number }>();
  for (const item of orderItems) {
    const entry = productMap.get(item.name) ?? {
      name: item.name,
      units: 0,
      revenueCents: 0,
    };
    entry.units += item.quantity;
    entry.revenueCents += item.unitPriceCents * item.quantity;
    productMap.set(item.name, entry);
  }
  stats.topProducts = [...productMap.values()]
    .sort((a, b) => b.units - a.units || b.revenueCents - a.revenueCents)
    .slice(0, TOP_PRODUCTS_LIMIT);

  // ---- Category split: revenue via productId -> product.category -----------
  const categoryOf = new Map(products.map((p) => [p.id, p.category]));
  const categoryMap = new Map<string, number>();
  for (const item of orderItems) {
    const category = categoryOf.get(item.productId) ?? "Other";
    categoryMap.set(category, (categoryMap.get(category) ?? 0) + item.unitPriceCents * item.quantity);
  }
  stats.categorySplit = [...categoryMap.entries()]
    .map(([category, revenue]) => ({ category, revenueCents: revenue }))
    .sort((a, b) => b.revenueCents - a.revenueCents);

  // ---- Low stock -----------------------------------------------------------
  stats.lowStock = lowStockVariants
    .sort((a, b) => a.stock - b.stock)
    .slice(0, LOW_STOCK_LIMIT)
    .map((v) => ({
      productId: v.productId,
      name: v.product.name,
      variantLabel: variantLabelText(v.color, v.size),
      stock: v.stock,
    }));

  return NextResponse.json({ stats });
}
