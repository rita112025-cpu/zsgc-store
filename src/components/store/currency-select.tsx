"use client"

import { useAppStore } from "@/store/app-store"
import { CURRENCIES } from "@/lib/currency"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function CurrencySelect() {
  const currency = useAppStore((s) => s.currency)
  const setCurrency = useAppStore((s) => s.setCurrency)

  return (
    <Select value={currency} onValueChange={(v) => setCurrency(v as typeof currency)}>
      <SelectTrigger
        size="sm"
        className="w-[92px]"
        aria-label="Select display currency"
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {CURRENCIES.map((c) => (
          <SelectItem key={c.code} value={c.code}>
            {c.symbol} {c.code}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
