"use client"

import { useEffect, useMemo, useState } from "react"
import { Minus, Palette, Plus, Ruler, Save, Trash2 } from "lucide-react"
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
import { Badge } from "@/components/ui/badge"
import { replaceVariants } from "@/lib/demo-db"
import type { ProductDTO } from "@/lib/types"

const SWATCHES: { name: string; hex: string }[] = [
  { name: "Black", hex: "#1c1917" },
  { name: "White", hex: "#fafaf9" },
  { name: "Sage", hex: "#a3b39b" },
  { name: "Forest", hex: "#3f6142" },
  { name: "Slate", hex: "#64748b" },
  { name: "Oatmeal", hex: "#d6cfc4" },
  { name: "Moss", hex: "#6b7d5a" },
  { name: "Tan", hex: "#b08d63" },
  { name: "Rust", hex: "#b4532a" },
  { name: "Cream", hex: "#f5efe0" },
  { name: "Olive", hex: "#6b6a3f" },
  { name: "Clay", hex: "#c07a5a" },
]

interface EditableVariant {
  key: string
  color: string
  size: string
  stock: number
  priceDelta: number
}

function hexFor(name: string): string {
  const hit = SWATCHES.find((s) => s.name.toLowerCase() === name.toLowerCase())
  if (hit) return hit.hex
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) % 360
  return `hsl(${hash} 35% 65%)`
}

export function VariantEditor({
  product,
  open,
  onOpenChange,
  onSaved,
}: {
  product: ProductDTO
  open: boolean
  onOpenChange: (o: boolean) => void
  onSaved: () => void
}) {
  const [variants, setVariants] = useState<EditableVariant[]>([])
  const [newColor, setNewColor] = useState("")
  const [newSize, setNewSize] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setVariants(
        product.variants.map((v) => ({
          key: v.id,
          color: v.color,
          size: v.size,
          stock: v.stock,
          priceDelta: v.priceDelta,
        }))
      )
      setNewColor("")
      setNewSize("")
    }
  }, [open, product])

  const colors = useMemo(() => [...new Set(variants.map((v) => v.color).filter(Boolean))], [variants])
  const sizes = useMemo(() => [...new Set(variants.map((v) => v.size).filter(Boolean))], [variants])

  const addColor = (name: string) => {
    const color = name.trim()
    if (!color) return
    if (colors.includes(color)) {
      toast.info(`"${color}" already exists`)
      return
    }
    // Clone size structure from an existing variant (or a single row)
    const template = variants[0]
    const newRows: EditableVariant[] =
      template && sizes.length > 0
        ? sizes.map((sz) => ({
            key: `new-${crypto.randomUUID()}`,
            color,
            size: sz,
            stock: 10,
            priceDelta: 0,
          }))
        : [{ key: `new-${crypto.randomUUID()}`, color, size: "", stock: 10, priceDelta: 0 }]
    setVariants((v) => [...v, ...newRows])
  }

  const addSize = (name: string) => {
    const size = name.trim()
    if (!size) return
    if (sizes.includes(size)) {
      toast.info(`"${size}" already exists`)
      return
    }
    const newRows: EditableVariant[] =
      colors.length > 0
        ? colors.map((c) => ({
            key: `new-${crypto.randomUUID()}`,
            color: c,
            size,
            stock: 10,
            priceDelta: 0,
          }))
        : [{ key: `new-${crypto.randomUUID()}`, color: "", size, stock: 10, priceDelta: 0 }]
    setVariants((v) => [...v, ...newRows])
  }

  const updateRow = (key: string, patch: Partial<EditableVariant>) =>
    setVariants((rows) => rows.map((r) => (r.key === key ? { ...r, ...patch } : r)))

  const removeRow = (key: string) => setVariants((rows) => rows.filter((r) => r.key !== key))

  const save = async () => {
    setSaving(true)
    try {
      await replaceVariants(
        product.id,
        variants.map(({ color, size, stock, priceDelta }) => ({ color, size, stock, priceDelta }))
      )
      toast.success("Variants saved", { description: `${variants.length} variant(s) for ${product.name}` })
      onSaved()
      onOpenChange(false)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save variants")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto scrollbar-thin sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Variants — {product.name}</DialogTitle>
          <DialogDescription>
            Manage colors and sizes. Stock and price adjustments apply per variant row.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Color picker */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">
              <Palette className="h-4 w-4" aria-hidden /> Colors
            </Label>
            <div className="flex flex-wrap gap-1.5">
              {colors.map((c) => (
                <Badge key={c} variant="secondary" className="gap-1.5 py-1 pr-2">
                  <span className="h-3.5 w-3.5 rounded-full border" style={{ backgroundColor: hexFor(c) }} aria-hidden />
                  {c}
                </Badge>
              ))}
              {colors.length === 0 && <p className="text-xs text-muted-foreground">No colors yet</p>}
            </div>
            <div className="flex flex-wrap gap-1.5" aria-label="Preset colors">
              {SWATCHES.map((s) => (
                <button
                  key={s.name}
                  type="button"
                  onClick={() => addColor(s.name)}
                  title={`Add ${s.name}`}
                  aria-label={`Add color ${s.name}`}
                  className={`h-8 w-8 rounded-full border-2 transition-transform hover:scale-110 ${
                    colors.includes(s.name) ? "border-primary opacity-40" : "border-border"
                  }`}
                  style={{ backgroundColor: s.hex }}
                />
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newColor}
                onChange={(e) => setNewColor(e.target.value)}
                placeholder="Custom color name…"
                className="min-h-10"
                onKeyDown={(e) => e.key === "Enter" && addColor(newColor)}
              />
              <Button type="button" variant="outline" className="min-h-10" onClick={() => addColor(newColor)}>
                <Plus className="h-4 w-4" aria-hidden /> Add
              </Button>
            </div>
          </div>

          {/* Size picker */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">
              <Ruler className="h-4 w-4" aria-hidden /> Sizes
            </Label>
            <div className="flex flex-wrap gap-1.5">
              {sizes.map((s) => (
                <Badge key={s} variant="secondary" className="py-1">
                  {s}
                </Badge>
              ))}
              {sizes.length === 0 && <p className="text-xs text-muted-foreground">No sizes (one-size product)</p>}
            </div>
            <div className="flex gap-2">
              <Input
                value={newSize}
                onChange={(e) => setNewSize(e.target.value)}
                placeholder="Add size (e.g. M, 250g)…"
                className="min-h-10"
                onKeyDown={(e) => e.key === "Enter" && addSize(newSize)}
              />
              <Button type="button" variant="outline" className="min-h-10" onClick={() => addSize(newSize)}>
                <Plus className="h-4 w-4" aria-hidden /> Add
              </Button>
            </div>
          </div>

          {/* Variant rows */}
          <div className="space-y-2">
            <Label>Variant rows ({variants.length})</Label>
            {variants.length === 0 ? (
              <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
                No variants — the product sells as a single SKU.
              </p>
            ) : (
              <div className="max-h-64 space-y-1.5 overflow-y-auto scrollbar-thin pr-1">
                {variants.map((row) => (
                  <div
                    key={row.key}
                    className="flex items-center gap-2 rounded-lg border p-2"
                  >
                    {row.color && (
                      <span
                        className="h-6 w-6 shrink-0 rounded-full border"
                        style={{ backgroundColor: hexFor(row.color) }}
                        title={row.color}
                        aria-hidden
                      />
                    )}
                    <span className="w-24 shrink-0 truncate text-xs font-medium" title={row.color || "—"}>
                      {row.color || "—"}
                    </span>
                    <span className="w-16 shrink-0 truncate text-xs text-muted-foreground" title={row.size || "One size"}>
                      {row.size || "One size"}
                    </span>
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        aria-label="Decrease stock"
                        onClick={() => updateRow(row.key, { stock: Math.max(0, row.stock - 1) })}
                      >
                        <Minus className="h-3 w-3" aria-hidden />
                      </Button>
                      <Input
                        type="number"
                        min={0}
                        value={row.stock}
                        onChange={(e) => updateRow(row.key, { stock: Math.max(0, Number(e.target.value) || 0) })}
                        className="h-8 w-16 px-1 text-center tabular-nums"
                        aria-label={`Stock for ${row.color} ${row.size}`}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        aria-label="Increase stock"
                        onClick={() => updateRow(row.key, { stock: row.stock + 1 })}
                      >
                        <Plus className="h-3 w-3" aria-hidden />
                      </Button>
                    </div>
                    <Input
                      type="number"
                      value={row.priceDelta}
                      onChange={(e) => updateRow(row.key, { priceDelta: Number(e.target.value) || 0 })}
                      className="h-8 w-24 px-2 text-center tabular-nums"
                      title="Price adjustment in cents (±)"
                      aria-label={`Price delta in cents for ${row.color} ${row.size}`}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                      onClick={() => removeRow(row.key)}
                      aria-label={`Remove variant ${row.color} ${row.size}`}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Price adjustment is in USD cents, e.g. 500 = +$5.00, −1000 = −$10.00.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={save} disabled={saving} className="gap-1.5">
            <Save className="h-4 w-4" aria-hidden /> {saving ? "Saving…" : "Save variants"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
