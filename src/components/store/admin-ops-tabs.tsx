"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Mail, MailOpen, Send, ShoppingCart } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { getAbandonedCarts, getAllEmails, sendRecoveryEmail } from "@/lib/demo-db"

function useAbandonedCarts() {
  return useQuery({ queryKey: ["admin", "carts"], queryFn: getAbandonedCarts })
}

export function AdminCartsTab() {
  const carts = useAbandonedCarts()
  const qc = useQueryClient()

  const recover = useMutation({
    mutationFn: sendRecoveryEmail,
    onSuccess: () => {
      toast.success("Recovery email queued", {
        description: "Logged to the email outbox — visible in the Emails tab.",
      })
      void qc.invalidateQueries({ queryKey: ["admin", "emails"] })
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  })

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Carts idle for a while with items still in them. Send a gentle nudge to bring shoppers back.
      </p>

      {carts.isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      ) : (carts.data?.length ?? 0) === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center">
          <ShoppingCart className="mx-auto mb-2 h-8 w-8 text-muted-foreground" aria-hidden />
          <p className="text-sm font-medium">No abandoned carts right now</p>
          <p className="text-xs text-muted-foreground">Every active cart is fresh.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {carts.data!.map((c) => (
            <Card key={c.sessionId} className="py-0">
              <CardContent className="flex flex-wrap items-center gap-3 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-950">
                  <ShoppingCart className="h-5 w-5 text-amber-700 dark:text-amber-400" aria-hidden />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-mono text-xs text-muted-foreground">{c.sessionId.slice(0, 18)}…</p>
                  <p className="text-sm font-semibold">
                    {c.itemCount} item{c.itemCount === 1 ? "" : "s"} · ${(c.totalCents / 100).toFixed(2)}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">
                  last touched {new Date(c.lastUpdated).toLocaleString()}
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5"
                  disabled={recover.isPending}
                  onClick={() => recover.mutate(c.sessionId)}
                >
                  <Send className="h-3.5 w-3.5" aria-hidden /> Recover
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

function useAdminEmails() {
  return useQuery({ queryKey: ["admin", "emails"], queryFn: getAllEmails })
}

const KIND_STYLES: Record<string, string> = {
  order_confirmation: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  abandoned_cart: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  transactional: "bg-stone-200 text-stone-700 dark:bg-stone-800 dark:text-stone-300",
}

export function AdminEmailsTab() {
  const emails = useAdminEmails()

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Transactional email outbox — order confirmations and abandoned-cart recovery, as they would be sent.
      </p>

      {emails.isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      ) : (emails.data?.length ?? 0) === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center">
          <MailOpen className="mx-auto mb-2 h-8 w-8 text-muted-foreground" aria-hidden />
          <p className="text-sm font-medium">Outbox is empty</p>
          <p className="text-xs text-muted-foreground">Place an order or send a recovery email to see it here.</p>
        </div>
      ) : (
        <div className="max-h-[520px] space-y-2 overflow-y-auto scrollbar-thin pr-1">
          {emails.data!.map((e) => (
            <Card key={e.id} className="py-0">
              <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 pb-1 pt-4">
                <CardTitle className="flex min-w-0 items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                  <span className="truncate">{e.subject}</span>
                </CardTitle>
                <Badge className={`text-[10px] ${KIND_STYLES[e.kind] ?? KIND_STYLES.transactional}`}>
                  {e.kind.replace("_", " ")}
                </Badge>
              </CardHeader>
              <CardContent className="pb-4">
                <p className="text-xs text-muted-foreground">
                  To {e.to} · {new Date(e.createdAt).toLocaleString()}
                </p>
                <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">{e.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
