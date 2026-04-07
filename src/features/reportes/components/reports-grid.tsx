"use client"

import { useState } from "react"
import {
  Receipt,
  Package,
  Users,
  ShoppingBag,
  TrendingUp,
  Warehouse,
  Truck,
  Archive,
  CalendarDays,
  Download,
  Loader2,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { startOfWeek, endOfWeek, subWeeks, subMonths, startOfMonth, format, eachDayOfInterval, isToday, isBefore, startOfDay, isSameWeek, isSameMonth } from "date-fns"
import { es } from "date-fns/locale"
import { AnimatePresence, motion } from "motion/react"
import { sileo } from "sileo"
import { useQueryClient } from "@tanstack/react-query"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { logExport } from "../actions"

import { ReportCard, type ReportCardColor } from "./report-card"
import { DateRangeExportDialog } from "./date-range-export-dialog"
import {
  exportSalesExcel,
  exportSalesRangeExcel,
  exportInventoryExcel,
  exportCustomersExcel,
  exportProductsExcel,
  exportTransitExcel,
  exportTransitRangeExcel,
  exportInitialLoadExcel,
} from "./excel-generators"

/* ── Color palettes — one per topic ── */

const COLORS = {
  rose: {
    iconBg: "bg-rose-100",
    iconColor: "text-rose-500",
    accentBorder: "border-l-rose-400",
  },
  teal: {
    iconBg: "bg-teal-100",
    iconColor: "text-teal-500",
    accentBorder: "border-l-teal-400",
  },
  amber: {
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
    accentBorder: "border-l-amber-400",
  },
  violet: {
    iconBg: "bg-violet-100",
    iconColor: "text-violet-500",
    accentBorder: "border-l-violet-400",
  },
  pink: {
    iconBg: "bg-pink-100",
    iconColor: "text-pink-500",
    accentBorder: "border-l-pink-400",
  },
  emerald: {
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-500",
    accentBorder: "border-l-emerald-400",
  },
} satisfies Record<string, ReportCardColor>

/* ── PDF handlers (dynamic import for code-splitting) ── */

async function handleInventoryPdf() {
  const { exportInventoryPdf } = await import("./pdf-generators")
  await exportInventoryPdf()
}

async function handleTransitPdf() {
  const { exportTransitPdf } = await import("./pdf-generators")
  await exportTransitPdf()
}

async function handleInitialLoadPdf() {
  const { exportInitialLoadPdf } = await import("./pdf-generators")
  await exportInitialLoadPdf()
}

async function handleCustomersPdf() {
  const { exportCustomersPdf } = await import("./pdf-generators")
  await exportCustomersPdf()
}

async function handleProductsPdf() {
  const { exportProductsPdf } = await import("./pdf-generators")
  await exportProductsPdf()
}

/* ── Monthly Sales PDF Dialog ── */

const MONTH_LABELS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]

type MonthPreset = "current" | "previous" | "custom"

function MonthlySalesDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  const [preset, setPreset] = useState<MonthPreset>("current")
  const [customMonth, setCustomMonth] = useState<number | undefined>(undefined)
  const [customYear, setCustomYear] = useState<number | undefined>(undefined)
  const [gridOpen, setGridOpen] = useState(false)
  const [gridYear, setGridYear] = useState(() => new Date().getFullYear())
  const [isExporting, setIsExporting] = useState(false)
  const queryClient = useQueryClient()

  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonthIdx = now.getMonth()

  const selectedDate =
    preset === "current" ? now
    : preset === "previous" ? subMonths(now, 1)
    : customMonth !== undefined && customYear !== undefined
      ? new Date(customYear, customMonth, 1)
      : now

  const monthStart = startOfMonth(selectedDate)
  const monthLabel = format(monthStart, "MMMM yyyy", { locale: es })
  const isCurrentMonth = isSameMonth(selectedDate, now)

  function handlePreset(p: MonthPreset) {
    setPreset(p)
    if (p !== "custom") {
      setGridOpen(false)
    }
  }

  function handleMonthSelect(monthIdx: number) {
    setCustomMonth(monthIdx)
    setCustomYear(gridYear)
    setPreset("custom")
    setTimeout(() => setGridOpen(false), 150)
  }

  async function handleExport() {
    if (isExporting) return
    setIsExporting(true)
    try {
      const { exportSalesPdf } = await import("./pdf-generators")
      await exportSalesPdf(selectedDate)
      try {
        await logExport("Reporte de ventas", "pdf")
        queryClient.invalidateQueries({ queryKey: ["export-logs"] })
      } catch {
        sileo.warning({ title: "Exportacion exitosa", description: "El registro de exportacion no se pudo guardar" })
      }
      sileo.success({ title: "Reporte de ventas exportado correctamente", description: "El archivo se descargo automaticamente" })
      onOpenChange(false)
    } catch {
      sileo.error({ title: "Error al exportar reporte de ventas" })
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <div className="flex items-center gap-3 mb-1">
          <div className="flex size-10 items-center justify-center rounded-xl bg-rose-100">
            <TrendingUp className="size-5 text-rose-500" strokeWidth={1.75} />
          </div>
          <div>
            <DialogTitle className="text-base font-bold text-neutral-900">
              Reporte de ventas
            </DialogTitle>
            <DialogDescription className="text-xs text-neutral-500">
              Selecciona el mes a exportar
            </DialogDescription>
          </div>
        </div>

        {/* Segmented presets */}
        <div className="flex items-center gap-1.5 rounded-xl bg-rose-50/60 border border-rose-100 p-1">
          <button
            type="button"
            onClick={() => handlePreset("current")}
            className={cn(
              "flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition-all",
              preset === "current"
                ? "bg-rose-500 text-white shadow-sm"
                : "text-neutral-500 hover:bg-rose-50 hover:text-rose-700"
            )}
          >
            Este mes
          </button>
          <button
            type="button"
            onClick={() => handlePreset("previous")}
            className={cn(
              "flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition-all",
              preset === "previous"
                ? "bg-rose-500 text-white shadow-sm"
                : "text-neutral-500 hover:bg-rose-50 hover:text-rose-700"
            )}
          >
            Anterior
          </button>
          <button
            type="button"
            onClick={() => {
              if (preset === "custom" && gridOpen) {
                setGridOpen(false)
              } else {
                setPreset("custom")
                setGridOpen(true)
              }
            }}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all",
              preset === "custom"
                ? "bg-rose-500 text-white shadow-sm"
                : "text-neutral-500 hover:bg-rose-50 hover:text-rose-700"
            )}
          >
            <CalendarIcon className="size-3.5" />
            Elegir mes
          </button>
        </div>

        {/* Month grid — slides in/out */}
        <AnimatePresence initial={false}>
          {gridOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
            >
              <div className="rounded-xl border border-rose-100 bg-rose-50/30 px-4 py-4">
                {/* Year navigator */}
                <div className="flex items-center justify-between mb-4">
                  <button
                    type="button"
                    onClick={() => setGridYear((y) => y - 1)}
                    className="flex size-8 items-center justify-center rounded-lg text-neutral-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                  >
                    <ChevronLeft className="size-4" />
                  </button>
                  <span className="text-sm font-bold text-neutral-800">{gridYear}</span>
                  <button
                    type="button"
                    onClick={() => setGridYear((y) => y + 1)}
                    disabled={gridYear >= currentYear}
                    className="flex size-8 items-center justify-center rounded-lg text-neutral-400 hover:bg-rose-50 hover:text-rose-600 transition-colors disabled:opacity-30 disabled:pointer-events-none"
                  >
                    <ChevronRight className="size-4" />
                  </button>
                </div>

                {/* 4x3 month grid */}
                <div className="grid grid-cols-4 gap-2">
                  {MONTH_LABELS.map((label, i) => {
                    const isFuture = gridYear > currentYear || (gridYear === currentYear && i > currentMonthIdx)
                    const isSelected = preset === "custom" && customMonth === i && customYear === gridYear
                    const isNow = gridYear === currentYear && i === currentMonthIdx

                    return (
                      <button
                        key={i}
                        type="button"
                        disabled={isFuture}
                        onClick={() => handleMonthSelect(i)}
                        className={cn(
                          "rounded-lg py-2.5 text-xs font-semibold transition-all",
                          isSelected
                            ? "bg-rose-500 text-white shadow-sm"
                            : isNow
                              ? "bg-rose-100 text-rose-700 ring-1 ring-rose-300"
                              : "text-neutral-600 hover:bg-rose-50 hover:text-rose-700",
                          isFuture && "opacity-30 pointer-events-none"
                        )}
                      >
                        {label}
                      </button>
                    )
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Month display — hidden when grid is open */}
        <AnimatePresence initial={false}>
          {!gridOpen && (
            <motion.div
              key="month-display"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
            >
              <div className="rounded-xl bg-neutral-50 border border-neutral-100 px-4 py-4 text-center">
                <p className="text-[10px] uppercase tracking-wider text-neutral-400 font-semibold mb-1">
                  Periodo seleccionado
                </p>
                <p className="text-lg font-bold text-neutral-800 capitalize">
                  {monthLabel}
                </p>
                {isCurrentMonth && (
                  <p className="text-[10px] text-rose-500 font-medium mt-1">
                    Mes en curso
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Export button */}
        <Button
          onClick={handleExport}
          disabled={isExporting}
          className="w-full bg-rose-500 text-white hover:bg-rose-600 border-0"
        >
          {isExporting ? (
            <Loader2 className="mr-1.5 size-4 animate-spin" />
          ) : (
            <Download className="mr-1.5 size-4" />
          )}
          {isExporting ? "Generando PDF..." : "Exportar PDF"}
        </Button>
      </DialogContent>
    </Dialog>
  )
}

/* ── Weekly Sales PDF Dialog ── */

type WeekPreset = "current" | "previous" | "custom"

function WeeklySalesDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  const [preset, setPreset] = useState<WeekPreset>("current")
  const [customDate, setCustomDate] = useState<Date | undefined>(undefined)
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const queryClient = useQueryClient()

  const now = new Date()
  const selectedDate =
    preset === "current" ? now
    : preset === "previous" ? subWeeks(now, 1)
    : customDate ?? now

  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 })
  const rangeLabel = `${format(weekStart, "d MMM", { locale: es })} — ${format(weekEnd, "d MMM yyyy", { locale: es })}`

  function handlePreset(p: WeekPreset) {
    setPreset(p)
    if (p !== "custom") {
      setCustomDate(undefined)
      setCalendarOpen(false)
    }
  }

  function handleCalendarSelect(day: Date | undefined) {
    if (!day) return
    setCustomDate(day)
    setPreset("custom")
    setTimeout(() => setCalendarOpen(false), 200)
  }

  async function handleExport() {
    if (isExporting) return
    setIsExporting(true)
    try {
      const { exportWeeklySalesPdf } = await import("./pdf-generators")
      await exportWeeklySalesPdf(selectedDate)
      try {
        await logExport("Reporte semanal", "pdf")
        queryClient.invalidateQueries({ queryKey: ["export-logs"] })
      } catch {
        sileo.warning({ title: "Exportacion exitosa", description: "El registro de exportacion no se pudo guardar" })
      }
      sileo.success({ title: "Reporte semanal exportado correctamente", description: "El archivo se descargo automaticamente" })
      onOpenChange(false)
    } catch {
      sileo.error({ title: "Error al exportar reporte semanal" })
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <div className="flex items-center gap-3 mb-1">
          <div className="flex size-10 items-center justify-center rounded-xl bg-amber-100">
            <CalendarDays className="size-5 text-amber-600" strokeWidth={1.75} />
          </div>
          <div>
            <DialogTitle className="text-base font-bold text-neutral-900">
              Reporte semanal
            </DialogTitle>
            <DialogDescription className="text-xs text-neutral-500">
              Selecciona el periodo a exportar
            </DialogDescription>
          </div>
        </div>

        {/* Segmented presets */}
        <div className="flex items-center gap-1.5 rounded-xl bg-amber-50/60 border border-amber-100 p-1">
          <button
            type="button"
            onClick={() => handlePreset("current")}
            className={cn(
              "flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition-all",
              preset === "current"
                ? "bg-amber-500 text-white shadow-sm"
                : "text-neutral-500 hover:bg-amber-50 hover:text-amber-700"
            )}
          >
            Esta semana
          </button>
          <button
            type="button"
            onClick={() => handlePreset("previous")}
            className={cn(
              "flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition-all",
              preset === "previous"
                ? "bg-amber-500 text-white shadow-sm"
                : "text-neutral-500 hover:bg-amber-50 hover:text-amber-700"
            )}
          >
            Anterior
          </button>
          <button
            type="button"
            onClick={() => {
              if (preset === "custom" && calendarOpen) {
                setCalendarOpen(false)
              } else {
                setPreset("custom")
                setCalendarOpen(true)
              }
            }}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all",
              preset === "custom"
                ? "bg-amber-500 text-white shadow-sm"
                : "text-neutral-500 hover:bg-amber-50 hover:text-amber-700"
            )}
          >
            <CalendarIcon className="size-3.5" />
            Elegir fecha
          </button>
        </div>

        {/* Inline calendar — slides in/out */}
        <AnimatePresence initial={false}>
          {calendarOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
            >
              <div className="rounded-xl border border-amber-100 bg-amber-50/30 p-1 [&_.rdp-root]:w-full [&_.rdp-month]:w-full [&_.rdp-month_table]:w-full [&_[data-selected-single=true]]:!bg-amber-500 [&_[data-selected-single=true]]:!text-white [&_[data-today=true]]:bg-amber-100 [&_[data-today=true]]:text-amber-900">
                <Calendar
                  mode="single"
                  selected={customDate}
                  onSelect={handleCalendarSelect}
                  disabled={{ after: new Date() }}
                  locale={es}
                  className="w-full"
                  modifiers={{
                    selectedWeek: (day) =>
                      customDate
                        ? isSameWeek(day, customDate, { weekStartsOn: 1 })
                        : false,
                  }}
                  modifiersClassNames={{
                    selectedWeek: "bg-amber-100 text-amber-900 rounded-none first:rounded-l-md last:rounded-r-md",
                  }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Timeline bar — hidden when calendar is open */}
        <AnimatePresence initial={false}>
        {!calendarOpen && (() => {
          const days = eachDayOfInterval({ start: weekStart, end: weekEnd })
          const today = startOfDay(new Date())
          const DAY_LABELS = ["Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom"]
          const isPastWeek = isBefore(weekEnd, today)

          return (
            <motion.div
              key="timeline"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
            >
            <div className="rounded-xl bg-neutral-50 border border-neutral-100 px-4 py-4">
              <p className="text-center text-[11px] font-semibold text-neutral-500 mb-3 capitalize">
                {rangeLabel}
              </p>

              <div className="flex items-center justify-between mb-2 px-1">
                {days.map((day, i) => (
                  <span
                    key={i}
                    className={cn(
                      "text-[10px] font-semibold w-8 text-center",
                      isToday(day) ? "text-amber-600" : "text-neutral-400"
                    )}
                  >
                    {DAY_LABELS[i]}
                  </span>
                ))}
              </div>

              <div className="relative flex items-center justify-between px-1">
                <div className="absolute left-5 right-5 top-1/2 -translate-y-1/2 h-1 rounded-full bg-neutral-200" />
                <div
                  className="absolute left-5 top-1/2 -translate-y-1/2 h-1 rounded-full bg-amber-400 transition-all duration-300"
                  style={{
                    width: isPastWeek
                      ? "calc(100% - 40px)"
                      : `calc(${
                          (days.filter((d) => isBefore(d, today) || isToday(d)).length / 7) * 100
                        }% - ${40 - (days.filter((d) => isBefore(d, today) || isToday(d)).length / 7) * 40}px)`,
                  }}
                />

                {days.map((day, i) => {
                  const isPast = isBefore(day, today)
                  const isTodayDay = isToday(day)
                  const filled = isPastWeek || isPast || isTodayDay

                  return (
                    <div key={i} className="relative z-10 flex flex-col items-center w-8">
                      <div
                        className={cn(
                          "rounded-full transition-all duration-200",
                          isTodayDay
                            ? "size-4 bg-amber-500 ring-4 ring-amber-100"
                            : filled
                              ? "size-3 bg-amber-400"
                              : "size-3 bg-neutral-200"
                        )}
                      />
                    </div>
                  )
                })}
              </div>

              <div className="flex items-center justify-between mt-2 px-1">
                {days.map((day, i) => (
                  <span
                    key={i}
                    className={cn(
                      "text-[10px] font-bold w-8 text-center tabular-nums",
                      isToday(day) ? "text-amber-600" : "text-neutral-500"
                    )}
                  >
                    {format(day, "d")}
                  </span>
                ))}
              </div>
            </div>
            </motion.div>
          )
        })()}
        </AnimatePresence>

        {/* Export button */}
        <Button
          onClick={handleExport}
          disabled={isExporting}
          className="w-full bg-amber-500 text-white hover:bg-amber-600 border-0"
        >
          {isExporting ? (
            <Loader2 className="mr-1.5 size-4 animate-spin" />
          ) : (
            <Download className="mr-1.5 size-4" />
          )}
          {isExporting ? "Generando PDF..." : "Exportar PDF"}
        </Button>
      </DialogContent>
    </Dialog>
  )
}

/* ── Unified Reports Grid ── */

export function ReportsGrid() {
  const [monthlyOpen, setMonthlyOpen] = useState(false)
  const [weeklyOpen, setWeeklyOpen] = useState(false)
  const [salesRangeOpen, setSalesRangeOpen] = useState(false)
  const [transitRangeOpen, setTransitRangeOpen] = useState(false)

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {/* Ventas — most used, first position */}
        <ReportCard
          title="Ventas"
          description="Historial de ventas con metricas, pagos y clientes"
          icon={Receipt}
          color={COLORS.rose}
          delay={0.0}
          actions={[
            { label: "PDF Mensual", format: "pdf", onExport: async () => setMonthlyOpen(true), skipAutoLog: true },
            { label: "PDF Semanal", format: "pdf", onExport: async () => setWeeklyOpen(true), skipAutoLog: true },
            { label: "Excel", format: "excel", onExport: exportSalesExcel },
            { label: "Personalizado", format: "range", onExport: async () => setSalesRangeOpen(true), skipAutoLog: true },
          ]}
        />

        {/* Inventario Fisico */}
        <ReportCard
          title="Inventario Fisico"
          description="Stock actual con alertas, minimos y valor total"
          icon={Package}
          color={COLORS.teal}
          delay={0.04}
          actions={[
            { label: "PDF", format: "pdf", onExport: handleInventoryPdf },
            { label: "Excel", format: "excel", onExport: exportInventoryExcel },
          ]}
        />

        {/* Inventario en Transito */}
        <ReportCard
          title="Inventario en Transito"
          description="Semanas de transito con productos y valores"
          icon={Truck}
          color={COLORS.amber}
          delay={0.08}
          actions={[
            { label: "PDF", format: "pdf", onExport: handleTransitPdf },
            { label: "Excel", format: "excel", onExport: exportTransitExcel },
            { label: "Personalizado", format: "range", onExport: async () => setTransitRangeOpen(true), skipAutoLog: true },
          ]}
        />

        {/* Inventario Carga Inicial */}
        <ReportCard
          title="Inventario Carga Inicial"
          description="Stock inicial con precios editados y valor total"
          icon={Archive}
          color={COLORS.violet}
          delay={0.12}
          actions={[
            { label: "PDF", format: "pdf", onExport: handleInitialLoadPdf },
            { label: "Excel", format: "excel", onExport: exportInitialLoadExcel },
          ]}
        />

        {/* Clientes */}
        <ReportCard
          title="Clientes"
          description="Lista de clientes con datos de contacto"
          icon={Users}
          color={COLORS.pink}
          delay={0.16}
          actions={[
            { label: "PDF", format: "pdf", onExport: handleCustomersPdf },
            { label: "Excel", format: "excel", onExport: exportCustomersExcel },
          ]}
        />

        {/* Productos */}
        <ReportCard
          title="Productos"
          description="Catalogo completo con variantes y precios"
          icon={ShoppingBag}
          color={COLORS.emerald}
          delay={0.2}
          actions={[
            { label: "PDF", format: "pdf", onExport: handleProductsPdf },
            { label: "Excel", format: "excel", onExport: exportProductsExcel },
          ]}
        />
      </div>

      {/* Sales PDF dialogs */}
      <MonthlySalesDialog open={monthlyOpen} onOpenChange={setMonthlyOpen} />
      <WeeklySalesDialog open={weeklyOpen} onOpenChange={setWeeklyOpen} />

      {/* Date range export dialogs */}
      <DateRangeExportDialog
        open={salesRangeOpen}
        onOpenChange={setSalesRangeOpen}
        title="Ventas"
        onExportPdf={async (from, to) => {
          const { exportSalesRangePdf } = await import("./pdf-generators")
          await exportSalesRangePdf(from, to)
        }}
        onExportExcel={async (from, to) => {
          await exportSalesRangeExcel(from, to)
        }}
      />
      <DateRangeExportDialog
        open={transitRangeOpen}
        onOpenChange={setTransitRangeOpen}
        title="Inventario en Transito"
        onExportPdf={async (from, to) => {
          const { exportTransitRangePdf } = await import("./pdf-generators")
          await exportTransitRangePdf(from, to)
        }}
        onExportExcel={async (from, to) => {
          await exportTransitRangeExcel(from, to)
        }}
      />
    </>
  )
}
