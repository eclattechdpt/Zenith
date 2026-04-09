"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useQueryClient } from "@tanstack/react-query"
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Tag,
  Percent,
  Users,
  ArrowRight,
  Sparkles,
} from "lucide-react"
import { motion, AnimatePresence } from "motion/react"
import { sileo } from "sileo"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { formatCurrency } from "@/lib/utils"

import { NumericInput } from "@/features/productos/components/variant-manager"
import { priceListSchema, type PriceListInput } from "../schemas"
import { usePriceLists, type PriceListWithClientCount } from "../queries"
import { createPriceList, updatePriceList, deletePriceList } from "../actions"
import type { PriceList } from "../types"
import { CustomerPriceEditor } from "./customer-price-editor"

const SPRING_SMOOTH = { type: "spring" as const, stiffness: 300, damping: 35 }
const SPRING_SNAPPY = { type: "spring" as const, stiffness: 500, damping: 35 }

const EXAMPLE_PRICE = 1000

export function PriceListManager() {
  const queryClient = useQueryClient()
  const { data: priceLists = [] } = usePriceLists()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string
    name: string
  } | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [priceEditorTarget, setPriceEditorTarget] =
    useState<PriceList | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } = useForm<PriceListInput>({ resolver: zodResolver(priceListSchema) as any })

  const discountPercent = watch("discount_percent") ?? 0

  function openCreate() {
    setEditId(null)
    reset({ name: "", description: "", discount_percent: 0 })
    setDialogOpen(true)
  }

  function openEdit(pl: PriceListWithClientCount) {
    setEditId(pl.id)
    reset({
      name: pl.name,
      description: pl.description,
      discount_percent: Number(pl.discount_percent),
    })
    setDialogOpen(true)
  }

  async function onSubmit(data: PriceListInput) {
    const result = editId
      ? await updatePriceList(editId, data)
      : await createPriceList(data)

    if ("error" in result) {
      const msg =
        (result.error as Record<string, string[]>)._form?.[0] ??
        "Error al guardar"
      sileo.error({ title: msg })
      return
    }

    sileo.success({
      title: editId ? "Lista actualizada" : "Lista creada",
      description: editId
        ? "Los cambios fueron guardados"
        : "Ya puedes asignar clientes a esta lista",
    })
    queryClient.invalidateQueries({ queryKey: ["price-lists"] })
    queryClient.invalidateQueries({ queryKey: ["config-stats", "descuentos"] })
    setDialogOpen(false)
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setIsDeleting(true)
    const result = await deletePriceList(deleteTarget.id)
    setIsDeleting(false)
    setDeleteTarget(null)

    if ("error" in result) {
      const msg =
        (result.error as Record<string, string[]>)._form?.[0] ??
        "Error al eliminar"
      sileo.error({ title: msg })
      return
    }

    sileo.success({
      title: "Lista eliminada",
      description: "Los clientes vinculados ya no tendran este descuento",
    })
    queryClient.invalidateQueries({ queryKey: ["price-lists"] })
    queryClient.invalidateQueries({ queryKey: ["config-stats", "descuentos"] })
  }

  return (
    <div className="flex flex-col gap-3">
      {/* ── Discount card list ── */}
      {priceLists.length === 0 ? (
        <EmptyState onCreate={openCreate} />
      ) : (
        <div className="flex flex-col gap-2.5">
          <AnimatePresence mode="popLayout">
            {priceLists.map((pl, i) => (
              <DiscountCard
                key={pl.id}
                priceList={pl}
                index={i}
                onEdit={() => openEdit(pl)}
                onDelete={() =>
                  setDeleteTarget({ id: pl.id, name: pl.name })
                }
                onPriceEditor={() =>
                  setPriceEditorTarget(pl as PriceList)
                }
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* ── Add button ── */}
      {priceLists.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: priceLists.length * 0.06 + 0.1 }}
        >
          <button
            type="button"
            onClick={openCreate}
            className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-teal-200/60 py-3.5 text-sm font-medium text-teal-500 transition-all hover:border-teal-300 hover:bg-teal-50/50 hover:text-teal-600 active:scale-[0.99]"
          >
            <Plus className="size-4" />
            Nuevo descuento
          </button>
        </motion.div>
      )}

      {/* ── Create / Edit dialog ── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-teal-400 to-teal-600 shadow-md shadow-teal-500/20">
                <Percent className="size-5 text-white" strokeWidth={2.5} />
              </div>
              <div>
                <DialogTitle className="text-base">
                  {editId ? "Editar descuento" : "Nuevo descuento"}
                </DialogTitle>
                <DialogDescription className="text-xs text-neutral-400">
                  {editId
                    ? "Modifica los detalles de este descuento"
                    : "Crea un descuento para asignar a tus clientes"}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col gap-5"
          >
            {/* Name + Description */}
            <div className="rounded-xl border border-neutral-100 bg-neutral-50/50 p-4 space-y-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="pl-name" className="text-xs font-semibold text-neutral-500">
                  Nombre del descuento
                </Label>
                <Input
                  id="pl-name"
                  placeholder="Ej: Mayoreo, VIP, Revendedoras"
                  {...register("name")}
                  className="bg-white focus-visible:ring-teal-300"
                />
                {errors.name && (
                  <p className="text-xs text-destructive">
                    {errors.name.message}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="pl-desc" className="text-xs font-semibold text-neutral-500">
                  Descripcion
                </Label>
                <Textarea
                  id="pl-desc"
                  placeholder="Describe para que tipo de clientes es este descuento"
                  rows={2}
                  {...register("description")}
                  className="bg-white resize-none focus-visible:ring-teal-300"
                />
              </div>
            </div>

            {/* Discount percentage + live preview */}
            <div className="rounded-xl border border-teal-100 bg-gradient-to-br from-teal-50/60 to-white p-4 space-y-4">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-semibold text-teal-600">
                  Porcentaje de descuento
                </Label>
                <div className="flex items-center gap-3">
                  <div className="w-28">
                    <NumericInput
                      decimal
                      min={0}
                      max={100}
                      step="0.01"
                      value={discountPercent}
                      onChange={(v) => setValue("discount_percent", v)}
                      className="focus-visible:ring-teal-300"
                    />
                  </div>
                  <span className="text-sm font-medium text-teal-500">%</span>
                </div>
                {errors.discount_percent && (
                  <p className="text-xs text-destructive">
                    {errors.discount_percent.message}
                  </p>
                )}
              </div>

              {/* Live price preview */}
              <PricePreview discountPercent={Number(discountPercent)} />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-teal-600 hover:bg-teal-700 text-white"
              >
                {isSubmitting && (
                  <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                )}
                {editId ? "Guardar cambios" : "Crear descuento"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Delete confirmation ── */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Eliminar descuento"
        description={`Se eliminara "${deleteTarget?.name}". Los clientes con este descuento pasaran a precio base.`}
        confirmLabel="Eliminar"
        variant="destructive"
        isLoading={isDeleting}
        onConfirm={handleDelete}
      />

      {/* ── Customer price editor ── */}
      {priceEditorTarget && (
        <CustomerPriceEditor
          priceList={priceEditorTarget}
          open={!!priceEditorTarget}
          onOpenChange={(open) => !open && setPriceEditorTarget(null)}
        />
      )}
    </div>
  )
}

// ─── Discount Card ───────────────────────────────────────────────────────────

function DiscountCard({
  priceList,
  index,
  onEdit,
  onDelete,
  onPriceEditor,
}: {
  priceList: PriceListWithClientCount
  index: number
  onEdit: () => void
  onDelete: () => void
  onPriceEditor: () => void
}) {
  const discountPct = Number(priceList.discount_percent)
  const finalPrice = EXAMPLE_PRICE * (1 - discountPct / 100)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      exit={{ opacity: 0, scale: 0.96, filter: "blur(4px)" }}
      transition={{ ...SPRING_SMOOTH, delay: index * 0.06 }}
      className="group relative flex overflow-hidden rounded-xl border border-teal-100/80 bg-gradient-to-r from-teal-50/40 via-white to-white transition-shadow hover:shadow-md hover:shadow-teal-500/[0.06]"
    >
      {/* Left accent stripe */}
      <div className="w-1 flex-shrink-0 bg-gradient-to-b from-teal-400 to-teal-500" />

      <div className="flex flex-1 items-center gap-4 px-4 py-3.5">
        {/* Discount percentage badge */}
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-teal-500/10">
          <span className="text-lg font-bold tabular-nums text-teal-600">
            {discountPct > 0 ? `${discountPct}` : "0"}
            <span className="text-xs">%</span>
          </span>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-neutral-900 truncate">
              {priceList.name}
            </span>
            {priceList.client_count > 0 && (
              <Badge
                variant="secondary"
                className="gap-1 bg-teal-100/60 text-teal-700 text-[10px] px-1.5 py-0"
              >
                <Users className="size-2.5" />
                {priceList.client_count}
              </Badge>
            )}
          </div>
          {priceList.description ? (
            <p className="mt-0.5 text-xs text-neutral-500 truncate">
              {priceList.description}
            </p>
          ) : (
            <p className="mt-0.5 text-xs text-neutral-400 italic">
              Sin descripcion
            </p>
          )}
          {/* Mini price example */}
          {discountPct > 0 && (
            <div className="mt-1 flex items-center gap-1.5 text-[10px] text-neutral-400">
              <span className="line-through">{formatCurrency(EXAMPLE_PRICE)}</span>
              <ArrowRight className="size-2.5" />
              <span className="font-medium text-teal-600">
                {formatCurrency(finalPrice)}
              </span>
            </div>
          )}
        </div>

        {/* Actions — hover reveal */}
        <div className="flex items-center gap-0.5 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onPriceEditor}
            title="Precios por variante"
            className="text-neutral-400 hover:text-teal-600 hover:bg-teal-50"
          >
            <Tag className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onEdit}
            title="Editar descuento"
            className="text-neutral-400 hover:text-teal-600 hover:bg-teal-50"
          >
            <Pencil className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onDelete}
            title="Eliminar descuento"
            className="text-neutral-400 hover:text-red-500 hover:bg-red-50"
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Empty State ─────────────────────────────────────────────────────────────

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={SPRING_SMOOTH}
      className="flex flex-col items-center gap-4 rounded-2xl border-2 border-dashed border-teal-200/60 bg-teal-50/20 py-14"
    >
      <motion.div
        animate={{ y: [0, -5, 0] }}
        transition={{ repeat: Infinity, duration: 2.8, ease: "easeInOut" }}
        className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-100 to-teal-200/60"
      >
        <Percent className="size-7 text-teal-500" strokeWidth={1.5} />
      </motion.div>
      <div className="text-center">
        <p className="text-sm font-semibold text-neutral-500">
          No hay descuentos configurados
        </p>
        <p className="mt-1 text-xs text-neutral-400">
          Crea tu primer descuento para asignar precios especiales a tus clientes
        </p>
      </div>
      <Button
        onClick={onCreate}
        className="bg-teal-600 hover:bg-teal-700 text-white"
      >
        <Plus className="mr-1.5 size-3.5" />
        Crear primer descuento
      </Button>
    </motion.div>
  )
}

// ─── Price Preview (live in dialog) ──────────────────────────────────────────

function PricePreview({ discountPercent }: { discountPercent: number }) {
  const finalPrice = EXAMPLE_PRICE * (1 - discountPercent / 100)
  const savings = EXAMPLE_PRICE - finalPrice

  return (
    <div className="rounded-lg border border-teal-200/60 bg-white p-3">
      <div className="flex items-center gap-1.5 mb-2.5">
        <Sparkles className="size-3 text-teal-400" />
        <span className="text-[10px] font-bold uppercase tracking-[1.5px] text-teal-500">
          Vista previa
        </span>
      </div>
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <p className="text-[10px] text-neutral-400">Precio original</p>
          <p
            className={`text-sm font-semibold tabular-nums ${
              discountPercent > 0
                ? "text-neutral-400 line-through"
                : "text-neutral-900"
            }`}
          >
            {formatCurrency(EXAMPLE_PRICE)}
          </p>
        </div>

        {discountPercent > 0 && (
          <>
            <ArrowRight className="size-4 text-teal-300" />
            <div className="space-y-0.5 text-right">
              <p className="text-[10px] text-teal-500">Con descuento</p>
              <p className="text-sm font-bold tabular-nums text-teal-600">
                {formatCurrency(finalPrice)}
              </p>
            </div>
            <div className="ml-3 rounded-lg bg-teal-500/10 px-2.5 py-1.5">
              <p className="text-[10px] text-teal-500">Ahorro</p>
              <p className="text-sm font-bold tabular-nums text-teal-600">
                {formatCurrency(savings)}
              </p>
            </div>
          </>
        )}
      </div>
      {discountPercent === 0 && (
        <p className="mt-2 text-[10px] text-neutral-400">
          Los clientes con este descuento pagaran el precio base
        </p>
      )}
    </div>
  )
}
