"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"
import { motion } from "motion/react"
import { toast } from "sonner"
import { useQueryClient } from "@tanstack/react-query"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { NumericInput } from "@/features/productos/components/variant-manager"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { formatCurrency } from "@/lib/utils"

import { upsertInitialLoadOverride } from "../actions"
import type { InventoryVariant } from "../types"

interface InitialLoadEditDialogProps {
  variant: InventoryVariant | null
  onOpenChange: (open: boolean) => void
}

export function InitialLoadEditDialog({
  variant,
  onOpenChange,
}: InitialLoadEditDialogProps) {
  return (
    <Dialog open={!!variant} onOpenChange={onOpenChange}>
      {variant && (
        <InitialLoadEditForm variant={variant} onOpenChange={onOpenChange} />
      )}
    </Dialog>
  )
}

function InitialLoadEditForm({
  variant,
  onOpenChange,
}: {
  variant: InventoryVariant
  onOpenChange: (open: boolean) => void
}) {
  const catalogName = variant.products.name
  const catalogPrice = variant.price

  const [overrideName, setOverrideName] = useState(variant.override_name ?? "")
  const [overridePrice, setOverridePrice] = useState(
    variant.override_price != null ? String(variant.override_price) : ""
  )
  const [stock, setStock] = useState(variant.initial_stock)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const queryClient = useQueryClient()

  const parsedPrice = overridePrice ? parseFloat(overridePrice) : null
  const isValidPrice = parsedPrice === null || (!isNaN(parsedPrice) && parsedPrice >= 0)
  const canSubmit = stock >= 0 && isValidPrice

  async function handleSubmit() {
    if (!canSubmit) return
    setIsSubmitting(true)

    const result = await upsertInitialLoadOverride({
      product_variant_id: variant.id,
      override_name: overrideName.trim() || null,
      override_price: parsedPrice,
      new_stock: stock,
    })

    setIsSubmitting(false)

    if ("error" in result && result.error) {
      const msg =
        (result.error as Record<string, string[]>)._form?.[0] ??
        "Error al guardar"
      toast.error(msg)
      return
    }

    toast.success("Producto actualizado en carga inicial")
    queryClient.invalidateQueries({ queryKey: ["inventory"] })
    queryClient.invalidateQueries({ queryKey: ["inventory-summary"] })
    queryClient.invalidateQueries({ queryKey: ["movements"] })
    onOpenChange(false)
  }

  const variantLabel = variant.name || variant.sku || ""

  return (
    <DialogContent showCloseButton={false} className="sm:max-w-md p-6">
      <DialogHeader>
        <DialogTitle>Editar producto — Carga Inicial</DialogTitle>
        <DialogDescription>
          {catalogName}
          {variantLabel && ` — ${variantLabel}`}
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4">
        {/* Reference: catalog values */}
        <div className="rounded-xl border border-neutral-100/80 bg-neutral-50/50 px-4 py-3 space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
            Valores del catalogo
          </p>
          <div className="flex items-center justify-between text-sm text-neutral-600">
            <span>{catalogName}</span>
            <span className="tabular-nums">{formatCurrency(catalogPrice)}</span>
          </div>
        </div>

        {/* Override name */}
        <div className="space-y-2">
          <Label htmlFor="override-name">Nombre personalizado</Label>
          <Input
            id="override-name"
            value={overrideName}
            onChange={(e) => setOverrideName(e.target.value)}
            placeholder={catalogName}
            maxLength={200}
          />
          <p className="text-[10px] text-neutral-400">
            Dejar vacio para usar el nombre del catalogo
          </p>
        </div>

        {/* Override price */}
        <div className="space-y-2">
          <Label htmlFor="override-price">Precio personalizado</Label>
          <Input
            id="override-price"
            type="number"
            min={0}
            step={0.01}
            value={overridePrice}
            onChange={(e) => setOverridePrice(e.target.value)}
            placeholder={String(catalogPrice)}
            className="tabular-nums"
          />
          <p className="text-[10px] text-neutral-400">
            Dejar vacio para usar el precio del catalogo
          </p>
        </div>

        {/* Stock */}
        <div className="space-y-2">
          <Label>Stock</Label>
          <NumericInput
            min={0}
            value={stock}
            onChange={setStock}
          />
        </div>
      </div>

      <DialogFooter>
        <Button
          variant="outline"
          disabled={isSubmitting}
          onClick={() => onOpenChange(false)}
        >
          Cancelar
        </Button>
        <Button disabled={!canSubmit || isSubmitting} onClick={handleSubmit}>
          {isSubmitting && <Loader2 className="animate-spin" />}
          Guardar cambios
        </Button>
      </DialogFooter>
    </DialogContent>
  )
}
