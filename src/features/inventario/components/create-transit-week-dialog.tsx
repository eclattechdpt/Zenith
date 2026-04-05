"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useQueryClient } from "@tanstack/react-query"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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

import { createTransitWeek } from "../actions"
import { MONTH_NAMES } from "./transit-monthly-chart"

interface CreateTransitWeekDialogProps {
  open: boolean
  year: number
  month: number
  existingWeekNumbers?: number[]
  onOpenChange: (open: boolean) => void
}

export function CreateTransitWeekDialog({
  open,
  year,
  month,
  existingWeekNumbers = [],
  onOpenChange,
}: CreateTransitWeekDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open && (
        <CreateWeekForm
          year={year}
          month={month}
          existingWeekNumbers={existingWeekNumbers}
          onOpenChange={onOpenChange}
        />
      )}
    </Dialog>
  )
}

function CreateWeekForm({
  year,
  month,
  existingWeekNumbers,
  onOpenChange,
}: {
  year: number
  month: number
  existingWeekNumbers: number[]
  onOpenChange: (open: boolean) => void
}) {
  const nextWeek = existingWeekNumbers.length > 0
    ? Math.min(Math.max(...existingWeekNumbers) + 1, 5)
    : 1
  const [weekNumber, setWeekNumber] = useState(nextWeek)
  const [label, setLabel] = useState("")
  const [notes, setNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const queryClient = useQueryClient()

  const isValid = weekNumber >= 1 && weekNumber <= 5

  const monthName = MONTH_NAMES[month - 1]

  async function handleSubmit() {
    if (!isValid) return
    setIsSubmitting(true)

    const result = await createTransitWeek({
      year,
      month,
      week_number: weekNumber,
      label: label.trim() || null,
      notes: notes.trim() || null,
    })

    setIsSubmitting(false)

    if ("error" in result && result.error) {
      const msg =
        (result.error as Record<string, string[]>)._form?.[0] ??
        "Error al crear la semana"
      toast.error(msg)
      return
    }

    toast.success(`Semana ${weekNumber} de ${monthName} ${year} creada`)
    queryClient.invalidateQueries({ queryKey: ["transit-weeks"] })
    queryClient.invalidateQueries({ queryKey: ["transit-month-summary"] })
    queryClient.invalidateQueries({ queryKey: ["inventory-summary"] })
    onOpenChange(false)
  }

  return (
    <DialogContent showCloseButton={false} className="sm:max-w-md p-6">
      <DialogHeader>
        <DialogTitle>Nueva semana</DialogTitle>
        <DialogDescription>
          {monthName} {year} — Agregar semana al inventario en transito
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Numero de semana (1-5)</Label>
          <NumericInput
            min={1}
            max={5}
            value={weekNumber}
            onChange={setWeekNumber}
            autoFocus
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="transit-label">Etiqueta (opcional)</Label>
          <Input
            id="transit-label"
            placeholder="Ej: Pedido proveedor X, Reposicion..."
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            maxLength={100}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="transit-notes">Notas (opcional)</Label>
          <Textarea
            id="transit-notes"
            placeholder="Notas adicionales sobre esta semana..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
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
        <Button disabled={!isValid || isSubmitting} onClick={handleSubmit}>
          {isSubmitting && <Loader2 className="animate-spin" />}
          Crear semana
        </Button>
      </DialogFooter>
    </DialogContent>
  )
}
