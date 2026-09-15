"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"

const CATEGORY_EMOJI: Record<string, string> = {
  Apparel: "👕",
  Accessories: "👜",
  Home: "🏠",
  Tech: "🎧",
  Pantry: "☕",
}

interface ProductImageProps {
  src: string
  alt: string
  category: string
  className?: string
}

/** Product image with a graceful gradient + emoji fallback when no photo exists. */
export function ProductImage({ src, alt, category, className }: ProductImageProps) {
  const [failed, setFailed] = useState(false)

  // Reset the failure state when the image source changes
  useEffect(() => setFailed(false), [src])

  if (!src || failed) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-gradient-to-br from-stone-100 via-stone-50 to-emerald-50 dark:from-stone-800 dark:via-stone-900 dark:to-emerald-950",
          className
        )}
        aria-label={alt}
        role="img"
      >
        <span className="text-4xl" aria-hidden>
          {CATEGORY_EMOJI[category] ?? "🛍️"}
        </span>
      </div>
    )
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className={cn("object-cover", className)}
    />
  )
}
