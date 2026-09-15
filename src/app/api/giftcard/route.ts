export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  const code = new URL(request.url).searchParams.get("code");
  if (!code || !code.trim()) {
    return NextResponse.json({ error: "code is required" }, { status: 400 });
  }

  const trimmed = code.trim();
  let giftCard = await db.giftCard.findUnique({ where: { code: trimmed } });
  if (!giftCard && trimmed !== trimmed.toUpperCase()) {
    giftCard = await db.giftCard.findUnique({ where: { code: trimmed.toUpperCase() } });
  }

  if (!giftCard) {
    return NextResponse.json({ error: "Gift card not found" }, { status: 404 });
  }

  return NextResponse.json({
    code: giftCard.code,
    balanceCents: giftCard.balanceCents,
    status: giftCard.status,
  });
}
