"use client"

import { useEffect, useState } from "react"
import { Lock, ShieldCheck } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AdminDashboardTab } from "@/components/store/admin-dashboard-tab"
import { AdminProductsTab } from "@/components/store/admin-products-tab"
import { AdminInventoryTab } from "@/components/store/admin-inventory-tab"
import { AdminCartsTab, AdminEmailsTab } from "@/components/store/admin-ops-tabs"
import { isAdminUnlocked, lockAdmin, unlockAdmin } from "@/lib/session"

export function AdminView() {
  const [unlocked, setUnlocked] = useState(false)
  const [key, setKey] = useState("")

  useEffect(() => setUnlocked(isAdminUnlocked()), [])

  if (!unlocked) {
    return (
      <Card className="mx-auto max-w-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-4 w-4" aria-hidden />
            Admin access
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault()
              if (unlockAdmin(key.trim())) {
                setUnlocked(true)
              } else {
                toast.error("Incorrect admin key")
              }
            }}
          >
            <Input
              type="password"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="Admin key"
              aria-label="Admin key"
              className="min-h-11"
            />
            <Button type="submit" className="min-h-11 w-full">
              Unlock
            </Button>
            <p className="text-xs text-muted-foreground">Demo key: zsgc-admin</p>
          </form>
        </CardContent>
      </Card>
    )
  }

  return (
    <section aria-label="Admin" className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight sm:text-3xl">
          <ShieldCheck className="h-6 w-6 text-primary" aria-hidden />
          Admin
        </h1>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            lockAdmin()
            setUnlocked(false)
            setKey("")
          }}
        >
          Lock
        </Button>
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
