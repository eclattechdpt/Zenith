"use client"

import { memo, useState, useCallback, useRef } from "react"
import Image from "next/image"
import { Plus, Pencil, AlertCircle, Check } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"
import { formatCurrency } from "@/lib/utils"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import type { POSProductWithImage } from "../queries"

interface POSProductCardProps {
  product: POSProductWithImage
  onAdd: (product: POSProductWithImage) => void
  onEdit?: (productId: string) => void
  /** Compact mode for carousel cards */
  compact?: boolean
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

const INITIAL_COLORS = [
  { bg: "bg-rose-50", text: "text-rose-200" },
  { bg: "bg-teal-50", text: "text-teal-200" },
  { bg: "bg-blush-50", text: "text-blush-200" },
  { bg: "bg-amber-50", text: "text-amber-200" },
]

function getColorIndex(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = hash + name.charCodeAt(i)
  return hash % INITIAL_COLORS.length
}

function getAvailableStock(product: POSProductWithImage) {
  return product.product_variants.reduce(
    (sum, v) => sum + (v.stock - v.reserved_stock),
    0
  )
}

function getDisplayPrice(product: POSProductWithImage) {
  const prices = product.product_variants.map((v) => v.price)
  const min = Math.min(...prices)
  const max = Math.max(...prices)
  if (min === max) return formatCurrency(min)
  return `${formatCurrency(min)} - ${formatCurrency(max)}`
}

export const POSProductCard = memo(function POSProductCard({
  product,
  onAdd,
  onEdit,
  compact = false,
}: POSProductCardProps) {
  const available = getAvailableStock(product)
  const outOfStock = available <= 0
  const lowStock = available > 0 && available <= 5

  const colorIdx = getColorIndex(product.name)
  const palette = INITIAL_COLORS[colorIdx]

  // ── Add-to-cart feedback ──
  const [justAdded, setJustAdded] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleAdd = useCallback(() => {
    if (justAdded) return
    onAdd(product)
    setJustAdded(true)
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => setJustAdded(false), 1000)
  }, [onAdd, product, justAdded])

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3, transition: { type: "spring", stiffness: 300, damping: 20 } }}
      whileTap={{ scale: 0.98 }}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-transparent bg-white shadow-sm transition-[border-color,box-shadow] duration-200 hover:border-accent-200 hover:shadow-md hover:shadow-accent-500/8"
    >
      {/* Stock badge — always visible */}
      {outOfStock ? (
        <span className="absolute left-2.5 top-2.5 z-10 flex items-center gap-1 rounded-md bg-rose-100 px-1.5 py-0.5 text-[10px] font-bold text-rose-600">
          Sin stock
        </span>
      ) : lowStock ? (
        <span className="absolute left-2.5 top-2.5 z-10 flex items-center gap-1 rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-600">
          <AlertCircle className="h-3 w-3" />
          {available}
        </span>
      ) : (
        <span className="absolute left-2.5 top-2.5 z-10 flex items-center gap-1 rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-600">
          {available} en stock
        </span>
      )}

      {/* Visual area — dominant */}
      <div
        className={`flex items-center justify-center ${palette.bg} ${
          compact ? "h-36 sm:h-40" : "h-40 sm:h-48"
        }`}
      >
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.name}
            width={200}
            height={200}
            className="h-full w-full object-cover"
          />
        ) : (
          <span
            className={`select-none font-black tracking-tight ${palette.text} ${
              compact ? "text-[42px] sm:text-[48px]" : "text-[52px] sm:text-[60px]"
            }`}
          >
            {getInitials(product.name)}
          </span>
        )}
      </div>

      {/* Info — minimal */}
      <div className="flex flex-1 flex-col p-4 pt-3.5">
        <p className="truncate text-[13px] font-semibold leading-tight text-neutral-800">
          {product.name}
        </p>
        {product.brand && (
          <p className="mt-0.5 truncate text-[11px] font-medium text-neutral-400">
            {product.brand}
          </p>
        )}

        <div className="mt-auto flex items-end justify-between gap-2 pt-4">
          <p className="text-[16px] font-extrabold tabular-nums tracking-[-0.3px] text-rose-600">
            {getDisplayPrice(product)}
          </p>
          <Tooltip>
            <TooltipTrigger
              render={
                <button
                  onClick={handleAdd}
                  className={`relative flex h-8 w-8 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl transition-colors active:scale-[0.95] ${
                    justAdded
                      ? "bg-emerald-100 text-emerald-600"
                      : outOfStock
                        ? "bg-indigo-100 text-indigo-500 hover:bg-indigo-200"
                        : "bg-rose-100 text-rose-500 hover:bg-rose-200"
                  }`}
                />
              }
            >
              <AnimatePresence mode="wait" initial={false}>
                {justAdded ? (
                  <motion.span
                    key="check"
                    initial={{ scale: 0, rotate: -90 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0, rotate: 90 }}
                    transition={{ type: "spring", stiffness: 700, damping: 22 }}
                    className="flex items-center justify-center"
                  >
                    <Check className="h-4 w-4" />
                  </motion.span>
                ) : (
                  <motion.span
                    key="plus"
                    initial={{ scale: 0, rotate: 90 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0, rotate: -90 }}
                    transition={{ type: "spring", stiffness: 700, damping: 22 }}
                    className="flex items-center justify-center"
                  >
                    <Plus className="h-4 w-4" />
                  </motion.span>
                )}
              </AnimatePresence>
            </TooltipTrigger>
            <TooltipContent side="top" sideOffset={6}>
              {justAdded ? "Agregado" : outOfStock ? "Agregar como vale" : "Agregar al carrito"}
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </motion.div>
  )
})
