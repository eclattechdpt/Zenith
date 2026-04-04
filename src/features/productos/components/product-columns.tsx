"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, Pencil, Trash2 } from "lucide-react"
import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { formatCurrency } from "@/lib/utils"

import { getCategoryNames } from "../types"
import type { ProductWithDetails } from "../types"

function getPriceRange(product: ProductWithDetails) {
  const prices = product.product_variants
    .filter((v) => v.is_active)
    .map((v) => v.price)

  if (prices.length === 0) return null

  const min = Math.min(...prices)
  const max = Math.max(...prices)

  if (min === max) return formatCurrency(min)
  return `${formatCurrency(min)} – ${formatCurrency(max)}`
}

function getTotalStock(product: ProductWithDetails) {
  return product.product_variants
    .filter((v) => v.is_active)
    .reduce((sum, v) => sum + v.stock, 0)
}

function getLowStockVariants(product: ProductWithDetails) {
  return product.product_variants.filter(
    (v) => v.is_active && v.stock <= v.stock_min
  ).map((v) => {
    const firstOption = v.variant_option_assignments[0]?.variant_options?.value
    return { label: firstOption || v.sku || "Variante", stock: v.stock }
  })
}

interface ProductColumnsOptions {
  onDelete?: (product: ProductWithDetails) => void
}

export function getProductColumns({
  onDelete,
}: ProductColumnsOptions = {}): ColumnDef<ProductWithDetails>[] {
  return [
    {
      accessorKey: "name",
      size: 250,
      minSize: 180,
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-3 h-8 text-[11px] font-semibold uppercase tracking-wider text-neutral-400"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Producto
          <ArrowUpDown className="ml-1 size-3" />
        </Button>
      ),
      cell: ({ row }) => {
        const product = row.original
        return (
          <div className="flex flex-col gap-0.5">
            <span className="text-[13px] font-semibold text-neutral-900">
              {product.name}
            </span>
            {product.brand && (
              <span className="text-[11px] text-neutral-400">{product.brand}</span>
            )}
          </div>
        )
      },
    },
    {
      id: "category",
      accessorFn: (row) => getCategoryNames(row.product_categories) ?? "",
      size: 160,
      minSize: 120,
      header: () => (
        <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
          Categoria
        </span>
      ),
      cell: ({ row }) => {
        const name = getCategoryNames(row.original.product_categories)
        if (!name) return <span className="text-neutral-300">—</span>
        return (
          <span className="rounded-md bg-neutral-50 px-2 py-0.5 text-[12px] font-medium text-neutral-500">
            {name}
          </span>
        )
      },
    },
    {
      id: "price",
      size: 140,
      minSize: 100,
      header: () => (
        <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
          Precio
        </span>
      ),
      cell: ({ row }) => {
        const range = getPriceRange(row.original)
        if (!range) return <span className="text-neutral-300">—</span>
        return (
          <span className="text-[13px] font-bold tabular-nums text-rose-600">
            {range}
          </span>
        )
      },
    },
    {
      id: "variants",
      size: 100,
      minSize: 80,
      header: () => (
        <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
          Variantes
        </span>
      ),
      cell: ({ row }) => {
        if (!row.original.has_variants) {
          return <span className="text-neutral-300">—</span>
        }
        const count = row.original.product_variants.filter(
          (v) => v.is_active
        ).length
        return (
          <span className="text-[13px] font-semibold tabular-nums text-neutral-700">
            {count}
          </span>
        )
      },
    },
    {
      id: "stock",
      size: 100,
      minSize: 80,
      header: () => (
        <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
          Stock
        </span>
      ),
      cell: ({ row }) => {
        const total = getTotalStock(row.original)
        const lowVariants = getLowStockVariants(row.original)
        return (
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-bold tabular-nums text-neutral-800">{total}</span>
            {lowVariants.length > 0 && (
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Badge
                      variant="destructive"
                      className="cursor-default rounded-md px-1.5 text-[10px] font-semibold leading-none"
                    />
                  }
                >
                  Bajo
                </TooltipTrigger>
                <TooltipContent side="top">
                  <div className="flex flex-col gap-1.5">
                    <span className="font-medium">Variantes con stock bajo:</span>
                    {lowVariants.map((v) => (
                      <span key={v.label}>
                        {v.label} — {v.stock} en stock
                      </span>
                    ))}
                  </div>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        )
      },
    },
    {
      id: "status",
      size: 100,
      minSize: 80,
      header: () => (
        <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
          Estado
        </span>
      ),
      cell: ({ row }) => {
        const active = row.original.is_active
        return active ? (
          <span className="text-[12px] font-semibold text-teal-600">Activo</span>
        ) : (
          <span className="text-[12px] font-medium text-neutral-400">Inactivo</span>
        )
      },
    },
    {
      id: "actions",
      size: 80,
      minSize: 80,
      header: "",
      cell: ({ row }) => {
        const product = row.original
        return (
          <div className="flex items-center justify-end gap-1">
            <Link
              href={`/productos/${product.id}`}
              className="rounded-lg p-1.5 text-neutral-300 transition-colors hover:bg-neutral-50 hover:text-neutral-600"
            >
              <Pencil className="size-3.5" />
            </Link>
            {onDelete && (
              <button
                type="button"
                onClick={() => onDelete(product)}
                className="rounded-lg p-1.5 text-neutral-300 transition-colors hover:bg-red-50 hover:text-red-500"
              >
                <Trash2 className="size-3.5" />
              </button>
            )}
          </div>
        )
      },
    },
  ]
}
