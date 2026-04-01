"use client"

import { isPast } from "date-fns"

import { Badge } from "@/components/ui/badge"
import { formatCurrency, formatDate } from "@/lib/utils"
import { CREDIT_NOTE_STATUSES } from "@/lib/constants"

import type { CreditNoteWithDetails } from "../types"

const STATUS_COLORS: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  redeemed: "bg-blue-50 text-blue-700 border-blue-200",
  expired: "bg-amber-50 text-amber-700 border-amber-200",
  cancelled: "bg-neutral-100 text-neutral-500 border-neutral-200",
}

interface CreditNotesCardMobileProps {
  note: CreditNoteWithDetails
}

export function CreditNotesCardMobile({ note }: CreditNotesCardMobileProps) {
  const status = note.status as string
  const isExpired =
    status === "active" &&
    note.expires_at &&
    isPast(new Date(note.expires_at))

  const statusLabel = isExpired
    ? "Expirada"
    : (CREDIT_NOTE_STATUSES[status as keyof typeof CREDIT_NOTE_STATUSES] ??
        status)

  const statusColor = isExpired
    ? "bg-amber-50 text-amber-700 border-amber-200"
    : (STATUS_COLORS[status] ?? "")

  return (
    <div className="rounded-xl border border-neutral-100 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-neutral-950 tabular-nums">
              {note.credit_number}
            </span>
            <Badge
              variant="outline"
              className={`text-[10px] ${statusColor}`}
            >
              {statusLabel}
            </Badge>
          </div>
          <p className="text-xs text-neutral-500 mt-0.5">
            {note.customers?.name}
          </p>
          {note.returns && (
            <p className="text-xs text-neutral-400">
              {note.returns.return_number}
            </p>
          )}
        </div>
        <div className="text-right shrink-0">
          <p className="font-semibold text-neutral-950 tabular-nums">
            {formatCurrency(Number(note.remaining_amount))}
          </p>
          {Number(note.remaining_amount) !== Number(note.original_amount) && (
            <p className="text-xs text-neutral-400 tabular-nums line-through">
              {formatCurrency(Number(note.original_amount))}
            </p>
          )}
        </div>
      </div>

      <div className="mt-2 text-xs text-neutral-500 tabular-nums">
        {formatDate(note.created_at)}
      </div>
    </div>
  )
}
