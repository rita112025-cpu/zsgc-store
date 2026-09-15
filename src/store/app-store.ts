"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { CurrencyCode } from "@/lib/currency"

export type View = "shop" | "cart" | "wishlist" | "orders" | "admin"

interface AppState {
  view: View
  currency: CurrencyCode
  detailProductId: string | null
  setView: (view: View) => void
  setCurrency: (c: CurrencyCode) => void
  openProduct: (id: string | null) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      view: "shop",
      currency: "USD",
      detailProductId: null,
      setView: (view) => set({ view }),
      setCurrency: (currency) => set({ currency }),
      openProduct: (detailProductId) => set({ detailProductId }),
    }),
    {
      name: "zsgc-app",
      partialize: (s) => ({ currency: s.currency }),
    }
  )
)
