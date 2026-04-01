"use client"

import { useMemo, useRef, useState } from "react"
import { Search, Receipt } from "lucide-react"
import { useQueryState, parseAsString } from "nuqs"
import { motion } from "motion/react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
  { value: "cancelled", label: "Canceladas" },
] as const

export function SalesTable() {
  const [search, setSearch] = useQueryState("q", parseAsString.withDefault(""))
  const [statusFilter, setStatusFilter] = useQueryState(
    "status",
    parseAsString.withDefault("")
  )

  const {
    data: sales = [],
    isLoading,
    isFetched,
    isFetching,
  } = useSales({
    search: search || undefined,
    status: statusFilter || undefined,
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
