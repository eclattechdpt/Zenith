"use client"

import { useMemo, useRef, useState, useCallback } from "react"
import { Search, Users, Plus, X } from "lucide-react"
import { useQueryState, parseAsString } from "nuqs"
import { motion, AnimatePresence } from "motion/react"

import { Skeleton as BoneyardSkeleton } from "boneyard-js/react"

import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/shared/data-table"
import { EmptyState } from "@/components/shared/empty-state"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { CustomerTableFixture } from "./fixtures/customer-table-fixture"

import { useQueryClient } from "@tanstack/react-query"
import { sileo } from "sileo"
import { useDebounce } from "@/hooks/use-debounce"

import { useCustomers } from "../queries"
import { deleteCustomer } from "../actions"
import type { CustomerWithPriceList } from "../types"
import { getCustomerColumns } from "./customer-columns"
import { CustomerCardMobile } from "./customer-card-mobile"

const SPRING_SNAPPY = { type: "spring" as const, stiffness: 500, damping: 35 }

interface CustomerTableProps {
  onEdit?: (customer: CustomerWithPriceList) => void
  onCreate?: () => void
  onView?: (customer: CustomerWithPriceList) => void
  onPreview?: (customerId: string, anchor: { top: number; left: number }) => void
  onPreviewDismiss?: () => void
}

export function CustomerTable({ onEdit, onCreate, onView, onPreview, onPreviewDismiss }: CustomerTableProps) {
  const [search, setSearch] = useQueryState("q", parseAsString.withDefault(""))
  const debouncedSearch = useDebounce(search, 250)
  const [isFocused, setIsFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const { data: customers = [], isLoading, isFetched, isFetching } = useCustomers({
    search: debouncedSearch || undefined,
  })
  const hasLoadedOnce = useRef(false)
  if (isFetched) hasLoadedOnce.current = true

  const [deleteTarget, setDeleteTarget] = useState<CustomerWithPriceList | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const columns = useMemo(
    () => getCustomerColumns({ onEdit, onDelete: setDeleteTarget, onView, onPreview, onPreviewDismiss }),
    [onEdit, onView, onPreview, onPreviewDismiss]
  )

  const queryClient = useQueryClient()

  async function handleDelete() {
    if (!deleteTarget) return
    setIsDeleting(true)
    const result = await deleteCustomer(deleteTarget.id)
    setIsDeleting(false)
    setDeleteTarget(null)

    if ("error" in result) {
      const msg = (result.error as Record<string, string[]>)._form?.[0] ?? "Error al eliminar el cliente"
      sileo.error({ title: msg })
      return
    }

    sileo.success({ title: "Cliente eliminado", description: "Su historial de compras fue conservado" })
    queryClient.invalidateQueries({ queryKey: ["customers"] })
  }

  const handleClear = useCallback(() => {
    setSearch(null)
    inputRef.current?.focus()
  }, [setSearch])

  const resultCount = customers.length
  const isSearching = search !== debouncedSearch

  const emptyAction = onCreate ? (
    <Button size="sm" onClick={onCreate}>
      <Plus className="mr-1.5 size-4" />
      Nuevo cliente
    </Button>
  ) : null

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, filter: "blur(4px)" }}
      animate={{ opacity: hasLoadedOnce.current ? 1 : 0, y: hasLoadedOnce.current ? 0 : 12, filter: hasLoadedOnce.current ? "blur(0px)" : "blur(4px)" }}
      transition={{ type: "spring", stiffness: 100, damping: 20, delay: 0.18 }}
      className="rounded-2xl border border-neutral-200/60 bg-neutral-50 p-5 shadow-sm shadow-neutral-900/[0.03] sm:p-7"
    >
      {/* ══════ Toolbar ══════ */}
      <div className="rounded-xl border border-neutral-100/80 bg-white p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Title + count */}
          <h2 className="flex items-center gap-2 text-[13px] font-bold uppercase tracking-[1.5px] text-neutral-400">
            <Users className="h-4 w-4 text-teal-400" />
            Directorio
            <AnimatePresence mode="wait">
              {!isLoading && (
                <motion.span
                  key={resultCount}
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.85 }}
                  transition={SPRING_SNAPPY}
                  className="ml-1 inline-flex h-5 min-w-[28px] items-center justify-center rounded-full bg-teal-50 px-1.5 text-[11px] font-bold tabular-nums text-teal-500"
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
                  ? "rgb(20, 184, 166)"
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
                  ? "0 0 0 3px rgba(20, 184, 166, 0.06), 0 2px 8px rgba(0,0,0,0.03)"
                  : "0 0 0 0px rgba(20, 184, 166, 0), 0 0px 0px rgba(0,0,0,0)",
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
                placeholder="Nombre, telefono o email..."
                className="h-10 w-full rounded-xl border border-neutral-200/80 bg-neutral-50/80 pl-10 pr-9 text-[13px] font-medium text-neutral-700 outline-none transition-colors duration-150 placeholder:text-neutral-300 focus:border-teal-200/80"
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
                  className="absolute bottom-0 left-3 right-3 h-[2px] origin-left rounded-full bg-gradient-to-r from-teal-400 to-teal-300"
                />
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* ══════ Results ══════ */}
      <motion.div
        className="mt-6"
        animate={{ opacity: isFetching && !isLoading ? 0.5 : 1 }}
        transition={{ duration: 0.15 }}
      >
        <BoneyardSkeleton
          name="customers-table"
          loading={isLoading}
          animate="shimmer"
          fixture={<CustomerTableFixture />}
        >
          {/* Mobile cards */}
          <div className="flex flex-col gap-3 sm:hidden">
            {customers.length > 0 ? (
              customers.map((customer) => (
                <CustomerCardMobile
                  key={customer.id}
                  customer={customer}
                  onEdit={onEdit}
                  onDelete={setDeleteTarget}
                  onView={onView}
                />
              ))
            ) : (
              <EmptyState
                icon={search ? Search : Users}
                title={search ? "Sin resultados" : "No hay clientes"}
                description={
                  search
                    ? "Intenta con otros terminos de busqueda."
                    : "Agrega tu primer cliente para comenzar."
                }
              >
                {!search && emptyAction}
              </EmptyState>
            )}
          </div>

          {/* Desktop table */}
          <div className="hidden sm:block">
            <DataTable
              columns={columns}
              data={customers}
              isLoading={false}
              pageSize={10}
              emptyState={
                search ? (
                  <EmptyState icon={Search} title="Sin resultados" description="Intenta con otros terminos de busqueda." />
                ) : (
                  <EmptyState icon={Users} title="No hay clientes" description="Agrega tu primer cliente para comenzar.">
                    {emptyAction}
                  </EmptyState>
                )
              }
            />
          </div>
        </BoneyardSkeleton>
      </motion.div>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Eliminar cliente"
        description={`Se eliminara "${deleteTarget?.name}". Esta accion no se puede deshacer.`}
        confirmLabel="Eliminar"
        variant="destructive"
        isLoading={isDeleting}
        onConfirm={handleDelete}
      />
    </motion.div>
  )
}
