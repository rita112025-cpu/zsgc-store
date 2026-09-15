"use client"

import { useQuery } from "@tanstack/react-query"
import {
  Area,
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { AlertTriangle, DollarSign, RefreshCw, ShoppingBag, Users } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { adminFetch } from "@/lib/session"
import type { StatsDTO } from "@/lib/types"

const CHART_COLORS = ["#059669", "#d97706", "#0d9488", "#ca8a04", "#15803d"]

function useAdminStats() {
  return useQuery({
    queryKey: ["admin", "stats"],
    queryFn: async () => {
      const res = await adminFetch("/api/admin/stats")
      if (!res.ok) throw new Error("Failed to load stats")
      return (await res.json()) as { stats: StatsDTO }
    },
    select: (d) => d.stats,
  })
}

export function AdminDashboardTab() {
  const { data: stats, isLoading } = useAdminStats()

  if (isLoading || !stats) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full rounded-xl" />
        ))}
      </div>
    )
  }

  const kpis = [
    { label: "Revenue (14d)", value: `$${(stats.totals.revenueCents / 100).toLocaleString()}`, icon: DollarSign },
    { label: "Orders", value: stats.totals.orders.toLocaleString(), icon: ShoppingBag },
    { label: "Avg order value", value: `$${(stats.totals.aovCents / 100).toFixed(2)}`, icon: Users },
    { label: "Units sold", value: stats.totals.unitsSold.toLocaleString(), icon: ShoppingBag },
    { label: "Active subscriptions", value: stats.totals.activeSubscriptions.toLocaleString(), icon: RefreshCw },
    { label: "Low stock variants", value: stats.totals.lowStockCount.toLocaleString(), icon: AlertTriangle },
  ]

  const chartData = stats.revenueByDay.map((d) => ({
    date: d.date.slice(5),
    revenue: d.revenueCents / 100,
    orders: d.orders,
  }))

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        {kpis.map(({ label, value, icon: Icon }) => (
          <Card key={label} className="py-0">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Icon className="h-5 w-5 text-primary" aria-hidden />
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs text-muted-foreground">{label}</p>
                <p className="text-lg font-bold tabular-nums">{value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Revenue & orders — last 14 days</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="date" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis yAxisId="left" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v: number) => `$${v}`} />
                <YAxis yAxisId="right" orientation="right" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8 }}
                  formatter={(value, name) =>
                    name === "revenue" ? [`$${Number(value).toFixed(2)}`, "Revenue"] : [value, "Orders"]
                  }
                />
                <Legend />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="revenue"
                  stroke={CHART_COLORS[0]}
                  fill={CHART_COLORS[0]}
                  fillOpacity={0.15}
                  strokeWidth={2}
                />
                <Bar yAxisId="right" dataKey="orders" fill={CHART_COLORS[1]} fillOpacity={0.7} radius={[3, 3, 0, 0]} maxBarSize={18} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Revenue by category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.categorySplit}
                    dataKey="revenueCents"
                    nameKey="category"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={3}
                  >
                    {stats.categorySplit.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8 }}
                    formatter={(value: number | string, name: string) => [`$${(Number(value) / 100).toFixed(2)}`, name]}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Top products</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.topProducts.length === 0 && (
              <p className="text-sm text-muted-foreground">No sales data yet.</p>
            )}
            {stats.topProducts.map((p, i) => {
              const max = stats.topProducts[0]?.units || 1
              return (
                <div key={p.name} className="space-y-1">
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <span className="min-w-0 truncate">
                      <span className="mr-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                        {i + 1}
                      </span>
                      {p.name}
                    </span>
                    <span className="shrink-0 tabular-nums text-muted-foreground">
                      {p.units} sold · ${(p.revenueCents / 100).toFixed(0)}
                    </span>
                  </div>
                  <Progress value={(p.units / max) * 100} className="h-1.5" />
                </div>
              )
            })}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="h-4 w-4 text-amber-600" aria-hidden /> Low stock alerts (≤ 5 units)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats.lowStock.length === 0 ? (
            <p className="text-sm text-muted-foreground">All variants are healthily stocked. 🎉</p>
          ) : (
            <div className="max-h-48 space-y-1.5 overflow-y-auto scrollbar-thin pr-1">
              {stats.lowStock.map((s) => (
                <div key={`${s.productId}-${s.variantLabel}`} className="flex items-center justify-between gap-2 rounded-lg border p-2.5 text-sm">
                  <span className="min-w-0 truncate">
                    {s.name} <span className="text-muted-foreground">· {s.variantLabel}</span>
                  </span>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${s.stock === 0 ? "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300" : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"}`}>
                    {s.stock} left
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
