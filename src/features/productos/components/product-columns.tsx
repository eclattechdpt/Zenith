"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, MoreHorizontal, Pencil, Trash2 } from "lucide-react"
import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { formatCurrency } from "@/lib/utils"

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
    // Only use the first option value (e.g. tone name) for a concise label
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
          className="-ml-3 h-8"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Producto
          <ArrowUpDown className="ml-1 size-3.5" />
        </Button>
      ),
      cell: ({ row }) => {
        const product = row.original
        return (
          <div className="flex flex-col">
            <span className="font-medium text-neutral-950">
              {product.name}
            </span>
            {product.brand && (
              <span className="text-xs text-neutral-500">{product.brand}</span>
            )}
          </div>
        )
      },
    },
    {
      id: "category",
      accessorFn: (row) => row.categories?.name ?? "",
      size: 160,
      minSize: 120,
      header: "Categoria",
      cell: ({ row }) => {
        const name = row.original.categories?.name
        if (!name) return <span className="text-neutral-400">—</span>
        return (
          <span className="text-sm text-neutral-600">{name}</span>
        )
      },
    },
    {
      id: "price",
      size: 140,
      minSize: 100,
      header: "Precio",
      cell: ({ row }) => {
        const range = getPriceRange(row.original)
        if (!range) return <span className="text-neutral-400">—</span>
        return <span className="text-sm tabular-nums">{range}</span>
      },
    },
    {
      id: "variants",
      size: 100,
      minSize: 80,
      header: "Variantes",
      cell: ({ row }) => {
        const count = row.original.product_variants.filter(
          (v) => v.is_active
        ).length
        if (count <= 1) return <span className="text-neutral-400">—</span>
        return (
          <span className="text-sm text-neutral-600">
            {count}
          </span>
        )
      },
    },
    {
      id: "stock",
      size: 100,
      minSize: 80,
      header: "Stock",
      cell: ({ row }) => {
        const total = getTotalStock(row.original)
        const lowVariants = getLowStockVariants(row.original)
        return (
          <div className="flex items-center gap-2">
            <span className="text-sm tabular-nums">{total}</span>
            {lowVariants.length > 0 && (
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Badge
                      variant="destructive"
                      className="cursor-default text-[10px] leading-none"
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
      header: "Estado",
      cell: ({ row }) => {
        const active = row.original.is_active
        return (
          <Badge variant={active ? "secondary" : "outline"}>
            {active ? "Activo" : "Inactivo"}
          </Badge>
        )
      },
    },
    {
      id: "actions",
      size: 50,
      minSize: 50,
      header: "",
      cell: ({ row }) => {
        const product = row.original
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
              <DropdownMenuItem
                nativeButton={false}
                render={<Link href={`/productos/${product.id}`} />}
              >
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
        )
      },
    },
  ]
}
