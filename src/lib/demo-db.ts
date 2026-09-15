// Browser-only data layer for the demo: seeded fictional data, persisted per visitor in localStorage.
import { convertCentsToMajor, formatMoney, getCurrency } from "@/lib/currency"
import {
  SEED_ABANDONED_CARTS,
  SEED_GIFT_CARDS,
  SEED_ORDERS,
  SEED_PRODUCTS,
  type SeedLine,
} from "@/lib/demo-data"
import type {
  CartItemDTO,
  CheckoutResult,
  EmailLogDTO,
  OrderDTO,
  OrderItemDTO,
  ProductDTO,
  StatsDTO,
  VariantDTO,
  WishlistItemDTO,
} from "@/lib/types"

const STORAGE_KEY = "zsgc-demo-v1"
const SHOPPER = "this-browser"
const DAY_MS = 24 * 60 * 60 * 1000
const HOUR_MS = 60 * 60 * 1000
const WELCOME_POINTS = 250
const LOW_STOCK_THRESHOLD = 5
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

interface StoredProduct extends ProductDTO {
  createdAt: number
}

interface StoredCartItem {
  id: string
  sessionId: string
  productId: string
  variantId: string | null
  quantity: number
  createdAt: number
  updatedAt: number
}

interface StoredOrder extends OrderDTO {
  sessionId: string
}

interface DemoState {
  seededAt: number
  products: StoredProduct[]
  cart: StoredCartItem[]
  wishlist: { id: string; productId: string; createdAt: number }[]
  orders: StoredOrder[]
  giftCards: { code: string; balanceCents: number; status: string }[]
  loyaltyPoints: number | null
  subscriptions: { sessionId: string; productId: string; status: string }[]
  emails: EmailLogDTO[]
}

export interface ProductInput {
  name: string
  category: string
  priceCents: number
  description?: string
  image?: string
  badge?: string | null
  subscription?: boolean
  active?: boolean
}

export interface AbandonedCart {
  sessionId: string
  itemCount: number
  totalCents: number
  lastUpdated: string
}

// crypto.randomUUID is missing on plain-http LAN origins, so ids use a simple generator.
function newId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`
}

function slugify(value: string): string {
  return (
    value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "product"
  )
}

function variantIdFor(slug: string, color: string, size: string): string {
  return [slug, slugify(color), size ? slugify(size) : ""].filter(Boolean).join("--")
}

function variantLabel(v: { color: string; size: string } | null | undefined): string {
  if (!v) return ""
  return [v.color, v.size].filter(Boolean).join(" / ")
}

function unitPrice(product: ProductDTO, variant: VariantDTO | null | undefined): number {
  return product.priceCents + (variant?.priceDelta ?? 0)
}

// ---------------------------------------------------------------------------
// Seeding and persistence

function resolveLine(products: StoredProduct[], line: SeedLine) {
  const product = products.find((p) => p.slug === line.slug)!
  const variant =
    product.variants.find((v) => v.color === line.color && v.size === (line.size ?? "")) ??
    product.variants.find((v) => v.color === line.color) ??
    null
  return { product, variant }
}

function seedState(now: number): DemoState {
  const products: StoredProduct[] = SEED_PRODUCTS.map((p, i) => ({
    id: p.slug,
    slug: p.slug,
    name: p.name,
    description: p.description,
    category: p.category,
    priceCents: p.priceCents,
    image: p.image,
    badge: p.badge ?? null,
    subscription: p.subscription ?? false,
    rating: p.rating,
    active: true,
    createdAt: now - (SEED_PRODUCTS.length - i) * 1000,
    variants: p.variants.map((v) => ({
      id: variantIdFor(p.slug, v.color, v.size ?? ""),
      color: v.color,
      size: v.size ?? "",
      stock: v.stock,
      priceDelta: v.priceDelta ?? 0,
    })),
  }))

  const orders: StoredOrder[] = []
  const subscriptions: DemoState["subscriptions"] = []
  SEED_ORDERS.forEach((o, index) => {
    const sessionId = `seed-${o.daysAgo}-${o.email.split("@")[0]}`
    const items: OrderItemDTO[] = o.items.map((line, i) => {
      const { product, variant } = resolveLine(products, line)
      return {
        id: `seed-item-${index}-${i}`,
        productId: product.id,
        name: product.name,
        variantLabel: [line.color, line.size].filter(Boolean).join(" / "),
        unitPriceCents: unitPrice(product, variant),
        quantity: line.qty,
      }
    })
    const subtotal = items.reduce((s, it) => s + it.unitPriceCents * it.quantity, 0)
    const subscriptionIds = [
      ...new Set(o.items.map((l) => resolveLine(products, l).product).filter((p) => p.subscription).map((p) => p.id)),
    ]
    subscriptionIds.forEach((productId) => subscriptions.push({ sessionId, productId, status: "active" }))
    orders.push({
      id: `seed-order-${index + 1}`,
      sessionId,
      email: o.email,
      subtotalCents: subtotal,
      loyaltyCents: 0,
      giftCardCents: 0,
      totalCents: subtotal,
      currency: "USD",
      totalMajor: subtotal / 100,
      status: o.daysAgo > 5 ? "delivered" : o.daysAgo > 2 ? "shipped" : "paid",
      giftCardCode: null,
      loyaltyPointsUsed: 0,
      hasSubscription: subscriptionIds.length > 0,
      createdAt: new Date(now - o.daysAgo * DAY_MS).toISOString(),
      items,
    })
  })

  const cart: StoredCartItem[] = SEED_ABANDONED_CARTS.flatMap((c) =>
    c.items.map((line, i) => {
      const { product, variant } = resolveLine(products, line)
      const at = now - c.hoursAgo * HOUR_MS
      return {
        id: `${c.sessionId}-${i}`,
        sessionId: c.sessionId,
        productId: product.id,
        variantId: variant?.id ?? null,
        quantity: line.qty,
        createdAt: at,
        updatedAt: at,
      }
    })
  )

  return {
    seededAt: now,
    products,
    cart,
    wishlist: [],
    orders,
    giftCards: SEED_GIFT_CARDS.map((g) => ({ code: g.code, balanceCents: g.balanceCents, status: "active" })),
    loyaltyPoints: null,
    subscriptions,
    emails: [],
  }
}

// Keeps the fictional history inside the dashboard's 14-day window for returning visitors.
function shiftSeedHistory(state: DemoState, now: number) {
  const delta = now - state.seededAt
  if (delta < DAY_MS) return
  for (const o of state.orders) {
    if (o.sessionId.startsWith("seed-")) o.createdAt = new Date(Date.parse(o.createdAt) + delta).toISOString()
  }
  for (const item of state.cart) {
    if (item.sessionId !== SHOPPER) {
      item.createdAt += delta
      item.updatedAt += delta
    }
  }
  state.seededAt = now
}

let cache: DemoState | null = null

if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === STORAGE_KEY) cache = null
  })
}

function persist() {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cache))
  } catch {
    // Private mode or full storage: the demo keeps working in memory for this visit.
  }
}

function db(): DemoState {
  if (cache) return cache
  const now = Date.now()
  let stored: DemoState | null = null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw) stored = JSON.parse(raw) as DemoState
  } catch {
    stored = null
  }
  if (stored && Array.isArray(stored.products)) {
    shiftSeedHistory(stored, now)
    cache = stored
  } else {
    cache = seedState(now)
  }
  persist()
  return cache
}

export async function resetDemoData(): Promise<void> {
  cache = seedState(Date.now())
  persist()
}

// ---------------------------------------------------------------------------
// Mappers

function toProductDTO(p: StoredProduct): ProductDTO {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    description: p.description,
    category: p.category,
    priceCents: p.priceCents,
    image: p.image,
    badge: p.badge,
    subscription: p.subscription,
    rating: p.rating,
    active: p.active,
    variants: p.variants.map((v) => ({ ...v })),
  }
}

function toOrderDTO(o: StoredOrder): OrderDTO {
  const { sessionId: _sessionId, ...order } = o
  return { ...order, items: order.items.map((i) => ({ ...i })) }
}

function findProduct(state: DemoState, id: string) {
  return state.products.find((p) => p.id === id)
}

function toCartItemDTO(state: DemoState, item: StoredCartItem): CartItemDTO | null {
  const product = findProduct(state, item.productId)
  if (!product) return null
  const variant = item.variantId ? product.variants.find((v) => v.id === item.variantId) ?? null : null
  return { id: item.id, quantity: item.quantity, product: toProductDTO(product), variant: variant ? { ...variant } : null }
}

// ---------------------------------------------------------------------------
// Storefront

export async function listProducts(): Promise<ProductDTO[]> {
  return [...db().products]
    .filter((p) => p.active)
    .sort((a, b) => b.createdAt - a.createdAt)
    .map(toProductDTO)
}

export async function getCart(): Promise<CartItemDTO[]> {
  const state = db()
  return state.cart
    .filter((i) => i.sessionId === SHOPPER)
    .sort((a, b) => a.createdAt - b.createdAt)
    .map((i) => toCartItemDTO(state, i))
    .filter((i): i is CartItemDTO => i !== null)
}

export async function addToCart(input: {
  productId: string
  variantId?: string | null
  quantity?: number
}): Promise<CartItemDTO> {
  const state = db()
  const product = findProduct(state, input.productId)
  if (!product) throw new Error("Product not found")
  const variantId = input.variantId || null
  if (variantId && !product.variants.some((v) => v.id === variantId)) {
    throw new Error("Variant not found for this product")
  }
  const quantity = Number.isInteger(input.quantity) && input.quantity! > 0 ? input.quantity! : 1
  const now = Date.now()

  let item = state.cart.find(
    (i) => i.sessionId === SHOPPER && i.productId === product.id && i.variantId === variantId
  )
  if (item) {
    item.quantity += quantity
    item.updatedAt = now
  } else {
    item = { id: newId("cart"), sessionId: SHOPPER, productId: product.id, variantId, quantity, createdAt: now, updatedAt: now }
    state.cart.push(item)
  }
  persist()
  return toCartItemDTO(state, item)!
}

export async function updateCartItem(input: { id: string; quantity: number }): Promise<CartItemDTO | null> {
  const state = db()
  const item = state.cart.find((i) => i.id === input.id && i.sessionId === SHOPPER)
  if (!item) throw new Error("Cart item not found")
  if (input.quantity <= 0) {
    state.cart = state.cart.filter((i) => i !== item)
    persist()
    return null
  }
  item.quantity = input.quantity
  item.updatedAt = Date.now()
  persist()
  return toCartItemDTO(state, item)
}

export async function removeCartItem(id: string): Promise<void> {
  const state = db()
  if (!state.cart.some((i) => i.id === id && i.sessionId === SHOPPER)) throw new Error("Cart item not found")
  state.cart = state.cart.filter((i) => i.id !== id)
  persist()
}

export async function getWishlist(): Promise<WishlistItemDTO[]> {
  const state = db()
  return [...state.wishlist]
    .sort((a, b) => b.createdAt - a.createdAt)
    .flatMap((w) => {
      const product = findProduct(state, w.productId)
      return product ? [{ id: w.id, product: toProductDTO(product) }] : []
    })
}

export async function addToWishlist(productId: string): Promise<WishlistItemDTO> {
  const state = db()
  const product = findProduct(state, productId)
  if (!product) throw new Error("Product not found")
  let item = state.wishlist.find((w) => w.productId === productId)
  if (!item) {
    item = { id: newId("wish"), productId, createdAt: Date.now() }
    state.wishlist.push(item)
    persist()
  }
  return { id: item.id, product: toProductDTO(product) }
}

export async function removeWishlistItem(id: string): Promise<void> {
  const state = db()
  if (!state.wishlist.some((w) => w.id === id)) throw new Error("Wishlist item not found")
  state.wishlist = state.wishlist.filter((w) => w.id !== id)
  persist()
}

export async function getOrders(): Promise<OrderDTO[]> {
  return db()
    .orders.filter((o) => o.sessionId === SHOPPER)
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .map(toOrderDTO)
}

export async function getCustomerEmails(limit = 10): Promise<EmailLogDTO[]> {
  return db()
    .emails.filter((e) => e.sessionId === SHOPPER)
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .slice(0, limit)
    .map((e) => ({ ...e }))
}

function ensureLoyalty(state: DemoState): { points: number; created: boolean } {
  if (state.loyaltyPoints === null) {
    state.loyaltyPoints = WELCOME_POINTS
    return { points: WELCOME_POINTS, created: true }
  }
  return { points: state.loyaltyPoints, created: false }
}

export async function getLoyalty(): Promise<{ points: number; welcomeBonusAwarded: boolean }> {
  const state = db()
  const { points, created } = ensureLoyalty(state)
  if (created) persist()
  return { points, welcomeBonusAwarded: created }
}

function findGiftCard(state: DemoState, code: string) {
  const trimmed = code.trim().toUpperCase()
  return state.giftCards.find((g) => g.code === trimmed)
}

export async function lookupGiftCard(code: string): Promise<{ code: string; balanceCents: number; status: string }> {
  if (!code.trim()) throw new Error("code is required")
  const card = findGiftCard(db(), code)
  if (!card) throw new Error("Gift card not found")
  return { ...card }
}

export async function checkout(input: {
  email: string
  currency: string
  giftCardCode?: string
  useLoyalty?: boolean
}): Promise<CheckoutResult> {
  const state = db()
  const email = input.email.trim()
  if (!EMAIL_RE.test(email)) throw new Error("A valid email address is required")
  const currency = getCurrency(input.currency || "USD").code

  const giftCard = input.giftCardCode?.trim() ? findGiftCard(state, input.giftCardCode) : undefined
  if (input.giftCardCode?.trim()) {
    if (!giftCard) throw new Error("Invalid gift card code")
    if (giftCard.balanceCents <= 0) throw new Error("Gift card has no remaining balance")
  }

  const lines = (await getCart()).map((item) => ({ item, price: unitPrice(item.product, item.variant) }))
  if (lines.length === 0) throw new Error("Your cart is empty")

  for (const { item } of lines) {
    if (!item.variant) continue
    const stored = findProduct(state, item.product.id)?.variants.find((v) => v.id === item.variant!.id)
    if (!stored || stored.stock < item.quantity) {
      throw new Error(`Insufficient stock for ${item.product.name} (${variantLabel(item.variant) || "default"})`)
    }
  }

  const subtotal = lines.reduce((sum, l) => sum + l.price * l.item.quantity, 0)
  const { points } = ensureLoyalty(state)
  const loyaltyDiscount = input.useLoyalty ? Math.min(points * 5, subtotal) : 0
  const pointsUsed = input.useLoyalty ? Math.min(points, Math.ceil(loyaltyDiscount / 5)) : 0
  const giftCardDeduction = giftCard ? Math.min(giftCard.balanceCents, subtotal - loyaltyDiscount) : 0
  const grandTotal = subtotal - loyaltyDiscount - giftCardDeduction

  // All validation passed: apply every change together so a failure never leaves a partial order.
  for (const { item } of lines) {
    if (!item.variant) continue
    const stored = findProduct(state, item.product.id)!.variants.find((v) => v.id === item.variant!.id)!
    stored.stock -= item.quantity
  }

  const hasSubscription = lines.some((l) => l.item.product.subscription)
  const order: StoredOrder = {
    id: newId("ord"),
    sessionId: SHOPPER,
    email,
    subtotalCents: subtotal,
    loyaltyCents: loyaltyDiscount,
    giftCardCents: giftCardDeduction,
    totalCents: grandTotal,
    currency,
    totalMajor: convertCentsToMajor(grandTotal, currency),
    status: "paid",
    giftCardCode: giftCard ? giftCard.code : null,
    loyaltyPointsUsed: pointsUsed,
    hasSubscription,
    createdAt: new Date().toISOString(),
    items: lines.map(({ item, price }) => ({
      id: newId("item"),
      productId: item.product.id,
      name: item.product.name,
      variantLabel: variantLabel(item.variant),
      unitPriceCents: price,
      quantity: item.quantity,
    })),
  }
  state.orders.push(order)

  let giftCardRemainingCents: number | null = null
  if (giftCard) {
    giftCardRemainingCents = giftCard.balanceCents - giftCardDeduction
    giftCard.balanceCents = giftCardRemainingCents
    giftCard.status = giftCardRemainingCents === 0 ? "redeemed" : "active"
  }

  const earned = Math.floor(subtotal / 100)
  const loyaltyBalance = Math.max(0, points - pointsUsed) + earned
  state.loyaltyPoints = loyaltyBalance

  for (const productId of new Set(lines.filter((l) => l.item.product.subscription).map((l) => l.item.product.id))) {
    if (!state.subscriptions.some((s) => s.sessionId === SHOPPER && s.productId === productId)) {
      state.subscriptions.push({ sessionId: SHOPPER, productId, status: "active" })
    }
  }

  const body = [
    `Thanks for your order, ${email}!`,
    "",
    `Order ID: ${order.id}`,
    "",
    "Items:",
    ...lines.map(
      ({ item, price }) =>
        `- ${item.product.name}${variantLabel(item.variant) ? ` (${variantLabel(item.variant)})` : ""} x ${item.quantity} — ${formatMoney(price, currency)}`
    ),
    "",
    `Subtotal: ${formatMoney(subtotal, currency)}`,
    loyaltyDiscount > 0 ? `Loyalty discount: -${formatMoney(loyaltyDiscount, currency)}` : null,
    giftCardDeduction > 0 ? `Gift card (${giftCard!.code}): -${formatMoney(giftCardDeduction, currency)}` : null,
    `Total: ${formatMoney(grandTotal, currency)}`,
  ]
    .filter((l): l is string => l !== null)
    .join("\n")
  state.emails.push({
    id: newId("email"),
    to: email,
    subject: "Your ZSGC Store order is confirmed",
    body,
    kind: "order_confirmation",
    sessionId: SHOPPER,
    createdAt: new Date().toISOString(),
  })

  state.cart = state.cart.filter((i) => i.sessionId !== SHOPPER)
  persist()

  return {
    order: toOrderDTO(order),
    giftCardRemainingCents,
    loyalty: { used: pointsUsed, earned, balance: loyaltyBalance },
    totals: {
      subtotalCents: subtotal,
      loyaltyCents: loyaltyDiscount,
      giftCardCents: giftCardDeduction,
      grandTotalCents: grandTotal,
      currency,
      totalMajor: convertCentsToMajor(grandTotal, currency),
    },
  }
}

// ---------------------------------------------------------------------------
// Admin (demo): changes only affect this browser's copy of the data

export async function adminListProducts(): Promise<ProductDTO[]> {
  return [...db().products].sort((a, b) => b.createdAt - a.createdAt).map(toProductDTO)
}

function validateProductInput(input: ProductInput) {
  if (!input.name?.trim() || !input.category?.trim() || !Number.isInteger(input.priceCents) || input.priceCents < 0) {
    throw new Error("Name, category and a valid price are required")
  }
}

function uniqueSlug(state: DemoState, base: string, exceptId?: string): string {
  let candidate = base
  while (state.products.some((p) => p.slug === candidate && p.id !== exceptId)) {
    candidate = `${base}-${Math.random().toString(36).slice(2, 7)}`
  }
  return candidate
}

export async function createProduct(input: ProductInput): Promise<ProductDTO> {
  validateProductInput(input)
  const state = db()
  const product: StoredProduct = {
    id: newId("prod"),
    slug: uniqueSlug(state, slugify(input.name)),
    name: input.name.trim(),
    category: input.category.trim(),
    priceCents: input.priceCents,
    description: input.description ?? "",
    image: input.image ?? "",
    badge: input.badge || null,
    subscription: input.subscription === true,
    rating: 0,
    active: input.active ?? true,
    createdAt: Date.now(),
    variants: [],
  }
  state.products.push(product)
  persist()
  return toProductDTO(product)
}

export async function updateProduct(id: string, input: ProductInput): Promise<ProductDTO> {
  validateProductInput(input)
  const state = db()
  const product = findProduct(state, id)
  if (!product) throw new Error("Product not found")
  Object.assign(product, {
    name: input.name.trim(),
    category: input.category.trim(),
    priceCents: input.priceCents,
    description: input.description ?? product.description,
    image: input.image ?? product.image,
    badge: input.badge === undefined ? product.badge : input.badge || null,
    subscription: input.subscription ?? product.subscription,
    active: input.active ?? product.active,
  })
  persist()
  return toProductDTO(product)
}

export async function setProductActive(id: string, active: boolean): Promise<void> {
  const state = db()
  const product = findProduct(state, id)
  if (!product) throw new Error("Product not found")
  product.active = active
  persist()
}

export async function replaceVariants(
  id: string,
  variants: { color: string; size: string; stock: number; priceDelta: number }[]
): Promise<ProductDTO> {
  const state = db()
  const product = findProduct(state, id)
  if (!product) throw new Error("Product not found")

  const byKey = new Map<string, VariantDTO>()
  for (const v of variants) {
    const color = v.color ?? ""
    const size = v.size ?? ""
    const key = `${color}||${size}`
    const existing = product.variants.find((pv) => `${pv.color}||${pv.size}` === key)
    byKey.set(key, {
      id: existing?.id ?? newId("var"),
      color,
      size,
      stock: Number.isInteger(v.stock) && v.stock >= 0 ? v.stock : 0,
      priceDelta: Number.isInteger(v.priceDelta) ? v.priceDelta : 0,
    })
  }
  product.variants = [...byKey.values()]

  const validIds = new Set(product.variants.map((v) => v.id))
  for (const item of state.cart) {
    if (item.productId === id && item.variantId && !validIds.has(item.variantId)) item.variantId = null
  }
  persist()
  return toProductDTO(product)
}

export async function deleteProduct(id: string): Promise<void> {
  const state = db()
  if (!findProduct(state, id)) throw new Error("Product not found")
  state.products = state.products.filter((p) => p.id !== id)
  state.cart = state.cart.filter((i) => i.productId !== id)
  state.wishlist = state.wishlist.filter((w) => w.productId !== id)
  state.subscriptions = state.subscriptions.filter((s) => s.productId !== id)
  persist()
}

export async function getStats(): Promise<StatsDTO> {
  const state = db()
  const orders = state.orders
  const orderItems = orders.flatMap((o) => o.items)
  const variants = state.products.flatMap((p) => p.variants.map((v) => ({ ...v, productId: p.id, productName: p.name })))
  const lowStock = variants.filter((v) => v.stock <= LOW_STOCK_THRESHOLD)
  const revenueCents = orders.reduce((sum, o) => sum + o.totalCents, 0)

  const byDay = new Map<string, { revenueCents: number; orders: number }>()
  const now = Date.now()
  for (let i = 13; i >= 0; i--) {
    byDay.set(new Date(now - i * DAY_MS).toISOString().slice(0, 10), { revenueCents: 0, orders: 0 })
  }
  for (const o of orders) {
    const entry = byDay.get(o.createdAt.slice(0, 10))
    if (entry) {
      entry.revenueCents += o.totalCents
      entry.orders += 1
    }
  }

  const productTotals = new Map<string, { name: string; units: number; revenueCents: number }>()
  for (const item of orderItems) {
    const entry = productTotals.get(item.name) ?? { name: item.name, units: 0, revenueCents: 0 }
    entry.units += item.quantity
    entry.revenueCents += item.unitPriceCents * item.quantity
    productTotals.set(item.name, entry)
  }

  const categoryOf = new Map(state.products.map((p) => [p.id, p.category]))
  const categoryTotals = new Map<string, number>()
  for (const item of orderItems) {
    const category = categoryOf.get(item.productId) ?? "Other"
    categoryTotals.set(category, (categoryTotals.get(category) ?? 0) + item.unitPriceCents * item.quantity)
  }

  return {
    totals: {
      revenueCents,
      orders: orders.length,
      aovCents: orders.length > 0 ? Math.round(revenueCents / orders.length) : 0,
      unitsSold: orderItems.reduce((sum, i) => sum + i.quantity, 0),
      lowStockCount: lowStock.length,
      activeSubscriptions: state.subscriptions.filter((s) => s.status === "active").length,
    },
    revenueByDay: [...byDay.entries()].map(([date, v]) => ({ date, ...v })),
    topProducts: [...productTotals.values()]
      .sort((a, b) => b.units - a.units || b.revenueCents - a.revenueCents)
      .slice(0, 5),
    categorySplit: [...categoryTotals.entries()]
      .map(([category, cents]) => ({ category, revenueCents: cents }))
      .sort((a, b) => b.revenueCents - a.revenueCents),
    lowStock: lowStock
      .sort((a, b) => a.stock - b.stock)
      .slice(0, 10)
      .map((v) => ({
        productId: v.productId,
        name: v.productName,
        variantLabel: variantLabel(v) || "Default",
        stock: v.stock,
      })),
  }
}

function csvField(value: string): string {
  return /[",\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value
}

export async function exportInventoryCsv(): Promise<string> {
  const products = [...db().products].sort(
    (a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name)
  )
  const rows = ["Product,Category,Color,Size,Stock,BasePriceUSD,VariantPriceUSD"]
  for (const p of products) {
    const base = (p.priceCents / 100).toFixed(2)
    if (p.variants.length === 0) {
      rows.push([csvField(p.name), csvField(p.category), "", "", "0", base, base].join(","))
      continue
    }
    for (const v of p.variants) {
      rows.push(
        [csvField(p.name), csvField(p.category), csvField(v.color), csvField(v.size), String(v.stock), base, ((p.priceCents + v.priceDelta) / 100).toFixed(2)].join(",")
      )
    }
  }
  return rows.join("\n") + "\n"
}

export async function getAbandonedCarts(): Promise<AbandonedCart[]> {
  const state = db()
  const carts = new Map<string, { itemCount: number; totalCents: number; lastUpdated: number }>()
  for (const item of state.cart) {
    const product = findProduct(state, item.productId)
    if (!product) continue
    const variant = product.variants.find((v) => v.id === item.variantId)
    const entry = carts.get(item.sessionId) ?? { itemCount: 0, totalCents: 0, lastUpdated: item.updatedAt }
    entry.itemCount += item.quantity
    entry.totalCents += unitPrice(product, variant) * item.quantity
    entry.lastUpdated = Math.max(entry.lastUpdated, item.updatedAt)
    carts.set(item.sessionId, entry)
  }
  return [...carts.entries()]
    .sort((a, b) => a[1].lastUpdated - b[1].lastUpdated)
    .map(([sessionId, c]) => ({
      sessionId,
      itemCount: c.itemCount,
      totalCents: c.totalCents,
      lastUpdated: new Date(c.lastUpdated).toISOString(),
    }))
}

export async function sendRecoveryEmail(sessionId: string): Promise<void> {
  const state = db()
  const items = state.cart.filter((i) => i.sessionId === sessionId)
  if (items.length === 0) throw new Error("Cart not found")

  const lastOrder = state.orders
    .filter((o) => o.sessionId === sessionId)
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))[0]
  const to =
    SEED_ABANDONED_CARTS.find((c) => c.sessionId === sessionId)?.email ??
    lastOrder?.email ??
    `guest+${sessionId}@example.com`

  let totalCents = 0
  const lines = items.flatMap((i) => {
    const product = findProduct(state, i.productId)
    if (!product) return []
    const variant = product.variants.find((v) => v.id === i.variantId)
    totalCents += unitPrice(product, variant) * i.quantity
    return [`- ${product.name}${variant ? ` (${variantLabel(variant)})` : ""} x ${i.quantity}`]
  })

  state.emails.push({
    id: newId("email"),
    to,
    subject: "You left something in your cart — complete your checkout",
    body: [
      "Still thinking it over?",
      "",
      "Your cart is waiting for you:",
      ...lines,
      "",
      `Cart total: $${(totalCents / 100).toFixed(2)}`,
      "",
      "Come back soon — your items are reserved while stock lasts.",
    ].join("\n"),
    kind: "abandoned_cart",
    sessionId,
    createdAt: new Date().toISOString(),
  })
  persist()
}

export async function getAllEmails(): Promise<EmailLogDTO[]> {
  return [...db().emails]
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .slice(0, 100)
    .map((e) => ({ ...e }))
}
