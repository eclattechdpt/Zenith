"use client"

import { CheckCircle2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatCurrency, formatDate } from "@/lib/utils"
import { VALE_STATUSES, VALE_PAYMENT_STATUSES } from "@/lib/constants"

import type { ValeWithDetails } from "../types"

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  ready: "bg-emerald-50 text-emerald-700 border-emerald-200",
  completed: "bg-blue-50 text-blue-700 border-blue-200",
  cancelled: "bg-neutral-100 text-neutral-500 border-neutral-200",
}

interface Props {
  vale: ValeWithDetails
  onComplete: () => void
}

export function ValesCardMobile({ vale, onComplete }: Props) {
  const canComplete = vale.status === "pending" || vale.status === "ready"

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <span className="font-semibold tabular-nums">{vale.vale_number}</span>
          <p className="mt-0.5 text-sm text-neutral-500">
            {vale.customers?.name ?? "—"}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <Badge
            variant="outline"
            className={`text-[10px] ${STATUS_COLORS[vale.status] ?? ""}`}
          >
            {VALE_STATUSES[vale.status as keyof typeof VALE_STATUSES] ?? vale.status}
          </Badge>
          <Badge
            variant="outline"
            className={`text-[10px] ${vale.payment_status === "paid" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}
          >
            {VALE_PAYMENT_STATUSES[vale.payment_status as keyof typeof VALE_PAYMENT_STATUSES] ?? vale.payment_status}
          </Badge>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-neutral-100 pt-3">
        <span className="text-sm text-neutral-500 tabular-nums">
          {formatDate(vale.created_at)}
        </span>
        <div className="flex items-center gap-3">
          <span className="font-semibold tabular-nums">
            {formatCurrency(Number(vale.total))}
          </span>
          {canComplete && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onComplete}
              className="text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
            >
              <CheckCircle2 className="mr-1 size-4" />
              Entregar
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
