"use client"

import {
  MoreHorizontal,
  ClipboardEdit,
  PackagePlus,
  History,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { formatCurrency } from "@/lib/utils"

import type { InventoryVariant, InventoryType } from "../types"

interface InventoryCardMobileProps {
  variant: InventoryVariant
  inventoryType?: InventoryType
  visible?: boolean
  onAdjust?: (variant: InventoryVariant) => void
  onAddStock?: (variant: InventoryVariant) => void
  onHistory?: (variant: InventoryVariant) => void
  onEdit?: (variant: InventoryVariant) => void
}

function getStockStatus(stock: number, stockMin: number) {
  if (stock <= 0) return { label: "Sin stock", bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200", thumbBg: "bg-rose-50", thumbText: "text-rose-300" }
  if (stock <= stockMin) return { label: "Bajo", bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", thumbBg: "bg-amber-50", thumbText: "text-amber-300" }
  return { label: "OK", bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", thumbBg: "bg-emerald-50", thumbText: "text-emerald-300" }
}

export function InventoryCardMobile({
  variant: v,
  inventoryType = "physical",
  visible = true,
  onAdjust,
  onAddStock,
  onHistory,
  onEdit,
}: InventoryCardMobileProps) {
  const stockValue = inventoryType === "initial_load" ? v.initial_stock : v.stock
  const displayName = (inventoryType === "initial_load" && v.override_name) || v.products.name
  const displayPrice = (inventoryType === "initial_load" && v.override_price != null) ? v.override_price : v.price
  const variantLabel = v.name || v.sku
  const initials = displayName.slice(0, 2).toUpperCase()
  const status = getStockStatus(stockValue, v.stock_min)

  return (
    <div className="flex gap-3.5 rounded-2xl border border-neutral-100 bg-white p-4 shadow-sm">
      {/* Thumbnail — image if available, colored initials as fallback */}
      <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl ${v.products.image_url ? "bg-neutral-100" : status.thumbBg}`}>
        {v.products.image_url ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={v.products.image_url}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <span className={`text-[16px] font-black ${status.thumbText}`}>
            {initials}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-semibold text-neutral-900 truncate">
                {displayName}
              </span>
              <Badge variant="outline" className={`${status.bg} ${status.text} ${status.border} text-[10px] shrink-0`}>
                {status.label}
              </Badge>
            </div>
            {v.products.brand && (
              <p className="text-[11px] font-medium text-neutral-400 mt-0.5 truncate">
                {v.products.brand}
              </p>
            )}
            {variantLabel && (
              <p className="text-[11px] text-neutral-400 mt-0.5 truncate">
                {v.name && v.sku ? `${v.name} · ${v.sku}` : variantLabel}
              </p>
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="ghost" size="sm" className="size-7 p-0 shrink-0" />
              }
            >
              <MoreHorizontal className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onEdit && (
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

        <div className="mt-2.5 flex items-center justify-between">
          <div className="flex items-center gap-3 text-[11px] text-neutral-500 tabular-nums">
            <span>Stock: <strong className="text-neutral-900">{stockValue}</strong></span>
            <span>Min: {v.stock_min}</span>
          </div>
          <span className="text-[15px] font-extrabold text-neutral-950 tabular-nums tracking-[-0.3px]">
            {visible ? formatCurrency(displayPrice) : "******"}
          </span>
        </div>
      </div>
    </div>
  )
}
