'use client'

import { useEffect } from 'react'
import { StoreHeader } from '@/components/store/store-header'
import { StoreFooter } from '@/components/store/store-footer'
import { ShopView } from '@/components/store/shop-view'
import { CartView } from '@/components/store/cart-view'
import { WishlistView } from '@/components/store/wishlist-view'
import { OrdersView } from '@/components/store/orders-view'
import { AdminView } from '@/components/store/admin-view'
import { ProductDetailDialog } from '@/components/store/product-detail-dialog'
import { useSharedWishlist } from '@/hooks/use-shared-wishlist'
import { useAppStore } from '@/store/app-store'

export default function Home() {
  const view = useAppStore((s) => s.view)
  useSharedWishlist()

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [view])

  return (
    <div className="flex min-h-screen flex-col">
      <StoreHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        {view === 'shop' && <ShopView />}
        {view === 'cart' && <CartView />}
        {view === 'wishlist' && <WishlistView />}
        {view === 'orders' && <OrdersView />}
        {view === 'admin' && <AdminView />}
      </main>
      <StoreFooter />
      <ProductDetailDialog />
    </div>
  )
}
