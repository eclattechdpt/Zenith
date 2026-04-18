"use client"

import { useRef, useState } from "react"
import { Loader2 } from "lucide-react"
import { motion } from "motion/react"
import { sileo } from "sileo"
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
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { useDirtyCloseGuard } from "@/hooks/use-dirty-close-guard"

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
  const submittingRef = useRef(false)
  return variant ? (
    <StockAdjustmentForm
      key={variant.id}
      variant={variant}
      inventoryType={inventoryType}
      onOpenChange={onOpenChange}
      submittingRef={submittingRef}
    />
  ) : null
}

function StockAdjustmentForm({
  variant,
  inventoryType,
  onOpenChange,
  submittingRef,
}: {
  variant: InventoryVariant
  inventoryType: InventoryType
  onOpenChange: (open: boolean) => void
  submittingRef: React.MutableRefObject<boolean>
}) {
  const currentStock =
    inventoryType === "initial_load" ? variant.initial_stock : variant.stock
  const [newStock, setNewStock] = useState(currentStock)
  const [reason, setReason] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [idempotencyKey] = useState(() => crypto.randomUUID())
  const queryClient = useQueryClient()

  const difference = newStock - currentStock
  const canSubmit = newStock >= 0 && difference !== 0 && reason.trim().length > 0
  const isDirty = difference !== 0 || reason.trim().length > 0

  const { confirmOpen, attemptClose, confirmDiscard, cancelDiscard } =
    useDirtyCloseGuard(isDirty, () => onOpenChange(false))

  const action =
    inventoryType === "initial_load" ? adjustInitialStock : adjustStock

  async function handleSubmit() {
    if (!canSubmit || isSubmitting) return
    setIsSubmitting(true)
    submittingRef.current = true

    const result = await action({
      product_variant_id: variant.id,
      new_stock: newStock,
      reason: reason.trim(),
      idempotency_key: idempotencyKey,
    })

    setIsSubmitting(false)
    submittingRef.current = false

    if ("error" in result && result.error) {
      const msg =
        (result.error as Record<string, string[]>)._form?.[0] ??
        "Error al ajustar stock"
      sileo.error({ title: msg })
      return
    }

    sileo.success({
      title: `Stock ajustado: ${currentStock} → ${newStock} (${difference > 0 ? "+" : ""}${difference})`,
      description: "El movimiento fue registrado en el historial",
    })
    queryClient.invalidateQueries({ queryKey: ["inventory"] })
    queryClient.invalidateQueries({ queryKey: ["inventory-summary"] })
    queryClient.invalidateQueries({ queryKey: ["movements"] })
    queryClient.invalidateQueries({ queryKey: ["products"] })
    onOpenChange(false)
  }

  const productLabel = `${variant.products.name}${variant.name ? ` — ${variant.name}` : ""}${variant.sku ? ` (${variant.sku})` : ""}`

  return (
    <>
    <Dialog
      open
      onOpenChange={(next) => {
        if (!next) {
          if (submittingRef.current) return
          attemptClose()
        }
      }}
    >
    <DialogContent showCloseButton={false} className="sm:max-w-md p-6">
      <DialogHeader>
        <DialogTitle>Ajustar stock</DialogTitle>
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
          <Label>Stock nuevo</Label>
          <NumericInput
            min={0}
            value={newStock}
            onChange={setNewStock}
            autoFocus
          />
        </div>

        {difference !== 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div
              className={`flex items-center justify-between rounded-xl border px-4 py-3 ${
                difference > 0
                  ? "border-emerald-100/80 bg-emerald-50/50 text-emerald-700"
                  : "border-rose-100/80 bg-rose-50/50 text-rose-700"
              }`}
            >
              <span className="text-sm">Diferencia</span>
              <span className="font-semibold tabular-nums">
                {difference > 0 ? "+" : ""}
                {difference}
              </span>
            </div>
          </motion.div>
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
          onClick={attemptClose}
        >
          Cancelar
        </Button>
        <Button disabled={!canSubmit || isSubmitting} onClick={handleSubmit}>
          {isSubmitting && <Loader2 className="animate-spin" />}
          Ajustar stock
        </Button>
      </DialogFooter>
    </DialogContent>
    </Dialog>
    <ConfirmDialog
      open={confirmOpen}
      onOpenChange={(next) => { if (!next) cancelDiscard() }}
      title="Descartar cambios"
      description="Hay cambios sin guardar que se perderán si cierras."
      confirmLabel="Descartar"
      cancelLabel="Seguir editando"
      variant="destructive"
      onConfirm={confirmDiscard}
    />
    </>
  )
}
