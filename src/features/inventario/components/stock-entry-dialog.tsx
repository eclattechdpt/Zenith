"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"
import { motion } from "motion/react"
import { toast } from "sonner"
import { useQueryClient } from "@tanstack/react-query"

import { Button } from "@/components/ui/button"
import { NumericInput } from "@/features/productos/components/variant-manager"
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
  const [quantity, setQuantity] = useState(0)
  const [reason, setReason] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const queryClient = useQueryClient()

  const canSubmit = quantity > 0

  const action = inventoryType === "initial_load" ? addInitialStock : addStock

  async function handleSubmit() {
    if (!canSubmit) return
    setIsSubmitting(true)

    const result = await action({
      product_variant_id: variant.id,
      quantity,
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
      `Entrada registrada: +${quantity} unidades (${currentStock} → ${currentStock + quantity})`
    )
    queryClient.invalidateQueries({ queryKey: ["inventory"] })
    queryClient.invalidateQueries({ queryKey: ["inventory-summary"] })
    queryClient.invalidateQueries({ queryKey: ["movements"] })
    queryClient.invalidateQueries({ queryKey: ["products"] })
    onOpenChange(false)
  }

  const productLabel = `${variant.products.name}${variant.name ? ` — ${variant.name}` : ""}${variant.sku ? ` (${variant.sku})` : ""}`

  return (
    <DialogContent showCloseButton={false} className="sm:max-w-md p-6 [&_input]:focus-visible:border-amber-400 [&_input]:focus-visible:ring-amber-500/30 [&_textarea]:focus-visible:border-amber-400 [&_textarea]:focus-visible:ring-amber-500/30 [&_::-webkit-scrollbar-thumb]:bg-amber-200 [&_::-webkit-scrollbar-thumb:hover]:bg-amber-300" style={{ scrollbarColor: "rgb(253 230 138) transparent" }}>
      <DialogHeader>
        <DialogTitle>Entrada de mercancia</DialogTitle>
        <DialogDescription>{productLabel}</DialogDescription>
      </DialogHeader>

      <div className="space-y-4">
        <div className="rounded-xl border border-neutral-100/80 bg-neutral-50/50 px-4 py-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
            Stock actual
          </p>
          <p className="mt-0.5 font-semibold text-neutral-950 tabular-nums">
            {currentStock}
          </p>
        </div>

        <div className="space-y-2">
          <Label>Cantidad a agregar</Label>
          <NumericInput
            min={1}
            value={quantity}
            onChange={setQuantity}
            placeholder="Ej: 50"
            autoFocus
          />
        </div>

        {quantity > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="flex items-center justify-between rounded-xl border border-emerald-100/80 bg-emerald-50/50 px-4 py-3 text-emerald-700">
              <span className="text-sm">Stock resultante</span>
              <span className="font-semibold tabular-nums">
                {currentStock + quantity}
              </span>
            </div>
          </motion.div>
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
