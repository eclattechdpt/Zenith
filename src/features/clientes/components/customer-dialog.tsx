"use client"

import { useState, useEffect, useCallback } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useQueryClient } from "@tanstack/react-query"
import { motion, AnimatePresence } from "motion/react"
import {
  X,
  User,
  Phone,
  Mail,
  MapPin,
  StickyNote,
  Percent,
  Loader2,
  Check,
  CheckCircle2,
  Hash,
  Info,
  Sparkles,
} from "lucide-react"
import { toast } from "sonner"

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { CollapsibleSection } from "@/features/productos/components/collapsible-section"

import { customerSchema, type CustomerInput } from "../schemas"
import { usePriceLists, useCustomer } from "../queries"
import { createCustomer, updateCustomer } from "../actions"

const SPRING_SMOOTH = { type: "spring" as const, stiffness: 300, damping: 35 }

interface CustomerDialogProps {
  open: boolean
  customerId?: string | null
  onClose: () => void
}

export function CustomerDialog({ open, customerId, onClose }: CustomerDialogProps) {
  const isEditing = !!customerId
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [infoOpen, setInfoOpen] = useState(true)
  const [detailsOpen, setDetailsOpen] = useState(false)

  const queryClient = useQueryClient()
  const { data: priceLists = [] } = usePriceLists()
  const { data: existingCustomer } = useCustomer(customerId ?? "")

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } = useForm<CustomerInput>({
    resolver: zodResolver(customerSchema) as any,
    defaultValues: {
      name: "",
      client_number: "",
      phone: "",
      email: "",
      address: "",
      notes: "",
      price_list_id: null,
    },
  })

  const name = watch("name")

  // Populate form when editing
  useEffect(() => {
    if (isEditing && existingCustomer) {
      reset({
        name: existingCustomer.name,
        client_number: existingCustomer.client_number ?? "",
        phone: existingCustomer.phone ?? "",
        email: existingCustomer.email ?? "",
        address: existingCustomer.address ?? "",
        notes: existingCustomer.notes ?? "",
        price_list_id: existingCustomer.price_list_id ?? null,
      })
    }
  }, [isEditing, existingCustomer, reset])

  // Reset form when dialog opens for new customer
  useEffect(() => {
    if (open && !isEditing) {
      reset({
        name: "",
        client_number: "",
        phone: "",
        email: "",
        address: "",
        notes: "",
        price_list_id: null,
      })
      setSuccess(false)
      setInfoOpen(true)
      setDetailsOpen(false)
    }
  }, [open, isEditing, reset])

  // Reset success state when opening for edit
  useEffect(() => {
    if (open && isEditing) {
      setSuccess(false)
      setInfoOpen(true)
      setDetailsOpen(true)
    }
  }, [open, isEditing])

  const handleClose = useCallback(() => {
    if (isSubmitting) return
    onClose()
  }, [isSubmitting, onClose])

  async function onSubmit(data: CustomerInput) {
    setIsSubmitting(true)

    const result = isEditing
      ? await updateCustomer(customerId!, data)
      : await createCustomer(data)

    setIsSubmitting(false)

    if ("error" in result) {
      const formError = (result.error as Record<string, string[]>)._form
      toast.error(
        formError?.[0] ??
          `Error al ${isEditing ? "actualizar" : "crear"} el cliente`
      )
      return
    }

    setSuccess(true)
    queryClient.invalidateQueries({ queryKey: ["customers"] })

    // Auto-close after success animation
    setTimeout(() => {
      onClose()
      setSuccess(false)
    }, 1200)
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent
        showCloseButton={false}
        className="flex max-h-[85vh] w-[95vw] flex-col gap-0 overflow-hidden bg-neutral-50 p-0 sm:max-w-2xl sm:rounded-2xl"
      >
        <DialogTitle className="sr-only">
          {isEditing ? "Editar cliente" : "Nuevo cliente"}
        </DialogTitle>

        {/* ── Header ── */}
        {!success && (
          <div className="flex flex-shrink-0 items-center justify-between border-b border-neutral-100 bg-white px-6 py-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] sm:px-8">
            <div className="flex items-center gap-3">
              <User className="h-7 w-7 text-teal-400" strokeWidth={1.5} />
              <div>
                <h2 className="font-display text-2xl font-semibold tracking-tight text-neutral-900">
                  {isEditing ? "Editar cliente" : "Nuevo cliente"}
                </h2>
                <p className="text-[12px] text-neutral-400">
                  {isEditing
                    ? "Modifica los datos del cliente"
                    : "Agrega un cliente al registro"}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="rounded-lg p-2 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* ── Content ── */}
        <div className="min-h-0 flex-1 overflow-y-auto">
          {success ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              className="flex h-full flex-col items-center justify-center gap-4 p-8 py-16"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ ...SPRING_SMOOTH, delay: 0.1 }}
                className="flex h-20 w-20 items-center justify-center rounded-full bg-teal-500"
              >
                <Check className="h-10 w-10 text-white" strokeWidth={3} />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="text-center"
              >
                <h2 className="font-display text-2xl font-semibold text-neutral-900">
                  {isEditing ? "Cliente actualizado" : "Cliente creado"}
                </h2>
                <p className="mt-1.5 text-sm text-neutral-500">
                  {isEditing ? (
                    "Los cambios se guardaron correctamente"
                  ) : (
                    <>
                      <span className="font-semibold text-neutral-700">{name}</span> se agrego al registro
                    </>
                  )}
                </p>
              </motion.div>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} id="customer-form" className="space-y-4 p-5 sm:p-7">
              {/* ═══ Informacion del cliente ═══ */}
              <CollapsibleSection
                icon={<Info className="h-3.5 w-3.5 text-teal-400" />}
                label="Informacion"
                isOpen={infoOpen}
                onToggle={() => setInfoOpen((v) => !v)}
              >
                <div className="rounded-xl border border-white/80 bg-white p-4 shadow-sm">
                  <div className="space-y-4">
                    {/* Name + Client Number */}
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor="cd-name" className="text-xs font-medium text-neutral-500">Nombre *</Label>
                        <Input
                          id="cd-name"
                          placeholder="Nombre completo"
                          className="rounded-xl border-neutral-200/80 bg-neutral-50/80 focus:border-teal-200/80"
                          {...register("name")}
                        />
                        {errors.name && (
                          <p className="text-[11px] text-destructive">{errors.name.message}</p>
                        )}
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor="cd-client-number" className="text-xs font-medium text-neutral-500">Numero de cliente</Label>
                        <Input
                          id="cd-client-number"
                          placeholder="Ej: C-001"
                          className="rounded-xl border-neutral-200/80 bg-neutral-50/80 focus:border-teal-200/80"
                          {...register("client_number")}
                        />
                        {errors.client_number && (
                          <p className="text-[11px] text-destructive">{errors.client_number.message}</p>
                        )}
                      </div>
                    </div>

                    {/* Phone + Email */}
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor="cd-phone" className="text-xs font-medium text-neutral-500">Telefono</Label>
                        <Input
                          id="cd-phone"
                          placeholder="Ej: 33 1234 5678"
                          className="rounded-xl border-neutral-200/80 bg-neutral-50/80 focus:border-teal-200/80"
                          {...register("phone")}
                        />
                        {errors.phone && (
                          <p className="text-[11px] text-destructive">{errors.phone.message}</p>
                        )}
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor="cd-email" className="text-xs font-medium text-neutral-500">Email</Label>
                        <Input
                          id="cd-email"
                          type="email"
                          placeholder="correo@ejemplo.com"
                          className="rounded-xl border-neutral-200/80 bg-neutral-50/80 focus:border-teal-200/80"
                          {...register("email")}
                        />
                        {errors.email && (
                          <p className="text-[11px] text-destructive">{errors.email.message}</p>
                        )}
                      </div>
                    </div>

                    {/* Discount */}
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="cd-discount" className="text-xs font-medium text-neutral-500">Descuento</Label>
                      <select
                        id="cd-discount"
                        {...register("price_list_id", {
                          setValueAs: (v: string) => v || null,
                        })}
                        className="h-9 rounded-xl border border-neutral-200/80 bg-neutral-50/80 px-3 text-sm outline-none transition-colors focus:border-teal-200/80 focus:ring-3 focus:ring-teal-500/10"
                      >
                        <option value="">Sin descuento (precio base)</option>
                        {priceLists.map((pl) => (
                          <option key={pl.id} value={pl.id}>
                            {pl.name}
                            {Number(pl.discount_percent) > 0 &&
                              ` (-${pl.discount_percent}%)`}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </CollapsibleSection>

              {/* ═══ Detalles adicionales ═══ */}
              <CollapsibleSection
                icon={<StickyNote className="h-3.5 w-3.5 text-teal-400" />}
                label="Detalles adicionales"
                isOpen={detailsOpen}
                onToggle={() => setDetailsOpen((v) => !v)}
              >
                <div className="rounded-xl border border-white/80 bg-white p-4 shadow-sm">
                  <div className="space-y-4">
                    {/* Address */}
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="cd-address" className="text-xs font-medium text-neutral-500">Direccion</Label>
                      <Input
                        id="cd-address"
                        placeholder="Direccion de entrega (opcional)"
                        className="rounded-xl border-neutral-200/80 bg-neutral-50/80 focus:border-teal-200/80"
                        {...register("address")}
                      />
                    </div>

                    {/* Notes */}
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="cd-notes" className="text-xs font-medium text-neutral-500">Notas</Label>
                      <Textarea
                        id="cd-notes"
                        placeholder="Notas internas sobre el cliente..."
                        rows={3}
                        className="rounded-xl border-neutral-200/80 bg-neutral-50/80 focus:border-teal-200/80"
                        {...register("notes")}
                      />
                    </div>
                  </div>
                </div>
              </CollapsibleSection>
            </form>
          )}
        </div>

        {/* ── Footer ── */}
        {!success && (
          <div className="flex flex-shrink-0 items-center justify-between border-t border-neutral-100 bg-white px-6 py-4 sm:px-8">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              form="customer-form"
              disabled={isSubmitting}
              className="rounded-xl bg-accent-500 text-white hover:bg-accent-600"
            >
              {isSubmitting ? (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="mr-1.5 h-4 w-4" />
              )}
              {isEditing ? "Guardar cambios" : "Crear cliente"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
