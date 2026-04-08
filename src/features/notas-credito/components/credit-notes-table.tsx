"use client"

import { useMemo, useRef, useState, useCallback } from "react"
import { Search, FileText, MoreHorizontal, CheckCircle2, XCircle, Package, X } from "lucide-react"
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
import { cn, formatDate } from "@/lib/utils"
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
  const [isFocused, setIsFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const queryClient = useQueryClient()

  const SPRING_SNAPPY = { type: "spring" as const, stiffness: 400, damping: 30 }

  const handleClear = useCallback(() => {
    setSearch(null)
    inputRef.current?.focus()
  }, [setSearch])

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
              <FileText className="h-4 w-4 text-accent-400" />
              Registro
              <AnimatePresence mode="wait">
                {!isLoading && (
                  <motion.span
                    key={notes.length}
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.85 }}
                    transition={SPRING_SNAPPY}
                    className="ml-1 inline-flex h-5 min-w-[28px] items-center justify-center rounded-full bg-accent-50 px-1.5 text-[11px] font-bold tabular-nums text-accent-500"
                  >
                    {notes.length}
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
                    ? "var(--accent-500, #25A6B6)"
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
                    ? "0 0 0 3px rgba(37, 166, 182, 0.06), 0 2px 8px rgba(0,0,0,0.03)"
                    : "0 0 0 0px rgba(37, 166, 182, 0), 0 0px 0px rgba(0,0,0,0)",
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
                  placeholder="Numero de nota o nombre de distribuidor..."
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
