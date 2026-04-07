"use client"

import { useState } from "react"
import { CheckCircle2, Loader2, Package } from "lucide-react"
import { useQueryClient } from "@tanstack/react-query"
import { sileo } from "sileo"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/utils"
import { VALE_PAYMENT_STATUSES } from "@/lib/constants"

import { useValeDetail } from "../queries"
import { completeVale } from "../actions"

interface Props {
  valeId: string | null
  onOpenChange: (open: boolean) => void
}

export function ValeCompleteDialog({ valeId, onOpenChange }: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const queryClient = useQueryClient()
  const { data: vale, isLoading } = useValeDetail(valeId)

  async function handleComplete() {
    if (!valeId || isSubmitting) return
    setIsSubmitting(true)

    const result = await completeVale({ vale_id: valeId })

    setIsSubmitting(false)

    if ("error" in result) {
      const msg =
        (result.error as Record<string, string[]>)._form?.[0] ??
        "Error al completar el vale"
      sileo.error({ title: msg })
      return
    }

    sileo.success({ title: `Vale ${result.data.vale_number} entregado` })

    queryClient.invalidateQueries({ queryKey: ["vales"] })
    queryClient.invalidateQueries({ queryKey: ["vales-ready"] })
    queryClient.invalidateQueries({ queryKey: ["inventory"] })
    queryClient.invalidateQueries({ queryKey: ["products"] })
    queryClient.invalidateQueries({ queryKey: ["pos-products"] })
    queryClient.invalidateQueries({ queryKey: ["dashboard"] })

    onOpenChange(false)
  }

  return (
    <Dialog open={!!valeId} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="size-4 text-emerald-500" />
            Entregar vale
          </DialogTitle>
        </DialogHeader>

        {isLoading || !vale ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="size-6 animate-spin text-neutral-400" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Vale info */}
            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
              <div className="flex items-center justify-between">
                <span className="font-semibold tabular-nums">
                  {vale.vale_number}
                </span>
                <Badge
                  variant="outline"
                  className={`text-[10px] ${vale.payment_status === "paid" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}
                >
                  {VALE_PAYMENT_STATUSES[vale.payment_status as keyof typeof VALE_PAYMENT_STATUSES] ?? vale.payment_status}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-neutral-500">
                {vale.customers?.name}
              </p>
            </div>

            {/* Items */}
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wider text-neutral-400">
                Productos
              </p>
              {vale.vale_items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 rounded-lg border border-neutral-100 bg-white p-3"
                >
                  <div className="flex size-8 items-center justify-center rounded-lg bg-indigo-50">
                    <Package className="size-4 text-indigo-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium">
                      {item.product_name}
                    </p>
                    <p className="text-xs text-neutral-400">
                      {item.variant_label} x{item.quantity}
                    </p>
                  </div>
                  <span className="text-sm font-semibold tabular-nums">
                    {formatCurrency(Number(item.line_total))}
                  </span>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="flex items-center justify-between rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3">
              <span className="font-medium text-indigo-900">Total</span>
              <span className="text-lg font-bold tabular-nums text-indigo-700">
                {formatCurrency(Number(vale.total))}
              </span>
            </div>

            {/* Warning */}
            <p className="text-xs text-neutral-500">
              Al entregar el vale se descontara el stock de los productos.
              {vale.payment_status === "pending" &&
                " El pago se marcara como completado."}
            </p>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1 bg-emerald-500 text-white hover:bg-emerald-600"
                onClick={handleComplete}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="mr-2 size-4" />
                )}
                Entregar
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
