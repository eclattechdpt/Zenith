"use client"

import { CheckCircle2, XCircle } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatDate } from "@/lib/utils"
import { CREDIT_NOTE_STATUSES, CREDIT_NOTE_TYPES } from "@/lib/constants"

import type { CreditNoteWithDetails } from "../types"

const STATUS_COLORS: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  settled: "bg-blue-50 text-blue-700 border-blue-200",
  cancelled: "bg-neutral-100 text-neutral-500 border-neutral-200",
}

const TYPE_COLORS: Record<string, string> = {
  lending: "bg-violet-50 text-violet-700 border-violet-200",
  exchange: "bg-amber-50 text-amber-700 border-amber-200",
}

interface Props {
  note: CreditNoteWithDetails
  onSettle?: () => void
  onCancel?: () => void
}

export function CreditNotesCardMobile({ note, onSettle, onCancel }: Props) {
  const items = note.credit_note_items ?? []
  const outCount = items.filter((i) => i.direction === "out").reduce((s, i) => s + i.quantity, 0)
  const inCount = items.filter((i) => i.direction === "in").reduce((s, i) => s + i.quantity, 0)

  return (
    <div className="rounded-xl border border-neutral-100 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold tabular-nums">{note.credit_number}</span>
            <Badge
              variant="outline"
              className={`text-[10px] ${TYPE_COLORS[note.credit_type] ?? ""}`}
            >
              {CREDIT_NOTE_TYPES[note.credit_type as keyof typeof CREDIT_NOTE_TYPES] ?? note.credit_type}
            </Badge>
          </div>
          <p className="mt-0.5 text-sm text-neutral-500">
            {note.customers?.name ?? "—"}
          </p>
        </div>
        <Badge
          variant="outline"
          className={`text-[10px] ${STATUS_COLORS[note.status] ?? ""}`}
        >
          {CREDIT_NOTE_STATUSES[note.status as keyof typeof CREDIT_NOTE_STATUSES] ?? note.status}
        </Badge>
      </div>

      <div className="mt-2 flex items-center gap-2 text-xs">
        {outCount > 0 && (
          <span className="rounded bg-rose-50 px-1.5 py-0.5 text-rose-600">
            -{outCount} salida
          </span>
        )}
        {inCount > 0 && (
          <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-emerald-600">
            +{inCount} entrada
          </span>
        )}
      </div>

      <div className="mt-3 border-t border-neutral-100 pt-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-neutral-500 tabular-nums">
            {formatDate(note.created_at)}
          </span>
        </div>
        {(onSettle || onCancel) && (
          <div className="mt-2 flex items-center justify-end gap-1">
            {onSettle && (
              <Button
                size="sm"
                variant="ghost"
                onClick={onSettle}
                className="text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
              >
                <CheckCircle2 className="mr-1 size-4" />
                Liquidar
              </Button>
            )}
            {onCancel && (
              <Button
                size="sm"
                variant="ghost"
                onClick={onCancel}
                className="text-red-600 hover:bg-red-50 hover:text-red-700"
              >
                <XCircle className="mr-1 size-4" />
                Cancelar
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
