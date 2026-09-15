export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { CURRENCIES } from "@/lib/currency";

export async function GET() {
  return NextResponse.json({ currencies: CURRENCIES });
}
