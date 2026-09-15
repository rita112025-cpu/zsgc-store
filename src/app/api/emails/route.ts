export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import type { EmailLog } from "@prisma/client";
import { db } from "@/lib/db";
import type { EmailLogDTO } from "@/lib/types";

function mapEmail(e: EmailLog): EmailLogDTO {
  return {
    id: e.id,
    to: e.to,
    subject: e.subject,
    body: e.body,
    kind: e.kind,
    sessionId: e.sessionId,
    createdAt: e.createdAt.toISOString(),
  };
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const sessionId = params.get("sessionId");
  if (!sessionId) {
    return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
  }

  const limitRaw = parseInt(params.get("limit") ?? "20", 10);
  const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 100) : 20;

  const emails = await db.emailLog.findMany({
    where: { sessionId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return NextResponse.json({ emails: emails.map(mapEmail) });
}
