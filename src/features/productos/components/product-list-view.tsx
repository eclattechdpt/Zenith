"use client"

import { useState } from "react"
import { ArrowUpDown, Pencil, Trash2, ChevronDown, Layers } from "lucide-react"
import { motion, AnimatePresence } from "motion/react"

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
  return product.product_variants
    .filter((v) => v.is_active && v.stock > 0 && v.stock <= 5)
    .map((v) => {
      const firstOption = v.variant_option_assignments[0]?.variant_options?.value
      return { label: firstOption || v.sku || "Variante", stock: v.stock }
    })
}

// ── Row ──

function ProductRow({
  product,
  onEdit,
  onDelete,
}: {
  product: ProductWithDetails
  onEdit?: (product: ProductWithDetails) => void
  onDelete?: (product: ProductWithDetails) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const activeVariants = product.product_variants.filter((v) => v.is_active)
  const hasMultipleVariants = product.has_variants && activeVariants.length > 1
  const totalStock = getTotalStock(product)
  const lowVariants = getLowStockVariants(product)
  const priceRange = getPriceRange(product)

  return (
    <>
      <tr className="group border-b border-neutral-100 transition-colors hover:bg-neutral-50/50">
        {/* Product */}
        <td className="py-3.5 pl-4 pr-3">
          <div className="flex items-center gap-3">
            {/* Expand toggle */}
            <button
              type="button"
              onClick={() => hasMultipleVariants && setExpanded((v) => !v)}
              className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md transition-colors ${
                hasMultipleVariants
                  ? "text-neutral-300 hover:bg-neutral-100 hover:text-neutral-500"
                  : "pointer-events-none text-transparent"
              }`}
            >
              {hasMultipleVariants && (
                <motion.div
                  animate={{ rotate: expanded ? 180 : 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                >
                  <ChevronDown className="h-3.5 w-3.5" />
                </motion.div>
              )}
            </button>
            {/* Thumbnail */}
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-neutral-100">
              {product.image_url ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={product.image_url}
                  alt=""
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              ) : (
                <span className="text-[11px] font-black text-neutral-300">
                  {product.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()}
                </span>
              )}
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[13px] font-semibold text-neutral-900">
                {product.name}
              </span>
              {product.brand && (
                <span className="text-[11px] text-neutral-400">
                  {product.brand}
                </span>
              )}
            </div>
          </div>
        </td>

        {/* Category */}
        <td className="px-3 py-3.5">
          {getCategoryNames(product.product_categories) ? (
            <span className="rounded-md bg-neutral-100/80 px-2 py-0.5 text-[12px] font-medium text-neutral-500">
              {getCategoryNames(product.product_categories)}
            </span>
          ) : (
            <span className="text-neutral-300">—</span>
          )}
        </td>

        {/* Price */}
        <td className="px-3 py-3.5">
          {priceRange ? (
            <span className="text-[13px] font-bold tabular-nums text-rose-600">
              {priceRange}
            </span>
          ) : (
            <span className="text-neutral-300">—</span>
          )}
        </td>

        {/* Variants */}
        <td className="px-3 py-3.5">
          {hasMultipleVariants ? (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[12px] font-semibold text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-700"
            >
              <Layers className="h-3 w-3 text-neutral-400" />
              {activeVariants.length}
            </button>
          ) : (
            <span className="text-neutral-300">—</span>
          )}
        </td>

        {/* Stock */}
        <td className="px-3 py-3.5">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-bold tabular-nums text-neutral-800">
              {totalStock}
            </span>
            {totalStock === 0 ? (
              <Badge
                variant="destructive"
                className="cursor-default rounded-md px-1.5 text-[10px] font-semibold leading-none"
              >
                Sin stock
              </Badge>
            ) : lowVariants.length > 0 ? (
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Badge
                      variant="destructive"
                      className="cursor-default rounded-md bg-amber-100 px-1.5 text-[10px] font-semibold leading-none text-amber-700 hover:bg-amber-100"
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
            ) : null}
          </div>
        </td>

        {/* Status */}
        <td className="px-3 py-3.5">
          {product.is_active ? (
            <span className="text-[12px] font-semibold text-teal-600">Activo</span>
          ) : (
            <span className="text-[12px] font-medium text-neutral-400">Inactivo</span>
          )}
        </td>

        {/* Actions */}
        <td className="py-3.5 pl-3 pr-4">
          <div className="flex items-center justify-end gap-1">
            <button
              type="button"
              onClick={() => onEdit?.(product)}
              className="rounded-lg p-1.5 text-neutral-300 transition-colors hover:bg-neutral-50 hover:text-neutral-600"
            >
              <Pencil className="size-3.5" />
            </button>
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
        </td>
      </tr>

      {/* Expanded variants row */}
      <AnimatePresence initial={false}>
        {expanded && hasMultipleVariants && (
          <tr>
            <td colSpan={7} className="p-0">
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                className="overflow-hidden"
              >
                <div className="border-b border-neutral-100 bg-neutral-50/60 px-4 py-3 pl-[68px]">
                  {/* Variant header */}
                  <div className="mb-2 flex items-center gap-4 px-3 text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
                    <span className="flex-1">Variante</span>
                    <span className="w-20 text-right">Precio</span>
                    <span className="w-16 text-right">Stock</span>
                    <span className="w-14 text-right">Codigo</span>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {activeVariants.map((v) => (
                      <div
                        key={v.id}
                        className="flex items-center gap-4 rounded-lg bg-white px-3 py-2 shadow-sm ring-1 ring-neutral-100"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[12px] font-semibold text-neutral-700">
                            {v.name || v.sku || "Variante"}
                          </p>
                        </div>
                        <span className="w-20 text-right text-[12px] font-bold tabular-nums text-rose-600">
                          {formatCurrency(v.price)}
                        </span>
                        <span className={`w-16 text-right text-[12px] font-semibold tabular-nums ${
                          v.stock <= 5 ? "text-amber-500" : "text-neutral-600"
                        }`}>
                          {v.stock}
                        </span>
                        <span className="w-14 truncate text-right text-[10px] font-medium text-neutral-400">
                          {v.sku || "—"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </td>
          </tr>
        )}
      </AnimatePresence>
    </>
  )
}

// ── Sortable header button ──

function SortHeader({
  label,
  sortKey,
  currentSort,
  onSort,
}: {
  label: string
  sortKey: string
  currentSort: { key: string; dir: "asc" | "desc" } | null
  onSort: (key: string) => void
}) {
  return (
    <Button
      variant="ghost"
      size="sm"
      className="-ml-3 h-8 text-[11px] font-semibold uppercase tracking-wider text-neutral-400"
      onClick={() => onSort(sortKey)}
    >
      {label}
      <ArrowUpDown className="ml-1 size-3" />
    </Button>
  )
}

// ── Main ──

interface ProductListViewProps {
  products: ProductWithDetails[]
  onEdit?: (product: ProductWithDetails) => void
  onDelete?: (product: ProductWithDetails) => void
}

export function ProductListView({ products, onEdit, onDelete }: ProductListViewProps) {
  const [sort, setSort] = useState<{ key: string; dir: "asc" | "desc" } | null>(null)

  function handleSort(key: string) {
    setSort((prev) =>
      prev?.key === key
        ? { key, dir: prev.dir === "asc" ? "desc" : "asc" }
        : { key, dir: "asc" }
    )
  }

  const sorted = sort
    ? [...products].sort((a, b) => {
        const dir = sort.dir === "asc" ? 1 : -1
        if (sort.key === "name") return dir * a.name.localeCompare(b.name)
        return 0
      })
    : products

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[700px]" style={{ tableLayout: "fixed" }}>
        <colgroup>
          <col style={{ width: "250px" }} />
          <col style={{ width: "160px" }} />
          <col style={{ width: "140px" }} />
          <col style={{ width: "100px" }} />
          <col style={{ width: "100px" }} />
          <col style={{ width: "100px" }} />
          <col style={{ width: "80px" }} />
        </colgroup>
        <thead>
          <tr className="border-b border-neutral-200/60">
            <th className="pb-2 pl-4 pr-3 text-left">
              <SortHeader label="Producto" sortKey="name" currentSort={sort} onSort={handleSort} />
            </th>
            <th className="px-3 pb-2 text-left">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                Categoria
              </span>
            </th>
            <th className="px-3 pb-2 text-left">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                Precio
              </span>
            </th>
            <th className="px-3 pb-2 text-left">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                Variantes
              </span>
            </th>
            <th className="px-3 pb-2 text-left">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                Stock
              </span>
            </th>
            <th className="px-3 pb-2 text-left">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                Estado
              </span>
            </th>
            <th className="pb-2 pl-3 pr-4" />
          </tr>
        </thead>
        <tbody>
          {sorted.map((product) => (
            <ProductRow
              key={product.id}
              product={product}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}
