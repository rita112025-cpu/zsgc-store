"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getSessionId } from "@/lib/session"
import type { CartItemDTO, ProductDTO, WishlistItemDTO, OrderDTO } from "@/lib/types"

/** Async helpers used by mutations */
async function jsonFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init)
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error((data as { error?: string }).error ?? `Request failed (${res.status})`)
  return data as T
}

export function useProducts() {
  return useQuery({
    queryKey: ["products"],
    queryFn: () => jsonFetch<{ products: ProductDTO[] }>("/api/products"),
    select: (d) => d.products,
  })
}

export function useCart() {
  const sessionId = getSessionId()
  return useQuery({
    queryKey: ["cart", sessionId],
    queryFn: () => jsonFetch<{ items: CartItemDTO[] }>(`/api/cart?sessionId=${sessionId}`),
    select: (d) => d.items,
    enabled: typeof window !== "undefined",
  })
}

export function useWishlist() {
  const sessionId = getSessionId()
  return useQuery({
    queryKey: ["wishlist", sessionId],
    queryFn: () => jsonFetch<{ items: WishlistItemDTO[] }>(`/api/wishlist?sessionId=${sessionId}`),
    select: (d) => d.items,
    enabled: typeof window !== "undefined",
  })
}

export function useOrders() {
  const sessionId = getSessionId()
  return useQuery({
    queryKey: ["orders", sessionId],
    queryFn: () => jsonFetch<{ orders: OrderDTO[] }>(`/api/orders?sessionId=${sessionId}`),
    select: (d) => d.orders,
    enabled: typeof window !== "undefined",
  })
}

export function useLoyalty() {
  const sessionId = getSessionId()
  return useQuery({
    queryKey: ["loyalty", sessionId],
    queryFn: () =>
      jsonFetch<{ points: number; welcomeBonusAwarded?: boolean }>(`/api/loyalty?sessionId=${sessionId}`),
    select: (d) => d.points,
    enabled: typeof window !== "undefined",
  })
}

export function useInvalidateStoreData() {
  const qc = useQueryClient()
  return () => {
    void qc.invalidateQueries({ queryKey: ["cart"] })
    void qc.invalidateQueries({ queryKey: ["wishlist"] })
    void qc.invalidateQueries({ queryKey: ["orders"] })
    void qc.invalidateQueries({ queryKey: ["loyalty"] })
    void qc.invalidateQueries({ queryKey: ["products"] })
    void qc.invalidateQueries({ queryKey: ["admin"] })
  }
}

export function useAddToCart() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: { productId: string; variantId?: string | null; quantity?: number }) =>
      jsonFetch("/api/cart", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ sessionId: getSessionId(), ...input }),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["cart"] })
    },
  })
}

export function useToggleWishlist() {
  const qc = useQueryClient()
  const wishlist = useWishlist()
  return useMutation({
    mutationFn: async (productId: string) => {
      const items = wishlist.data ?? []
      const existing = items.find((w) => w.product.id === productId)
      if (existing) {
        return jsonFetch(`/api/wishlist?id=${existing.id}`, { method: "DELETE" })
      }
      return jsonFetch("/api/wishlist", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ sessionId: getSessionId(), productId }),
      })
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["wishlist"] })
    },
  })
}
