# Project Worklog — ZSGC Store

Single-page e-commerce app (Next.js 16 App Router). User-visible route: `/` only.
Money is stored/passed as **USD cents (Int)** everywhere; client converts for display.

---

Task ID: 1
Agent: Z.ai Code (orchestrator)
Task: Rebuild project foundation (sandbox was reset — only starter template existed). Schema, seed, shared libs, worklog init.

Work Log:
- Rewrote `prisma/schema.prisma`: Product, Variant, CartItem, WishlistItem, Order, OrderItem, GiftCard, GiftCardTransaction, LoyaltyAccount, Subscription, EmailLog
- `bun run db:push` — schema live on SQLite (db/custom.db)
- Wrote `prisma/seed.ts`, ran it: 12 products (Apparel/Accessories/Home/Tech/Pantry), 48 variants, 3 gift cards (ZSGC-WELCOME-25 $25, ZSGC-HOLIDAY-50 $50, ZSGC-VIP-100 $100), 8 historical orders across last 14 days, 2 subscription-eligible products (soy-wax-candle, single-origin-coffee)
- Wrote shared libs:
  - `src/lib/currency.ts` — CURRENCIES (USD/EUR/GBP/TWD), formatMoney(), convertCentsToMajor()
  - `src/lib/types.ts` — DTOs (ProductDTO, VariantDTO, CartItemDTO, OrderDTO, CheckoutResult, StatsDTO, EmailLogDTO…), ADMIN_KEY = "zsgc-admin"
  - `src/lib/session.ts` — getSessionId() (localStorage uuid), isAdminUnlocked/unlockAdmin/lockAdmin, adminFetch() helper (sends x-admin-key header)

Stage Summary:
- DB live + seeded; shared types/currency/session libs ready.
- API CONTRACT (binding for all agents):
  - All money = USD cents. Errors → `{ error }` with proper status (400/401/404).
  - Admin routes require header `x-admin-key: zsgc-admin`, else 401.
  - GET  /api/products → `{ products: ProductDTO[] }` (active only, include variants, order by createdAt)
  - GET  /api/config → `{ currencies: CurrencyInfo[] }` (import from src/lib/currency.ts)
  - GET  /api/cart?sessionId → `{ items: CartItemDTO[] }` (include product + variant)
  - POST /api/cart { sessionId, productId, variantId?, quantity? } → `{ item }` upsert on (sessionId, productId, variantId)
  - PATCH /api/cart { id, quantity } → `{ item }` (quantity <= 0 deletes)
  - DELETE /api/cart?id → `{ ok: true }`
  - GET  /api/wishlist?sessionId → `{ items: WishlistItemDTO[] }`
  - POST /api/wishlist { sessionId, productId } → `{ item }` upsert
  - DELETE /api/wishlist?id → `{ ok: true }`
  - POST /api/checkout { sessionId, email, currency, giftCardCode?, useLoyalty? } → `{ checkout: CheckoutResult }`; validates cart non-empty (400), looks up gift card (400 if invalid/exhausted when code provided), subtotal → loyalty discount (min(points*5, subtotal), 1pt=$0.05) → gift card deduction (min(balance, remaining)) → grandTotal; in a $transaction: decrement variant stock, create Order+Items (totalMajor via convertCentsToMajor), GiftCardTransaction(-amount), loyalty deduct + earn floor(subtotal/100)/$ pts (upsert LoyaltyAccount), Subscription rows for subscription products, EmailLog (kind "order_confirmation", sessionId attached), clear cart. LoyaltyAccount lazily created with 250 welcome points if absent.
  - GET  /api/orders?sessionId → `{ orders: OrderDTO[] }` (desc, include items)
  - GET  /api/giftcard?code → `{ code, balanceCents, status }` (404 if missing)
  - GET  /api/loyalty?sessionId → `{ points, welcomeBonusAwarded? }` (create w/ 250 pts if absent)
  - GET  /api/emails?sessionId&limit → `{ emails: EmailLogDTO[] }` (filter sessionId, desc)
  - GET  /api/admin/products → `{ products }` (all incl. inactive, w/ variants)
  - POST /api/admin/products { name, category, priceCents, description?, image?, badge?, subscription?, slug? } → `{ product }` (auto-slug if missing)
  - PATCH /api/admin/products { id, …fields } → `{ product }`
  - PUT  /api/admin/products { id, variants: [{color,size,stock,priceDelta}] } → replace full variant set → `{ product }`
  - DELETE /api/admin/products?id → `{ ok: true }` (hard delete, cascade)
  - GET  /api/admin/stats → `{ stats: StatsDTO }` (revenueByDay last 14 days from Order.createdAt, topProducts by units, categorySplit by revenue, lowStock = variants stock<=5 w/ product+label)
  - GET  /api/admin/export → text/csv attachment `inventory.csv` (Product, Category, Color, Size, Stock, BasePriceUSD, VariantPriceUSD)
  - GET  /api/admin/carts → `{ carts: [{ sessionId, itemCount, totalCents, lastUpdated }] }` distinct sessions w/ items, stalest first
  - POST /api/admin/carts { sessionId } → recovery email → EmailLog kind "abandoned_cart" → `{ ok: true }`
  - GET  /api/admin/emails → `{ emails }` all, desc, limit 100
  - ProductDTO/VariantDTO shapes in `src/lib/types.ts` — match exactly.

---

Task ID: 2-b
Agent: general-purpose (image generation)
Task: Generate 12 product photos

Work Log:
- Created output directory `/home/z/my-project/public/products/`
- Loaded image-generation skill; used the `z-ai image` CLI (`-s 1024x1024`) with a shared retry helper (2 attempts per image, then skip)
- Consistent style prompt applied to ALL 12 images: professional e-commerce product photography, single product centered, soft warm neutral light beige/greige seamless studio background, soft diffused lighting, subtle shadow, no text / no watermark / no people
- Batch 1: heritage-cotton-tee, merino-crew-sweater, rain-shell-jacket, canvas-weekender-bag — all OK first attempt
- Batch 2: leather-card-wallet, wool-beanie, stoneware-mug-set, linen-throw-blanket — all OK first attempt
- Batch 3: soy-wax-candle, wireless-earbuds, desk-charging-pad, single-origin-coffee — all OK first attempt
- CLI wrote JPEG bytes under .png names; converted all 12 in place to true PNG via Pillow, then verified with `file`: PNG image data, 1024x1024, 8-bit RGB, non-interlaced, non-zero sizes (0.4–1.2 MB each)
- Cleaned up temp helper script

Stage Summary:
- 12/12 images succeeded, 0 failures, no retries needed, no fallback placeholders required.
- Files (all at /home/z/my-project/public/products/): heritage-cotton-tee.png, merino-crew-sweater.png, rain-shell-jacket.png, canvas-weekender-bag.png, leather-card-wallet.png, wool-beanie.png, stoneware-mug-set.png, linen-throw-blanket.png, soy-wax-candle.png, wireless-earbuds.png, desk-charging-pad.png, single-origin-coffee.png
- Note for other agents: images are served from /products/<name>.png (public dir), square 1024x1024, uniform warm-neutral studio look.

---
---

Task ID: 2-a
Agent: full-stack-developer
Task: Implement backend API routes per contract

Work Log:
- Read worklog contract + src/lib/{types,currency,db}.ts + prisma/schema.prisma; created 14 route files under src/app/api/: products, config, cart, wishlist, checkout, orders, giftcard, loyalty, emails, admin/{products,stats,export,carts,emails}
- All routes: `export const dynamic = "force-dynamic"`, DTO mappers inline (exact shapes from types.ts), money in USD cents
- Admin routes gated on `x-admin-key === ADMIN_KEY` (imported from types.ts) -> 401 { error: "Unauthorized" }
- Checkout: gift-card pre-checks (400 invalid / 400 exhausted) then full db.$transaction: cart validation (400 "Your cart is empty"), subtotal w/ variant priceDelta, lazy LoyaltyAccount create w/ 250 welcome pts (usable same checkout), loyaltyDiscount = min(points*5, subtotal), giftDeduction = min(balance, remaining), variant stock decrement guarded by updateMany stock >= qty (Insufficient stock -> 400 rollback), Order + OrderItem snapshots (totalMajor via convertCentsToMajor), GiftCardTransaction(-amount) + balance/status update ("redeemed" at 0), loyalty deduct + earn floor(subtotal/100), Subscription upsert-per-(sessionId,productId) for subscription products, EmailLog "order_confirmation", cart cleared
- Cart POST: Prisma 6 rejects `variantId: null` inside compound-unique where input -> replaced native upsert with findFirst + update/create (quirk noted below)
- Admin products: POST auto-slug (kebab-case + random suffix loop until unique), PATCH partial fields, PUT full variant-set replace in transaction (dedupes on color||size against compound unique), DELETE hard-deletes OrderItem + Subscription rows first (schema has no cascade on those) then product (Variant/CartItem/WishlistItem cascade via schema)
- Admin stats: fetch-then-aggregate in TS; revenueByDay = last 14 UTC days incl. today zero-filled; topProducts top-5 by units from OrderItems; categorySplit via productId->product.category; lowStock variants stock<=5 (count unbounded, list top-10 by stock asc); aovCents rounded
- Admin export: CSV (Product,Category,Color,Size,Stock,BasePriceUSD,VariantPriceUSD), variant rows w/ priceCents+priceDelta, no-variant products -> single row w/ empty color/size; proper Content-Type/Content-Disposition headers; CSV-escaping
- Admin carts: groupBy sessionId in TS, filters "seed-*", itemCount=sum(quantity), totalCents=sum(priceCents*qty), lastUpdated=max(updatedAt), stalest first; POST sends abandoned_cart EmailLog (to = last order email for session, else guest+{sessionId}@zsgc.store), 404 if cart empty
- Verified: bunx tsc --noEmit clean for src/app/api; eslint clean; curl smoke-tested every endpoint incl. 401/400/404 paths, full checkout (EUR + loyalty + gift card + subscription), stock decrement, slug collision suffixes, PUT variant dedupe, inactive-product hiding, CSV headers

Stage Summary:
- All 14 API route files implemented per contract; frontend can rely on shapes in src/lib/types.ts exactly.
- QUIRK: Prisma compound-unique `sessionId_productId_variantId` cannot take null in upsert-where (Prisma 6.19) — cart POST does findFirst-then-create/update instead; same NULL semantics preserved.
- QUIRK: OrderItem/Subscription have no onDelete cascade to Product in schema, so admin DELETE removes those snapshot rows first (topProducts still works — it groups by OrderItem.name).
- Cart PATCH with quantity<=0 deletes and returns `{ item: null }` (contract's { item } shape preserved).
- Loyalty GET creates the account with 250 welcome pts if absent and returns welcomeBonusAwarded: true (always present as boolean).
- Test side effects left intentionally: 2 small test orders (qa@example.com / plain@example.com) + their loyalty accounts exist so stats/revenueByDay have "today" data; ZSGC-WELCOME-25 gift card was consumed during testing then RESTORED to 2500/active with its transaction rows removed; HOLIDAY-50 and VIP-100 untouched. Test product/cart/email artifacts were deleted.
