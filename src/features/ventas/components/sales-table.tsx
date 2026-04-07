"use client"

import { useMemo, useRef, useState } from "react"
import { Search, Receipt, X, ChevronLeft, ChevronRight } from "lucide-react"
import { useQueryState, parseAsString } from "nuqs"
import { motion } from "motion/react"
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
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { DataTable } from "@/components/shared/data-table"
import { EmptyState } from "@/components/shared/empty-state"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"

import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { useSales } from "../queries"
import { cancelQuote, cancelSale } from "../actions"
import type { SaleWithSummary } from "../types"
import { getSalesColumns } from "./sales-columns"
import { SalesCardMobile } from "./sales-card-mobile"
import { ConvertQuoteDialog } from "./convert-quote-dialog"
import { ReturnDialog } from "./return-dialog"

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
    search: search || undefined,
    status: statusFilter || undefined,
    dateFrom: dateRange?.from,
    dateTo: dateRange?.to,
  })
  const hasLoadedOnce = useRef(false)
  if (isFetched) hasLoadedOnce.current = true

  const [convertTarget, setConvertTarget] = useState<SaleWithSummary | null>(
    null
  )
  const [cancelTarget, setCancelTarget] = useState<SaleWithSummary | null>(null)
  const [returnTarget, setReturnTarget] = useState<SaleWithSummary | null>(null)
  const [cancelSaleTarget, setCancelSaleTarget] =
    useState<SaleWithSummary | null>(null)
  const [isCancelling, setIsCancelling] = useState(false)
  const [isCancellingSale, setIsCancellingSale] = useState(false)

  const queryClient = useQueryClient()

  function handleViewDetail(sale: SaleWithSummary) {
    window.location.href = `/ventas/${sale.id}`
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
      toast.error(msg)
      return
    }

    toast.success("Cotizacion cancelada")
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
      toast.error(msg)
      return
    }

    toast.success("Venta cancelada")
    queryClient.invalidateQueries({ queryKey: ["sales"] })
    queryClient.invalidateQueries({ queryKey: ["products"] })
    queryClient.invalidateQueries({ queryKey: ["inventory"] })
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: hasLoadedOnce.current ? 1 : 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="space-y-4 overflow-hidden rounded-2xl border border-rose-100 bg-gradient-to-b from-white to-rose-50/30 p-4 shadow-sm sm:p-6"
    >
      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-sm">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-neutral-400" />
          <Input
            placeholder="Buscar por numero (V-0001, C-0001)..."
            value={search}
            onChange={(e) => setSearch(e.target.value || null)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-1">
          {STATUS_TABS.map((tab) => (
            <Button
              key={tab.value}
              variant={statusFilter === tab.value ? "default" : "ghost"}
              size="sm"
              onClick={() => setStatusFilter(tab.value || null)}
              className="text-xs"
            >
              {tab.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Date filter pills */}
      <div className="flex flex-wrap items-center gap-1">
        {/* Quick presets */}
        <Button
          variant={datePreset === "today" ? "default" : "ghost"}
          size="sm"
          className={`h-7 rounded-full px-3 text-[11px] ${datePreset === "today" ? "bg-accent-500 text-white hover:bg-accent-600" : ""}`}
          onClick={() => {
            setDatePreset("today")
            setCustomDate("")
            setDatePickerOpen(false)
          }}
        >
          Hoy
        </Button>
        <Button
          variant={datePreset === "week" ? "default" : "ghost"}
          size="sm"
          className={`h-7 rounded-full px-3 text-[11px] ${datePreset === "week" ? "bg-accent-500 text-white hover:bg-accent-600" : ""}`}
          onClick={() => {
            setDatePreset("week")
            setCustomDate("")
            setDatePickerOpen(false)
          }}
        >
          Esta semana
        </Button>

        {/* Month navigator */}
        <div className="flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={() => {
              setSelectedMonth((m) => subMonths(m, 1))
              setDatePreset("month")
              setCustomDate("")
              setDatePickerOpen(false)
            }}
          >
            <ChevronLeft className="size-3.5" />
          </Button>
          <Button
            variant={datePreset === "month" ? "default" : "ghost"}
            size="sm"
            className={`h-7 rounded-full px-3 text-[11px] capitalize ${datePreset === "month" ? "bg-accent-500 text-white hover:bg-accent-600" : ""}`}
            onClick={() => {
              setSelectedMonth(startOfMonth(new Date()))
              setDatePreset("month")
              setCustomDate("")
              setDatePickerOpen(false)
            }}
          >
            {monthLabel}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
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
          >
            <ChevronRight className="size-3.5" />
          </Button>
        </div>

        {/* Custom date pill */}
        {datePreset === "custom" && customDate ? (
          <Button
            variant="default"
            size="sm"
            className="h-7 gap-1 rounded-full px-3 text-[11px] bg-accent-500 text-white hover:bg-accent-600"
            onClick={() => {
              setDatePreset("today")
              setCustomDate("")
            }}
          >
            {format(new Date(customDate), "d MMM yyyy", { locale: es })}
            <X className="size-3" />
          </Button>
        ) : (
          <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
            <PopoverTrigger
              render={
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 rounded-full px-3 text-[11px]"
                />
              }
            >
              Fecha
            </PopoverTrigger>
            <PopoverContent className="w-auto p-3" side="bottom" align="start">
              <Input
                type="date"
                value={customDate}
                onChange={(e) => {
                  const val = e.target.value
                  if (val) {
                    setCustomDate(val)
                    setDatePreset("custom")
                    setDatePickerOpen(false)
                  }
                }}
                className="h-9"
                autoFocus
              />
            </PopoverContent>
          </Popover>
        )}
      </div>

      {/* Table */}
      <div
        className="transition-opacity duration-200 ease-out"
        style={{ opacity: isFetching && hasLoadedOnce.current ? 0.5 : 1 }}
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
            isLoading={isLoading}
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
      </div>

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
