import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

type SeedVariant = { color: string; size?: string; stock: number; priceDelta?: number };

interface SeedProduct {
  slug: string;
  name: string;
  category: string;
  priceCents: number;
  description: string;
  image: string;
  badge?: string;
  subscription?: boolean;
  rating: number;
  variants: SeedVariant[];
}

const PRODUCTS: SeedProduct[] = [
  {
    slug: "heritage-cotton-tee",
    name: "Heritage Cotton Tee",
    category: "Apparel",
    priceCents: 2800,
    description: "Heavyweight 240gsm organic cotton tee with a relaxed fit and garment-washed softness.",
    image: "/products/heritage-cotton-tee.png",
    badge: "BESTSELLER",
    rating: 4.8,
    variants: [
      { color: "Black", size: "S", stock: 24 },
      { color: "Black", size: "M", stock: 32 },
      { color: "Black", size: "L", stock: 18 },
      { color: "Black", size: "XL", stock: 9 },
      { color: "White", size: "S", stock: 21 },
      { color: "White", size: "M", stock: 28 },
      { color: "White", size: "L", stock: 15 },
      { color: "Sage", size: "M", stock: 12, priceDelta: 200 },
      { color: "Sage", size: "L", stock: 7, priceDelta: 200 },
    ],
  },
  {
    slug: "merino-crew-sweater",
    name: "Merino Crew Sweater",
    category: "Apparel",
    priceCents: 9800,
    description: "Fine-gauge extra-fine merino wool crewneck. Breathable, odour-resistant, travels well.",
    image: "/products/merino-crew-sweater.png",
    rating: 4.7,
    variants: [
      { color: "Oatmeal", size: "S", stock: 10 },
      { color: "Oatmeal", size: "M", stock: 14 },
      { color: "Oatmeal", size: "L", stock: 8 },
      { color: "Charcoal", size: "M", stock: 11 },
      { color: "Charcoal", size: "L", stock: 6 },
      { color: "Moss", size: "M", stock: 9, priceDelta: 500 },
      { color: "Moss", size: "L", stock: 4, priceDelta: 500 },
    ],
  },
  {
    slug: "rain-shell-jacket",
    name: "Rain Shell Jacket",
    category: "Apparel",
    priceCents: 14900,
    description: "2.5-layer waterproof shell with fully taped seams and packable hood. 15k/15k rated.",
    image: "/products/rain-shell-jacket.png",
    badge: "SALE",
    rating: 4.9,
    variants: [
      { color: "Forest", size: "S", stock: 6 },
      { color: "Forest", size: "M", stock: 9 },
      { color: "Forest", size: "L", stock: 5 },
      { color: "Slate", size: "M", stock: 7, priceDelta: -1000 },
      { color: "Slate", size: "L", stock: 3, priceDelta: -1000 },
      { color: "Slate", size: "XL", stock: 2, priceDelta: -1000 },
    ],
  },
  {
    slug: "canvas-weekender-bag",
    name: "Canvas Weekender Bag",
    category: "Accessories",
    priceCents: 12800,
    description: "40L waxed-canvas duffel with full-grain leather trim and a laptop-safe interior pocket.",
    image: "/products/canvas-weekender-bag.png",
    rating: 4.6,
    variants: [
      { color: "Olive", stock: 12 },
      { color: "Sand", stock: 8 },
      { color: "Black", stock: 5, priceDelta: 800 },
    ],
  },
  {
    slug: "leather-card-wallet",
    name: "Leather Card Wallet",
    category: "Accessories",
    priceCents: 4200,
    description: "Six-pocket vegetable-tanned leather wallet that develops a rich patina over time.",
    image: "/products/leather-card-wallet.png",
    rating: 4.8,
    variants: [
      { color: "Tan", stock: 30 },
      { color: "Black", stock: 26 },
      { color: "Navy", stock: 14, priceDelta: 300 },
    ],
  },
  {
    slug: "wool-beanie",
    name: "Ribbed Wool Beanie",
    category: "Accessories",
    priceCents: 2400,
    description: "Chunky rib-knit lambswool beanie, double-layered for extra warmth.",
    image: "/products/wool-beanie.png",
    rating: 4.5,
    variants: [
      { color: "Rust", stock: 22 },
      { color: "Cream", stock: 17 },
      { color: "Charcoal", stock: 25 },
    ],
  },
  {
    slug: "stoneware-mug-set",
    name: "Stoneware Mug Set",
    category: "Home",
    priceCents: 3600,
    description: "Set of four hand-glazed 350ml stoneware mugs. Dishwasher and microwave safe.",
    image: "/products/stoneware-mug-set.png",
    rating: 4.7,
    variants: [
      { color: "Speckled", stock: 16 },
      { color: "Slate", stock: 11 },
    ],
  },
  {
    slug: "linen-throw-blanket",
    name: "Linen Throw Blanket",
    category: "Home",
    priceCents: 8900,
    description: "Stonewashed European flax throw with hand-knotted fringe. Gets softer with every wash.",
    image: "/products/linen-throw-blanket.png",
    badge: "NEW",
    rating: 4.9,
    variants: [
      { color: "Sage", stock: 9 },
      { color: "Clay", stock: 6 },
      { color: "Ivory", stock: 4 },
    ],
  },
  {
    slug: "soy-wax-candle",
    name: "Soy Wax Candle",
    category: "Home",
    priceCents: 2200,
    description: "45-hour burn time, cotton wick, and a reusable amber glass vessel.",
    image: "/products/soy-wax-candle.png",
    subscription: true,
    rating: 4.4,
    variants: [
      { color: "Cedar & Smoke", stock: 40 },
      { color: "Amber & Moss", stock: 34 },
      { color: "Fig & Sea Salt", stock: 28 },
    ],
  },
  {
    slug: "wireless-earbuds",
    name: "Wireless Earbuds",
    category: "Tech",
    priceCents: 7900,
    description: "Hybrid active noise cancelling, 32h total battery, and multipoint Bluetooth 5.3.",
    image: "/products/wireless-earbuds.png",
    badge: "BESTSELLER",
    rating: 4.6,
    variants: [
      { color: "Black", stock: 19 },
      { color: "White", stock: 13 },
    ],
  },
  {
    slug: "desk-charging-pad",
    name: "Desk Charging Pad",
    category: "Tech",
    priceCents: 5400,
    description: "15W dual-coil fast-charging pad with a woven fabric top and anti-slip base.",
    image: "/products/desk-charging-pad.png",
    rating: 4.3,
    variants: [
      { color: "Black", stock: 15 },
      { color: "Gray", stock: 10 },
    ],
  },
  {
    slug: "single-origin-coffee",
    name: "Single-Origin Coffee",
    category: "Pantry",
    priceCents: 1800,
    description: "Freshly roasted single-origin beans, shipped the day they leave the roaster.",
    image: "/products/single-origin-coffee.png",
    subscription: true,
    rating: 4.9,
    variants: [
      { color: "Light Roast", size: "250g", stock: 45 },
      { color: "Medium Roast", size: "250g", stock: 52 },
      { color: "Dark Roast", size: "250g", stock: 38 },
      { color: "Medium Roast", size: "1kg", stock: 12, priceDelta: 2200 },
      { color: "Dark Roast", size: "1kg", stock: 3, priceDelta: 2200 },
    ],
  },
];

const GIFT_CARDS = [
  { code: "ZSGC-WELCOME-25", balanceCents: 2500 },
  { code: "ZSGC-HOLIDAY-50", balanceCents: 5000 },
  { code: "ZSGC-VIP-100", balanceCents: 10000 },
];

async function main() {
  console.log("Seeding products…");
  const productIds: Record<string, string> = {};

  for (const p of PRODUCTS) {
    const product = await db.product.upsert({
      where: { slug: p.slug },
      update: {
        name: p.name,
        description: p.description,
        category: p.category,
        priceCents: p.priceCents,
        image: p.image,
        badge: p.badge ?? null,
        subscription: p.subscription ?? false,
        rating: p.rating,
      },
      create: {
        slug: p.slug,
        name: p.name,
        description: p.description,
        category: p.category,
        priceCents: p.priceCents,
        image: p.image,
        badge: p.badge ?? null,
        subscription: p.subscription ?? false,
        rating: p.rating,
      },
    });
    productIds[p.slug] = product.id;

    const existing = await db.variant.findMany({ where: { productId: product.id } });
    const key = (v: { color: string; size?: string }) => `${v.color}|${v.size ?? ""}`;
    const existingKeys = new Set(existing.map((v) => `${v.color}|${v.size}`));

    for (const v of p.variants) {
      if (!existingKeys.has(key(v))) {
        await db.variant.create({
          data: {
            productId: product.id,
            color: v.color,
            size: v.size ?? "",
            stock: v.stock,
            priceDelta: v.priceDelta ?? 0,
          },
        });
      }
    }
    // Remove variants no longer in the seed definition
    const wantedKeys = new Set(p.variants.map(key));
    for (const ev of existing) {
      if (!wantedKeys.has(`${ev.color}|${ev.size}`)) {
        await db.variant.delete({ where: { id: ev.id } });
      }
    }
  }

  console.log("Seeding gift cards…");
  for (const gc of GIFT_CARDS) {
    await db.giftCard.upsert({
      where: { code: gc.code },
      update: {},
      create: { code: gc.code, balanceCents: gc.balanceCents, initialCents: gc.balanceCents },
    });
  }

  // ── Historical orders (spread over the last 14 days for dashboard charts) ──
  const orderCount = await db.order.count();
  if (orderCount === 0) {
    console.log("Seeding historical orders…");
    const day = 24 * 60 * 60 * 1000;
    const now = Date.now();
    const seedOrders: {
      daysAgo: number;
      email: string;
      items: { slug: string; qty: number; color?: string; size?: string }[];
    }[] = [
      { daysAgo: 13, email: "amelia@example.com", items: [{ slug: "heritage-cotton-tee", qty: 2, color: "Black", size: "M" }, { slug: "wool-beanie", qty: 1, color: "Rust" }] },
      { daysAgo: 11, email: "ravi@example.com", items: [{ slug: "merino-crew-sweater", qty: 1, color: "Oatmeal", size: "M" }] },
      { daysAgo: 9, email: "sofia@example.com", items: [{ slug: "rain-shell-jacket", qty: 1, color: "Forest", size: "M" }, { slug: "leather-card-wallet", qty: 1, color: "Tan" }] },
      { daysAgo: 7, email: "amelia@example.com", items: [{ slug: "stoneware-mug-set", qty: 1, color: "Speckled" }] },
      { daysAgo: 6, email: "kenji@example.com", items: [{ slug: "wireless-earbuds", qty: 1, color: "Black" }, { slug: "desk-charging-pad", qty: 2, color: "Gray" }] },
      { daysAgo: 4, email: "nora@example.com", items: [{ slug: "linen-throw-blanket", qty: 1, color: "Sage" }, { slug: "soy-wax-candle", qty: 3, color: "Cedar & Smoke" }] },
      { daysAgo: 3, email: "ravi@example.com", items: [{ slug: "single-origin-coffee", qty: 2, color: "Medium Roast", size: "250g" }] },
      { daysAgo: 1, email: "sofia@example.com", items: [{ slug: "canvas-weekender-bag", qty: 1, color: "Olive" }, { slug: "wool-beanie", qty: 2, color: "Cream" }] },
    ];

    for (const o of seedOrders) {
      const createdAt = new Date(now - o.daysAgo * day);
      const lines = o.items.map((it) => {
        const p = PRODUCTS.find((x) => x.slug === it.slug)!;
        const variant = p.variants.find(
          (v) => v.color === (it.color ?? "") && (v.size ?? "") === (it.size ?? "")
        ) ?? p.variants.find((v) => v.color === (it.color ?? ""));
        const unit = p.priceCents + (variant?.priceDelta ?? 0);
        return {
          productId: productIds[it.slug],
          name: p.name,
          variantLabel: [it.color, it.size].filter(Boolean).join(" / "),
          unitPriceCents: unit,
          quantity: it.qty,
        };
      });
      const subtotal = lines.reduce((s, l) => s + l.unitPriceCents * l.quantity, 0);
      const hasSub = o.items.some((it) => PRODUCTS.find((x) => x.slug === it.slug)?.subscription);
      const order = await db.order.create({
        data: {
          sessionId: `seed-${o.daysAgo}-${o.email.split("@")[0]}`,
          email: o.email,
          subtotalCents: subtotal,
          totalCents: subtotal,
          currency: "USD",
          totalMajor: subtotal / 100,
          status: o.daysAgo > 5 ? "delivered" : o.daysAgo > 2 ? "shipped" : "paid",
          hasSubscription: hasSub,
          createdAt,
          items: { create: lines },
        },
      });
      if (hasSub) {
        for (const it of o.items) {
          const p = PRODUCTS.find((x) => x.slug === it.slug)!;
          if (p.subscription) {
            await db.subscription.create({
              data: { sessionId: order.sessionId, productId: productIds[it.slug], createdAt },
            });
          }
        }
      }
    }
  }

  const counts = {
    products: await db.product.count(),
    variants: await db.variant.count(),
    giftCards: await db.giftCard.count(),
    orders: await db.order.count(),
  };
  console.log("Seed complete:", counts);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
