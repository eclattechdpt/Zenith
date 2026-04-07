"use client"

import { useMemo, useRef, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Search, Receipt, X, ChevronLeft, ChevronRight, CalendarDays } from "lucide-react"
import { useQueryState, parseAsString } from "nuqs"
import { motion, AnimatePresence } from "motion/react"
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  startOfMonth,
  endOfMonth,
  subMonths,
  addMonths,
  isAfter,
  format,
} from "date-fns"
import { es } from "date-fns/locale"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Skeleton as BoneyardSkeleton } from "boneyard-js/react"

import { DataTable } from "@/components/shared/data-table"
import { EmptyState } from "@/components/shared/empty-state"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { SalesTableFixture } from "./fixtures/sales-table-fixture"

import { useQueryClient } from "@tanstack/react-query"
import { sileo } from "sileo"
import { useDebounce } from "@/hooks/use-debounce"
import { cn } from "@/lib/utils"

import { useSales } from "../queries"
import { cancelQuote, cancelSale } from "../actions"
import type { SaleWithSummary } from "../types"
import { getSalesColumns } from "./sales-columns"
import { SalesCardMobile } from "./sales-card-mobile"
import { ConvertQuoteDialog } from "./convert-quote-dialog"
import { ReturnDialog } from "./return-dialog"

const SPRING_SNAPPY = { type: "spring" as const, stiffness: 500, damping: 35 }

const STATUS_TABS = [
  { value: "", label: "Todos" },
  { value: "quote", label: "Cotizaciones" },
  { value: "completed", label: "Ventas" },
  { value: "returned", label: "Devoluciones" },
  { value: "cancelled", label: "Canceladas" },
] as const

function getDateRange(
  preset: string,
  selectedMonth: Date,
  customDate?: string
): { from: string; to: string } | null {
  const now = new Date()
  const todayEnd = endOfDay(now).toISOString()
  if (preset === "today") {
    return { from: startOfDay(now).toISOString(), to: todayEnd }
  }
  if (preset === "week") {
    return {
      from: startOfWeek(now, { weekStartsOn: 1 }).toISOString(),
      to: todayEnd,
    }
  }
  if (preset === "month") {
    return {
      from: startOfMonth(selectedMonth).toISOString(),
      to: endOfMonth(selectedMonth).toISOString(),
    }
  }
  if (preset === "custom" && customDate) {
    const date = new Date(customDate)
    return {
      from: startOfDay(date).toISOString(),
      to: endOfDay(date).toISOString(),
    }
  }
  return null
}

export function SalesTable() {
  const [search, setSearch] = useQueryState("q", parseAsString.withDefault(""))
  const debouncedSearch = useDebounce(search, 250)
  const [isFocused, setIsFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const [statusFilter, setStatusFilter] = useQueryState(
    "status",
    parseAsString.withDefault("")
  )
  const [datePreset, setDatePreset] = useState("today")
  const [selectedMonth, setSelectedMonth] = useState(() => startOfMonth(new Date()))
  const [customDate, setCustomDate] = useState("")
  const [datePickerOpen, setDatePickerOpen] = useState(false)

  const isCurrentMonth =
    format(selectedMonth, "yyyy-MM") === format(new Date(), "yyyy-MM")
  const monthLabel = format(selectedMonth, "MMMM yyyy", { locale: es })

  const dateRange = getDateRange(datePreset, selectedMonth, customDate)

  const {
    data: sales = [],
    isLoading,
    isFetched,
    isFetching,
  } = useSales({
    search: debouncedSearch || undefined,
    status: statusFilter || undefined,
    dateFrom: dateRange?.from,
    dateTo: dateRange?.to,
  })
  const hasLoadedOnce = useRef(false)
  if (isFetched) hasLoadedOnce.current = true

  const [convertTarget, setConvertTarget] = useState<SaleWithSummary | null>(null)
  const [cancelTarget, setCancelTarget] = useState<SaleWithSummary | null>(null)
  const [returnTarget, setReturnTarget] = useState<SaleWithSummary | null>(null)
  const [cancelSaleTarget, setCancelSaleTarget] = useState<SaleWithSummary | null>(null)
  const [isCancelling, setIsCancelling] = useState(false)
  const [isCancellingSale, setIsCancellingSale] = useState(false)

  const queryClient = useQueryClient()
  const router = useRouter()

  function handleViewDetail(sale: SaleWithSummary) {
    router.push(`/ventas/${sale.id}`)
  }

  const columns = useMemo(
    () =>
      getSalesColumns({
        onConvert: setConvertTarget,
        onCancel: setCancelTarget,
        onReturn: setReturnTarget,
        onCancelSale: setCancelSaleTarget,
        onViewDetail: handleViewDetail,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  async function handleCancel() {
    if (!cancelTarget) return
    setIsCancelling(true)
    const result = await cancelQuote({ quote_id: cancelTarget.id })
    setIsCancelling(false)
    setCancelTarget(null)

    if ("error" in result) {
      const msg =
        (result.error as Record<string, string[]>)._form?.[0] ??
        "Error al cancelar la cotizacion"
      sileo.error({ title: msg })
      return
    }

    sileo.success({ title: "Cotizacion cancelada", description: "La cotizacion fue marcada como cancelada" })
    queryClient.invalidateQueries({ queryKey: ["sales"] })
  }

  async function handleCancelSale() {
    if (!cancelSaleTarget) return
    setIsCancellingSale(true)
    const result = await cancelSale({ sale_id: cancelSaleTarget.id })
    setIsCancellingSale(false)
    setCancelSaleTarget(null)

    if ("error" in result) {
      const msg =
        (result.error as Record<string, string[]>)._form?.[0] ??
        "Error al cancelar la venta"
      sileo.error({ title: msg })
      return
    }

    sileo.success({ title: "Venta cancelada", description: "El stock fue restaurado al inventario" })
    queryClient.invalidateQueries({ queryKey: ["sales"] })
    queryClient.invalidateQueries({ queryKey: ["products"] })
    queryClient.invalidateQueries({ queryKey: ["inventory"] })
  }

  const handleClear = useCallback(() => {
    setSearch(null)
    inputRef.current?.focus()
  }, [setSearch])

  const resultCount = sales.length
  const isSearching = search !== debouncedSearch

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, filter: "blur(4px)" }}
      animate={{ opacity: hasLoadedOnce.current ? 1 : 0, y: hasLoadedOnce.current ? 0 : 12, filter: hasLoadedOnce.current ? "blur(0px)" : "blur(4px)" }}
      transition={{ type: "spring", stiffness: 100, damping: 20, delay: 0.18 }}
      className="rounded-2xl border border-neutral-200/60 bg-neutral-50 p-5 shadow-sm shadow-neutral-900/[0.03] sm:p-7"
    >
      {/* ══════ Toolbar ══════ */}
      <div className="rounded-xl border border-neutral-100/80 bg-white p-4 sm:p-5">
        {/* Row 1: Title + Search */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="flex items-center gap-2 text-[13px] font-bold uppercase tracking-[1.5px] text-neutral-400">
            <Receipt className="h-4 w-4 text-rose-400" />
            Historial
            <AnimatePresence mode="wait">
              {!isLoading && (
                <motion.span
                  key={resultCount}
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.85 }}
                  transition={SPRING_SNAPPY}
                  className="ml-1 inline-flex h-5 min-w-[28px] items-center justify-center rounded-full bg-rose-50 px-1.5 text-[11px] font-bold tabular-nums text-rose-500"
                >
                  {resultCount}
                </motion.span>
              )}
            </AnimatePresence>
          </h2>

          {/* Search */}
          <div className="relative w-full sm:w-72">
            <motion.div
              className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2"
              animate={{
                scale: isFocused ? 1.08 : 1,
                color: isFocused
                  ? "rgb(244, 63, 94)"
                  : search
                    ? "rgb(163, 163, 163)"
                    : "rgb(212, 212, 212)",
              }}
              transition={SPRING_SNAPPY}
            >
              <Search className="h-4 w-4" />
            </motion.div>

            <motion.div
              animate={{
                boxShadow: isFocused
                  ? "0 0 0 3px rgba(244, 63, 94, 0.06), 0 2px 8px rgba(0,0,0,0.03)"
                  : "0 0 0 0px rgba(244, 63, 94, 0), 0 0px 0px rgba(0,0,0,0)",
              }}
              transition={SPRING_SNAPPY}
              className="rounded-xl"
            >
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value || null)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder="Numero de venta o cotizacion..."
                className="h-10 w-full rounded-xl border border-neutral-200/80 bg-neutral-50/80 pl-10 pr-9 text-[13px] font-medium text-neutral-700 outline-none transition-colors duration-150 placeholder:text-neutral-300 focus:border-rose-200/80"
              />
            </motion.div>

            <AnimatePresence>
              {search.length > 0 && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.5, rotate: -90 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  exit={{ opacity: 0, scale: 0.5, rotate: 90 }}
                  transition={{ type: "spring", stiffness: 300, damping: 35 }}
                  whileTap={{ scale: 0.85 }}
                  onClick={handleClear}
                  className="absolute right-2.5 top-1/2 z-10 -translate-y-1/2 rounded-md p-0.5 text-neutral-300 transition-colors hover:text-neutral-500"
                >
                  <X className="h-3.5 w-3.5" />
                </motion.button>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {isSearching && (
                <motion.div
                  initial={{ scaleX: 0, opacity: 0 }}
                  animate={{ scaleX: 1, opacity: 1 }}
                  exit={{ scaleX: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="absolute bottom-0 left-3 right-3 h-[2px] origin-left rounded-full bg-gradient-to-r from-rose-400 to-rose-300"
                />
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Row 2: Status tabs */}
        <div className="mt-3 flex items-center gap-1 rounded-xl bg-rose-50/50 border border-rose-100/60 p-1">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setStatusFilter(tab.value || null)}
              className={cn(
                "flex-1 rounded-lg px-2 py-1.5 text-[11px] font-semibold transition-all",
                statusFilter === tab.value
                  ? "bg-accent-500 text-white shadow-sm"
                  : "text-neutral-500 hover:bg-rose-50 hover:text-neutral-700"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Row 3: Date filters */}
        <div className="mt-3 flex flex-wrap items-center gap-1">
          <button
            type="button"
            onClick={() => { setDatePreset("today"); setCustomDate(""); setDatePickerOpen(false) }}
            className={cn(
              "h-7 rounded-full px-3 text-[11px] font-semibold transition-all",
              datePreset === "today"
                ? "bg-accent-500 text-white shadow-sm"
                : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700"
            )}
          >
            Hoy
          </button>
          <button
            type="button"
            onClick={() => { setDatePreset("week"); setCustomDate(""); setDatePickerOpen(false) }}
            className={cn(
              "h-7 rounded-full px-3 text-[11px] font-semibold transition-all",
              datePreset === "week"
                ? "bg-accent-500 text-white shadow-sm"
                : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700"
            )}
          >
            Esta semana
          </button>

          {/* Month navigator */}
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => {
                setSelectedMonth((m) => subMonths(m, 1))
                setDatePreset("month")
                setCustomDate("")
                setDatePickerOpen(false)
              }}
              className="flex size-7 items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 transition-colors"
            >
              <ChevronLeft className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedMonth(startOfMonth(new Date()))
                setDatePreset("month")
                setCustomDate("")
                setDatePickerOpen(false)
              }}
              className={cn(
                "h-7 rounded-full px-3 text-[11px] font-semibold capitalize transition-all",
                datePreset === "month"
                  ? "bg-accent-500 text-white shadow-sm"
                  : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700"
              )}
            >
              {monthLabel}
            </button>
            <button
              type="button"
              disabled={isCurrentMonth}
              onClick={() => {
                setSelectedMonth((m) => {
                  const next = addMonths(m, 1)
                  return isAfter(next, new Date()) ? startOfMonth(new Date()) : next
                })
                setDatePreset("month")
                setCustomDate("")
                setDatePickerOpen(false)
              }}
              className="flex size-7 items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 transition-colors disabled:opacity-30 disabled:pointer-events-none"
            >
              <ChevronRight className="size-3.5" />
            </button>
          </div>

          {/* Custom date */}
          {datePreset === "custom" && customDate ? (
            <button
              type="button"
              onClick={() => { setDatePreset("today"); setCustomDate("") }}
              className="flex h-7 items-center gap-1 rounded-full bg-accent-500 px-3 text-[11px] font-semibold text-white shadow-sm"
            >
              {format(new Date(customDate), "d MMM yyyy", { locale: es })}
              <X className="size-3" />
            </button>
          ) : (
            <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
              <PopoverTrigger
                render={
                  <button
                    type="button"
                    className="flex h-7 items-center gap-1 rounded-full px-3 text-[11px] font-semibold text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 transition-all"
                  />
                }
              >
                <CalendarDays className="size-3" />
                Fecha
              </PopoverTrigger>
              <PopoverContent className="w-auto p-2" side="bottom" align="start">
                <Calendar
                  mode="single"
                  selected={customDate ? new Date(customDate + "T12:00:00") : undefined}
                  onSelect={(date) => {
                    if (date) {
                      setCustomDate(format(date, "yyyy-MM-dd"))
                      setDatePreset("custom")
                      setDatePickerOpen(false)
                    }
                  }}
                  disabled={{ after: new Date() }}
                  locale={es}
                  classNames={{
                    today: "rounded-(--cell-radius) bg-rose-50 text-rose-600 data-[selected=true]:rounded-none",
                    day: "group/day relative aspect-square h-full w-full rounded-(--cell-radius) p-0 text-center select-none",
                  }}
                />
              </PopoverContent>
            </Popover>
          )}
        </div>
      </div>

      {/* ══════ Results ══════ */}
      <motion.div
        className="mt-6"
        animate={{ opacity: isFetching && !isLoading ? 0.5 : 1 }}
        transition={{ duration: 0.15 }}
      >
        <BoneyardSkeleton
          name="sales-table"
          loading={isLoading}
          animate="shimmer"
          fixture={<SalesTableFixture />}
        >
          {/* Mobile cards */}
          <div className="flex flex-col gap-3 sm:hidden">
            {sales.length > 0 ? (
              sales.map((sale) => (
                <SalesCardMobile
                  key={sale.id}
                  sale={sale}
                  onConvert={setConvertTarget}
                  onCancel={setCancelTarget}
                  onReturn={setReturnTarget}
                  onCancelSale={setCancelSaleTarget}
                  onViewDetail={handleViewDetail}
                />
              ))
            ) : (
              <EmptyState
                icon={search ? Search : Receipt}
                title={search ? "Sin resultados" : "No hay registros"}
                description={
                  search
                    ? "Intenta con otro numero de venta o cotizacion."
                    : "Las ventas y cotizaciones apareceran aqui."
                }
              />
            )}
          </div>

          {/* Desktop table */}
          <div className="hidden sm:block">
            <DataTable
              columns={columns}
              data={sales}
              isLoading={false}
              pageSize={15}
              emptyState={
                search ? (
                  <EmptyState
                    icon={Search}
                    title="Sin resultados"
                    description="Intenta con otro numero de venta o cotizacion."
                  />
                ) : (
                  <EmptyState
                    icon={Receipt}
                    title="No hay registros"
                    description="Las ventas y cotizaciones apareceran aqui."
                  />
                )
              }
            />
          </div>
        </BoneyardSkeleton>
      </motion.div>

      {/* Convert quote dialog */}
      <ConvertQuoteDialog
        quoteId={convertTarget?.id ?? null}
        onOpenChange={(open) => !open && setConvertTarget(null)}
        onConverted={() => setConvertTarget(null)}
      />

      {/* Cancel quote confirmation */}
      <ConfirmDialog
        open={!!cancelTarget}
        onOpenChange={(open) => !open && setCancelTarget(null)}
        title="Cancelar cotizacion"
        description={`Se cancelara la cotizacion "${cancelTarget?.sale_number}". Esta accion no se puede deshacer.`}
        confirmLabel="Cancelar cotizacion"
        variant="destructive"
        isLoading={isCancelling}
        onConfirm={handleCancel}
      />

      {/* Return dialog */}
      <ReturnDialog
        saleId={returnTarget?.id ?? null}
        onOpenChange={(open) => !open && setReturnTarget(null)}
        onReturned={() => setReturnTarget(null)}
      />

      {/* Cancel sale confirmation */}
      <ConfirmDialog
        open={!!cancelSaleTarget}
        onOpenChange={(open) => !open && setCancelSaleTarget(null)}
        title="Cancelar venta"
        description={`Se cancelara la venta "${cancelSaleTarget?.sale_number}" y se regresara el stock al inventario. Esta accion no se puede deshacer.`}
        confirmLabel="Cancelar venta"
        variant="destructive"
        isLoading={isCancellingSale}
        onConfirm={handleCancelSale}
      />
    </motion.div>
  )
}
