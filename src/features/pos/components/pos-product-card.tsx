"use client"

import { memo } from "react"
import Image from "next/image"
import Link from "next/link"
import { Plus, Pencil } from "lucide-react"
import { motion } from "motion/react"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/utils"
import type { POSProductWithImage } from "../queries"

interface POSProductCardProps {
  product: POSProductWithImage
  onAdd: (product: POSProductWithImage) => void
}

function getInitials(name: string) {
  return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()
}

const INITIAL_COLORS = [
  { bg: "from-rose-100 to-rose-200", text: "text-rose-400" },
  { bg: "from-teal-100 to-teal-200", text: "text-teal-500" },
  { bg: "from-blush-100 to-blush-200", text: "text-blush-500" },
  { bg: "from-neutral-100 to-neutral-200", text: "text-neutral-500" },
]

function getColorIndex(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = hash + name.charCodeAt(i)
  return hash % INITIAL_COLORS.length
}

function getAvailableStock(product: POSProductWithImage) {
  return product.product_variants.reduce((sum, v) => sum + (v.stock - v.reserved_stock), 0)
}

function getDisplayPrice(product: POSProductWithImage) {
  const prices = product.product_variants.map((v) => v.price)
  const min = Math.min(...prices)
  const max = Math.max(...prices)
  if (min === max) return formatCurrency(min)
  return `${formatCurrency(min)} - ${formatCurrency(max)}`
}

export const POSProductCard = memo(function POSProductCard({ product, onAdd }: POSProductCardProps) {
  const available = getAvailableStock(product)
  const outOfStock = available <= 0

  const colorIdx = getColorIndex(product.name)
  const initColor = INITIAL_COLORS[colorIdx]

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`group relative rounded-xl border border-neutral-200 bg-white p-3 shadow-xs transition-shadow hover:shadow-md ${outOfStock ? "opacity-50" : ""}`}
    >
      <Link
        href={`/productos/${product.id}`}
        className="absolute right-2 top-2 z-10 rounded-md p-1 text-neutral-400 opacity-0 transition-opacity hover:text-neutral-600 group-hover:opacity-100"
      >
        <Pencil className="h-3.5 w-3.5" />
      </Link>

      <div className={`mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-lg bg-gradient-to-br ${initColor.bg} sm:h-20 sm:w-20`}>
        {product.image_url ? (
          <Image src={product.image_url} alt={product.name} width={80} height={80} className="h-full w-full rounded-lg object-cover" />
        ) : (
          <span className={`text-lg font-bold ${initColor.text} sm:text-xl`}>{getInitials(product.name)}</span>
        )}
      </div>

      <p className="truncate text-center text-[11px] font-semibold tracking-[0.3px] text-neutral-800">{product.name}</p>
      <p className="text-center text-sm font-extrabold tabular-nums tracking-[-0.5px] text-rose-600">{getDisplayPrice(product)}</p>

      <Button
        size="sm"
        disabled={outOfStock}
        onClick={() => onAdd(product)}
        className="mt-2 h-7 w-full bg-rose-500 text-xs font-semibold text-white hover:bg-rose-600 disabled:opacity-40"
      >
        <Plus className="mr-1 h-3 w-3" />
        {outOfStock ? "Agotado" : "Agregar"}
      </Button>
    </motion.div>
  )
})
