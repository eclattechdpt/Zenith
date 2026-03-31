"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import { ArrowLeft, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"

import { customerSchema, type CustomerInput } from "../schemas"
import { usePriceLists } from "../queries"
import { createCustomer, updateCustomer } from "../actions"

interface CustomerFormProps {
  customerId?: string
  defaultValues?: Partial<CustomerInput>
  onBack?: () => void
}

export function CustomerForm({ customerId, defaultValues, onBack }: CustomerFormProps) {
  const isEditing = !!customerId
  const router = useRouter()
  const queryClient = useQueryClient()
  const { data: priceLists = [] } = usePriceLists()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
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
      ...defaultValues,
    },
  })

  // Unsaved changes guard
  const submittedRef = useRef(false)
  const [pendingNav, setPendingNav] = useState<(() => void) | null>(null)

  useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      if (isDirty && !submittedRef.current) {
        e.preventDefault()
      }
    }
    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [isDirty])

  const guardedNavigate = useCallback(
    (navigate: () => void) => {
      if (isDirty && !submittedRef.current) {
        setPendingNav(() => navigate)
      } else {
        navigate()
      }
    },
    [isDirty]
  )

  async function onSubmit(data: CustomerInput) {
    setIsSubmitting(true)

    const result = isEditing
      ? await updateCustomer(customerId, data)
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

    submittedRef.current = true
    toast.success(
      isEditing ? "Cliente actualizado" : "Cliente creado exitosamente"
    )
    queryClient.invalidateQueries({ queryKey: ["customers"] })
    router.push("/clientes")
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-6"
    >
      {/* Back button */}
      {onBack && (
        <div className="flex justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => guardedNavigate(onBack)}
          >
            <ArrowLeft className="mr-1.5 size-3.5" />
            Volver
          </Button>
        </div>
      )}

      {/* Customer Info */}
      <Card>
        <CardHeader>
          <CardTitle>Informacion del cliente</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Nombre *</Label>
            <Input
              id="name"
              placeholder="Nombre completo"
              {...register("name")}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="phone">Telefono</Label>
            <Input
              id="phone"
              placeholder="Ej: 33 1234 5678"
              {...register("phone")}
            />
            {errors.phone && (
              <p className="text-xs text-destructive">{errors.phone.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="correo@ejemplo.com"
              {...register("email")}
            />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="price_list_id">Lista de precios</Label>
            <select
              id="price_list_id"
              {...register("price_list_id", {
                setValueAs: (v: string) => v || null,
              })}
              className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <option value="">Sin lista (precio base)</option>
              {priceLists.map((pl) => (
                <option key={pl.id} value={pl.id}>
                  {pl.name}
                  {Number(pl.discount_percent) > 0 && ` (-${pl.discount_percent}%)`}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor="address">Direccion</Label>
            <Input
              id="address"
              placeholder="Direccion de entrega (opcional)"
              {...register("address")}
            />
          </div>

          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor="notes">Notas</Label>
            <Textarea
              id="notes"
              placeholder="Notas internas sobre el cliente..."
              {...register("notes")}
            />
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => guardedNavigate(onBack ?? (() => router.back()))}
        >
          Cancelar
        </Button>
        <Button type="submit" size="sm" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-1.5 size-3.5 animate-spin" />}
          {isEditing ? "Guardar cambios" : "Crear cliente"}
        </Button>
      </div>

      {/* Unsaved changes dialog */}
      <ConfirmDialog
        open={!!pendingNav}
        onOpenChange={(open) => !open && setPendingNav(null)}
        title="Cambios sin guardar"
        description="Algunos cambios no han sido guardados. ¿Seguro que quieres salir?"
        confirmLabel="Salir sin guardar"
        cancelLabel="Seguir editando"
        variant="destructive"
        onConfirm={() => {
          const nav = pendingNav
          setPendingNav(null)
          nav?.()
        }}
      />
    </form>
  )
}
