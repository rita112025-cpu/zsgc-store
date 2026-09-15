"use client"

import { useState } from "react"
import { Check, Copy, Link2, Mail, MessageCircle, Share2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import type { WishlistItemDTO } from "@/lib/types"

export function ShareWishlistButton({ items }: { items: WishlistItemDTO[] }) {
  const [copied, setCopied] = useState(false)
  const [open, setOpen] = useState(false)

  if (items.length === 0) return null

  const url = (() => {
    if (typeof window === "undefined") return ""
    const ids = items.map((w) => w.product.id).join(",")
    const u = new URL(window.location.href)
    u.search = `?wishlist=${ids}`
    u.hash = ""
    return u.toString()
  })()

  const message = "Here's my ZSGC Store wishlist — take a look!"

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      toast.success("Link copied to clipboard")
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error("Couldn't copy — long-press the link instead")
    }
  }

  const nativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: "My ZSGC wishlist", text: message, url })
      } catch {
        /* user dismissed */
      }
    } else {
      void copy()
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="min-h-11 gap-2">
          <Share2 className="h-4 w-4" aria-hidden />
          Share wishlist
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="h-4 w-4 text-primary" aria-hidden />
            Share your wishlist
          </DialogTitle>
          <DialogDescription>
            Anyone with this link can add these {items.length} item{items.length === 1 ? "" : "s"} to their own
            wishlist — no account needed.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="flex gap-2">
            <Input readOnly value={url} className="min-h-11 font-mono text-xs" aria-label="Shareable wishlist link" onFocus={(e) => e.target.select()} />
            <Button variant="outline" className="min-h-11 gap-1.5" onClick={copy}>
              {copied ? <Check className="h-4 w-4" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <Button variant="secondary" className="min-h-11 gap-1.5" asChild>
              <a
                href={`mailto:?subject=${encodeURIComponent("My ZSGC wishlist")}&body=${encodeURIComponent(`${message}\n\n${url}`)}`}
              >
                <Mail className="h-4 w-4" aria-hidden /> Email
              </a>
            </Button>
            <Button variant="secondary" className="min-h-11 gap-1.5" asChild>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`${message} ${url}`)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle className="h-4 w-4" aria-hidden /> WhatsApp
              </a>
            </Button>
            <Button variant="secondary" className="min-h-11 gap-1.5" onClick={nativeShare}>
              <Share2 className="h-4 w-4" aria-hidden /> More
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
