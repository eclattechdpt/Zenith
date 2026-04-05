"use client"

import { useState } from "react"
import { Plus, Trash2, Pencil, Loader2 } from "lucide-react"
import { motion, AnimatePresence } from "motion/react"
import { toast } from "sonner"
import { useQueryClient } from "@tanstack/react-query"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { NumericInput } from "@/features/productos/components/variant-manager"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { formatCurrency } from "@/lib/utils"

import { useTransitWeekDetail } from "../queries"
import {
  addTransitWeekItem,
  updateTransitWeekItem,
  deleteTransitWeekItem,
} from "../actions"
import type { TransitWeekItemWithProduct } from "../types"
import { TransitProductPicker } from "./transit-product-picker"

// ── Color hash for product thumbnails ──

const THUMB_COLORS = [
  { bg: "bg-rose-50", text: "text-rose-200" },
  { bg: "bg-teal-50", text: "text-teal-200" },
  { bg: "bg-amber-50", text: "text-amber-200" },
  { bg: "bg-blue-50", text: "text-blue-200" },
]

function getThumbColor(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = hash + name.charCodeAt(i)
  return THUMB_COLORS[hash % THUMB_COLORS.length]
}

// ── Stagger variants ──

const itemListContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05, delayChildren: 0.08 } },
}
const itemListChild = {
  hidden: { opacity: 0, y: 12, filter: "blur(4px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const },
  },
}

interface TransitWeekDetailProps {
  weekId: string | null
  onClose?: () => void
}

export function TransitWeekDetail({ weekId }: TransitWeekDetailProps) {
  const { data: week, isLoading } = useTransitWeekDetail(weekId)
  const [showAddItem, setShowAddItem] = useState(false)
  const [editItem, setEditItem] = useState<TransitWeekItemWithProduct | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<TransitWeekItemWithProduct | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const queryClient = useQueryClient()

  if (!weekId) return null

  const items = week?.transit_week_items ?? []

  async function handleDeleteItem() {
    if (!deleteTarget) return
    setIsDeleting(true)
    const result = await deleteTransitWeekItem(deleteTarget.id)
    setIsDeleting(false)
    setDeleteTarget(null)

    if ("error" in result && result.error) {
      toast.error("Error al eliminar el producto")
      return
    }

    toast.success("Producto eliminado de la semana")
    queryClient.invalidateQueries({ queryKey: ["transit-week"] })
    queryClient.invalidateQueries({ queryKey: ["transit-weeks"] })
    queryClient.invalidateQueries({ queryKey: ["transit-month-summary"] })
    queryClient.invalidateQueries({ queryKey: ["inventory-summary"] })
  }

  return (
    <div className="rounded-2xl border border-neutral-200/60 bg-white shadow-sm">
      {isLoading ? (
        <div className="space-y-4 p-6 sm:p-8">
          <div className="h-12 w-56 animate-pulse rounded-xl bg-neutral-100/80" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-xl bg-neutral-100/80"
              style={{ animationDelay: `${i * 80}ms` }}
            />
          ))}
        </div>
      ) : week ? (
        <>
          {/* Header */}
          <div className="px-6 pt-6 sm:px-8 sm:pt-8">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-blue-500">
                  Detalle de semana
                </p>
                <h3 className="mt-1 text-xl font-bold text-neutral-950">
                  Semana {week.week_number}, {week.year}
                </h3>
                {week.label && (
                  <p className="mt-1 text-[13px] text-neutral-500">{week.label}</p>
                )}
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                  Total
                </p>
                <p className="text-2xl font-bold text-neutral-950 tabular-nums">
                  {formatCurrency(Number(week.total_value))}
                </p>
              </div>
            </div>

            {/* CTA below header */}
            <motion.div
              className="mt-5"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                onClick={() => setShowAddItem(true)}
                className="h-11 w-full gap-2 rounded-xl bg-blue-500 text-[13px] font-bold text-white shadow-sm shadow-blue-500/20 hover:bg-blue-600"
              >
                <Plus className="size-4" />
                Agregar producto
              </Button>
            </motion.div>
          </div>

          {/* Items list */}
          <div className="mt-6 border-t border-neutral-100 px-6 py-6 sm:px-8 sm:py-8">
            <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
              {items.length} {items.length === 1 ? "producto" : "productos"}
            </p>

            {items.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-4 flex h-36 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-blue-200 bg-blue-50/30"
              >
                <motion.div
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Plus className="h-5 w-5 text-blue-300" />
                </motion.div>
                <p className="text-[12px] font-semibold text-neutral-400">Sin productos</p>
                <p className="text-[11px] text-neutral-400/70">
                  Agrega productos que llegaron esta semana.
                </p>
              </motion.div>
            ) : (
              <motion.div
                className="mt-4 space-y-3"
                variants={itemListContainer}
                initial="hidden"
                animate="visible"
              >
                {items.map((item) => {
                  const productName = item.product_variants.products.name
                  const imageUrl = item.product_variants.products.image_url
                  const palette = getThumbColor(productName)
                  const initials = productName.slice(0, 2).toUpperCase()

                  return (
                    <motion.div
                      key={item.id}
                      variants={itemListChild}
                      className="group rounded-xl border border-neutral-100 bg-neutral-50/40 p-4 transition-[border-color] duration-150 hover:border-blue-200"
                    >
                      <div className="flex items-center gap-4">
                        {/* Product thumbnail */}
                        <div className={`flex h-14 w-14 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl ${palette.bg}`}>
                          {imageUrl ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                              src={imageUrl}
                              alt={productName}
                              className="h-full w-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <span className={`text-[18px] font-black ${palette.text}`}>
                              {initials}
                            </span>
                          )}
                        </div>

                        {/* Product info */}
                        <div className="min-w-0 flex-1">
                          <p className="text-[14px] font-semibold text-neutral-900 truncate">
                            {productName}
                          </p>
                          <p className="mt-0.5 text-[12px] text-neutral-400 truncate">
                            {item.product_variants.name || item.product_variants.sku || "—"}
                            {item.product_variants.products.brand &&
                              ` · ${item.product_variants.products.brand}`}
                          </p>
                        </div>

                        {/* Quantity & price */}
                        <div className="shrink-0 text-right">
                          <p className="text-[14px] font-bold text-neutral-950 tabular-nums">
                            {item.quantity} × {formatCurrency(Number(item.unit_price))}
                          </p>
                          <p className="mt-0.5 text-[13px] font-semibold text-blue-600 tabular-nums">
                            {formatCurrency(Number(item.line_total))}
                          </p>
                        </div>

                        {/* Actions — more spacious */}
                        <div className="flex shrink-0 gap-1 border-l border-neutral-100 pl-3 opacity-0 transition-opacity group-hover:opacity-100">
                          <button
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-white hover:text-neutral-700"
                            onClick={() => setEditItem(item)}
                          >
                            <Pencil className="size-3.5" />
                          </button>
                          <button
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-rose-50 hover:text-rose-500"
                            onClick={() => setDeleteTarget(item)}
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </motion.div>
            )}
          </div>
        </>
      ) : null}

      {/* Add item dialog */}
      <AddTransitItemDialog
        open={showAddItem}
        weekId={weekId}
        existingVariantIds={items.map((i) => i.product_variant_id)}
        onOpenChange={setShowAddItem}
      />

      {/* Edit item dialog */}
      <EditTransitItemDialog
        item={editItem}
        onOpenChange={(open) => !open && setEditItem(null)}
      />

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Eliminar producto"
        description={`Se eliminara "${deleteTarget?.product_variants.products.name}" de esta semana.`}
        confirmLabel="Eliminar"
        variant="destructive"
        isLoading={isDeleting}
        onConfirm={handleDeleteItem}
      />
    </div>
  )
}

// ── Add item dialog ──

function AddTransitItemDialog({
  open,
  weekId,
  existingVariantIds,
  onOpenChange,
}: {
  open: boolean
  weekId: string
  existingVariantIds: string[]
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open && (
        <AddTransitItemForm
          weekId={weekId}
          existingVariantIds={existingVariantIds}
          onOpenChange={onOpenChange}
        />
      )}
    </Dialog>
  )
}

function AddTransitItemForm({
  weekId,
  existingVariantIds,
  onOpenChange,
}: {
  weekId: string
  existingVariantIds: string[]
  onOpenChange: (open: boolean) => void
}) {
  const [selectedVariant, setSelectedVariant] = useState<{
    id: string
    name: string
    price: number
  } | null>(null)
  const [quantity, setQuantity] = useState(0)
  const [unitPrice, setUnitPrice] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const queryClient = useQueryClient()

  const isValid =
    selectedVariant &&
    quantity > 0 &&
    unitPrice >= 0

  async function handleSubmit() {
    if (!isValid || !selectedVariant) return
    setIsSubmitting(true)

    const result = await addTransitWeekItem({
      transit_week_id: weekId,
      product_variant_id: selectedVariant.id,
      quantity,
      unit_price: unitPrice,
    })

    setIsSubmitting(false)

    if ("error" in result && result.error) {
      const msg =
        (result.error as Record<string, string[]>)._form?.[0] ??
        "Error al agregar producto"
      toast.error(msg)
      return
    }

    toast.success("Producto agregado")
    queryClient.invalidateQueries({ queryKey: ["transit-week"] })
    queryClient.invalidateQueries({ queryKey: ["transit-weeks"] })
    queryClient.invalidateQueries({ queryKey: ["transit-month-summary"] })
    queryClient.invalidateQueries({ queryKey: ["inventory-summary"] })
    onOpenChange(false)
  }

  return (
    <DialogContent showCloseButton={false} className="sm:max-w-xl p-6">
      <DialogHeader>
        <DialogTitle className="text-lg">Agregar producto</DialogTitle>
        <DialogDescription>
          Selecciona un producto que llego esta semana
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-5">
        {/* Step 1: Product selection */}
        <div>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-blue-500">
            1. Selecciona producto
          </p>
          <TransitProductPicker
            excludeVariantIds={existingVariantIds}
            onSelect={(variant) => {
              setSelectedVariant(variant)
              setUnitPrice(variant.price)
            }}
            onClear={() => {
              setSelectedVariant(null)
              setUnitPrice(0)
              setQuantity(0)
            }}
            selected={selectedVariant}
          />
        </div>

        {/* Step 2: Quantity & price (appears after selection) */}
        <AnimatePresence>
          {selectedVariant && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="-mx-1 overflow-clip px-1"
            >
              <div className="space-y-4 pb-1">
                <div>
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-blue-500">
                    2. Cantidad y precio
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-[11px] text-neutral-500">Cantidad</Label>
                      <NumericInput
                        min={1}
                        value={quantity}
                        onChange={setQuantity}
                        placeholder="Ej: 10"
                        autoFocus
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[11px] text-neutral-500">Precio unitario</Label>
                      <NumericInput
                        decimal
                        prefix="$"
                        min={0}
                        value={unitPrice}
                        onChange={setUnitPrice}
                      />
                    </div>
                  </div>
                </div>

                {/* Total preview */}
                {isValid && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.15 }}
                    className="flex items-center justify-between rounded-xl border border-blue-200/60 bg-gradient-to-r from-blue-50/80 to-blue-50/40 px-4 py-3"
                  >
                    <span className="text-[12px] font-semibold text-blue-600">Total</span>
                    <span className="text-lg font-bold text-blue-700 tabular-nums">
                      {formatCurrency(quantity * unitPrice)}
                    </span>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <DialogFooter className="mt-2">
        <Button
          variant="outline"
          disabled={isSubmitting}
          onClick={() => onOpenChange(false)}
        >
          Cancelar
        </Button>
        <Button
          disabled={!isValid || isSubmitting}
          onClick={handleSubmit}
          className="bg-blue-500 text-white shadow-sm shadow-blue-500/20 hover:bg-blue-600"
        >
          {isSubmitting && <Loader2 className="animate-spin" />}
          Agregar producto
        </Button>
      </DialogFooter>
    </DialogContent>
  )
}

// ── Edit item dialog ──

function EditTransitItemDialog({
  item,
  onOpenChange,
}: {
  item: TransitWeekItemWithProduct | null
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Dialog open={!!item} onOpenChange={onOpenChange}>
      {item && <EditTransitItemForm item={item} onOpenChange={onOpenChange} />}
    </Dialog>
  )
}

function EditTransitItemForm({
  item,
  onOpenChange,
}: {
  item: TransitWeekItemWithProduct
  onOpenChange: (open: boolean) => void
}) {
  const [quantity, setQuantity] = useState(item.quantity)
  const [unitPrice, setUnitPrice] = useState(Number(item.unit_price))
  const [isSubmitting, setIsSubmitting] = useState(false)
  const queryClient = useQueryClient()

  const isValid = quantity > 0 && unitPrice >= 0
  const hasChanges =
    quantity !== item.quantity || unitPrice !== Number(item.unit_price)

  async function handleSubmit() {
    if (!isValid || !hasChanges) return
    setIsSubmitting(true)

    const result = await updateTransitWeekItem({
      id: item.id,
      quantity,
      unit_price: unitPrice,
    })

    setIsSubmitting(false)

    if ("error" in result && result.error) {
      const msg =
        (result.error as Record<string, string[]>)._form?.[0] ??
        "Error al actualizar"
      toast.error(msg)
      return
    }

    toast.success("Producto actualizado")
    queryClient.invalidateQueries({ queryKey: ["transit-week"] })
    queryClient.invalidateQueries({ queryKey: ["transit-weeks"] })
    queryClient.invalidateQueries({ queryKey: ["transit-month-summary"] })
    queryClient.invalidateQueries({ queryKey: ["inventory-summary"] })
    onOpenChange(false)
  }

  const productName = item.product_variants.products.name

  return (
    <DialogContent showCloseButton={false} className="sm:max-w-md p-6">
      <DialogHeader>
        <DialogTitle className="text-lg">Editar producto</DialogTitle>
        <DialogDescription>{productName}</DialogDescription>
      </DialogHeader>

      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-[11px] text-neutral-500">Cantidad</Label>
            <NumericInput
              min={1}
              value={quantity}
              onChange={setQuantity}
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] text-neutral-500">Precio unitario</Label>
            <NumericInput
              decimal
              prefix="$"
              min={0}
              value={unitPrice}
              onChange={setUnitPrice}
            />
          </div>
        </div>

        {isValid && (
          <div className="flex items-center justify-between rounded-xl border border-blue-200/60 bg-gradient-to-r from-blue-50/80 to-blue-50/40 px-4 py-3">
            <span className="text-[12px] font-semibold text-blue-600">Total</span>
            <span className="text-lg font-bold text-blue-700 tabular-nums">
              {formatCurrency(quantity * unitPrice)}
            </span>
          </div>
        )}
      </div>

      <DialogFooter className="mt-2">
        <Button
          variant="outline"
          disabled={isSubmitting}
          onClick={() => onOpenChange(false)}
        >
          Cancelar
        </Button>
        <Button
          disabled={!isValid || !hasChanges || isSubmitting}
          onClick={handleSubmit}
          className="bg-blue-500 text-white shadow-sm shadow-blue-500/20 hover:bg-blue-600"
        >
          {isSubmitting && <Loader2 className="animate-spin" />}
          Guardar cambios
        </Button>
      </DialogFooter>
    </DialogContent>
  )
}
