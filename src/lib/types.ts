export interface VariantDTO {
  id: string;
  color: string;
  size: string;
  stock: number;
  priceDelta: number;
}

export interface ProductDTO {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  priceCents: number;
  image: string;
  badge: string | null;
  subscription: boolean;
  rating: number;
  active: boolean;
  variants: VariantDTO[];
}

export interface CartItemDTO {
  id: string;
  quantity: number;
  product: ProductDTO;
  variant: VariantDTO | null;
}

export interface WishlistItemDTO {
  id: string;
  product: ProductDTO;
}

export interface OrderItemDTO {
  id: string;
  productId: string;
  name: string;
  variantLabel: string;
  unitPriceCents: number;
  quantity: number;
}

export interface OrderDTO {
  id: string;
  email: string;
  subtotalCents: number;
  loyaltyCents: number;
  giftCardCents: number;
  totalCents: number;
  currency: string;
  totalMajor: number;
  status: string;
  giftCardCode: string | null;
  loyaltyPointsUsed: number;
  hasSubscription: boolean;
  createdAt: string;
  items: OrderItemDTO[];
}

export interface CheckoutResult {
  order: OrderDTO;
  giftCardRemainingCents: number | null;
  loyalty: { used: number; earned: number; balance: number };
  totals: {
    subtotalCents: number;
    loyaltyCents: number;
    giftCardCents: number;
    grandTotalCents: number;
    currency: string;
    totalMajor: number;
  };
}

export interface EmailLogDTO {
  id: string;
  to: string;
  subject: string;
  body: string;
  kind: string;
  sessionId: string | null;
  createdAt: string;
}

export interface StatsDTO {
  totals: {
    revenueCents: number;
    orders: number;
    aovCents: number;
    unitsSold: number;
    lowStockCount: number;
    activeSubscriptions: number;
  };
  revenueByDay: { date: string; revenueCents: number; orders: number }[];
  topProducts: { name: string; units: number; revenueCents: number }[];
  categorySplit: { category: string; revenueCents: number }[];
  lowStock: { productId: string; name: string; variantLabel: string; stock: number }[];
}
