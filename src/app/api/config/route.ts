export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { CURRENCIES } from "@/lib/currency";
import { adminWritesEnabled } from "@/lib/admin-mode";

export async function GET() {
  return NextResponse.json({ currencies: CURRENCIES, adminReadOnly: !adminWritesEnabled() });
}
