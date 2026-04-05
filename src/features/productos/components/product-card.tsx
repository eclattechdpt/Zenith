"use client"

import { memo, useState } from "react"
import { Pencil, Trash2, AlertCircle, ChevronDown, Layers } from "lucide-react"
import { motion, AnimatePresence } from "motion/react"
import { formatCurrency } from "@/lib/utils"
import { getCategoryNames } from "../types"
import type { ProductWithDetails } from "../types"

const INITIAL_COLORS = [
  { bg: "bg-rose-50", text: "text-rose-200" },
  { bg: "bg-teal-50", text: "text-teal-200" },
  { bg: "bg-blush-50", text: "text-blush-200" },
  { bg: "bg-amber-50", text: "text-amber-200" },
]

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

function getColorIndex(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = hash + name.charCodeAt(i)
  return hash % INITIAL_COLORS.length
}

function getPriceRange(product: ProductWithDetails) {
  const prices = product.product_variants
    .filter((v) => v.is_active)
    .map((v) => v.price)
  if (prices.length === 0) return null
  const min = Math.min(...prices)
  const max = Math.max(...prices)
  if (min === max) return formatCurrency(min)
  return `${formatCurrency(min)} - ${formatCurrency(max)}`
}

function getTotalStock(product: ProductWithDetails) {
  return product.product_variants
    .filter((v) => v.is_active)
    .reduce((sum, v) => sum + v.stock, 0)
}

interface ProductCardProps {
  product: ProductWithDetails
  onEdit?: (product: ProductWithDetails) => void
  onDelete?: (product: ProductWithDetails) => void
}

export const ProductCard = memo(function ProductCard({
  product,
  onEdit,
  onDelete,
}: ProductCardProps) {
  const [expanded, setExpanded] = useState(false)
  const totalStock = getTotalStock(product)
  const lowStock = product.product_variants.some(
    (v) => v.is_active && v.stock <= v.stock_min
  )
  const colorIdx = getColorIndex(product.name)
  const palette = INITIAL_COLORS[colorIdx]
  const priceRange = getPriceRange(product)
  const activeVariants = product.product_variants.filter((v) => v.is_active)
  const hasMultipleVariants = product.has_variants && activeVariants.length > 1

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      layout
      className={`group relative flex flex-col overflow-hidden rounded-2xl border border-transparent bg-white shadow-sm transition-[border-color,box-shadow] duration-200 hover:border-accent-200 hover:shadow-md hover:shadow-accent-500/8 ${
        !product.is_active ? "opacity-50 grayscale-[30%]" : ""
      }`}
    >
      {/* Action icons — hover reveal */}
      <div className="absolute right-2.5 top-2.5 z-10 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          type="button"
          onClick={() => onEdit?.(product)}
          className="rounded-lg bg-white/80 p-1.5 text-neutral-400 backdrop-blur-sm transition-colors hover:text-neutral-600"
        >
          <Pencil className="h-3 w-3" />
        </button>
        {onDelete && (
          <button
            type="button"
            onClick={() => onDelete(product)}
            className="rounded-lg bg-white/80 p-1.5 text-neutral-400 backdrop-blur-sm transition-colors hover:text-red-500"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* Low stock badge */}
      {lowStock && (
        <span className="absolute left-2.5 top-2.5 z-10 flex items-center gap-1 rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-600">
          <AlertCircle className="h-3 w-3" />
          Bajo
        </span>
      )}

      {/* Inactive badge */}
      {!product.is_active && (
        <span className="absolute left-2.5 top-2.5 z-10 rounded-md bg-neutral-100 px-1.5 py-0.5 text-[10px] font-bold text-neutral-500">
          Inactivo
        </span>
      )}

      {/* Visual area */}
      <div
        className={`flex h-40 items-center justify-center sm:h-48 ${palette.bg}`}
      >
        {product.image_url ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={product.image_url}
            alt={product.name}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <span
            className={`select-none text-[52px] font-black tracking-tight sm:text-[60px] ${palette.text}`}
          >
            {getInitials(product.name)}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col p-4 pt-3.5">
        <p className="truncate text-[13px] font-semibold leading-tight text-neutral-800">
          {product.name}
        </p>
        {product.brand && (
          <p className="mt-0.5 truncate text-[11px] font-medium text-neutral-400">
            {product.brand}
          </p>
        )}
        {getCategoryNames(product.product_categories) && (
          <p className="mt-0.5 truncate text-[10px] font-medium text-neutral-300">
            {getCategoryNames(product.product_categories)}
          </p>
        )}

        <div className="mt-auto flex items-end justify-between gap-2 pt-4">
          <div className="min-w-0">
            {priceRange && (
              <p className="truncate text-[16px] font-extrabold tabular-nums tracking-[-0.3px] text-rose-600">
                {priceRange}
              </p>
            )}
            <p className="text-[10px] tabular-nums text-neutral-400">
              <span className="font-bold text-neutral-500">{totalStock}</span> en stock
            </p>
          </div>

          {/* Variants toggle */}
          {hasMultipleVariants && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-semibold text-neutral-400 transition-colors hover:bg-neutral-50 hover:text-neutral-600"
            >
              <Layers className="h-3 w-3" />
              {activeVariants.length}
              <motion.div
                animate={{ rotate: expanded ? 180 : 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 35 }}
              >
                <ChevronDown className="h-3 w-3" />
              </motion.div>
            </button>
          )}
        </div>
      </div>

      {/* Collapsible variants panel */}
      <AnimatePresence initial={false}>
        {expanded && hasMultipleVariants && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="border-t border-neutral-100 bg-neutral-50/50 px-4 py-3">
              <div className="flex flex-col gap-2">
                {activeVariants.map((v) => (
                  <div
                    key={v.id}
                    className="flex items-center justify-between gap-2 rounded-lg bg-white px-3 py-2 shadow-sm ring-1 ring-neutral-100"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[11px] font-semibold text-neutral-700">
                        {v.name || v.sku || "Variante"}
                      </p>
                      {v.sku && v.name && (
                        <p className="truncate text-[10px] text-neutral-400">{v.sku}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-right">
                      <span className="text-[12px] font-bold tabular-nums text-rose-600">
                        {formatCurrency(v.price)}
                      </span>
                      <span className={`text-[10px] font-semibold tabular-nums ${
                        v.stock <= v.stock_min ? "text-amber-500" : "text-neutral-400"
                      }`}>
                        {v.stock}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
})
