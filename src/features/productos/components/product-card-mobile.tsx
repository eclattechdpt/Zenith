"use client"

import { MoreHorizontal, Pencil, Trash2 } from "lucide-react"
import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { formatCurrency } from "@/lib/utils"

import type { ProductWithDetails } from "../types"

interface ProductCardMobileProps {
  product: ProductWithDetails
  onDelete?: (product: ProductWithDetails) => void
}

export function ProductCardMobile({ product, onDelete }: ProductCardMobileProps) {
  const activeVariants = product.product_variants.filter((v) => v.is_active)
  const prices = activeVariants.map((v) => v.price)
  const min = prices.length > 0 ? Math.min(...prices) : 0
  const max = prices.length > 0 ? Math.max(...prices) : 0
  const priceLabel = min === max ? formatCurrency(min) : `${formatCurrency(min)} – ${formatCurrency(max)}`
  const totalStock = activeVariants.reduce((sum, v) => sum + v.stock, 0)
  const categoryName = product.categories?.name
  const variantCount = product.has_variants ? activeVariants.length : null

  return (
    <div className="rounded-xl border border-neutral-100 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-medium text-neutral-950">{product.name}</p>
          {product.brand && (
            <p className="text-xs text-neutral-500">{product.brand}</p>
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
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-neutral-500">
        {categoryName && (
          <span>{categoryName}</span>
        )}
        {categoryName && variantCount !== null && <span>·</span>}
        {variantCount !== null && (
          <span>{variantCount} variante{variantCount !== 1 ? "s" : ""}</span>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium tabular-nums text-neutral-950">
            {priceLabel}
          </span>
          <span className="text-xs text-neutral-400">
            Stock: {totalStock}
          </span>
        </div>
        <Badge variant={product.is_active ? "secondary" : "outline"}>
          {product.is_active ? "Activo" : "Inactivo"}
        </Badge>
      </div>
    </div>
  )
}
