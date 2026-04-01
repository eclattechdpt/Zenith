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

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`group relative rounded-xl border border-stone-200 bg-white p-3 transition-shadow hover:shadow-md ${outOfStock ? "opacity-50" : ""}`}
    >
      <Link
        href={`/productos/${product.id}`}
        className="absolute right-2 top-2 z-10 rounded-md p-1 text-stone-400 opacity-0 transition-opacity hover:text-stone-600 group-hover:opacity-100"
      >
        <Pencil className="h-3.5 w-3.5" />
      </Link>

      <div className="mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-lg bg-gradient-to-br from-rose-100 to-rose-200 sm:h-20 sm:w-20">
        {product.image_url ? (
          <Image src={product.image_url} alt={product.name} width={80} height={80} className="h-full w-full rounded-lg object-cover" />
        ) : (
          <span className="text-lg font-bold text-rose-300 sm:text-xl">{getInitials(product.name)}</span>
        )}
      </div>

      <p className="truncate text-center text-xs font-semibold text-stone-800">{product.name}</p>
      <p className="text-center text-sm font-extrabold text-rose-600">{getDisplayPrice(product)}</p>

      <Button
        size="sm"
        disabled={outOfStock}
        onClick={() => onAdd(product)}
        className="mt-2 h-7 w-full bg-rose-600 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-40"
      >
        <Plus className="mr-1 h-3 w-3" />
        {outOfStock ? "Agotado" : "Agregar"}
      </Button>
    </motion.div>
  )
})
