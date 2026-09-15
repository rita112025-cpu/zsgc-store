# ZSGC Store

A full-stack e-commerce demo: storefront, cart and checkout with gift cards, loyalty points and subscriptions, plus an admin dashboard with sales analytics.

**Live demo → [zsgc-store.vercel.app](https://zsgc-store.vercel.app)**

> **中文簡介**：以 Next.js 16 打造的全端電商展示網站。包含商品瀏覽、購物車、禮物卡、會員點數、訂閱商品、多幣別顯示，以及具銷售圖表的管理後台。部署於 Vercel，資料庫使用 Neon Postgres。線上版後台為唯讀模式，可自由瀏覽。

---

## Try it

| What | How |
| --- | --- |
| Shop | Browse, filter by category, search, sort by price or rating |
| Gift cards | At checkout, enter `ZSGC-WELCOME-25`, `ZSGC-HOLIDAY-50`, or `ZSGC-VIP-100` (shared demo balances, so they can run out) |
| Loyalty points | Every new visitor starts with 250 points; toggle "Redeem loyalty points" in the cart |
| Admin | Open **Admin** and enter the demo key `zsgc-admin` |

No sign-up needed. Each browser gets an anonymous session, so your cart, wishlist and orders stay private to you. Order emails are simulated and never sent.

## Features

**Storefront**
- Product grid with category filters, search and sorting
- Product detail dialog with color/size variants, per-variant stock and pricing
- Wishlist with shareable links (`/?wishlist=…` imports items into the visitor's wishlist)
- Display prices in USD, EUR, GBP or TWD
- Light and dark mode, web app manifest and icons for home-screen shortcuts

**Checkout**
- Loyalty points: 1 point = $0.05 off; earn 1 point per $1 spent
- Gift cards applied after loyalty discounts, with balance tracking
- Subscription products that renew monthly
- The whole order runs in one database transaction: stock is decremented safely, and the order, gift card, points and confirmation email are recorded together, so a failed step leaves no partial order

**Admin dashboard**
- KPIs, 14-day revenue/orders chart, revenue by category, top products
- Product editor with variant management
- Inventory view with low-stock alerts and CSV export
- Abandoned-cart list with recovery emails, and a log of every email sent

**Public demo is read-only.** The admin key is intentionally public, so every admin write (create, edit, delete, send email) is rejected by the server with `403`. Shopping and checkout work normally.

## Tech stack

| Layer | Tools |
| --- | --- |
| Framework | Next.js 16 (App Router, Route Handlers), React 19, TypeScript |
| UI | Tailwind CSS 4, shadcn/ui (Radix), Lucide icons, Recharts |
| State & data | TanStack Query, Zustand |
| Database | Prisma 6, PostgreSQL on Neon |
| Hosting | Vercel |

## Run locally

Requires Node.js 22.18 or newer and a PostgreSQL database (a free [Neon](https://neon.tech) project works).

1. Install dependencies

   ```bash
   npm install
   ```

2. Create `.env` from the template and fill in your connection strings

   ```bash
   cp .env.example .env
   ```

3. Create the tables and load demo data (12 products, 48 variants, 3 gift cards, sample orders)

   ```bash
   npm run setup
   ```

4. Start the dev server and open http://localhost:3000

   ```bash
   npm run dev
   ```

### Environment variables

| Name | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Yes | Pooled Postgres connection used by the app |
| `DATABASE_URL_UNPOOLED` | Yes | Direct connection used by `prisma db push` |
| `ADMIN_WRITES_ENABLED` | No | Set to `true` to allow admin edits. Leave unset in public deployments |

The Vercel Neon integration sets both database variables automatically.

### Scripts

| Command | Does |
| --- | --- |
| `npm run dev` | Start the dev server on port 3000 |
| `npm run setup` | Sync the schema to the database and seed demo data |
| `npm run db:seed` | Re-run the seed; safe to repeat (products are updated, sample orders are only added to an empty database) |
| `npm run lint` | Run ESLint |

## Project structure

```
prisma/
  schema.prisma          Data model: products, variants, carts, orders, gift cards, loyalty, emails
  seed.ts                Demo data
src/
  app/
    page.tsx             Single-page storefront shell
    api/                 Route Handlers for shop, checkout and admin
  components/store/      Storefront and admin UI
  hooks/use-store.ts     TanStack Query hooks for cart, wishlist, orders, loyalty
  lib/
    admin-mode.ts        Read-only admin guard
    currency.ts          Currency conversion and formatting
    session.ts           Anonymous session id and admin key helpers
public/products/         Product images
```

**Design notes**
- All money is stored and passed as integer USD cents; conversion happens only for display
- Shoppers are identified by an anonymous session id in `localStorage`, with no accounts
- Admin routes require the `x-admin-key` header; this is demo-grade access control, not real authentication

## Credits

Built with AI coding agents (Z.ai Code and Claude Code). Product photos are AI-generated.
