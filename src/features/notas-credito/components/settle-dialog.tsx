"use client"

import { useState } from "react"
import { CheckCircle2, Loader2, Package, ArrowUpRight } from "lucide-react"
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
import { CREDIT_NOTE_TYPES } from "@/lib/constants"

import { useCreditNoteDetail } from "../queries"
import { settleCreditNote } from "../actions"

interface Props {
  creditNoteId: string | null
  onOpenChange: (open: boolean) => void
}

export function SettleDialog({ creditNoteId, onOpenChange }: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const queryClient = useQueryClient()
  const { data: cn, isLoading } = useCreditNoteDetail(creditNoteId)

  async function handleSettle() {
    if (!creditNoteId || isSubmitting) return
    setIsSubmitting(true)

    const result = await settleCreditNote({ credit_note_id: creditNoteId })

    setIsSubmitting(false)

    if ("error" in result) {
      const msg =
        (result.error as Record<string, string[]>)._form?.[0] ??
        "Error al liquidar"
      sileo.error({ title: msg })
      return
    }

    sileo.success({ title: `Nota ${result.data.credit_number} liquidada` })

    queryClient.invalidateQueries({ queryKey: ["credit-notes"] })
    queryClient.invalidateQueries({ queryKey: ["inventory"] })
    queryClient.invalidateQueries({ queryKey: ["products"] })
    queryClient.invalidateQueries({ queryKey: ["pos-products"] })

    onOpenChange(false)
  }

  const items = cn?.credit_note_items ?? []
  const outItems = items.filter((i) => i.direction === "out")

  return (
    <Dialog open={!!creditNoteId} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="size-4 text-emerald-500" />
            Liquidar prestamo
          </DialogTitle>
        </DialogHeader>

        {isLoading || !cn ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="size-6 animate-spin text-neutral-400" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Info */}
            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
              <div className="flex items-center justify-between">
                <span className="font-semibold tabular-nums">
                  {cn.credit_number}
                </span>
                <Badge
                  variant="outline"
                  className="text-[10px] bg-violet-50 text-violet-700 border-violet-200"
                >
                  {CREDIT_NOTE_TYPES[cn.credit_type as keyof typeof CREDIT_NOTE_TYPES] ?? cn.credit_type}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-neutral-500">
                {cn.customers?.name}
              </p>
            </div>

            {/* Items being returned */}
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wider text-neutral-400">
                Productos prestados (se regresaran al stock)
              </p>
              {outItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 rounded-lg border border-neutral-100 bg-white p-3"
                >
                  <div className="flex size-8 items-center justify-center rounded-lg bg-violet-50">
                    <Package className="size-4 text-violet-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium">
                      {item.product_name}
                    </p>
                    <p className="text-xs text-neutral-400">
                      {item.variant_label}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-sm font-semibold text-emerald-600">
                    <ArrowUpRight className="size-3.5" />
                    +{item.quantity}
                  </div>
                </div>
              ))}
            </div>

            {/* Warning */}
            <p className="text-xs text-neutral-500">
              Al liquidar, los productos prestados se regresaran al inventario
              fisico y la nota se marcara como liquidada.
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
                onClick={handleSettle}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="mr-2 size-4" />
                )}
                Liquidar
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
