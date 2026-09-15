"use client"

import { useQueryClient } from "@tanstack/react-query"
import { Info, RotateCcw, ShieldCheck } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AdminDashboardTab } from "@/components/store/admin-dashboard-tab"
import { AdminProductsTab } from "@/components/store/admin-products-tab"
import { AdminInventoryTab } from "@/components/store/admin-inventory-tab"
import { AdminCartsTab, AdminEmailsTab } from "@/components/store/admin-ops-tabs"
import { resetDemoData } from "@/lib/demo-db"

export function AdminView() {
  const qc = useQueryClient()

  const reset = async () => {
    await resetDemoData()
    await qc.invalidateQueries()
    toast.success("Demo data reset", { description: "Products, orders and your cart are back to the starting state." })
  }

  return (
    <section aria-label="Admin" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight sm:text-3xl">
          <ShieldCheck className="h-6 w-6 text-primary" aria-hidden />
          Admin
        </h1>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={reset}>
          <RotateCcw className="h-3.5 w-3.5" aria-hidden />
          Reset demo data
        </Button>
      </div>

      <div
        role="note"
        className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200"
      >
        <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        <p>
          <span className="font-medium">Demo admin, open to everyone.</span> All data is fictional and
          every change is saved only in this browser — nothing reaches a server or other visitors.
        </p>
      </div>

      <Tabs defaultValue="dashboard">
        <div className="overflow-x-auto">
          <TabsList>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="inventory">Inventory</TabsTrigger>
            <TabsTrigger value="carts">Carts</TabsTrigger>
            <TabsTrigger value="emails">Emails</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="dashboard" className="mt-4"><AdminDashboardTab /></TabsContent>
        <TabsContent value="products" className="mt-4"><AdminProductsTab /></TabsContent>
        <TabsContent value="inventory" className="mt-4"><AdminInventoryTab /></TabsContent>
        <TabsContent value="carts" className="mt-4"><AdminCartsTab /></TabsContent>
        <TabsContent value="emails" className="mt-4"><AdminEmailsTab /></TabsContent>
      </Tabs>
    </section>
  )
}
