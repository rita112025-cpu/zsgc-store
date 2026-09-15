export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  const sessionId = new URL(request.url).searchParams.get("sessionId");
  if (!sessionId) {
    return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
  }

  let account = await db.loyaltyAccount.findUnique({ where: { sessionId } });
  let welcomeBonusAwarded = false;

  if (!account) {
    // Lazily create the account with 250 welcome points.
    account = await db.loyaltyAccount.create({
      data: { sessionId, points: 250 },
    });
    welcomeBonusAwarded = true;
  }

  return NextResponse.json({
    points: account.points,
    welcomeBonusAwarded,
  });
}
