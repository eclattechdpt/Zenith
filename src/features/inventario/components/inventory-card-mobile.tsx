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
  onAdjust?: (variant: InventoryVariant) => void
  onAddStock?: (variant: InventoryVariant) => void
  onHistory?: (variant: InventoryVariant) => void
  onEdit?: (variant: InventoryVariant) => void
}

function StockBadgeMobile({ stock, stockMin }: { stock: number; stockMin: number }) {
  if (stock <= 0) {
    return (
      <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200 text-[10px]">
        Sin stock
      </Badge>
    )
  }
  if (stock <= stockMin) {
    return (
      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-[10px]">
        Bajo
      </Badge>
    )
  }
  return (
    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">
      OK
    </Badge>
  )
}

export function InventoryCardMobile({
  variant: v,
  inventoryType = "physical",
  onAdjust,
  onAddStock,
  onHistory,
  onEdit,
}: InventoryCardMobileProps) {
  const stockValue = inventoryType === "initial_load" ? v.initial_stock : v.stock
  const displayName = (inventoryType === "initial_load" && v.override_name) || v.products.name
  const displayPrice = (inventoryType === "initial_load" && v.override_price != null) ? v.override_price : v.price
  const variantLabel = v.name || v.sku

  return (
    <div className="rounded-xl border border-neutral-100 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-neutral-950 truncate">
              {displayName}
            </span>
            <StockBadgeMobile stock={stockValue} stockMin={v.stock_min} />
          </div>
          {v.products.brand && (
            <p className="text-xs text-neutral-500 mt-0.5">{v.products.brand}</p>
          )}
          {variantLabel && (
            <p className="text-xs text-neutral-400 mt-0.5 truncate">
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

      <div className="mt-2 flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs text-neutral-500 tabular-nums">
          <span>Stock: <strong className="text-neutral-950">{stockValue}</strong></span>
          <span>Min: {v.stock_min}</span>
        </div>
        <span className="font-semibold text-neutral-950 tabular-nums">
          {formatCurrency(displayPrice)}
        </span>
      </div>
    </div>
  )
}
