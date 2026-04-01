"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useQueryClient } from "@tanstack/react-query"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import { addStock, addInitialStock } from "../actions"
import type { InventoryVariant, InventoryType } from "../types"

interface StockEntryDialogProps {
  variant: InventoryVariant | null
  inventoryType?: InventoryType
  onOpenChange: (open: boolean) => void
}

export function StockEntryDialog({
  variant,
  inventoryType = "physical",
  onOpenChange,
}: StockEntryDialogProps) {
  return (
    <Dialog open={!!variant} onOpenChange={onOpenChange}>
      {variant && (
        <StockEntryForm
          variant={variant}
          inventoryType={inventoryType}
          onOpenChange={onOpenChange}
        />
      )}
    </Dialog>
  )
}

function StockEntryForm({
  variant,
  inventoryType,
  onOpenChange,
}: {
  variant: InventoryVariant
  inventoryType: InventoryType
  onOpenChange: (open: boolean) => void
}) {
  const currentStock =
    inventoryType === "initial_load" ? variant.initial_stock : variant.stock
  const [quantity, setQuantity] = useState("")
  const [reason, setReason] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const queryClient = useQueryClient()

  const parsedQty = parseInt(quantity, 10)
  const isValidQty = !isNaN(parsedQty) && parsedQty > 0
  const canSubmit = isValidQty

  const action = inventoryType === "initial_load" ? addInitialStock : addStock

  async function handleSubmit() {
    if (!canSubmit) return
    setIsSubmitting(true)

    const result = await action({
      product_variant_id: variant.id,
      quantity: parsedQty,
      reason: reason.trim() || null,
    })

    setIsSubmitting(false)

    if ("error" in result && result.error) {
      const msg =
        (result.error as Record<string, string[]>)._form?.[0] ??
        "Error al registrar entrada"
      toast.error(msg)
      return
    }

    toast.success(
      `Entrada registrada: +${parsedQty} unidades (${currentStock} → ${currentStock + parsedQty})`
    )
    queryClient.invalidateQueries({ queryKey: ["inventory"] })
    queryClient.invalidateQueries({ queryKey: ["inventory-summary"] })
    queryClient.invalidateQueries({ queryKey: ["movements"] })
    queryClient.invalidateQueries({ queryKey: ["products"] })
    onOpenChange(false)
  }

  const productLabel = `${variant.products.name}${variant.name ? ` — ${variant.name}` : ""}${variant.sku ? ` (${variant.sku})` : ""}`

  return (
    <DialogContent showCloseButton={false}>
      <DialogHeader>
        <DialogTitle>Entrada de mercancia</DialogTitle>
        <DialogDescription>{productLabel}</DialogDescription>
      </DialogHeader>

      <div className="space-y-4">
        <div className="flex items-center justify-between rounded-lg bg-neutral-50 px-4 py-3">
          <span className="text-sm text-neutral-500">Stock actual</span>
          <span className="font-semibold text-neutral-950 tabular-nums">
            {currentStock}
          </span>
        </div>

        <div className="space-y-2">
          <Label htmlFor="entry-quantity">Cantidad a agregar</Label>
          <Input
            id="entry-quantity"
            type="number"
            min={1}
            step={1}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="Ej: 50"
            className="tabular-nums"
            autoFocus
          />
        </div>

        {isValidQty && (
          <div className="flex items-center justify-between rounded-lg bg-emerald-50 px-4 py-3 text-emerald-700">
            <span className="text-sm">Stock resultante</span>
            <span className="font-semibold tabular-nums">
              {currentStock + parsedQty}
            </span>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="entry-reason">Referencia (opcional)</Label>
          <Textarea
            id="entry-reason"
            placeholder="Ej: Orden de compra #123, reposicion semanal..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={500}
            rows={2}
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
          Registrar entrada
        </Button>
      </DialogFooter>
    </DialogContent>
  )
}
