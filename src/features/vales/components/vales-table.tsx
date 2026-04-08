"use client"

import { useMemo, useRef, useState, useCallback } from "react"
import { Search, Ticket, MoreHorizontal, CheckCircle2, XCircle, X } from "lucide-react"
import { useQueryClient } from "@tanstack/react-query"
import { sileo } from "sileo"
import { useQueryState, parseAsString } from "nuqs"
import { motion, AnimatePresence } from "motion/react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DataTable } from "@/components/shared/data-table"
import { EmptyState } from "@/components/shared/empty-state"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { DateFilterPills, type DateRange } from "@/components/shared/date-filter-pills"
import { cn, formatCurrency, formatDate } from "@/lib/utils"
import { VALE_STATUSES, VALE_PAYMENT_STATUSES } from "@/lib/constants"

import { useVales } from "../queries"
import { cancelVale } from "../actions"
import type { ValeWithDetails } from "../types"
import { ValesCardMobile } from "./vales-card-mobile"
import { ValeCompleteDialog } from "./vale-complete-dialog"

import type { ColumnDef } from "@tanstack/react-table"

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  ready: "bg-emerald-50 text-emerald-700 border-emerald-200",
  completed: "bg-blue-50 text-blue-700 border-blue-200",
  cancelled: "bg-neutral-100 text-neutral-500 border-neutral-200",
}

const PAYMENT_COLORS: Record<string, string> = {
  paid: "bg-emerald-50 text-emerald-700 border-emerald-200",
  pending: "bg-amber-50 text-amber-700 border-amber-200",
}

const STATUS_TABS = [
  { value: "", label: "Todos" },
  { value: "pending", label: "Pendientes" },
  { value: "ready", label: "Listos" },
  { value: "completed", label: "Completados" },
  { value: "cancelled", label: "Cancelados" },
] as const

export function ValesTable() {
  const [search, setSearch] = useQueryState("q", parseAsString.withDefault(""))
  const [statusFilter, setStatusFilter] = useQueryState(
    "status",
    parseAsString.withDefault("")
  )
  const [completeValeId, setCompleteValeId] = useState<string | null>(null)
  const [cancelTarget, setCancelTarget] = useState<ValeWithDetails | null>(null)
  const [isCancelling, setIsCancelling] = useState(false)
  const [dateRange, setDateRange] = useState<DateRange | null>(null)
  const [isFocused, setIsFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const queryClient = useQueryClient()

  const SPRING_SNAPPY = { type: "spring" as const, stiffness: 400, damping: 30 }

  const handleClear = useCallback(() => {
    setSearch(null)
    inputRef.current?.focus()
  }, [setSearch])

  const {
    data: vales = [],
    isLoading,
    isFetched,
    isFetching,
  } = useVales({
    search: search || undefined,
    status: statusFilter || undefined,
    dateFrom: dateRange?.from,
    dateTo: dateRange?.to,
  })
  const hasLoadedOnce = useRef(false)
  if (isFetched) hasLoadedOnce.current = true

  async function handleCancelVale() {
    if (!cancelTarget) return
    setIsCancelling(true)
    try {
      const result = await cancelVale({ vale_id: cancelTarget.id })
      setIsCancelling(false)
      setCancelTarget(null)

      if ("error" in result) {
        const msg =
          (result.error as Record<string, string[]>)._form?.[0] ??
          "Error al cancelar el vale"
        sileo.error({ title: msg })
        return
      }

      sileo.success({ title: "Vale cancelado" })
      queryClient.invalidateQueries({ queryKey: ["vales"] })
      queryClient.invalidateQueries({ queryKey: ["vales-ready"] })
    } catch {
      setIsCancelling(false)
      setCancelTarget(null)
      sileo.error({ title: "Error al cancelar el vale" })
    }
  }

  const columns: ColumnDef<ValeWithDetails>[] = [
    {
      accessorKey: "vale_number",
      size: 120,
      minSize: 100,
      header: "Numero",
      cell: ({ row }) => (
        <span className="font-semibold text-neutral-950 tabular-nums">
          {row.original.vale_number}
        </span>
      ),
    },
    {
      accessorKey: "status",
      size: 130,
      minSize: 100,
      header: "Estado",
      cell: ({ row }) => {
        const status = row.original.status
        return (
          <Badge
            variant="outline"
            className={`text-[10px] ${STATUS_COLORS[status] ?? ""}`}
          >
            {VALE_STATUSES[status as keyof typeof VALE_STATUSES] ?? status}
          </Badge>
        )
      },
    },
    {
      accessorKey: "payment_status",
      size: 100,
      minSize: 80,
      header: "Pago",
      cell: ({ row }) => {
        const ps = row.original.payment_status
        return (
          <Badge
            variant="outline"
            className={`text-[10px] ${PAYMENT_COLORS[ps] ?? ""}`}
          >
            {VALE_PAYMENT_STATUSES[ps as keyof typeof VALE_PAYMENT_STATUSES] ?? ps}
          </Badge>
        )
      },
    },
    {
      id: "customer",
      size: 160,
      minSize: 120,
      header: "Cliente",
      cell: ({ row }) => (
        <span className="text-sm text-neutral-600">
          {row.original.customers?.name ?? "—"}
        </span>
      ),
    },
    {
      accessorKey: "total",
      size: 110,
      minSize: 90,
      header: () => <span className="block text-right">Total</span>,
      cell: ({ row }) => (
        <span className="block text-right font-semibold text-neutral-950 tabular-nums">
          {formatCurrency(Number(row.original.total))}
        </span>
      ),
    },
    {
      accessorKey: "created_at",
      size: 100,
      minSize: 80,
      header: "Fecha",
      cell: ({ row }) => (
        <span className="text-sm text-neutral-500 tabular-nums">
          {formatDate(row.original.created_at)}
        </span>
      ),
    },
    {
      id: "actions",
      size: 50,
      minSize: 50,
      header: "",
      cell: ({ row }) => {
        const vale = row.original
        const canAct = vale.status === "pending" || vale.status === "ready"
        if (!canAct) return null
        return (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="ghost" size="sm" className="size-8 p-0" />
              }
            >
              <MoreHorizontal className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setCompleteValeId(vale.id)}>
                <CheckCircle2 className="mr-2 size-3.5 text-emerald-500" />
                Entregar vale
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                onClick={() => setCancelTarget(vale)}
              >
                <XCircle className="mr-2 size-3.5" />
                Cancelar vale
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  return (
    <>
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
              <Ticket className="h-4 w-4 text-accent-400" />
              Registro
              <AnimatePresence mode="wait">
                {!isLoading && (
                  <motion.span
                    key={vales.length}
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.85 }}
                    transition={SPRING_SNAPPY}
                    className="ml-1 inline-flex h-5 min-w-[28px] items-center justify-center rounded-full bg-accent-50 px-1.5 text-[11px] font-bold tabular-nums text-accent-500"
                  >
                    {vales.length}
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
                    ? "var(--accent-500, #6366F1)"
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
                    ? "0 0 0 3px rgba(99, 102, 241, 0.06), 0 2px 8px rgba(0,0,0,0.03)"
                    : "0 0 0 0px rgba(99, 102, 241, 0), 0 0px 0px rgba(0,0,0,0)",
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
                  placeholder="Numero de vale o nombre de cliente..."
                  className="h-10 w-full rounded-xl border border-neutral-200/80 bg-neutral-50/80 pl-10 pr-9 text-[13px] font-medium text-neutral-700 outline-none transition-colors duration-150 placeholder:text-neutral-300 focus:border-accent-200"
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
            </div>
          </div>

          {/* Row 2: Status tabs */}
          <div className="mt-3 flex items-center gap-1 rounded-xl bg-accent-50/50 border border-accent-100/60 p-1">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => setStatusFilter(tab.value || null)}
                className={cn(
                  "flex-1 rounded-lg px-2 py-1.5 text-[11px] font-semibold transition-all",
                  statusFilter === tab.value
                    ? "bg-accent-500 text-white shadow-sm"
                    : "text-neutral-500 hover:bg-accent-50 hover:text-neutral-700"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Row 3: Date filters */}
          <div className="mt-3">
            <DateFilterPills onChange={setDateRange} defaultPreset="today" />
          </div>
        </div>

        {/* Table */}
        <div
          className="transition-opacity duration-200 ease-out"
          style={{ opacity: isFetching && hasLoadedOnce.current ? 0.5 : 1 }}
        >
          {/* Mobile cards */}
          <div className="flex flex-col gap-3 sm:hidden">
            {vales.length > 0 ? (
              vales.map((vale) => (
                <ValesCardMobile
                  key={vale.id}
                  vale={vale}
                  onComplete={() => setCompleteValeId(vale.id)}
                  onCancel={() => setCancelTarget(vale)}
                />
              ))
            ) : (
              <EmptyState
                icon={search ? Search : Ticket}
                title={search ? "Sin resultados" : "No hay vales"}
                description={
                  search
                    ? "Intenta con otro numero o nombre."
                    : "Los vales apareceran aqui al crearlos desde el punto de venta."
                }
              />
            )}
          </div>

          {/* Desktop table */}
          <div className="hidden sm:block">
            <DataTable
              columns={columns}
              data={vales}
              isLoading={isLoading}
              pageSize={15}
              emptyState={
                search ? (
                  <EmptyState
                    icon={Search}
                    title="Sin resultados"
                    description="Intenta con otro numero o nombre."
                  />
                ) : (
                  <EmptyState
                    icon={Ticket}
                    title="No hay vales"
                    description="Los vales apareceran aqui al crearlos desde el punto de venta."
                  />
                )
              }
            />
          </div>
        </div>
      </motion.div>

      <ValeCompleteDialog
        valeId={completeValeId}
        onOpenChange={(open) => !open && setCompleteValeId(null)}
      />

      <ConfirmDialog
        open={!!cancelTarget}
        onOpenChange={(open) => !open && setCancelTarget(null)}
        title="Cancelar vale"
        description={`Se cancelara el vale "${cancelTarget?.vale_number}". Esta accion no se puede deshacer.`}
        confirmLabel="Cancelar vale"
        variant="destructive"
        isLoading={isCancelling}
        onConfirm={handleCancelVale}
      />
    </>
  )
}
