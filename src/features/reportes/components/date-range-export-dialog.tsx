"use client"

import { useState, useMemo, useEffect } from "react"
import {
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  Download,
  FileSpreadsheet,
  FileText,
  Loader2,
  Check,
} from "lucide-react"
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  subMonths,
  addMonths,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
  isToday,
  isBefore,
  isAfter,
  format,
} from "date-fns"
import { es } from "date-fns/locale"
import { AnimatePresence, motion } from "motion/react"
import { sileo } from "sileo"
import { useQueryClient } from "@tanstack/react-query"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { logExport } from "../actions"

/* ── Types ── */

type DateRange = { from: Date | undefined; to?: Date | undefined }
type ExportState = "idle" | "loading" | "success"
type Preset = "this-week" | "this-month" | "last-month" | "last-3" | "custom"

interface DateRangeExportDialogProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  title: string
  onExportPdf: (from: Date, to: Date) => Promise<void>
  onExportExcel: (from: Date, to: Date) => Promise<void>
}

/* ── Presets ── */

function getPresetRange(preset: Preset): DateRange {
  const now = new Date()
  switch (preset) {
    case "this-week":
      return {
        from: startOfWeek(now, { weekStartsOn: 1 }),
        to: endOfWeek(now, { weekStartsOn: 1 }),
      }
    case "this-month":
      return { from: startOfMonth(now), to: endOfMonth(now) }
    case "last-month": {
      const prev = subMonths(now, 1)
      return { from: startOfMonth(prev), to: endOfMonth(prev) }
    }
    case "last-3": {
      const m3 = subMonths(now, 2)
      return { from: startOfMonth(m3), to: endOfMonth(now) }
    }
    default:
      return { from: undefined, to: undefined }
  }
}

const PRESETS: { key: Preset; label: string }[] = [
  { key: "this-week", label: "Esta semana" },
  { key: "this-month", label: "Este mes" },
  { key: "last-month", label: "Mes anterior" },
  { key: "last-3", label: "3 meses" },
]

/* ── Custom Range Calendar ── */

const WEEKDAYS = ["lu", "ma", "mi", "ju", "vi", "sá", "do"]

function RangeCalendar({
  range,
  onSelect,
}: {
  range: DateRange
  onSelect: (range: DateRange) => void
}) {
  const [viewDate, setViewDate] = useState(() =>
    startOfMonth(range.from ?? new Date())
  )
  const [hovered, setHovered] = useState<Date | null>(null)

  const today = useMemo(() => new Date(), [])

  // Auto-navigate when range changes externally (presets)
  useEffect(() => {
    if (range.from) {
      setViewDate(startOfMonth(range.from))
    }
  }, [range.from?.getTime()]) // eslint-disable-line react-hooks/exhaustive-deps

  // Effective range including hover preview
  const effectiveRange = useMemo(() => {
    if (range.from && !range.to && hovered) {
      if (isBefore(hovered, range.from)) {
        return { from: hovered, to: range.from }
      }
      return { from: range.from, to: hovered }
    }
    return range
  }, [range, hovered])

  // Generate calendar grid
  const weeks = useMemo(() => {
    const monthStart = startOfMonth(viewDate)
    const monthEnd = endOfMonth(viewDate)
    const calStart = startOfWeek(monthStart, { weekStartsOn: 1 })
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
    const days = eachDayOfInterval({ start: calStart, end: calEnd })

    const result: Date[][] = []
    for (let i = 0; i < days.length; i += 7) {
      result.push(days.slice(i, i + 7))
    }
    return result
  }, [viewDate])

  function handleDayClick(day: Date) {
    if (!range.from || (range.from && range.to)) {
      onSelect({ from: day, to: undefined })
    } else {
      if (isSameDay(day, range.from)) {
        onSelect({ from: day, to: day })
      } else if (isBefore(day, range.from)) {
        onSelect({ from: day, to: range.from })
      } else {
        onSelect({ from: range.from, to: day })
      }
    }
  }

  const canGoNext = !isAfter(addMonths(viewDate, 1), startOfMonth(today))

  return (
    <div className="rounded-xl border border-neutral-100 bg-white px-3 py-3">
      {/* Month navigation */}
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setViewDate((v) => subMonths(v, 1))}
          className="flex size-7 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-indigo-50 hover:text-indigo-600"
        >
          <ChevronLeft className="size-4" />
        </button>
        <span className="text-sm font-semibold capitalize text-neutral-800">
          {format(viewDate, "MMMM yyyy", { locale: es })}
        </span>
        <button
          type="button"
          onClick={() => setViewDate((v) => addMonths(v, 1))}
          disabled={!canGoNext}
          className="flex size-7 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-indigo-50 hover:text-indigo-600 disabled:pointer-events-none disabled:opacity-30"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>

      {/* Weekday headers */}
      <div className="mb-1 grid grid-cols-7">
        {WEEKDAYS.map((d) => (
          <div
            key={d}
            className="py-1 text-center text-[11px] font-medium text-neutral-400"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7">
        {weeks.flat().map((day, i) => {
          const outside = !isSameMonth(day, viewDate)
          const future = isAfter(day, today)
          const disabled = future || outside
          const todayDay = isToday(day) && !outside

          const start =
            effectiveRange.from ? isSameDay(day, effectiveRange.from) : false
          const end =
            effectiveRange.to ? isSameDay(day, effectiveRange.to) : false
          const singleDay = start && end

          const inRange =
            !disabled &&
            effectiveRange.from &&
            effectiveRange.to &&
            (isAfter(day, effectiveRange.from) ||
              isSameDay(day, effectiveRange.from)) &&
            (isBefore(day, effectiveRange.to) ||
              isSameDay(day, effectiveRange.to))

          const middle = inRange && !start && !end
          const isSelecting = !!range.from && !range.to
          const isHoverPreview = isSelecting && hovered && inRange && !start

          return (
            <div
              key={i}
              className={cn(
                "relative flex h-9 items-center justify-center",
                // Range band on the cell background
                middle && "bg-indigo-50/70",
                start &&
                  !singleDay &&
                  inRange &&
                  "bg-gradient-to-r from-transparent from-50% to-indigo-50/70 to-50%",
                end &&
                  !singleDay &&
                  inRange &&
                  "bg-gradient-to-r from-indigo-50/70 from-50% to-transparent to-50%",
                // Hover preview band (lighter)
                isHoverPreview && "bg-indigo-50/40",
              )}
            >
              <button
                type="button"
                disabled={disabled}
                onClick={() => handleDayClick(day)}
                onMouseEnter={() =>
                  isSelecting && !disabled && setHovered(day)
                }
                onMouseLeave={() => setHovered(null)}
                className={cn(
                  "relative z-10 flex size-8 items-center justify-center rounded-full text-[13px] tabular-nums transition-all duration-150",
                  // Default day
                  !disabled &&
                    !inRange &&
                    "text-neutral-700 hover:bg-indigo-50 hover:text-indigo-700",
                  // Disabled / outside
                  disabled && "pointer-events-none text-neutral-200",
                  // Range start
                  start &&
                    !disabled &&
                    "bg-indigo-500 font-semibold text-white shadow-[0_1px_6px_rgba(99,102,241,0.4)]",
                  // Range end (distinct from start when not single day)
                  end &&
                    !singleDay &&
                    !disabled &&
                    "bg-indigo-500 font-semibold text-white shadow-[0_1px_6px_rgba(99,102,241,0.4)]",
                  // Range middle
                  middle && "font-medium text-indigo-700",
                  // Today indicator
                  todayDay &&
                    !start &&
                    !end &&
                    !disabled &&
                    "font-bold text-indigo-600",
                )}
              >
                {format(day, "d")}
                {/* Today dot */}
                {todayDay && !start && !end && !disabled && (
                  <span className="absolute bottom-0.5 left-1/2 size-1 -translate-x-1/2 rounded-full bg-indigo-400" />
                )}
              </button>
            </div>
          )
        })}
      </div>

      {/* Selection hint */}
      {range.from && !range.to && (
        <p className="mt-2 text-center text-[10px] font-medium text-indigo-400">
          Selecciona la fecha final
        </p>
      )}
    </div>
  )
}

/* ── Dialog ── */

export function DateRangeExportDialog({
  open,
  onOpenChange,
  title,
  onExportPdf,
  onExportExcel,
}: DateRangeExportDialogProps) {
  const [preset, setPreset] = useState<Preset>("this-month")
  const [range, setRange] = useState<DateRange>(getPresetRange("this-month"))
  const [pdfState, setPdfState] = useState<ExportState>("idle")
  const [excelState, setExcelState] = useState<ExportState>("idle")
  const queryClient = useQueryClient()

  const hasValidRange = range.from && range.to
  const rangeLabel =
    range.from && range.to
      ? `${format(range.from, "d MMM", { locale: es })} — ${format(range.to, "d MMM yyyy", { locale: es })}`
      : "Selecciona un rango"

  function handlePreset(p: Preset) {
    setPreset(p)
    setRange(getPresetRange(p))
  }

  function handleCalendarSelect(selected: DateRange) {
    setRange(selected)
    setPreset("custom")
  }

  async function handleExport(
    type: "pdf" | "excel",
    setState: (s: ExportState) => void,
    exportFn: (from: Date, to: Date) => Promise<void>
  ) {
    if (!range.from || !range.to) return
    setState("loading")
    try {
      await exportFn(range.from, range.to)
      try {
        await logExport(title, type)
        queryClient.invalidateQueries({ queryKey: ["export-logs"] })
      } catch {
        sileo.warning({ title: "Exportacion exitosa", description: "El registro de exportacion no se pudo guardar" })
      }
      setState("success")
      sileo.success({ title: `${title} exportado correctamente`, description: "El archivo se descargo automaticamente" })
      setTimeout(() => setState("idle"), 1500)
    } catch {
      setState("idle")
      sileo.error({ title: `Error al exportar ${title.toLowerCase()}` })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        {/* Header */}
        <div className="mb-1 flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-indigo-100">
            <CalendarRange
              className="size-5 text-indigo-500"
              strokeWidth={1.75}
            />
          </div>
          <div>
            <DialogTitle className="text-base font-bold text-neutral-900">
              {title}
            </DialogTitle>
            <DialogDescription className="text-xs text-neutral-500">
              Selecciona el rango de fechas
            </DialogDescription>
          </div>
        </div>

        {/* Preset buttons */}
        <div className="flex items-center gap-1.5 rounded-xl border border-indigo-100 bg-indigo-50/60 p-1">
          {PRESETS.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => handlePreset(p.key)}
              className={cn(
                "flex-1 rounded-lg px-2 py-2 text-[11px] font-semibold transition-all",
                preset === p.key
                  ? "bg-indigo-500 text-white shadow-sm"
                  : "text-neutral-500 hover:bg-indigo-50 hover:text-indigo-700"
              )}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Custom range calendar */}
        <RangeCalendar range={range} onSelect={handleCalendarSelect} />

        {/* Range display */}
        <AnimatePresence mode="wait">
          {hasValidRange && (
            <motion.div
              key="range-label"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
            >
              <div className="rounded-xl border border-neutral-100 bg-neutral-50 px-4 py-3 text-center">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
                  Periodo seleccionado
                </p>
                <p className="mt-0.5 text-sm font-bold capitalize text-neutral-800">
                  {rangeLabel}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Export buttons */}
        <div className="flex gap-2">
          <ExportButton
            label="PDF"
            icon={FileText}
            state={pdfState}
            disabled={!hasValidRange || excelState === "loading"}
            className="bg-rose-500 hover:bg-rose-600"
            onClick={() => handleExport("pdf", setPdfState, onExportPdf)}
          />
          <ExportButton
            label="Excel"
            icon={FileSpreadsheet}
            state={excelState}
            disabled={!hasValidRange || pdfState === "loading"}
            className="bg-emerald-500 hover:bg-emerald-600"
            onClick={() => handleExport("excel", setExcelState, onExportExcel)}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}

/* ── Export Button ── */

function ExportButton({
  label,
  icon: Icon,
  state,
  disabled,
  className,
  onClick,
}: {
  label: string
  icon: typeof FileText
  state: ExportState
  disabled: boolean
  className: string
  onClick: () => void
}) {
  return (
    <Button
      onClick={onClick}
      disabled={disabled || state === "loading"}
      className={cn(
        "flex-1 border-0 text-white transition-all",
        state === "success"
          ? "bg-emerald-500 hover:bg-emerald-500"
          : className
      )}
    >
      <AnimatePresence mode="wait" initial={false}>
        {state === "loading" ? (
          <motion.span
            key="loading"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.12 }}
          >
            <Loader2 className="mr-1.5 size-4 animate-spin" />
          </motion.span>
        ) : state === "success" ? (
          <motion.span
            key="success"
            initial={{ opacity: 0, scale: 0, rotate: -90 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
          >
            <Check className="mr-1.5 size-4" strokeWidth={2.5} />
          </motion.span>
        ) : (
          <motion.span
            key="idle"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.12 }}
          >
            <Download className="mr-1.5 size-4" />
          </motion.span>
        )}
      </AnimatePresence>
      {state === "loading"
        ? "Exportando..."
        : state === "success"
          ? "Listo"
          : `${label}`}
    </Button>
  )
}
