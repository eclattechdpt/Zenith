"use client"

import { useState, useMemo } from "react"
import {
  ArrowUpDown,
  MoreHorizontal,
  ClipboardEdit,
  PackagePlus,
  History,
  Pencil,
  ChevronDown,
  Layers,
} from "lucide-react"
import { motion, AnimatePresence } from "motion/react"

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

// ── Status ─────────────────────────────────────────────────────────────────

type Status = "ok" | "bajo" | "sin_stock"

function computeStatus(stock: number, stockMin: number): Status {
  if (stock <= 0) return "sin_stock"
  if (stock <= stockMin) return "bajo"
  return "ok"
}

function getStatusConfig(status: Status) {
  switch (status) {
    case "sin_stock":
      return {
        label: "Sin stock",
        rowBg: "bg-rose-50/55 hover:bg-rose-50/90",
        dotColor: "bg-rose-500",
        textColor: "text-rose-600",
        stockColor: "text-rose-600",
      }
    case "bajo":
      return {
        label: "Stock bajo",
        rowBg: "bg-amber-50/45 hover:bg-amber-50/80",
        dotColor: "bg-amber-500",
        textColor: "text-amber-700",
        stockColor: "text-amber-700",
      }
    default:
      return {
        label: "Disponible",
        rowBg: "bg-white hover:bg-neutral-50/70",
        dotColor: "bg-emerald-500",
        textColor: "text-emerald-700",
        stockColor: "text-neutral-950",
      }
  }
}

// ── Grouping ───────────────────────────────────────────────────────────────

interface ProductGroup {
  productId: string
  productInfo: InventoryVariant["products"]
  variants: InventoryVariant[]
  totalStock: number
  minPrice: number
  maxPrice: number
  worstStatus: Status
}

function groupByProduct(
  variants: InventoryVariant[],
  inventoryType: InventoryType
): ProductGroup[] {
  const map = new Map<string, ProductGroup>()
  const order: string[] = []

  for (const v of variants) {
    const stock =
      inventoryType === "initial_load" ? v.initial_stock : v.stock
    const price =
      inventoryType === "initial_load" && v.override_price != null
        ? v.override_price
        : v.price
    const status = computeStatus(stock, v.stock_min)

    let group = map.get(v.product_id)
    if (!group) {
      group = {
        productId: v.product_id,
        productInfo: v.products,
        variants: [],
        totalStock: 0,
        minPrice: price,
        maxPrice: price,
        worstStatus: "ok",
      }
      map.set(v.product_id, group)
      order.push(v.product_id)
    }
    group.variants.push(v)
    group.totalStock += stock
    group.minPrice = Math.min(group.minPrice, price)
    group.maxPrice = Math.max(group.maxPrice, price)
    if (status === "sin_stock") group.worstStatus = "sin_stock"
    else if (status === "bajo" && group.worstStatus !== "sin_stock")
      group.worstStatus = "bajo"
  }

  return order.map((id) => map.get(id)!)
}

// ── Sort ───────────────────────────────────────────────────────────────────

type SortKey = "name" | "stock"
type SortDir = "asc" | "desc"

// ── Main component ─────────────────────────────────────────────────────────

interface InventoryListViewProps {
  variants: InventoryVariant[]
  inventoryType?: InventoryType
  visible?: boolean
  onAdjust?: (v: InventoryVariant) => void
  onAddStock?: (v: InventoryVariant) => void
  onHistory?: (v: InventoryVariant) => void
  onEdit?: (v: InventoryVariant) => void
}

export function InventoryListView({
  variants,
  inventoryType = "physical",
  visible = true,
  onAdjust,
  onAddStock,
  onHistory,
  onEdit,
}: InventoryListViewProps) {
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir } | null>(null)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  function handleSort(key: SortKey) {
    setSort((prev) =>
      prev?.key === key
        ? { key, dir: prev.dir === "asc" ? "desc" : "asc" }
        : { key, dir: "asc" }
    )
  }

  function toggleExpanded(productId: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(productId)) next.delete(productId)
      else next.add(productId)
      return next
    })
  }

  const groups = useMemo(
    () => groupByProduct(variants, inventoryType),
    [variants, inventoryType]
  )

  const sortedGroups = useMemo(() => {
    if (!sort) return groups
    const dir = sort.dir === "asc" ? 1 : -1
    return [...groups].sort((a, b) => {
      if (sort.key === "name") {
        return dir * a.productInfo.name.localeCompare(b.productInfo.name)
      }
      if (sort.key === "stock") {
        return dir * (a.totalStock - b.totalStock)
      }
      return 0
    })
  }, [groups, sort])

  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-sm shadow-neutral-900/[0.02]">
      <div className="overflow-x-auto">
        <table
          className="w-full min-w-[900px]"
          style={{ tableLayout: "fixed" }}
        >
          <colgroup>
            <col style={{ width: "56px" }} />
            <col />
            <col style={{ width: "160px" }} />
            <col style={{ width: "150px" }} />
            <col style={{ width: "120px" }} />
            <col style={{ width: "110px" }} />
            <col style={{ width: "130px" }} />
            <col style={{ width: "56px" }} />
          </colgroup>

          {/* ── Header ── */}
          <thead>
            <tr className="border-b border-neutral-100 bg-neutral-50/60">
              <th />
              <th className="py-2.5 pr-3 text-left">
                <SortButton
                  label="Producto"
                  active={sort?.key === "name"}
                  onClick={() => handleSort("name")}
                />
              </th>
              <th className="px-3 py-2.5 text-left">
                <HeaderLabel>Variantes</HeaderLabel>
              </th>
              <th className="px-3 py-2.5 text-left">
                <HeaderLabel>Categoria</HeaderLabel>
              </th>
              <th className="px-3 py-2.5 text-right">
                <HeaderLabel align="right">Precio</HeaderLabel>
              </th>
              <th className="px-3 py-2.5 text-right">
                <SortButton
                  label="Stock"
                  active={sort?.key === "stock"}
                  onClick={() => handleSort("stock")}
                  align="right"
                />
              </th>
              <th className="px-3 py-2.5 text-left">
                <HeaderLabel>Estado</HeaderLabel>
              </th>
              <th className="py-2.5 pl-3 pr-4" />
            </tr>
          </thead>

          {/* ── Body ── */}
          <tbody>
            {sortedGroups.map((group) => (
              <ProductRow
                key={group.productId}
                group={group}
                inventoryType={inventoryType}
                visible={visible}
                isExpanded={expanded.has(group.productId)}
                onToggleExpand={() => toggleExpanded(group.productId)}
                onAdjust={onAdjust}
                onAddStock={onAddStock}
                onHistory={onHistory}
                onEdit={onEdit}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Product row (handles single + multi-variant) ───────────────────────────

interface ProductRowProps {
  group: ProductGroup
  inventoryType: InventoryType
  visible: boolean
  isExpanded: boolean
  onToggleExpand: () => void
  onAdjust?: (v: InventoryVariant) => void
  onAddStock?: (v: InventoryVariant) => void
  onHistory?: (v: InventoryVariant) => void
  onEdit?: (v: InventoryVariant) => void
}

function ProductRow({
  group,
  inventoryType,
  visible,
  isExpanded,
  onToggleExpand,
  onAdjust,
  onAddStock,
  onHistory,
  onEdit,
}: ProductRowProps) {
  const isMulti = group.variants.length > 1
  const status = getStatusConfig(group.worstStatus)
  const product = group.productInfo

  // Category display
  const cats = (product.product_categories ?? [])
    .map((pc) => pc.categories?.name)
    .filter(Boolean)
    .join(", ")

  // For single-variant products: pull data from the only variant
  const singleVariant = !isMulti ? group.variants[0] : null
  const singleOverridden =
    singleVariant &&
    inventoryType === "initial_load" &&
    singleVariant.override_name
  const displayName =
    (singleVariant &&
      inventoryType === "initial_load" &&
      singleVariant.override_name) ||
    product.name
  const initials = displayName
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()

  // Price display
  const priceLabel =
    group.minPrice === group.maxPrice
      ? formatCurrency(group.minPrice)
      : `${formatCurrency(group.minPrice)} – ${formatCurrency(group.maxPrice)}`

  return (
    <>
      <tr
        className={`border-b border-neutral-100/70 transition-colors duration-150 ${status.rowBg} ${
          isMulti ? "cursor-pointer" : ""
        }`}
        onClick={isMulti ? onToggleExpand : undefined}
      >
        {/* Chevron */}
        <td className="py-3.5 pl-3 pr-3">
          {isMulti ? (
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 35 }}
              className="flex h-6 w-6 items-center justify-center rounded-md text-neutral-300 transition-colors hover:bg-neutral-100 hover:text-neutral-500"
            >
              <ChevronDown className="h-3.5 w-3.5" />
            </motion.div>
          ) : (
            <div className="h-6 w-6" />
          )}
        </td>

        {/* Producto: image + name + brand */}
        <td className="py-3.5 pr-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-neutral-100 ring-1 ring-neutral-200/70">
              {product.image_url ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={product.image_url}
                  alt=""
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              ) : (
                <span className="text-[10px] font-black text-neutral-300">
                  {initials}
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="truncate text-[13.5px] font-semibold text-neutral-950">
                  {displayName}
                </span>
                {singleOverridden && (
                  <Badge
                    variant="outline"
                    className="bg-slate-50 text-slate-500 border-slate-200 text-[9px] shrink-0"
                  >
                    editado
                  </Badge>
                )}
              </div>
              {product.brand && (
                <p className="truncate text-[11px] font-medium text-neutral-400">
                  {product.brand}
                </p>
              )}
            </div>
          </div>
        </td>

        {/* Variantes */}
        <td className="px-3 py-3.5">
          {isMulti ? (
            <div className="inline-flex items-center gap-1.5 rounded-md bg-neutral-100/80 px-2 py-1 text-[11px] font-semibold text-neutral-600">
              <Layers className="h-3 w-3 text-neutral-400" />
              {group.variants.length} variantes
            </div>
          ) : singleVariant && (singleVariant.name || singleVariant.sku) ? (
            <div className="min-w-0">
              {singleVariant.name && (
                <p className="truncate text-[12px] font-semibold text-neutral-700">
                  {singleVariant.name}
                </p>
              )}
              {singleVariant.sku && (
                <p className="truncate text-[10px] font-medium tabular-nums text-neutral-400">
                  {singleVariant.sku}
                </p>
              )}
            </div>
          ) : (
            <span className="text-neutral-300">—</span>
          )}
        </td>

        {/* Categoria */}
        <td className="px-3 py-3.5">
          {cats ? (
            <span className="inline-block max-w-full truncate rounded-md bg-neutral-100/90 px-2 py-0.5 text-[11px] font-medium text-neutral-500">
              {cats}
            </span>
          ) : (
            <span className="text-neutral-300">—</span>
          )}
        </td>

        {/* Precio */}
        <td className="px-3 py-3.5 text-right">
          <span className="text-[13px] font-semibold tabular-nums text-neutral-700">
            {visible ? priceLabel : "••••"}
          </span>
        </td>

        {/* Stock */}
        <td className="px-3 py-3.5 text-right">
          <div className="flex flex-col items-end leading-none">
            <span
              className={`text-[16px] font-black tabular-nums ${status.stockColor}`}
            >
              {group.totalStock}
            </span>
            <span className="mt-1 text-[9px] font-semibold uppercase tracking-[0.8px] text-neutral-400">
              {isMulti
                ? `${group.variants.length} variantes`
                : `min ${singleVariant?.stock_min ?? 0}`}
            </span>
          </div>
        </td>

        {/* Estado */}
        <td className="px-3 py-3.5">
          <div className="inline-flex items-center gap-1.5">
            <span className={`h-1.5 w-1.5 rounded-full ${status.dotColor}`} />
            <span className={`text-[11px] font-semibold ${status.textColor}`}>
              {status.label}
            </span>
          </div>
        </td>

        {/* Actions — only single-variant rows; multi-variant actions live on expanded sub-rows */}
        <td
          className="py-3.5 pl-3 pr-4"
          onClick={(e) => e.stopPropagation()}
        >
          {!isMulti && singleVariant && (
            <VariantActions
              variant={singleVariant}
              inventoryType={inventoryType}
              onAdjust={onAdjust}
              onAddStock={onAddStock}
              onHistory={onHistory}
              onEdit={onEdit}
            />
          )}
        </td>
      </tr>

      {/* Expanded variant sub-rows */}
      <AnimatePresence initial={false}>
        {isMulti && isExpanded && (
          <tr>
            <td colSpan={8} className="p-0">
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                className="overflow-hidden"
              >
                <div className="border-b border-neutral-100 bg-neutral-50/50 px-4 py-3 pl-[76px]">
                  <div className="mb-2 flex items-center gap-3 px-3 text-[9px] font-bold uppercase tracking-[0.8px] text-neutral-400">
                    <span className="flex-1">Variante</span>
                    <span className="w-24 text-right">Precio</span>
                    <span className="w-24 text-right">Stock</span>
                    <span className="w-24">Estado</span>
                    <span className="w-8" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {group.variants.map((v) => (
                      <VariantSubRow
                        key={v.id}
                        variant={v}
                        inventoryType={inventoryType}
                        visible={visible}
                        onAdjust={onAdjust}
                        onAddStock={onAddStock}
                        onHistory={onHistory}
                        onEdit={onEdit}
                      />
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

// ── Variant sub-row (inside expanded panel) ────────────────────────────────

interface VariantSubRowProps {
  variant: InventoryVariant
  inventoryType: InventoryType
  visible: boolean
  onAdjust?: (v: InventoryVariant) => void
  onAddStock?: (v: InventoryVariant) => void
  onHistory?: (v: InventoryVariant) => void
  onEdit?: (v: InventoryVariant) => void
}

function VariantSubRow({
  variant: v,
  inventoryType,
  visible,
  onAdjust,
  onAddStock,
  onHistory,
  onEdit,
}: VariantSubRowProps) {
  const stock = inventoryType === "initial_load" ? v.initial_stock : v.stock
  const price =
    inventoryType === "initial_load" && v.override_price != null
      ? v.override_price
      : v.price
  const status = getStatusConfig(computeStatus(stock, v.stock_min))
  const variantLabel = v.name || v.sku || "Variante"
  const isOverridden = inventoryType === "initial_load" && v.override_name

  return (
    <div className="flex items-center gap-3 rounded-lg bg-white px-3 py-2 shadow-sm ring-1 ring-neutral-100">
      {/* Variant name + sku */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="truncate text-[12px] font-semibold text-neutral-800">
            {variantLabel}
          </p>
          {isOverridden && (
            <Badge
              variant="outline"
              className="bg-slate-50 text-slate-500 border-slate-200 text-[9px] shrink-0"
            >
              editado
            </Badge>
          )}
        </div>
        {v.sku && v.name && (
          <p className="truncate text-[10px] font-medium tabular-nums text-neutral-400">
            {v.sku}
          </p>
        )}
      </div>

      {/* Price */}
      <span className="w-24 text-right text-[12px] font-semibold tabular-nums text-neutral-700">
        {visible ? formatCurrency(price) : "••••"}
      </span>

      {/* Stock */}
      <div className="w-24 text-right">
        <span
          className={`text-[13px] font-black tabular-nums ${status.stockColor}`}
        >
          {stock}
        </span>
        <span className="ml-1 text-[9px] font-medium uppercase tracking-wider text-neutral-400">
          / {v.stock_min}
        </span>
      </div>

      {/* Status */}
      <div className="flex w-24 items-center gap-1.5">
        <span className={`h-1.5 w-1.5 rounded-full ${status.dotColor}`} />
        <span className={`text-[10px] font-semibold ${status.textColor}`}>
          {status.label}
        </span>
      </div>

      {/* Actions */}
      <div className="w-8">
        <VariantActions
          variant={v}
          inventoryType={inventoryType}
          compact
          onAdjust={onAdjust}
          onAddStock={onAddStock}
          onHistory={onHistory}
          onEdit={onEdit}
        />
      </div>
    </div>
  )
}

// ── Actions dropdown ───────────────────────────────────────────────────────

interface VariantActionsProps {
  variant: InventoryVariant
  inventoryType: InventoryType
  compact?: boolean
  onAdjust?: (v: InventoryVariant) => void
  onAddStock?: (v: InventoryVariant) => void
  onHistory?: (v: InventoryVariant) => void
  onEdit?: (v: InventoryVariant) => void
}

function VariantActions({
  variant: v,
  inventoryType,
  compact = false,
  onAdjust,
  onAddStock,
  onHistory,
  onEdit,
}: VariantActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="sm"
            className={`${compact ? "size-7" : "size-8"} p-0 text-neutral-300 transition-colors hover:bg-white hover:text-neutral-700`}
          />
        }
      >
        <MoreHorizontal className={compact ? "size-3.5" : "size-4"} />
        <span className="sr-only">Acciones</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {onEdit && inventoryType === "initial_load" && (
          <DropdownMenuItem onClick={() => onEdit(v)}>
            <Pencil className="mr-2 size-3.5" />
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
  )
}

// ── Header primitives ──────────────────────────────────────────────────────

function HeaderLabel({
  children,
  align = "left",
}: {
  children: React.ReactNode
  align?: "left" | "right"
}) {
  return (
    <span
      className={`block text-[10px] font-bold uppercase tracking-[1.2px] text-neutral-400 ${
        align === "right" ? "text-right" : ""
      }`}
    >
      {children}
    </span>
  )
}

function SortButton({
  label,
  active,
  onClick,
  align = "left",
}: {
  label: string
  active: boolean
  onClick: () => void
  align?: "left" | "right"
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-[1.2px] transition-colors ${
        align === "right" ? "ml-auto" : ""
      } ${active ? "text-neutral-700" : "text-neutral-400 hover:text-neutral-600"}`}
    >
      {label}
      <ArrowUpDown className="size-3" />
    </button>
  )
}
