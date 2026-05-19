"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useQueryClient } from "@tanstack/react-query"
import { Plus, Pencil, Trash2, Loader2, Users, Network } from "lucide-react"
import { motion, AnimatePresence } from "motion/react"
import { sileo } from "sileo"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { cn } from "@/lib/utils"

import { customerNetworkSchema, type CustomerNetworkInput } from "../schemas"
import { useCustomerNetworks, type CustomerNetworkWithCount } from "../queries"
import {
  createCustomerNetwork,
  updateCustomerNetwork,
  deleteCustomerNetwork,
} from "../actions"

const SPRING_SNAPPY = { type: "spring" as const, stiffness: 500, damping: 35 }

// Tailwind 500-ish swatches que combinan con el design system
const COLOR_PRESETS = [
  "#94a3b8", // slate (default)
  "#f43f5e", // rose
  "#14b8a6", // teal
  "#f59e0b", // amber
  "#8b5cf6", // violet
  "#3b82f6", // blue
  "#10b981", // emerald
  "#ec4899", // pink
]

export function NetworkManager() {
  const queryClient = useQueryClient()
  const { data: networks = [] } = useCustomerNetworks()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string; count: number } | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } = useForm<CustomerNetworkInput>({ resolver: zodResolver(customerNetworkSchema) as any })

  const currentColor = watch("color") ?? "#94a3b8"

  function openCreate() {
    setEditId(null)
    reset({ name: "", color: "#94a3b8", sort_order: 0 })
    setDialogOpen(true)
  }

  function openEdit(n: CustomerNetworkWithCount) {
    setEditId(n.id)
    reset({ name: n.name, color: n.color, sort_order: n.sort_order })
    setDialogOpen(true)
  }

  async function onSubmit(data: CustomerNetworkInput) {
    const result = editId
      ? await updateCustomerNetwork(editId, data)
      : await createCustomerNetwork(data)

    if ("error" in result) {
      const msg = (result.error as Record<string, string[]>)._form?.[0] ?? "Error al guardar"
      sileo.error({ title: msg })
      return
    }

    sileo.success({ title: editId ? "Red actualizada" : "Red creada" })
    queryClient.invalidateQueries({ queryKey: ["customer-networks"] })
    queryClient.invalidateQueries({ queryKey: ["customers"] })
    setDialogOpen(false)
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setIsDeleting(true)
    const result = await deleteCustomerNetwork(deleteTarget.id)
    setIsDeleting(false)
    setDeleteTarget(null)

    if ("error" in result) {
      const msg = (result.error as Record<string, string[]>)._form?.[0] ?? "Error al eliminar"
      sileo.error({ title: msg })
      return
    }

    sileo.success({
      title: "Red eliminada",
      description:
        deleteTarget.count > 0
          ? `${deleteTarget.count} cliente${deleteTarget.count !== 1 ? "s" : ""} ahora sin red`
          : "",
    })
    queryClient.invalidateQueries({ queryKey: ["customer-networks"] })
    queryClient.invalidateQueries({ queryKey: ["customers"] })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-neutral-500">
          Clasifica a tus clientes por red (interna, externa, referidas, etc.)
        </p>
        <Button onClick={openCreate} size="sm" className="gap-1.5">
          <Plus className="size-3.5" />
          Nueva red
        </Button>
      </div>

      {networks.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-neutral-200 bg-neutral-50/40 px-6 py-12">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-white shadow-sm">
            <Network className="size-5 text-neutral-300" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-neutral-700">Sin redes definidas</p>
            <p className="mt-0.5 text-xs text-neutral-500">
              Crea tu primera red para clasificar clientes
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {networks.map((n) => (
              <motion.div
                key={n.id}
                layout
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={SPRING_SNAPPY}
                className="group relative overflow-hidden rounded-2xl border border-neutral-200/70 bg-white p-4 shadow-sm transition-[border-color,box-shadow] hover:border-neutral-300 hover:shadow-md"
              >
                <div
                  className="absolute left-0 top-0 h-full w-1.5"
                  style={{ backgroundColor: n.color }}
                />
                <div className="ml-2 flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="size-3 flex-shrink-0 rounded-full"
                        style={{ backgroundColor: n.color }}
                      />
                      <p className="truncate text-sm font-semibold text-neutral-800">
                        {n.name}
                      </p>
                    </div>
                    <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2 py-0.5">
                      <Users className="size-2.5 text-neutral-400" />
                      <span className="text-[10px] font-semibold text-neutral-500">
                        {n.client_count} {n.client_count === 1 ? "cliente" : "clientes"}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={() => openEdit(n)}
                      className="rounded-lg p-1.5 text-neutral-300 transition-colors hover:bg-neutral-100 hover:text-neutral-600"
                    >
                      <Pencil className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setDeleteTarget({ id: n.id, name: n.name, count: n.client_count })
                      }
                      className="rounded-lg p-1.5 text-neutral-300 transition-colors hover:bg-red-50 hover:text-red-500"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Create/Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editId ? "Editar red" : "Nueva red"}</DialogTitle>
            <DialogDescription>
              Las redes te ayudan a clasificar clientes (interna / externa / referida, etc.)
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="net-name">Nombre</Label>
              <Input
                id="net-name"
                placeholder="Ej: Red interna"
                {...register("name")}
                autoFocus
              />
              {errors.name && (
                <p className="text-xs text-red-500">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Color</Label>
              <div className="flex flex-wrap gap-2">
                {COLOR_PRESETS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setValue("color", c, { shouldDirty: true })}
                    className={cn(
                      "flex size-8 items-center justify-center rounded-full ring-2 transition-all",
                      currentColor === c
                        ? "ring-neutral-900 scale-110"
                        : "ring-transparent hover:ring-neutral-300"
                    )}
                    style={{ backgroundColor: c }}
                    aria-label={`Color ${c}`}
                  />
                ))}
              </div>
              <input type="hidden" {...register("color")} />
              {errors.color && (
                <p className="text-xs text-red-500">{errors.color.message}</p>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
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

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={`Eliminar "${deleteTarget?.name}"`}
        description={
          deleteTarget && deleteTarget.count > 0
            ? `${deleteTarget.count} cliente${deleteTarget.count !== 1 ? "s" : ""} quedará${deleteTarget.count !== 1 ? "n" : ""} sin red asignada. Esta acción no se puede deshacer.`
            : "Esta acción no se puede deshacer."
        }
        confirmLabel="Eliminar red"
        variant="destructive"
        isLoading={isDeleting}
        onConfirm={handleDelete}
      />
    </div>
  )
}
