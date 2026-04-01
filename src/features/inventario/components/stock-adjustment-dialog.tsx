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

import { adjustStock, adjustInitialStock } from "../actions"
import type { InventoryVariant, InventoryType } from "../types"

interface StockAdjustmentDialogProps {
  variant: InventoryVariant | null
  inventoryType?: InventoryType
  onOpenChange: (open: boolean) => void
}

export function StockAdjustmentDialog({
  variant,
  inventoryType = "physical",
  onOpenChange,
}: StockAdjustmentDialogProps) {
  return (
    <Dialog open={!!variant} onOpenChange={onOpenChange}>
      {variant && (
        <StockAdjustmentForm
          variant={variant}
          inventoryType={inventoryType}
          onOpenChange={onOpenChange}
        />
      )}
    </Dialog>
  )
}

function StockAdjustmentForm({
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
  const [newStock, setNewStock] = useState(String(currentStock))
  const [reason, setReason] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const queryClient = useQueryClient()

  const parsedNew = parseInt(newStock, 10)
  const isValidStock = !isNaN(parsedNew) && parsedNew >= 0
  const difference = isValidStock ? parsedNew - currentStock : 0
  const canSubmit = isValidStock && difference !== 0 && reason.trim().length > 0

  const action =
    inventoryType === "initial_load" ? adjustInitialStock : adjustStock

  async function handleSubmit() {
    if (!canSubmit) return
    setIsSubmitting(true)

    const result = await action({
      product_variant_id: variant.id,
      new_stock: parsedNew,
      reason: reason.trim(),
    })

    setIsSubmitting(false)

    if ("error" in result && result.error) {
      const msg =
        (result.error as Record<string, string[]>)._form?.[0] ??
        "Error al ajustar stock"
      toast.error(msg)
      return
    }

    toast.success(
      `Stock ajustado: ${currentStock} → ${parsedNew} (${difference > 0 ? "+" : ""}${difference})`
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
        <DialogTitle>Ajustar stock</DialogTitle>
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
          <Label htmlFor="new-stock">Stock nuevo</Label>
          <Input
            id="new-stock"
            type="number"
            min={0}
            step={1}
            value={newStock}
            onChange={(e) => setNewStock(e.target.value)}
            className="tabular-nums"
            autoFocus
          />
        </div>

        {isValidStock && difference !== 0 && (
          <div
            className={`flex items-center justify-between rounded-lg px-4 py-3 ${
              difference > 0
                ? "bg-emerald-50 text-emerald-700"
                : "bg-rose-50 text-rose-700"
            }`}
          >
            <span className="text-sm">Diferencia</span>
            <span className="font-semibold tabular-nums">
              {difference > 0 ? "+" : ""}
              {difference}
            </span>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="reason">
            Motivo <span className="text-rose-500">*</span>
          </Label>
          <Textarea
            id="reason"
            placeholder="Ej: Conteo fisico, producto danado, error en registro..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={500}
            rows={3}
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
          Ajustar stock
        </Button>
      </DialogFooter>
    </DialogContent>
  )
}
