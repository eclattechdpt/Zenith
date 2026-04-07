"use client"

import { useRef, useState } from "react"
import { Search, Ticket, MoreHorizontal, CheckCircle2, XCircle, X } from "lucide-react"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { useQueryState, parseAsString } from "nuqs"
import { motion } from "motion/react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { formatCurrency, formatDate } from "@/lib/utils"
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
  const queryClient = useQueryClient()

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
        toast.error(msg)
        return
      }

      toast.success("Vale cancelado")
      queryClient.invalidateQueries({ queryKey: ["vales"] })
      queryClient.invalidateQueries({ queryKey: ["vales-ready"] })
    } catch {
      setIsCancelling(false)
      setCancelTarget(null)
      toast.error("Error al cancelar el vale")
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
        initial={{ opacity: 0 }}
        animate={{ opacity: hasLoadedOnce.current ? 1 : 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="space-y-4 overflow-hidden rounded-2xl border border-indigo-100 bg-gradient-to-b from-white to-indigo-50/30 p-4 shadow-sm sm:p-6"
      >
        {/* Filters */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1 sm:max-w-sm">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-neutral-400" />
            <Input
              placeholder="Buscar (VL-0001) o nombre de cliente..."
              value={search}
              onChange={(e) => setSearch(e.target.value || null)}
              className="pl-9"
            />
          </div>
          <div className="flex flex-wrap gap-1">
            {STATUS_TABS.map((tab) => {
              const isActive = statusFilter === tab.value
              return (
                <Button
                  key={tab.value}
                  variant={isActive ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setStatusFilter(tab.value || null)}
                  className="text-xs"
                >
                  {tab.label}
                </Button>
              )
            })}
          </div>
        </div>

        {/* Date filter */}
        <DateFilterPills onChange={setDateRange} defaultPreset="today" />

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
