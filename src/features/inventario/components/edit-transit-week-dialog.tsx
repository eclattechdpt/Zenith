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

import { updateTransitWeek } from "../actions"
import { MONTH_NAMES } from "./transit-monthly-chart"
import type { TransitWeekWithItems } from "../types"

interface EditTransitWeekDialogProps {
  week: TransitWeekWithItems | null
  onOpenChange: (open: boolean) => void
}

export function EditTransitWeekDialog({
  week,
  onOpenChange,
}: EditTransitWeekDialogProps) {
  return (
    <Dialog open={!!week} onOpenChange={onOpenChange}>
      {week && <EditWeekForm week={week} onOpenChange={onOpenChange} />}
    </Dialog>
  )
}

function EditWeekForm({
  week,
  onOpenChange,
}: {
  week: TransitWeekWithItems
  onOpenChange: (open: boolean) => void
}) {
  const [label, setLabel] = useState(week.label ?? "")
  const [notes, setNotes] = useState(week.notes ?? "")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const queryClient = useQueryClient()

  const monthName = MONTH_NAMES[week.month - 1]
  const hasChanges =
    (label.trim() || null) !== (week.label ?? null) ||
    (notes.trim() || null) !== (week.notes ?? null)

  async function handleSubmit() {
    if (!hasChanges) return
    setIsSubmitting(true)

    const result = await updateTransitWeek({
      id: week.id,
      label: label.trim() || null,
      notes: notes.trim() || null,
    })

    setIsSubmitting(false)

    if ("error" in result && result.error) {
      const msg =
        (result.error as Record<string, string[]>)._form?.[0] ??
        "Error al actualizar"
      toast.error(msg)
      return
    }

    toast.success("Semana actualizada")
    queryClient.invalidateQueries({ queryKey: ["transit-weeks"] })
    onOpenChange(false)
  }

  return (
    <DialogContent showCloseButton={false} className="sm:max-w-md p-6">
      <DialogHeader>
        <DialogTitle>Editar semana</DialogTitle>
        <DialogDescription>
          Semana {week.week_number} — {monthName} {week.year}
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="edit-week-label">Etiqueta</Label>
          <Input
            id="edit-week-label"
            placeholder="Ej: Pedido proveedor X, Reposicion..."
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            maxLength={100}
            autoFocus
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="edit-week-notes">Notas</Label>
          <Textarea
            id="edit-week-notes"
            placeholder="Notas adicionales sobre esta semana..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
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
        <Button
          disabled={!hasChanges || isSubmitting}
          onClick={handleSubmit}
        >
          {isSubmitting && <Loader2 className="animate-spin" />}
          Guardar cambios
        </Button>
      </DialogFooter>
    </DialogContent>
  )
}
