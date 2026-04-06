"use client"

import { useState } from "react"
import {
  startOfMonth,
  endOfMonth,
  subMonths,
  addMonths,
  format,
  formatDistanceToNow,
  isAfter,
} from "date-fns"
import { es } from "date-fns/locale"
import {
  FileSpreadsheet,
  FileText,
  Clock,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useExportLogs } from "../queries"

const FORMAT_ICON = {
  excel: FileSpreadsheet,
  pdf: FileText,
} as const

const FORMAT_BADGE = {
  excel: "bg-emerald-50 text-emerald-700 border-emerald-200",
  pdf: "bg-rose-50 text-rose-700 border-rose-200",
} as const

export function ExportLog() {
  const [selectedMonth, setSelectedMonth] = useState(() => startOfMonth(new Date()))

  const from = startOfMonth(selectedMonth).toISOString()
  const to = endOfMonth(selectedMonth).toISOString()
  const { data: logs, isLoading } = useExportLogs({ from, to })

  const isCurrentMonth =
    format(selectedMonth, "yyyy-MM") === format(new Date(), "yyyy-MM")

  const monthLabel = format(selectedMonth, "MMMM yyyy", { locale: es })

  return (
    <div className="space-y-4">
      {/* Month navigator */}
      <div className="flex items-center justify-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          onClick={() => setSelectedMonth((m) => subMonths(m, 1))}
        >
          <ChevronLeft className="size-4" />
        </Button>
        <span className="min-w-36 text-center text-sm font-bold capitalize text-neutral-950">
          {monthLabel}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          disabled={isCurrentMonth}
          onClick={() => setSelectedMonth((m) => {
            const next = addMonths(m, 1)
            return isAfter(next, new Date()) ? startOfMonth(new Date()) : next
          })}
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-14 animate-pulse rounded-xl bg-neutral-100"
            />
          ))}
        </div>
      ) : !logs?.length ? (
        <div className="flex flex-col items-center gap-2 py-10 text-center">
          <Clock className="size-8 text-neutral-300" strokeWidth={1.5} />
          <p className="text-sm text-neutral-500">
            Sin exportaciones en {monthLabel}
          </p>
          <p className="text-[11px] text-neutral-400">
            El historial aparecera cuando descargues un reporte
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-[11px] font-medium text-neutral-400">
            {logs.length} exportacion{logs.length !== 1 ? "es" : ""}
          </p>
          {logs.map((log) => {
            const fmt = log.format as "excel" | "pdf"
            const Icon = FORMAT_ICON[fmt] ?? FileText
            const badgeClass = FORMAT_BADGE[fmt] ?? FORMAT_BADGE.pdf

            return (
              <div
                key={log.id}
                className="flex items-center gap-3 rounded-xl border border-neutral-100 bg-white px-4 py-3"
              >
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-neutral-50">
                  <Icon className="size-4 text-neutral-500" strokeWidth={1.5} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-neutral-900">
                    {log.report_name}
                  </p>
                  <p className="text-[11px] text-neutral-400">
                    {formatDistanceToNow(new Date(log.created_at), {
                      addSuffix: true,
                      locale: es,
                    })}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className={`shrink-0 text-[10px] ${badgeClass}`}
                >
                  {fmt === "excel" ? "Excel" : "PDF"}
                </Badge>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
