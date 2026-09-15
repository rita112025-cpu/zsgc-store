export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ADMIN_KEY } from "@/lib/types";
import { adminReadOnlyResponse, adminWritesEnabled } from "@/lib/admin-mode";

export async function GET(request: Request) {
  if (request.headers.get("x-admin-key") !== ADMIN_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const items = await db.cartItem.findMany({
    include: { product: { select: { priceCents: true } } },
    orderBy: { updatedAt: "desc" },
  });

  // Aggregate per session, ignoring seed sessions.
  const carts = new Map<
    string,
    { sessionId: string; itemCount: number; totalCents: number; lastUpdated: Date }
  >();
  for (const item of items) {
    if (item.sessionId.startsWith("seed-")) continue;
    const entry = carts.get(item.sessionId) ?? {
      sessionId: item.sessionId,
      itemCount: 0,
      totalCents: 0,
      lastUpdated: item.updatedAt,
    };
    entry.itemCount += item.quantity;
    entry.totalCents += item.product.priceCents * item.quantity;
    if (item.updatedAt > entry.lastUpdated) entry.lastUpdated = item.updatedAt;
    carts.set(item.sessionId, entry);
  }

  const list = [...carts.values()]
    .sort((a, b) => a.lastUpdated.getTime() - b.lastUpdated.getTime())
    .map((c) => ({
      sessionId: c.sessionId,
      itemCount: c.itemCount,
      totalCents: c.totalCents,
      lastUpdated: c.lastUpdated.toISOString(),
    }));

  return NextResponse.json({ carts: list });
}

export async function POST(request: Request) {
  if (request.headers.get("x-admin-key") !== ADMIN_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!adminWritesEnabled()) return adminReadOnlyResponse();

  const body = await request.json().catch(() => null);
  if (!body || typeof body.sessionId !== "string" || !body.sessionId) {
    return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
  }
  const sessionId = body.sessionId as string;

  const items = await db.cartItem.findMany({
    where: { sessionId },
    include: { product: true, variant: true },
    orderBy: { createdAt: "asc" },
  });
  if (items.length === 0) {
    return NextResponse.json({ error: "Cart not found" }, { status: 404 });
  }

  // Best-known contact for the session: their last order email, else a guest alias.
  const lastOrder = await db.order.findFirst({
    where: { sessionId },
    orderBy: { createdAt: "desc" },
  });
  const to = lastOrder ? lastOrder.email : `guest+${sessionId}@zsgc.store`;

  const totalCents = items.reduce(
    (sum, i) => sum + (i.product.priceCents + (i.variant ? i.variant.priceDelta : 0)) * i.quantity,
    0
  );
  const lines = items.map(
    (i) =>
      `- ${i.product.name}${
        i.variant ? [i.variant.color, i.variant.size].filter(Boolean).join(" / ") : ""
      } x ${i.quantity}`
  );

  await db.emailLog.create({
    data: {
      to,
      subject: "You left something in your cart — complete your checkout",
      body: [
        "Still thinking it over?",
        "",
        "Your cart is waiting for you:",
        ...lines,
        "",
        `Cart total: $${(totalCents / 100).toFixed(2)}`,
        "",
        "Come back soon — your items are reserved while stock lasts.",
      ].join("\n"),
      kind: "abandoned_cart",
      sessionId,
    },
  });

  return NextResponse.json({ ok: true });
}
