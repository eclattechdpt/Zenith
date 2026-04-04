"use client"

import type { ColumnDef } from "@tanstack/react-table"
import {
  ArrowUpDown,
  MoreHorizontal,
  ClipboardEdit,
  PackagePlus,
  History,
  Pencil,
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

import type { InventoryVariant } from "../types"

import type { InventoryType } from "../types"

interface InventoryColumnsOptions {
  onAdjust?: (variant: InventoryVariant) => void
  onAddStock?: (variant: InventoryVariant) => void
  onHistory?: (variant: InventoryVariant) => void
  onEdit?: (variant: InventoryVariant) => void
  inventoryType?: InventoryType
}

function getStockValue(v: InventoryVariant, type: InventoryType = "physical") {
  return type === "initial_load" ? v.initial_stock : v.stock
}

function StockBadge({ stock, stockMin }: { stock: number; stockMin: number }) {
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

export function getInventoryColumns({
  onAdjust,
  onAddStock,
  onHistory,
  onEdit,
  inventoryType = "physical",
}: InventoryColumnsOptions = {}): ColumnDef<InventoryVariant>[] {
  return [
    {
      id: "product",
      size: 200,
      minSize: 160,
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-3 h-8"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Producto
          <ArrowUpDown className="ml-1 size-3.5" />
        </Button>
      ),
      accessorFn: (row) => row.products.name,
      cell: ({ row }) => {
        const v = row.original
        const displayName = (inventoryType === "initial_load" && v.override_name) || v.products.name
        const isOverridden = inventoryType === "initial_load" && v.override_name
        return (
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="font-semibold text-neutral-950 truncate">
                {displayName}
              </p>
              {isOverridden && (
                <Badge variant="outline" className="bg-slate-50 text-slate-500 border-slate-200 text-[9px] shrink-0">
                  editado
                </Badge>
              )}
            </div>
            {v.products.brand && (
              <p className="text-xs text-neutral-500 truncate">{v.products.brand}</p>
            )}
          </div>
        )
      },
    },
    {
      id: "variant",
      size: 140,
      minSize: 100,
      header: "Variante",
      cell: ({ row }) => {
        const v = row.original
        const label = v.name || v.sku
        if (!label && !v.products.has_variants) {
          return <span className="text-neutral-400">—</span>
        }
        return (
          <div className="min-w-0">
            {v.name && (
              <p className="text-sm text-neutral-700 truncate">{v.name}</p>
            )}
            {v.sku && (
              <p className="text-xs text-neutral-400 tabular-nums truncate">{v.sku}</p>
            )}
          </div>
        )
      },
    },
    {
      id: "category",
      size: 120,
      minSize: 100,
      header: "Categoria",
      cell: ({ row }) => {
        const cats = (row.original.products.product_categories ?? [])
          .map((pc) => pc.categories?.name)
          .filter(Boolean)
          .join(", ")
        if (!cats) return <span className="text-neutral-400">—</span>
        return <span className="text-sm text-neutral-600">{cats}</span>
      },
    },
    {
      accessorKey: "price",
      size: 100,
      minSize: 80,
      header: () => <span className="block text-right">Precio</span>,
      cell: ({ row }) => {
        const v = row.original
        const displayPrice = (inventoryType === "initial_load" && v.override_price != null)
          ? v.override_price
          : v.price
        return (
          <span className="block text-right text-sm text-neutral-700 tabular-nums">
            {formatCurrency(displayPrice)}
          </span>
        )
      },
    },
    {
      id: "stock_value",
      accessorFn: (row) => getStockValue(row, inventoryType),
      size: 80,
      minSize: 70,
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-3 h-8"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Stock
          <ArrowUpDown className="ml-1 size-3.5" />
        </Button>
      ),
      cell: ({ row }) => (
        <span className="font-semibold text-neutral-950 tabular-nums">
          {getStockValue(row.original, inventoryType)}
        </span>
      ),
    },
    {
      accessorKey: "stock_min",
      size: 70,
      minSize: 60,
      header: "Minimo",
      cell: ({ row }) => (
        <span className="text-sm text-neutral-500 tabular-nums">
          {row.original.stock_min}
        </span>
      ),
    },
    {
      id: "status",
      size: 90,
      minSize: 80,
      header: "Estado",
      cell: ({ row }) => (
        <StockBadge
          stock={getStockValue(row.original, inventoryType)}
          stockMin={row.original.stock_min}
        />
      ),
    },
    {
      id: "actions",
      size: 50,
      minSize: 50,
      header: "",
      cell: ({ row }) => {
        const variant = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="ghost" size="sm" className="size-8 p-0" />
              }
            >
              <MoreHorizontal className="size-4" />
              <span className="sr-only">Acciones</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onEdit && inventoryType === "initial_load" && (
                <DropdownMenuItem onClick={() => onEdit(variant)}>
                  <Pencil className="mr-2 size-3.5" />
                  Editar producto
                </DropdownMenuItem>
              )}
              {onAdjust && (
                <DropdownMenuItem onClick={() => onAdjust(variant)}>
                  <ClipboardEdit className="mr-2 size-3.5" />
                  Ajustar stock
                </DropdownMenuItem>
              )}
              {onAddStock && (
                <DropdownMenuItem onClick={() => onAddStock(variant)}>
                  <PackagePlus className="mr-2 size-3.5" />
                  Entrada de mercancia
                </DropdownMenuItem>
              )}
              {onHistory && (
                <DropdownMenuItem onClick={() => onHistory(variant)}>
                  <History className="mr-2 size-3.5" />
                  Ver historial
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]
}
