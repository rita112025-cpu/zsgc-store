"use client"

import { useEffect, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { addToWishlist } from "@/lib/demo-db"

/**
 * Detects `/?wishlist=id1,id2,…` on load, imports those products into the
 * current session's wishlist, then cleans the URL.
 */
export function useSharedWishlist() {
  const [importing, setImporting] = useState(false)
  const qc = useQueryClient()

  useEffect(() => {
    if (typeof window === "undefined") return
    const params = new URLSearchParams(window.location.search)
    const shared = params.get("wishlist")
    if (!shared) return

    const ids = shared.split(",").map((s) => s.trim()).filter(Boolean)
    const url = new URL(window.location.href)
    url.searchParams.delete("wishlist")
    window.history.replaceState({}, "", url.pathname + (url.searchParams.toString() ? `?${url.searchParams}` : ""))

    if (ids.length === 0) return

    setImporting(true)
    Promise.allSettled(ids.map((productId) => addToWishlist(productId)))
      .then((results) => {
        const ok = results.filter((r) => r.status === "fulfilled").length
        if (ok > 0) {
          toast.success(`Imported ${ok} item${ok === 1 ? "" : "s"} from a shared wishlist`, {
            description: "Find them in your Wishlist tab.",
          })
          void qc.invalidateQueries({ queryKey: ["wishlist"] })
        } else {
          toast.error("Couldn't import the shared wishlist")
        }
      })
      .finally(() => setImporting(false))
  }, [qc])

  return { importing }
}
