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
  CheckCircle2,
} from "lucide-react"
import { toast } from "sonner"

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

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

  const queryClient = useQueryClient()
  const { data: priceLists = [] } = usePriceLists()
  const { data: existingCustomer } = useCustomer(customerId ?? "")

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } = useForm<CustomerInput>({
    resolver: zodResolver(customerSchema) as any,
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      address: "",
      notes: "",
      price_list_id: null,
    },
  })

  // Populate form when editing
  useEffect(() => {
    if (isEditing && existingCustomer) {
      reset({
        name: existingCustomer.name,
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
        phone: "",
        email: "",
        address: "",
        notes: "",
        price_list_id: null,
      })
      setSuccess(false)
    }
  }, [open, isEditing, reset])

  // Reset success state when opening for edit
  useEffect(() => {
    if (open && isEditing) {
      setSuccess(false)
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
        className="max-h-[85vh] sm:max-w-2xl overflow-y-auto p-0"
        showCloseButton={false}
      >
        <DialogTitle className="sr-only">
          {isEditing ? "Editar cliente" : "Nuevo cliente"}
        </DialogTitle>

        <AnimatePresence mode="wait">
          {success ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={SPRING_SMOOTH}
              className="flex flex-col items-center justify-center gap-3 py-16"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ ...SPRING_SMOOTH, delay: 0.1 }}
              >
                <CheckCircle2 className="h-12 w-12 text-teal-500" />
              </motion.div>
              <p className="text-lg font-semibold text-neutral-900">
                {isEditing ? "Cliente actualizado" : "Cliente creado"}
              </p>
              <p className="text-sm text-neutral-400">
                {isEditing
                  ? "Los cambios se guardaron correctamente"
                  : "El cliente fue agregado al registro"}
              </p>
            </motion.div>
          ) : (
            <motion.form
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onSubmit={handleSubmit(onSubmit)}
              className="flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-neutral-100 px-6 py-4">
                <div>
                  <h2 className="text-base font-semibold text-neutral-900">
                    {isEditing ? "Editar cliente" : "Nuevo cliente"}
                  </h2>
                  <p className="text-xs text-neutral-400">
                    {isEditing
                      ? "Modifica los datos del cliente"
                      : "Agrega un cliente al registro"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Form fields */}
              <div className="space-y-5 px-6 py-5">
                {/* Name + Phone */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="cd-name" className="flex items-center gap-1.5 text-xs">
                      <User className="h-3 w-3 text-neutral-400" />
                      Nombre *
                    </Label>
                    <Input
                      id="cd-name"
                      placeholder="Nombre completo"
                      {...register("name")}
                    />
                    {errors.name && (
                      <p className="text-[11px] text-destructive">{errors.name.message}</p>
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="cd-phone" className="flex items-center gap-1.5 text-xs">
                      <Phone className="h-3 w-3 text-neutral-400" />
                      Telefono
                    </Label>
                    <Input
                      id="cd-phone"
                      placeholder="Ej: 33 1234 5678"
                      {...register("phone")}
                    />
                    {errors.phone && (
                      <p className="text-[11px] text-destructive">{errors.phone.message}</p>
                    )}
                  </div>
                </div>

                {/* Email + Discount */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="cd-email" className="flex items-center gap-1.5 text-xs">
                      <Mail className="h-3 w-3 text-neutral-400" />
                      Email
                    </Label>
                    <Input
                      id="cd-email"
                      type="email"
                      placeholder="correo@ejemplo.com"
                      {...register("email")}
                    />
                    {errors.email && (
                      <p className="text-[11px] text-destructive">{errors.email.message}</p>
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="cd-discount" className="flex items-center gap-1.5 text-xs">
                      <Percent className="h-3 w-3 text-neutral-400" />
                      Descuento
                    </Label>
                    <select
                      id="cd-discount"
                      {...register("price_list_id", {
                        setValueAs: (v: string) => v || null,
                      })}
                      className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
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

                {/* Address */}
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="cd-address" className="flex items-center gap-1.5 text-xs">
                    <MapPin className="h-3 w-3 text-neutral-400" />
                    Direccion
                  </Label>
                  <Input
                    id="cd-address"
                    placeholder="Direccion de entrega (opcional)"
                    {...register("address")}
                  />
                </div>

                {/* Notes */}
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="cd-notes" className="flex items-center gap-1.5 text-xs">
                    <StickyNote className="h-3 w-3 text-neutral-400" />
                    Notas
                  </Label>
                  <Textarea
                    id="cd-notes"
                    placeholder="Notas internas sobre el cliente..."
                    rows={3}
                    {...register("notes")}
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 border-t border-neutral-100 px-6 py-4">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleClose}
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmitting}
                  className="bg-rose-500 text-white hover:bg-rose-600"
                >
                  {isSubmitting && (
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  )}
                  {isEditing ? "Guardar cambios" : "Crear cliente"}
                </Button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  )
}
