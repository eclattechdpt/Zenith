"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useQueryClient } from "@tanstack/react-query"
import { getISOWeek } from "date-fns"

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

import { createTransitWeek } from "../actions"

interface CreateTransitWeekDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateTransitWeekDialog({
  open,
  onOpenChange,
}: CreateTransitWeekDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open && <CreateWeekForm onOpenChange={onOpenChange} />}
    </Dialog>
  )
}

function CreateWeekForm({
  onOpenChange,
}: {
  onOpenChange: (open: boolean) => void
}) {
  const now = new Date()
  const [year, setYear] = useState(String(now.getFullYear()))
  const [weekNumber, setWeekNumber] = useState(String(getISOWeek(now)))
  const [label, setLabel] = useState("")
  const [notes, setNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const queryClient = useQueryClient()

  const parsedYear = parseInt(year, 10)
  const parsedWeek = parseInt(weekNumber, 10)
  const isValid =
    !isNaN(parsedYear) &&
    parsedYear >= 2020 &&
    parsedYear <= 2099 &&
    !isNaN(parsedWeek) &&
    parsedWeek >= 1 &&
    parsedWeek <= 53

  async function handleSubmit() {
    if (!isValid) return
    setIsSubmitting(true)

    const result = await createTransitWeek({
      year: parsedYear,
      week_number: parsedWeek,
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

    toast.success(`Semana ${parsedWeek} del ${parsedYear} creada`)
    queryClient.invalidateQueries({ queryKey: ["transit-weeks"] })
    queryClient.invalidateQueries({ queryKey: ["inventory-summary"] })
    onOpenChange(false)
  }

  return (
    <DialogContent showCloseButton={false}>
      <DialogHeader>
        <DialogTitle>Nueva semana</DialogTitle>
        <DialogDescription>
          Registra una nueva semana de inventario en transito
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="transit-year">Ano</Label>
            <Input
              id="transit-year"
              type="number"
              min={2020}
              max={2099}
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="tabular-nums"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="transit-week">Semana</Label>
            <Input
              id="transit-week"
              type="number"
              min={1}
              max={53}
              value={weekNumber}
              onChange={(e) => setWeekNumber(e.target.value)}
              className="tabular-nums"
              autoFocus
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="transit-label">Etiqueta (opcional)</Label>
          <Input
            id="transit-label"
            placeholder="Ej: Pedido proveedor X, Reposicion abril..."
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
