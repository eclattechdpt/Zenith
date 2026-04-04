"use client"

import {
  MoreHorizontal,
  ClipboardEdit,
  PackagePlus,
  History,
  AlertCircle,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { formatCurrency } from "@/lib/utils"

import type { InventoryVariant, InventoryType } from "../types"

// ── Deterministic color hash (matching productos/product-card.tsx) ──

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

// ── Accent config per type ──

const ACCENT = {
  physical: {
    hover: "hover:border-amber-200 hover:shadow-md hover:shadow-amber-500/8",
    price: "text-amber-600",
  },
  initial_load: {
    hover: "hover:border-slate-200 hover:shadow-md hover:shadow-slate-500/8",
    price: "text-slate-600",
  },
} as const

interface InventoryGridCardProps {
  variant: InventoryVariant
  inventoryType?: InventoryType
  visible?: boolean
  onAdjust?: (v: InventoryVariant) => void
  onAddStock?: (v: InventoryVariant) => void
  onHistory?: (v: InventoryVariant) => void
  onEdit?: (v: InventoryVariant) => void
}

export function InventoryGridCard({
  variant: v,
  inventoryType = "physical",
  visible = true,
  onAdjust,
  onAddStock,
  onHistory,
  onEdit,
}: InventoryGridCardProps) {
  const stockValue =
    inventoryType === "initial_load" ? v.initial_stock : v.stock
  const displayName =
    (inventoryType === "initial_load" && v.override_name) || v.products.name
  const displayPrice =
    inventoryType === "initial_load" && v.override_price != null
      ? v.override_price
      : v.price
  const variantLabel = v.name || v.sku
  const accent = ACCENT[inventoryType]

  const isOutOfStock = stockValue <= 0
  const isLowStock = !isOutOfStock && stockValue <= v.stock_min

  const colorIdx = getColorIndex(displayName)
  const palette = INITIAL_COLORS[colorIdx]
  const imageUrl = v.products.image_url

  return (
    <div
      className={`group relative flex flex-col overflow-hidden rounded-2xl border border-transparent bg-white shadow-sm transition-[border-color,box-shadow] duration-200 ${accent.hover} ${
        isOutOfStock ? "opacity-60 grayscale-[20%]" : ""
      }`}
    >
      {/* Low stock badge */}
      {isLowStock && (
        <span className="absolute left-2.5 top-2.5 z-10 flex items-center gap-1 rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-600">
          <AlertCircle className="h-3 w-3" />
          Bajo
        </span>
      )}
      {isOutOfStock && (
        <span className="absolute left-2.5 top-2.5 z-10 flex items-center gap-1 rounded-md bg-rose-50 px-1.5 py-0.5 text-[10px] font-bold text-rose-600">
          <AlertCircle className="h-3 w-3" />
          Sin stock
        </span>
      )}

      {/* Actions — hover reveal */}
      <div className="absolute right-2.5 top-2.5 z-10 opacity-0 transition-opacity group-hover:opacity-100">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="sm"
                className="size-7 p-0 rounded-lg bg-white/80 text-neutral-400 backdrop-blur-sm hover:text-neutral-600"
              />
            }
          >
            <MoreHorizontal className="size-3.5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {onEdit && inventoryType === "initial_load" && (
              <DropdownMenuItem onClick={() => onEdit(v)}>
                <ClipboardEdit className="mr-2 size-3.5" />
                Editar producto
              </DropdownMenuItem>
            )}
            {onAdjust && (
              <DropdownMenuItem onClick={() => onAdjust(v)}>
                <ClipboardEdit className="mr-2 size-3.5" />
                Ajustar stock
              </DropdownMenuItem>
            )}
            {onAddStock && (
              <DropdownMenuItem onClick={() => onAddStock(v)}>
                <PackagePlus className="mr-2 size-3.5" />
                Entrada de mercancia
              </DropdownMenuItem>
            )}
            {onHistory && (
              <DropdownMenuItem onClick={() => onHistory(v)}>
                <History className="mr-2 size-3.5" />
                Ver historial
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Visual area — image or initials (matching product-card.tsx) */}
      <div className={`flex h-40 items-center justify-center sm:h-48 ${palette.bg}`}>
        {imageUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={imageUrl}
            alt={displayName}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <span
            className={`select-none text-[52px] font-black tracking-tight sm:text-[60px] ${palette.text}`}
          >
            {getInitials(displayName)}
          </span>
        )}
      </div>

      {/* Info section */}
      <div className="flex flex-1 flex-col p-4 pt-3.5">
        <p className="truncate text-[13px] font-semibold leading-tight text-neutral-800">
          {displayName}
        </p>
        {v.products.brand && (
          <p className="mt-0.5 truncate text-[11px] font-medium text-neutral-400">
            {v.products.brand}
          </p>
        )}
        {variantLabel && (
          <p className="mt-0.5 truncate text-[10px] font-medium text-neutral-300">
            {v.name && v.sku ? `${v.name} · ${v.sku}` : variantLabel}
          </p>
        )}

        <div className="mt-auto flex items-end justify-between gap-2 pt-4">
          <div className="min-w-0">
            <p className={`text-[16px] font-extrabold tabular-nums tracking-[-0.3px] ${accent.price}`}>
              {visible ? formatCurrency(displayPrice) : "******"}
            </p>
            <p className="text-[10px] tabular-nums text-neutral-400">
              {stockValue} en stock
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
