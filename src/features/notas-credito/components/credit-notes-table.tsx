"use client"

import { useRef, useState } from "react"
import { Search, FileText, MoreHorizontal, CheckCircle2, XCircle, Package } from "lucide-react"
import { useQueryClient } from "@tanstack/react-query"
import { sileo } from "sileo"
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
import { formatDate } from "@/lib/utils"
import { CREDIT_NOTE_STATUSES, CREDIT_NOTE_TYPES } from "@/lib/constants"

import { useCreditNotes } from "../queries"
import { cancelCreditNote } from "../actions"
import type { CreditNoteWithDetails } from "../types"
import { CreditNotesCardMobile } from "./credit-notes-card-mobile"
import { SettleDialog } from "./settle-dialog"

import type { ColumnDef } from "@tanstack/react-table"

const STATUS_COLORS: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  settled: "bg-blue-50 text-blue-700 border-blue-200",
  cancelled: "bg-neutral-100 text-neutral-500 border-neutral-200",
}

const TYPE_COLORS: Record<string, string> = {
  lending: "bg-violet-50 text-violet-700 border-violet-200",
  exchange: "bg-amber-50 text-amber-700 border-amber-200",
}

const STATUS_TABS = [
  { value: "", label: "Todas" },
  { value: "active", label: "Activas" },
  { value: "settled", label: "Liquidadas" },
  { value: "cancelled", label: "Canceladas" },
] as const

export function CreditNotesTable() {
  const [search, setSearch] = useQueryState("q", parseAsString.withDefault(""))
  const [statusFilter, setStatusFilter] = useQueryState(
    "status",
    parseAsString.withDefault("")
  )
  const [settleId, setSettleId] = useState<string | null>(null)
  const [cancelTarget, setCancelTarget] = useState<CreditNoteWithDetails | null>(null)
  const [isCancelling, setIsCancelling] = useState(false)
  const [dateRange, setDateRange] = useState<DateRange | null>(null)
  const queryClient = useQueryClient()

  const {
    data: notes = [],
    isLoading,
    isFetched,
    isFetching,
  } = useCreditNotes({
    search: search || undefined,
    status: statusFilter || undefined,
    dateFrom: dateRange?.from,
    dateTo: dateRange?.to,
  })
  const hasLoadedOnce = useRef(false)
  if (isFetched) hasLoadedOnce.current = true

  async function handleCancel() {
    if (!cancelTarget) return
    setIsCancelling(true)
    try {
      const result = await cancelCreditNote({ credit_note_id: cancelTarget.id })
      setIsCancelling(false)
      setCancelTarget(null)

      if ("error" in result) {
        const msg =
          (result.error as Record<string, string[]>)._form?.[0] ??
          "Error al cancelar la nota de credito"
        sileo.error({ title: msg })
        return
      }

      sileo.success({ title: "Nota de credito cancelada" })
      queryClient.invalidateQueries({ queryKey: ["credit-notes"] })
    } catch {
      setIsCancelling(false)
      setCancelTarget(null)
      sileo.error({ title: "Error al cancelar la nota de credito" })
    }
  }

  const columns: ColumnDef<CreditNoteWithDetails>[] = [
    {
      accessorKey: "credit_number",
      size: 120,
      minSize: 100,
      header: "Numero",
      cell: ({ row }) => (
        <span className="font-semibold text-neutral-950 tabular-nums">
          {row.original.credit_number}
        </span>
      ),
    },
    {
      accessorKey: "credit_type",
      size: 110,
      minSize: 90,
      header: "Tipo",
      cell: ({ row }) => {
        const type = row.original.credit_type
        return (
          <Badge
            variant="outline"
            className={`text-[10px] ${TYPE_COLORS[type] ?? ""}`}
          >
            {CREDIT_NOTE_TYPES[type as keyof typeof CREDIT_NOTE_TYPES] ?? type}
          </Badge>
        )
      },
    },
    {
      accessorKey: "status",
      size: 110,
      minSize: 90,
      header: "Estado",
      cell: ({ row }) => {
        const status = row.original.status
        return (
          <Badge
            variant="outline"
            className={`text-[10px] ${STATUS_COLORS[status] ?? ""}`}
          >
            {CREDIT_NOTE_STATUSES[status as keyof typeof CREDIT_NOTE_STATUSES] ?? status}
          </Badge>
        )
      },
    },
    {
      id: "customer",
      size: 160,
      minSize: 120,
      header: "Distribuidor",
      cell: ({ row }) => (
        <span className="text-sm text-neutral-600">
          {row.original.customers?.name ?? "—"}
        </span>
      ),
    },
    {
      id: "items_summary",
      size: 140,
      minSize: 100,
      header: "Productos",
      cell: ({ row }) => {
        const items = row.original.credit_note_items ?? []
        const outCount = items.filter((i) => i.direction === "out").reduce((s, i) => s + i.quantity, 0)
        const inCount = items.filter((i) => i.direction === "in").reduce((s, i) => s + i.quantity, 0)
        return (
          <div className="flex items-center gap-2 text-xs text-neutral-500">
            {outCount > 0 && (
              <span className="rounded bg-rose-50 px-1.5 py-0.5 text-rose-600">
                -{outCount} salida
              </span>
            )}
            {inCount > 0 && (
              <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-emerald-600">
                +{inCount} entrada
              </span>
            )}
          </div>
        )
      },
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
        const cn = row.original
        const isActive = cn.status === "active"
        const canSettle = isActive && cn.credit_type === "lending"
        if (!isActive) return null
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
              {canSettle && (
                <DropdownMenuItem onClick={() => setSettleId(cn.id)}>
                  <CheckCircle2 className="mr-2 size-3.5 text-emerald-500" />
                  Liquidar prestamo
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                variant="destructive"
                onClick={() => setCancelTarget(cn)}
              >
                <XCircle className="mr-2 size-3.5" />
                Cancelar nota
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
        className="space-y-4 overflow-hidden rounded-2xl border border-teal-100 bg-gradient-to-b from-white to-teal-50/30 p-4 shadow-sm sm:p-6"
      >
        {/* Filters */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1 sm:max-w-sm">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-neutral-400" />
            <Input
              placeholder="Buscar (NC-0001) o nombre de distribuidor..."
              value={search}
              onChange={(e) => setSearch(e.target.value || null)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-1">
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
            {notes.length > 0 ? (
              notes.map((note) => (
                <CreditNotesCardMobile
                  key={note.id}
                  note={note}
                  onSettle={note.status === "active" && note.credit_type === "lending" ? () => setSettleId(note.id) : undefined}
                  onCancel={note.status === "active" ? () => setCancelTarget(note) : undefined}
                />
              ))
            ) : (
              <EmptyState
                icon={search ? Search : FileText}
                title={search ? "Sin resultados" : "No hay notas de credito"}
                description={
                  search
                    ? "Intenta con otro numero."
                    : "Crea una nota de credito para registrar prestamos o intercambios con distribuidores."
                }
              />
            )}
          </div>

          {/* Desktop table */}
          <div className="hidden sm:block">
            <DataTable
              columns={columns}
              data={notes}
              isLoading={isLoading}
              pageSize={15}
              emptyState={
                search ? (
                  <EmptyState
                    icon={Search}
                    title="Sin resultados"
                    description="Intenta con otro numero."
                  />
                ) : (
                  <EmptyState
                    icon={FileText}
                    title="No hay notas de credito"
                    description="Crea una nota de credito para registrar prestamos o intercambios con distribuidores."
                  />
                )
              }
            />
          </div>
        </div>
      </motion.div>

      <SettleDialog
        creditNoteId={settleId}
        onOpenChange={(open) => !open && setSettleId(null)}
      />

      <ConfirmDialog
        open={!!cancelTarget}
        onOpenChange={(open) => !open && setCancelTarget(null)}
        title="Cancelar nota de credito"
        description={`Se cancelara la nota "${cancelTarget?.credit_number}". Esta accion no se puede deshacer.`}
        confirmLabel="Cancelar nota"
        variant="destructive"
        isLoading={isCancelling}
        onConfirm={handleCancel}
      />
    </>
  )
}
