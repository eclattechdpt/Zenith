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
  ChevronDown,
} from "lucide-react"
import { AnimatePresence, motion } from "motion/react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Skeleton as BoneyardSkeleton } from "boneyard-js/react"
import { useExportLogs } from "../queries"
import { ExportLogFixture } from "./fixtures/export-log-fixture"

const FORMAT_ICON = {
  excel: FileSpreadsheet,
  pdf: FileText,
} as const

const FORMAT_BADGE = {
  excel: "bg-emerald-50 text-emerald-700 border-emerald-200",
  pdf: "bg-rose-50 text-rose-700 border-rose-200",
} as const

const VISIBLE_COUNT = 10

export function ExportLog() {
  const [selectedMonth, setSelectedMonth] = useState(() => startOfMonth(new Date()))
  const [expanded, setExpanded] = useState(false)

  const from = startOfMonth(selectedMonth).toISOString()
  const to = endOfMonth(selectedMonth).toISOString()
  const { data: logs, isLoading } = useExportLogs({ from, to })

  const isCurrentMonth =
    format(selectedMonth, "yyyy-MM") === format(new Date(), "yyyy-MM")

  const monthLabel = format(selectedMonth, "MMMM yyyy", { locale: es })

  const totalCount = logs?.length ?? 0
  const hasMore = totalCount > VISIBLE_COUNT
  const visibleLogs = expanded ? logs : logs?.slice(0, VISIBLE_COUNT)
  const hiddenCount = totalCount - VISIBLE_COUNT

  return (
    <div className="space-y-4">
      {/* Month navigator */}
      <div className="flex items-center justify-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          onClick={() => {
            setSelectedMonth((m) => subMonths(m, 1))
            setExpanded(false)
          }}
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
          onClick={() => {
            setSelectedMonth((m) => {
              const next = addMonths(m, 1)
              return isAfter(next, new Date()) ? startOfMonth(new Date()) : next
            })
            setExpanded(false)
          }}
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>

      {/* Content */}
      <BoneyardSkeleton
        name="export-log"
        loading={isLoading}
        animate="shimmer"
        fixture={<ExportLogFixture />}
      >
        {!logs?.length ? (
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
              {totalCount} exportacion{totalCount !== 1 ? "es" : ""}
            </p>

            {/* Visible logs */}
            {visibleLogs?.map((log) => {
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

            {/* Show more / show less toggle */}
            {hasMore && (
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                className={cn(
                  "flex w-full items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-semibold transition-colors",
                  "text-neutral-500 hover:bg-neutral-50 hover:text-neutral-700"
                )}
              >
                <ChevronDown
                  className={cn(
                    "size-3.5 transition-transform duration-200",
                    expanded && "rotate-180"
                  )}
                />
                {expanded
                  ? "Mostrar menos"
                  : `Ver ${hiddenCount} exportacion${hiddenCount !== 1 ? "es" : ""} mas`}
              </button>
            )}
          </div>
        )}
      </BoneyardSkeleton>
    </div>
  )
}
