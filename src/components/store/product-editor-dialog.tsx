"use client"

import { useEffect, useState } from "react"
import { Save } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createProduct, updateProduct } from "@/lib/demo-db"
import type { ProductDTO } from "@/lib/types"

const CATEGORIES = ["Apparel", "Accessories", "Home", "Tech", "Pantry"]
const BADGES = ["none", "NEW", "BESTSELLER", "SALE", "LIMITED"]

export function ProductEditorDialog({
  product,
  open,
  onOpenChange,
  onSaved,
}: {
  product: ProductDTO | null
  open: boolean
  onOpenChange: (o: boolean) => void
  onSaved: () => void
}) {
  const [name, setName] = useState("")
  const [category, setCategory] = useState("Apparel")
  const [price, setPrice] = useState("0")
  const [description, setDescription] = useState("")
  const [image, setImage] = useState("")
  const [badge, setBadge] = useState("none")
  const [subscription, setSubscription] = useState(false)
  const [active, setActive] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setName(product?.name ?? "")
      setCategory(product?.category ?? "Apparel")
      setPrice(product ? (product.priceCents / 100).toFixed(2) : "0")
      setDescription(product?.description ?? "")
      setImage(product?.image ?? "")
      setBadge(product?.badge ?? "none")
      setSubscription(product?.subscription ?? false)
      setActive(product?.active ?? true)
    }
  }, [open, product])

  const save = async () => {
    const priceCents = Math.round(Number(price) * 100)
    if (!name.trim()) {
      toast.error("Product name is required")
      return
    }
    if (!Number.isFinite(priceCents) || priceCents < 0) {
      toast.error("Enter a valid price")
      return
    }
    setSaving(true)
    try {
      const input = {
        name: name.trim(),
        category,
        priceCents,
        description: description.trim(),
        image: image.trim(),
        badge: badge === "none" ? null : badge,
        subscription,
        active,
      }
      if (product) await updateProduct(product.id, input)
      else await createProduct(input)
      toast.success(product ? "Product updated" : "Product created", { description: name })
      onSaved()
      onOpenChange(false)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save product")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto scrollbar-thin sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{product ? "Edit product" : "New product"}</DialogTitle>
          <DialogDescription>
            {product ? "Update catalog details for this product." : "Add a new product to the catalog."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="p-name">Name</Label>
            <Input id="p-name" value={name} onChange={(e) => setName(e.target.value)} className="min-h-10" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="min-h-10 w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="p-price">Base price (USD)</Label>
              <Input
                id="p-price"
                type="number"
                min={0}
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="min-h-10 tabular-nums"
              />
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="p-desc">Description</Label>
            <Textarea id="p-desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Badge</Label>
              <Select value={badge} onValueChange={setBadge}>
                <SelectTrigger className="min-h-10 w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {BADGES.map((b) => (
                    <SelectItem key={b} value={b}>{b === "none" ? "No badge" : b}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="p-image">Image path</Label>
              <Input
                id="p-image"
                value={image}
                onChange={(e) => setImage(e.target.value)}
                placeholder="/products/your-product.png"
                className="min-h-10 font-mono text-xs"
              />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label htmlFor="p-sub" className="text-sm">Subscription eligible</Label>
              <p className="text-xs text-muted-foreground">Renews monthly at the base price.</p>
            </div>
            <Switch id="p-sub" checked={subscription} onCheckedChange={setSubscription} />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label htmlFor="p-active" className="text-sm">Visible in shop</Label>
              <p className="text-xs text-muted-foreground">Inactive products are hidden from customers.</p>
            </div>
            <Switch id="p-active" checked={active} onCheckedChange={setActive} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save} disabled={saving} className="gap-1.5">
            <Save className="h-4 w-4" aria-hidden /> {saving ? "Saving…" : "Save product"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
