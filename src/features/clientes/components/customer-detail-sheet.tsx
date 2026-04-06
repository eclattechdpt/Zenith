"use client"

import { useState, useEffect } from "react"
import {
  User,
  Phone,
  Mail,
  MapPin,
  Hash,
  Percent,
  ShoppingBag,
  Loader2,
  Receipt,
  Pencil,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
} from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { AnimatePresence, motion } from "motion/react"

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/utils"
import { cn } from "@/lib/utils"
import { SALE_STATUSES } from "@/lib/constants"

import { useCustomer, useCustomerSales } from "../queries"

const MONTH_LABELS = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
]

type MonthFilter = "all" | "current" | "previous" | "custom"

interface CustomerDetailSheetProps {
  customerId: string | null
  open: boolean
  onClose: () => void
  onEdit: (customer: { id: string }) => void
}

export function CustomerDetailSheet({
  customerId,
  open,
  onClose,
  onEdit,
}: CustomerDetailSheetProps) {
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth()

  const [year, setYear] = useState(currentYear)
  const [monthFilter, setMonthFilter] = useState<MonthFilter>("all")
  const [customMonth, setCustomMonth] = useState<number | null>(null)
  const [gridOpen, setGridOpen] = useState(false)

  // Reset filters when opening for a new customer
  useEffect(() => {
    if (open) {
      setYear(currentYear)
      setMonthFilter("all")
      setCustomMonth(null)
      setGridOpen(false)
    }
  }, [open, customerId, currentYear])

  // Compute the month param for the query
  const queryMonth =
    monthFilter === "all" ? null
    : monthFilter === "current" ? currentMonth
    : monthFilter === "previous" ? (currentMonth === 0 ? 11 : currentMonth - 1)
    : customMonth

  // If "previous" crosses year boundary (January → December of prev year)
  const queryYear =
    monthFilter === "previous" && currentMonth === 0 ? year - 1 : year

  const { data: customer } = useCustomer(customerId ?? "")
  const { data: sales = [], isLoading: salesLoading } = useCustomerSales(
    open ? customerId : null,
    { year: queryYear, month: queryMonth }
  )

  const totalSpent = sales.reduce((s, sale) => s + sale.total, 0)

  function handleMonthFilter(f: MonthFilter) {
    setMonthFilter(f)
    if (f !== "custom") {
      setCustomMonth(null)
      setGridOpen(false)
    }
  }

  function handleMonthSelect(monthIdx: number) {
    setCustomMonth(monthIdx)
    setMonthFilter("custom")
    setTimeout(() => setGridOpen(false), 150)
  }

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="right"
        showCloseButton
        className="flex flex-col sm:max-w-md"
      >
        <SheetHeader className="px-6 pt-6 pb-0">
          <SheetTitle className="sr-only">Detalle de cliente</SheetTitle>
          <SheetDescription className="sr-only">
            Informacion y historial de compras del cliente
          </SheetDescription>
        </SheetHeader>

        {customer && (
          <div className="flex flex-1 flex-col overflow-hidden">
            {/* ── Client info card ── */}
            <div className="flex-shrink-0 px-6 pb-5">
              <div className="rounded-2xl border border-teal-100 bg-gradient-to-br from-teal-50/60 to-white p-5">
                <div className="flex items-start gap-4">
                  <div className="flex size-12 flex-shrink-0 items-center justify-center rounded-xl bg-teal-500/10">
                    <User className="size-6 text-teal-600" strokeWidth={1.5} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg font-bold text-neutral-900 truncate">
                      {customer.name}
                    </h3>
                    {customer.client_number && (
                      <p className="flex items-center gap-1 text-xs text-teal-600 font-medium mt-0.5">
                        <Hash className="size-3" />
                        {customer.client_number}
                      </p>
                    )}
                  </div>
                </div>

                {/* Contact details */}
                <div className="mt-4 space-y-2">
                  {customer.phone && (
                    <div className="flex items-center gap-2.5 text-sm text-neutral-600">
                      <Phone className="size-3.5 text-neutral-400" />
                      {customer.phone}
                    </div>
                  )}
                  {customer.email && (
                    <div className="flex items-center gap-2.5 text-sm text-neutral-600">
                      <Mail className="size-3.5 text-neutral-400" />
                      {customer.email}
                    </div>
                  )}
                  {customer.address && (
                    <div className="flex items-center gap-2.5 text-sm text-neutral-600">
                      <MapPin className="size-3.5 text-neutral-400" />
                      {customer.address}
                    </div>
                  )}
                  {customer.price_lists && (
                    <div className="flex items-center gap-2.5 text-sm text-neutral-600">
                      <Percent className="size-3.5 text-neutral-400" />
                      {customer.price_lists.name}
                      {Number(customer.price_lists.discount_percent) > 0 && (
                        <Badge className="text-[9px] bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-50">
                          -{customer.price_lists.discount_percent}%
                        </Badge>
                      )}
                    </div>
                  )}
                </div>

                {/* Edit button */}
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4 w-full rounded-xl border-teal-200 text-teal-700 hover:bg-teal-50"
                  onClick={() => {
                    onClose()
                    onEdit({ id: customer.id })
                  }}
                >
                  <Pencil className="mr-1.5 size-3.5" />
                  Editar cliente
                </Button>
              </div>
            </div>

            {/* ── History header ── */}
            <div className="flex-shrink-0 px-6">
              <div className="flex items-center gap-2.5">
                <Receipt className="size-3.5 text-teal-400" />
                <p className="text-[11px] font-bold uppercase tracking-[2px] text-neutral-400">
                  Historial de compras
                </p>
              </div>
            </div>

            {/* ── Filters ── */}
            <div className="flex-shrink-0 px-6 mt-3 space-y-2">
              {/* Month filter pills */}
              <div className="flex items-center gap-1 rounded-xl bg-teal-50/60 border border-teal-100 p-1">
                <button
                  type="button"
                  onClick={() => handleMonthFilter("all")}
                  className={cn(
                    "flex-1 rounded-lg px-2 py-1.5 text-[11px] font-semibold transition-all",
                    monthFilter === "all"
                      ? "bg-teal-500 text-white shadow-sm"
                      : "text-neutral-500 hover:bg-teal-50 hover:text-teal-700"
                  )}
                >
                  Todo
                </button>
                <button
                  type="button"
                  onClick={() => handleMonthFilter("current")}
                  className={cn(
                    "flex-1 rounded-lg px-2 py-1.5 text-[11px] font-semibold transition-all",
                    monthFilter === "current"
                      ? "bg-teal-500 text-white shadow-sm"
                      : "text-neutral-500 hover:bg-teal-50 hover:text-teal-700"
                  )}
                >
                  Este mes
                </button>
                <button
                  type="button"
                  onClick={() => handleMonthFilter("previous")}
                  className={cn(
                    "flex-1 rounded-lg px-2 py-1.5 text-[11px] font-semibold transition-all",
                    monthFilter === "previous"
                      ? "bg-teal-500 text-white shadow-sm"
                      : "text-neutral-500 hover:bg-teal-50 hover:text-teal-700"
                  )}
                >
                  Anterior
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (monthFilter === "custom" && gridOpen) {
                      setGridOpen(false)
                    } else {
                      setMonthFilter("custom")
                      setGridOpen(true)
                    }
                  }}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-semibold transition-all",
                    monthFilter === "custom"
                      ? "bg-teal-500 text-white shadow-sm"
                      : "text-neutral-500 hover:bg-teal-50 hover:text-teal-700"
                  )}
                >
                  <CalendarIcon className="size-3" />
                  Elegir
                </button>
              </div>

              {/* Year selector + Month grid — slides in/out together */}
              <AnimatePresence initial={false}>
                {gridOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="rounded-xl border border-teal-100 bg-teal-50/30 p-3">
                      {/* Year nav */}
                      <div className="flex items-center justify-between mb-3">
                        <button
                          type="button"
                          onClick={() => setYear((y) => y - 1)}
                          className="flex size-7 items-center justify-center rounded-lg text-neutral-400 hover:bg-teal-50 hover:text-teal-600 transition-colors"
                        >
                          <ChevronLeft className="size-4" />
                        </button>
                        <span className="text-sm font-bold text-neutral-800">{year}</span>
                        <button
                          type="button"
                          onClick={() => setYear((y) => y + 1)}
                          disabled={year >= currentYear}
                          className="flex size-7 items-center justify-center rounded-lg text-neutral-400 hover:bg-teal-50 hover:text-teal-600 transition-colors disabled:opacity-30 disabled:pointer-events-none"
                        >
                          <ChevronRight className="size-4" />
                        </button>
                      </div>

                      {/* Month grid */}
                      <div className="grid grid-cols-4 gap-1.5">
                        {MONTH_LABELS.map((label, i) => {
                          const isFuture = year > currentYear || (year === currentYear && i > currentMonth)
                          const isSelected = monthFilter === "custom" && customMonth === i

                          return (
                            <button
                              key={i}
                              type="button"
                              disabled={isFuture}
                              onClick={() => handleMonthSelect(i)}
                              className={cn(
                                "rounded-lg py-2 text-[11px] font-semibold transition-all",
                                isSelected
                                  ? "bg-teal-500 text-white shadow-sm"
                                  : year === currentYear && i === currentMonth
                                    ? "bg-teal-100 text-teal-700 ring-1 ring-teal-300"
                                    : "text-neutral-600 hover:bg-teal-50 hover:text-teal-700",
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
            </div>

            {/* ── Sales list (scrollable) ── */}
            <div className="mt-3 flex-1 overflow-y-auto px-6 pb-6">
              {salesLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="size-5 animate-spin text-neutral-300" />
                </div>
              ) : sales.length === 0 ? (
                <div className="flex flex-col items-center gap-2.5 py-12 text-center">
                  <div className="flex size-14 items-center justify-center rounded-2xl bg-neutral-50">
                    <ShoppingBag className="size-7 text-neutral-200" strokeWidth={1.5} />
                  </div>
                  <p className="text-xs text-neutral-400">
                    {monthFilter === "all"
                      ? `Sin compras en ${year}`
                      : "Sin compras en este periodo"}
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {sales.map((sale) => (
                    <div
                      key={sale.sale_number}
                      className="flex items-center justify-between rounded-xl border border-neutral-100 bg-white px-4 py-3 transition-colors hover:border-teal-100 hover:bg-teal-50/30"
                    >
                      <div>
                        <p className="text-sm font-bold text-neutral-800 tabular-nums">
                          {sale.sale_number}
                        </p>
                        <p className="text-[11px] text-neutral-400 mt-0.5">
                          {format(new Date(sale.created_at), "d MMM yyyy · HH:mm", {
                            locale: es,
                          })}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-sm font-bold text-neutral-900 tabular-nums">
                          {formatCurrency(sale.total)}
                        </span>
                        <Badge
                          variant="outline"
                          className={`text-[9px] ${
                            sale.status === "completed"
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                              : "border-amber-200 bg-amber-50 text-amber-700"
                          }`}
                        >
                          {SALE_STATUSES[sale.status as keyof typeof SALE_STATUSES] ??
                            sale.status}
                        </Badge>
                      </div>
                    </div>
                  ))}

                  {/* Summary */}
                  <div className="mt-2 flex items-center justify-between rounded-xl bg-neutral-50 border border-neutral-100 px-4 py-3">
                    <span className="text-xs text-neutral-500">
                      {sales.length} {sales.length === 1 ? "compra" : "compras"}
                    </span>
                    <span className="text-sm font-bold text-neutral-900 tabular-nums">
                      {formatCurrency(totalSpent)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
