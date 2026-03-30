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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"

import {
  variantTypeSchema,
  variantOptionSchema,
  type VariantTypeInput,
  type VariantOptionInput,
} from "../schemas"
import { useVariantTypes } from "../queries"
import {
  createVariantType,
  createVariantOption,
  updateVariantOption,
  deleteVariantOption,
} from "../actions"

export function VariantTypeManager() {
  const queryClient = useQueryClient()
  const { data: variantTypes = [] } = useVariantTypes()

  // Type dialog
  const [typeDialogOpen, setTypeDialogOpen] = useState(false)
  const typeForm = useForm<VariantTypeInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(variantTypeSchema) as any,
  })

  // Option dialog
  const [optionDialogOpen, setOptionDialogOpen] = useState(false)
  const [editOptionId, setEditOptionId] = useState<string | null>(null)
  const [activeTypeId, setActiveTypeId] = useState<string | null>(null)
  const optionForm = useForm<VariantOptionInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(variantOptionSchema) as any,
  })

  // Delete
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; value: string } | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  function openCreateType() {
    typeForm.reset({ name: "", sort_order: 0 })
    setTypeDialogOpen(true)
  }

  async function onTypeSubmit(data: VariantTypeInput) {
    const result = await createVariantType(data)
    if ("error" in result) {
      toast.error("Error al crear el tipo")
      return
    }
    toast.success("Tipo de variante creado")
    queryClient.invalidateQueries({ queryKey: ["variant-types"] })
    setTypeDialogOpen(false)
  }

  function openCreateOption(typeId: string) {
    setEditOptionId(null)
    setActiveTypeId(typeId)
    optionForm.reset({ variant_type_id: typeId, value: "", color_hex: null, sort_order: 0 })
    setOptionDialogOpen(true)
  }

  function openEditOption(option: { id: string; variant_type_id: string; value: string; color_hex: string | null; sort_order: number }) {
    setEditOptionId(option.id)
    setActiveTypeId(option.variant_type_id)
    optionForm.reset({
      variant_type_id: option.variant_type_id,
      value: option.value,
      color_hex: option.color_hex,
      sort_order: option.sort_order,
    })
    setOptionDialogOpen(true)
  }

  async function onOptionSubmit(data: VariantOptionInput) {
    const result = editOptionId
      ? await updateVariantOption(editOptionId, data)
      : await createVariantOption(data)

    if ("error" in result) {
      toast.error("Error al guardar la opcion")
      return
    }

    toast.success(editOptionId ? "Opcion actualizada" : "Opcion creada")
    queryClient.invalidateQueries({ queryKey: ["variant-types"] })
    setOptionDialogOpen(false)
  }

  async function handleDeleteOption() {
    if (!deleteTarget) return
    setIsDeleting(true)
    await deleteVariantOption(deleteTarget.id)
    setIsDeleting(false)
    setDeleteTarget(null)
    toast.success("Opcion eliminada")
    queryClient.invalidateQueries({ queryKey: ["variant-types"] })
  }

  // Check if the active type is "Tono" to show color_hex field
  const activeType = variantTypes.find((vt) => vt.id === activeTypeId)
  const showColorField = activeType?.name?.toLowerCase().includes("tono")

  return (
    <div className="flex flex-col gap-3">
      {variantTypes.map((vt) => (
        <div key={vt.id} className="rounded-lg border border-input">
          {/* Type header */}
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-sm font-medium text-neutral-950">
              {vt.name}
            </span>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => openCreateOption(vt.id)}
              title="Agregar opcion"
            >
              <Plus className="size-3" />
            </Button>
          </div>

          {/* Options */}
          {vt.variant_options.length > 0 && (
            <div className="border-t border-input px-4 py-3">
              <div className="flex flex-wrap gap-1.5">
                {vt.variant_options.map((opt) => (
                  <div
                    key={opt.id}
                    className="group inline-flex items-center gap-1.5 rounded-md border border-input px-2 py-1 text-xs text-neutral-700"
                  >
                    {opt.color_hex && (
                      <span
                        className="size-3 rounded-full border border-neutral-200"
                        style={{ backgroundColor: opt.color_hex }}
                      />
                    )}
                    {opt.value}
                    <button
                      type="button"
                      onClick={() => openEditOption(opt)}
                      className="ml-0.5 opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      <Pencil className="size-2.5 text-neutral-400" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget({ id: opt.id, value: opt.value })}
                      className="opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      <Trash2 className="size-2.5 text-neutral-400" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}

      <Button variant="outline" size="sm" onClick={openCreateType}>
        <Plus className="mr-1.5 size-3.5" />
        Nuevo tipo de variante
      </Button>

      {/* Create type dialog */}
      <Dialog open={typeDialogOpen} onOpenChange={setTypeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo tipo de variante</DialogTitle>
          </DialogHeader>
          <form onSubmit={typeForm.handleSubmit(onTypeSubmit)} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="type-name">Nombre *</Label>
              <Input
                id="type-name"
                placeholder="Ej: Tono, Tamano, Formula"
                {...typeForm.register("name")}
              />
              {typeForm.formState.errors.name && (
                <p className="text-xs text-destructive">
                  {typeForm.formState.errors.name.message}
                </p>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setTypeDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={typeForm.formState.isSubmitting}>
                {typeForm.formState.isSubmitting && (
                  <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                )}
                Crear
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Create/Edit option dialog */}
      <Dialog open={optionDialogOpen} onOpenChange={setOptionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editOptionId ? "Editar opcion" : "Nueva opcion"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={optionForm.handleSubmit(onOptionSubmit)} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="opt-value">Valor *</Label>
              <Input
                id="opt-value"
                placeholder="Ej: Red Lacquer, 30ml, Mate"
                {...optionForm.register("value")}
              />
              {optionForm.formState.errors.value && (
                <p className="text-xs text-destructive">
                  {optionForm.formState.errors.value.message}
                </p>
              )}
            </div>
            {showColorField && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="opt-color">Color (hex)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="opt-color"
                    placeholder="#C41E3A"
                    {...optionForm.register("color_hex")}
                  />
                  {optionForm.watch("color_hex") && (
                    <span
                      className="size-8 shrink-0 rounded-md border border-neutral-200"
                      style={{ backgroundColor: optionForm.watch("color_hex") ?? undefined }}
                    />
                  )}
                </div>
                {optionForm.formState.errors.color_hex && (
                  <p className="text-xs text-destructive">
                    {optionForm.formState.errors.color_hex.message}
                  </p>
                )}
              </div>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOptionDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={optionForm.formState.isSubmitting}>
                {optionForm.formState.isSubmitting && (
                  <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                )}
                {editOptionId ? "Guardar" : "Crear"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete option confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Eliminar opcion"
        description={`Se eliminara la opcion "${deleteTarget?.value}".`}
        confirmLabel="Eliminar"
        variant="destructive"
        isLoading={isDeleting}
        onConfirm={handleDeleteOption}
      />
    </div>
  )
}
