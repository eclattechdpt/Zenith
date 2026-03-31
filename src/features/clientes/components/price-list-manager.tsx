"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useQueryClient } from "@tanstack/react-query"
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react"
import { toast } from "sonner"

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
} from "@/components/ui/dialog"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"

import { NumericInput } from "@/features/productos/components/variant-manager"
import { priceListSchema, type PriceListInput } from "../schemas"
import { usePriceLists } from "../queries"
import { createPriceList, updatePriceList, deletePriceList } from "../actions"

export function PriceListManager() {
  const queryClient = useQueryClient()
  const { data: priceLists = [] } = usePriceLists()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

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

  function openEdit(pl: { id: string; name: string; description: string | null; discount_percent: number }) {
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
      const msg = (result.error as Record<string, string[]>)._form?.[0] ?? "Error al guardar"
      toast.error(msg)
      return
    }

    toast.success(editId ? "Lista actualizada" : "Lista creada")
    queryClient.invalidateQueries({ queryKey: ["price-lists"] })
    setDialogOpen(false)
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setIsDeleting(true)
    const result = await deletePriceList(deleteTarget.id)
    setIsDeleting(false)
    setDeleteTarget(null)

    if ("error" in result) {
      const msg = (result.error as Record<string, string[]>)._form?.[0] ?? "Error al eliminar"
      toast.error(msg)
      return
    }

    toast.success("Lista eliminada")
    queryClient.invalidateQueries({ queryKey: ["price-lists"] })
  }

  return (
    <div className="flex flex-col gap-3">
      {priceLists.map((pl) => (
        <div
          key={pl.id}
          className="flex items-center justify-between rounded-lg border border-input px-4 py-3"
        >
          <div className="flex items-center gap-3">
            <div>
              <span className="text-sm font-medium text-neutral-950">
                {pl.name}
              </span>
              {pl.description && (
                <p className="text-xs text-neutral-500">{pl.description}</p>
              )}
            </div>
            <Badge variant="secondary" className="text-[10px]">
              {Number(pl.discount_percent) > 0
                ? `-${Number(pl.discount_percent)}%`
                : "Precio base"}
            </Badge>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() =>
                openEdit({
                  id: pl.id,
                  name: pl.name,
                  description: pl.description,
                  discount_percent: Number(pl.discount_percent),
                })
              }
            >
              <Pencil className="size-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => setDeleteTarget({ id: pl.id, name: pl.name })}
            >
              <Trash2 className="size-3" />
            </Button>
          </div>
        </div>
      ))}

      <Button variant="outline" size="sm" onClick={openCreate}>
        <Plus className="mr-1.5 size-3.5" />
        Nueva lista de precios
      </Button>

      {/* Create/Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editId ? "Editar lista de precios" : "Nueva lista de precios"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="pl-name">Nombre *</Label>
              <Input
                id="pl-name"
                placeholder="Ej: Mayoreo, VIP, Revendedoras"
                {...register("name")}
              />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name.message}</p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="pl-desc">Descripcion</Label>
              <Textarea
                id="pl-desc"
                placeholder="Opcional"
                {...register("description")}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Descuento (%)</Label>
              <NumericInput
                decimal
                min={0}
                max={100}
                step="0.01"
                value={discountPercent}
                onChange={(v) => setValue("discount_percent", v)}
              />
              {errors.discount_percent && (
                <p className="text-xs text-destructive">{errors.discount_percent.message}</p>
              )}
              <p className="text-xs text-neutral-500">
                {Number(discountPercent) === 0
                  ? "Los clientes con esta lista pagaran el precio base"
                  : `Los clientes con esta lista obtendran ${discountPercent}% de descuento`}
              </p>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-1.5 size-3.5 animate-spin" />}
                {editId ? "Guardar" : "Crear"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Eliminar lista de precios"
        description={`Se eliminara "${deleteTarget?.name}". Los clientes con esta lista pasaran a precio base.`}
        confirmLabel="Eliminar"
        variant="destructive"
        isLoading={isDeleting}
        onConfirm={handleDelete}
      />
    </div>
  )
}
