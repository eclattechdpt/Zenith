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
  ExternalLink,
} from "lucide-react"
import { sileo } from "sileo"

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
  const [mapCoords, setMapCoords] = useState<{ lat: number; lon: number } | null>(null)
  const [isGeocoding, setIsGeocoding] = useState(false)
  const [geocodeFailed, setGeocodeFailed] = useState(false)

  const queryClient = useQueryClient()
  const { data: priceLists = [] } = usePriceLists()
  const { data: existingCustomer } = useCustomer(customerId ?? "")

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    setError,
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

  // Format phone as user types: "33 1234 5678"
  const formatPhone = useCallback((raw: string) => {
    const digits = raw.replace(/\D/g, "").slice(0, 10)
    if (digits.length <= 2) return digits
    if (digits.length <= 6) return `${digits.slice(0, 2)} ${digits.slice(2)}`
    return `${digits.slice(0, 2)} ${digits.slice(2, 6)} ${digits.slice(6)}`
  }, [])

  const phoneRegister = register("phone")
  const handlePhoneChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const formatted = formatPhone(e.target.value)
      setValue("phone", formatted, { shouldValidate: false })
      e.target.value = formatted
    },
    [formatPhone, setValue]
  )

  // Geocode address with Nominatim (debounced)
  const address = watch("address")
  useEffect(() => {
    if (!address || address.trim().length < 8) {
      setMapCoords(null)
      setIsGeocoding(false)
      setGeocodeFailed(false)
      return
    }
    setIsGeocoding(true)
    setGeocodeFailed(false)
    const controller = new AbortController()
    const timer = setTimeout(async () => {
      try {
        const q = encodeURIComponent(address.trim())
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${q}`,
          {
            signal: controller.signal,
            headers: { Accept: "application/json" },
          }
        )
        if (!res.ok) {
          setMapCoords(null)
          setGeocodeFailed(true)
          setIsGeocoding(false)
          return
        }
        const data = await res.json()
        if (Array.isArray(data) && data.length > 0) {
          setMapCoords({ lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) })
          setGeocodeFailed(false)
        } else {
          setMapCoords(null)
          setGeocodeFailed(true)
        }
      } catch (err) {
        if (!(err instanceof DOMException && err.name === "AbortError")) {
          setMapCoords(null)
          setGeocodeFailed(true)
        }
      } finally {
        if (!controller.signal.aborted) setIsGeocoding(false)
      }
    }, 1500)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [address])

  // Populate form when editing
  useEffect(() => {
    if (isEditing && existingCustomer) {
      reset({
        name: existingCustomer.name,
        client_number: existingCustomer.client_number ?? "",
        phone: formatPhone(existingCustomer.phone ?? ""),
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
      setMapCoords(null)
      setGeocodeFailed(false)
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
      const errs = result.error as Record<string, string[]>
      // Route field-level errors back to their inputs so the user sees the
      // specific message (e.g. "Ya existe un cliente con este número") inline
      // instead of a generic toast. Falls back to _form for unscoped errors.
      let hasFieldError = false
      for (const [key, messages] of Object.entries(errs)) {
        if (key === "_form" || !messages?.length) continue
        setError(key as keyof CustomerInput, { type: "server", message: messages[0] })
        hasFieldError = true
      }
      if (!hasFieldError) {
        sileo.error({
          title: errs._form?.[0] ??
            `Error al ${isEditing ? "actualizar" : "crear"} el cliente`,
        })
      }
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
                          className="rounded-xl border-neutral-200/80 bg-neutral-50/80 focus-visible:border-teal-300 focus-visible:ring-teal-500/20"
                          {...register("name")}
                        />
                        {errors.name && (
                          <p className="text-[11px] text-destructive">{errors.name.message}</p>
                        )}
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor="cd-client-number" className="text-xs font-medium text-neutral-500">Numero de cliente <span className="font-normal text-neutral-400">(opcional)</span></Label>
                        <Input
                          id="cd-client-number"
                          placeholder="Ej: C-001"
                          className="rounded-xl border-neutral-200/80 bg-neutral-50/80 focus-visible:border-teal-300 focus-visible:ring-teal-500/20"
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
                          className="rounded-xl border-neutral-200/80 bg-neutral-50/80 focus-visible:border-teal-300 focus-visible:ring-teal-500/20"
                          {...phoneRegister}
                          onChange={(e) => {
                            handlePhoneChange(e)
                            phoneRegister.onChange(e)
                          }}
                        />
                        {errors.phone && (
                          <p className="text-[11px] text-destructive">{errors.phone.message}</p>
                        )}
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor="cd-email" className="text-xs font-medium text-neutral-500">Email <span className="font-normal text-neutral-400">(opcional)</span></Label>
                        <Input
                          id="cd-email"
                          type="email"
                          placeholder="correo@ejemplo.com"
                          className="rounded-xl border-neutral-200/80 bg-neutral-50/80 focus-visible:border-teal-300 focus-visible:ring-teal-500/20"
                          {...register("email")}
                        />
                        {errors.email && (
                          <p className="text-[11px] text-destructive">{errors.email.message}</p>
                        )}
                      </div>
                    </div>

                    {/* Discount */}
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-xs font-medium text-neutral-500">Descuento</Label>
                      <Select
                        value={watch("price_list_id") ?? ""}
                        onValueChange={(val) =>
                          setValue("price_list_id", val || null, { shouldDirty: true })
                        }
                      >
                        <SelectTrigger className="w-full rounded-xl border-neutral-200/80 bg-neutral-50/80 focus-visible:border-teal-300 focus-visible:ring-teal-500/20">
                          <SelectValue placeholder="Sin descuento (precio base)">
                            {(value: string | null) => {
                              if (!value) return "Sin descuento (precio base)"
                              const pl = priceLists.find((p) => p.id === value)
                              if (!pl) return "Sin descuento (precio base)"
                              return (
                                <>
                                  {pl.name}
                                  {Number(pl.discount_percent) > 0 && (
                                    <span className="text-accent-500 font-medium"> (-{pl.discount_percent}%)</span>
                                  )}
                                </>
                              )
                            }}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent align="start" alignItemWithTrigger={false}>
                          <SelectItem value="" label="Sin descuento (precio base)">
                            <Percent className="size-3.5 text-neutral-400" />
                            Sin descuento (precio base)
                          </SelectItem>
                          {priceLists.map((pl) => {
                            const label = `${pl.name}${Number(pl.discount_percent) > 0 ? ` (-${pl.discount_percent}%)` : ""}`
                            return (
                              <SelectItem key={pl.id} value={pl.id} label={label}>
                                <Percent className="size-3.5 text-teal-500" />
                                {pl.name}
                                {Number(pl.discount_percent) > 0 && (
                                  <span className="text-teal-600 font-medium">
                                    -{pl.discount_percent}%
                                  </span>
                                )}
                              </SelectItem>
                            )
                          })}
                        </SelectContent>
                      </Select>
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
                      <Label htmlFor="cd-address" className="text-xs font-medium text-neutral-500">
                        Direccion <span className="font-normal text-neutral-400">(opcional)</span>
                      </Label>
                      <Input
                        id="cd-address"
                        placeholder="Direccion de entrega"
                        className="rounded-xl border-neutral-200/80 bg-neutral-50/80 focus-visible:border-teal-300 focus-visible:ring-teal-500/20"
                        {...register("address")}
                      />
                      {isGeocoding && (
                        <p className="flex items-center gap-1.5 text-[11px] text-neutral-400">
                          <Loader2 className="size-3 animate-spin" />
                          Buscando ubicacion...
                        </p>
                      )}
                      {geocodeFailed && !isGeocoding && (
                        <p className="flex items-center gap-1.5 text-[11px] text-neutral-400">
                          <MapPin className="size-3" />
                          No se encontro la ubicacion — intenta con una direccion mas general (ej: colonia, ciudad)
                        </p>
                      )}
                      <AnimatePresence>
                        {mapCoords && !isGeocoding && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3, ease: "easeOut" }}
                            className="overflow-hidden"
                          >
                            <div className="relative mt-1 overflow-hidden rounded-xl border border-neutral-200/80 shadow-sm">
                              <iframe
                                title="Mapa de ubicacion"
                                width="100%"
                                height="180"
                                style={{ border: 0, display: "block" }}
                                loading="lazy"
                                src={`https://www.openstreetmap.org/export/embed.html?bbox=${mapCoords.lon - 0.005},${mapCoords.lat - 0.003},${mapCoords.lon + 0.005},${mapCoords.lat + 0.003}&layer=mapnik&marker=${mapCoords.lat},${mapCoords.lon}`}
                              />
                              <a
                                href={`https://www.google.com/maps?q=${mapCoords.lat},${mapCoords.lon}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="absolute bottom-2 right-2 flex items-center gap-1 rounded-lg bg-white/90 px-2 py-1 text-[10px] font-medium text-neutral-600 shadow-sm backdrop-blur-sm transition-colors hover:bg-white hover:text-neutral-900"
                              >
                                <ExternalLink className="size-3" />
                                Abrir mapa
                              </a>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Notes */}
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="cd-notes" className="text-xs font-medium text-neutral-500">Notas</Label>
                      <Textarea
                        id="cd-notes"
                        placeholder="Notas internas sobre el cliente..."
                        rows={3}
                        className="rounded-xl border-neutral-200/80 bg-neutral-50/80 focus-visible:border-teal-300 focus-visible:ring-teal-500/20"
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
