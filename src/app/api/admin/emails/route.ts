export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import type { EmailLog } from "@prisma/client";
import { db } from "@/lib/db";
import { ADMIN_KEY, type EmailLogDTO } from "@/lib/types";

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
  if (request.headers.get("x-admin-key") !== ADMIN_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const emails = await db.emailLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json({ emails: emails.map(mapEmail) });
}
