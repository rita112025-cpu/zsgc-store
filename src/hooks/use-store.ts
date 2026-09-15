"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  addToCart,
  addToWishlist,
  getCart,
  getLoyalty,
  getOrders,
  getWishlist,
  listProducts,
  removeWishlistItem,
} from "@/lib/demo-db"

export function useProducts() {
  return useQuery({ queryKey: ["products"], queryFn: listProducts })
}

export function useCart() {
  return useQuery({ queryKey: ["cart"], queryFn: getCart })
}

export function useWishlist() {
  return useQuery({ queryKey: ["wishlist"], queryFn: getWishlist })
}

export function useOrders() {
  return useQuery({ queryKey: ["orders"], queryFn: getOrders })
}

export function useLoyalty() {
  return useQuery({
    queryKey: ["loyalty"],
    queryFn: getLoyalty,
    select: (d) => d.points,
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
    void qc.invalidateQueries({ queryKey: ["emails"] })
    void qc.invalidateQueries({ queryKey: ["admin"] })
  }
}

export function useAddToCart() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: addToCart,
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
      const existing = (wishlist.data ?? []).find((w) => w.product.id === productId)
      if (existing) return removeWishlistItem(existing.id)
      return addToWishlist(productId)
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["wishlist"] })
    },
  })
}
