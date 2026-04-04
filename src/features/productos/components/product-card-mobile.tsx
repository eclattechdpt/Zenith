"use client"

import { MoreHorizontal, Pencil, Trash2, AlertCircle } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { formatCurrency } from "@/lib/utils"

import { getCategoryNames } from "../types"
import type { ProductWithDetails } from "../types"

const INITIAL_COLORS = [
  { bg: "bg-rose-50", text: "text-rose-300" },
  { bg: "bg-teal-50", text: "text-teal-300" },
  { bg: "bg-blush-50", text: "text-blush-300" },
  { bg: "bg-amber-50", text: "text-amber-300" },
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

interface ProductCardMobileProps {
  product: ProductWithDetails
  onEdit?: (product: ProductWithDetails) => void
  onDelete?: (product: ProductWithDetails) => void
}

export function ProductCardMobile({ product, onEdit, onDelete }: ProductCardMobileProps) {
  const activeVariants = product.product_variants.filter((v) => v.is_active)
  const prices = activeVariants.map((v) => v.price)
  const min = prices.length > 0 ? Math.min(...prices) : 0
  const max = prices.length > 0 ? Math.max(...prices) : 0
  const priceLabel = min === max ? formatCurrency(min) : `${formatCurrency(min)} - ${formatCurrency(max)}`
  const totalStock = activeVariants.reduce((sum, v) => sum + v.stock, 0)
  const categoryName = getCategoryNames(product.product_categories)
  const variantCount = product.has_variants ? activeVariants.length : null
  const lowStock = activeVariants.some((v) => v.stock <= v.stock_min)

  const colorIdx = getColorIndex(product.name)
  const palette = INITIAL_COLORS[colorIdx]

  return (
    <div className={`flex gap-3.5 rounded-2xl border border-neutral-100 bg-white p-4 shadow-sm ${!product.is_active ? "opacity-50" : ""}`}>
      {/* Product thumbnail */}
      <div
        className={`flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl ${palette.bg}`}
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
          <span className={`text-[16px] font-black ${palette.text}`}>
            {getInitials(product.name)}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold text-neutral-900">
              {product.name}
            </p>
            {product.brand && (
              <p className="truncate text-[11px] font-medium text-neutral-400">
                {product.brand}
              </p>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="ghost" size="sm" className="size-7 shrink-0 rounded-lg p-0" />
              }
            >
              <MoreHorizontal className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit?.(product)}>
                <Pencil className="mr-2 size-3.5" />
                Editar
              </DropdownMenuItem>
              {onDelete && (
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => onDelete(product)}
                >
                  <Trash2 className="mr-2 size-3.5" />
                  Eliminar
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px] text-neutral-400">
          {categoryName && <span>{categoryName}</span>}
          {categoryName && variantCount !== null && <span>·</span>}
          {variantCount !== null && (
            <span>{variantCount} variante{variantCount !== 1 ? "s" : ""}</span>
          )}
        </div>

        <div className="mt-2.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-[15px] font-extrabold tabular-nums tracking-[-0.3px] text-rose-600">
              {priceLabel}
            </span>
            <span className="flex items-center gap-1 text-[11px] tabular-nums text-neutral-400">
              <span className="font-bold text-neutral-500">{totalStock}</span> stock
              {lowStock && (
                <AlertCircle className="h-3 w-3 text-amber-500" />
              )}
            </span>
          </div>
          <Badge variant={product.is_active ? "secondary" : "outline"} className="text-[10px]">
            {product.is_active ? "Activo" : "Inactivo"}
          </Badge>
        </div>
      </div>
    </div>
  )
}
