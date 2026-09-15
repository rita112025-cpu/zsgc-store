export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ADMIN_KEY } from "@/lib/types";

function csvField(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function GET(request: Request) {
  if (request.headers.get("x-admin-key") !== ADMIN_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const products = await db.product.findMany({
    include: { variants: true },
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });

  const rows: string[] = [
    "Product,Category,Color,Size,Stock,BasePriceUSD,VariantPriceUSD",
  ];

  for (const p of products) {
    const base = (p.priceCents / 100).toFixed(2);
    if (p.variants.length === 0) {
      // Products without variants get a single row with empty color/size.
      rows.push(
        [
          csvField(p.name),
          csvField(p.category),
          "",
          "",
          "0",
          base,
          base,
        ].join(",")
      );
      continue;
    }
    for (const v of p.variants) {
      const variantPrice = ((p.priceCents + v.priceDelta) / 100).toFixed(2);
      rows.push(
        [
          csvField(p.name),
          csvField(p.category),
          csvField(v.color),
          csvField(v.size),
          String(v.stock),
          base,
          variantPrice,
        ].join(",")
      );
    }
  }

  const csv = rows.join("\n") + "\n";

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": 'attachment; filename="inventory.csv"',
    },
  });
}
