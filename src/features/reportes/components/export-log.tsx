"use client"

import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import { FileSpreadsheet, FileText, Clock } from "lucide-react"

import { Badge } from "@/components/ui/badge"
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
  const { data: logs, isLoading } = useExportLogs(15)

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="h-14 animate-pulse rounded-xl bg-neutral-100"
          />
        ))}
      </div>
    )
  }

  if (!logs?.length) {
    return (
      <div className="flex flex-col items-center gap-2 py-10 text-center">
        <Clock className="size-8 text-neutral-300" strokeWidth={1.5} />
        <p className="text-sm text-neutral-500">
          Aun no se han generado exportaciones
        </p>
        <p className="text-[11px] text-neutral-400">
          El historial aparecera aqui cuando descargues un reporte
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {logs.map((log) => {
        const format = log.format as "excel" | "pdf"
        const Icon = FORMAT_ICON[format] ?? FileText
        const badgeClass = FORMAT_BADGE[format] ?? FORMAT_BADGE.pdf

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
              {format === "excel" ? "Excel" : "PDF"}
            </Badge>
          </div>
        )
      })}
    </div>
  )
}
