"use client"

import { useRef } from "react"
import { Search, FileText } from "lucide-react"
import { useQueryState, parseAsString } from "nuqs"
import { motion } from "motion/react"
import { isPast } from "date-fns"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DataTable } from "@/components/shared/data-table"
import { EmptyState } from "@/components/shared/empty-state"
import { formatCurrency, formatDate } from "@/lib/utils"
import { CREDIT_NOTE_STATUSES } from "@/lib/constants"

import { useCreditNotes } from "../queries"
import type { CreditNoteWithDetails } from "../types"
import { CreditNotesCardMobile } from "./credit-notes-card-mobile"

import type { ColumnDef } from "@tanstack/react-table"

const STATUS_COLORS: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  redeemed: "bg-blue-50 text-blue-700 border-blue-200",
  expired: "bg-amber-50 text-amber-700 border-amber-200",
  cancelled: "bg-neutral-100 text-neutral-500 border-neutral-200",
}

const STATUS_TABS = [
  { value: "", label: "Todas" },
  { value: "active", label: "Activas" },
  { value: "redeemed", label: "Aplicadas" },
  { value: "expired", label: "Expiradas" },
] as const

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
    accessorKey: "status",
    size: 110,
    minSize: 90,
    header: "Estado",
    cell: ({ row }) => {
      const status = row.original.status as string
      const isExpired =
        status === "active" &&
        row.original.expires_at &&
        isPast(new Date(row.original.expires_at))

      if (isExpired) {
        return (
          <Badge
            variant="outline"
            className="bg-amber-50 text-amber-700 border-amber-200 text-[10px]"
          >
            Expirada
          </Badge>
        )
      }

      return (
        <Badge
          variant="outline"
          className={`text-[10px] ${STATUS_COLORS[status] ?? ""}`}
        >
          {CREDIT_NOTE_STATUSES[
            status as keyof typeof CREDIT_NOTE_STATUSES
          ] ?? status}
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
    accessorKey: "original_amount",
    size: 110,
    minSize: 90,
    header: () => <span className="block text-right">Original</span>,
    cell: ({ row }) => (
      <span className="block text-right text-sm text-neutral-500 tabular-nums">
        {formatCurrency(Number(row.original.original_amount))}
      </span>
    ),
  },
  {
    accessorKey: "remaining_amount",
    size: 110,
    minSize: 90,
    header: () => <span className="block text-right">Saldo</span>,
    cell: ({ row }) => (
      <span className="block text-right font-semibold text-neutral-950 tabular-nums">
        {formatCurrency(Number(row.original.remaining_amount))}
      </span>
    ),
  },
  {
    id: "return",
    size: 100,
    minSize: 80,
    header: "Devolucion",
    cell: ({ row }) => {
      const ret = row.original.returns
      if (!ret) return <span className="text-neutral-400">—</span>
      return (
        <span className="text-xs text-neutral-500">{ret.return_number}</span>
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
]

export function CreditNotesTable() {
  const [search, setSearch] = useQueryState("q", parseAsString.withDefault(""))
  const [statusFilter, setStatusFilter] = useQueryState(
    "status",
    parseAsString.withDefault("")
  )

  const {
    data: notes = [],
    isLoading,
    isFetched,
    isFetching,
  } = useCreditNotes({
    search: search || undefined,
    status: statusFilter || undefined,
  })
  const hasLoadedOnce = useRef(false)
  if (isFetched) hasLoadedOnce.current = true

  return (
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
            placeholder="Buscar por numero (NC-0001)..."
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
                className={`text-xs ${isActive ? "bg-accent-500 text-white hover:bg-accent-600" : ""}`}
              >
                {tab.label}
              </Button>
            )
          })}
        </div>
      </div>

      {/* Table */}
      <div
        className="transition-opacity duration-200 ease-out"
        style={{ opacity: isFetching && hasLoadedOnce.current ? 0.5 : 1 }}
      >
        {/* Mobile cards */}
        <div className="flex flex-col gap-3 sm:hidden">
          {notes.length > 0 ? (
            notes.map((note) => (
              <CreditNotesCardMobile key={note.id} note={note} />
            ))
          ) : (
            <EmptyState
              icon={search ? Search : FileText}
              title={search ? "Sin resultados" : "No hay notas de credito"}
              description={
                search
                  ? "Intenta con otro numero."
                  : "Las notas de credito apareceran aqui al procesar devoluciones."
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
                  description="Las notas de credito apareceran aqui al procesar devoluciones."
                />
              )
            }
          />
        </div>
      </div>
    </motion.div>
  )
}
