"use client"

import { useMemo, useState } from "react"
import { Search, Warehouse } from "lucide-react"
import { useQueryState, parseAsString } from "nuqs"
import { motion } from "motion/react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DataTable } from "@/components/shared/data-table"
import { EmptyState } from "@/components/shared/empty-state"

import { useInventory } from "../queries"
import { useCategories } from "@/features/productos/queries"
import type { InventoryVariant } from "../types"
import { getInventoryColumns } from "./inventory-columns"
import { InventoryCardMobile } from "./inventory-card-mobile"
import { StockAdjustmentDialog } from "./stock-adjustment-dialog"
import { StockEntryDialog } from "./stock-entry-dialog"
import { MovementHistoryDialog } from "./movement-history-dialog"

const LOW_STOCK_TABS = [
  { value: "", label: "Todos" },
  { value: "low", label: "Stock bajo" },
] as const

export function InventoryTable() {
  const [search, setSearch] = useQueryState("q", parseAsString.withDefault(""))
  const [categoryFilter, setCategoryFilter] = useQueryState(
    "cat",
    parseAsString.withDefault("")
  )
  const [lowStockFilter, setLowStockFilter] = useQueryState(
    "stock",
    parseAsString.withDefault("")
  )

  const {
    data: variants = [],
    isLoading,
    isFetched,
    isFetching,
  } = useInventory({
    search: search || undefined,
    categoryId: categoryFilter || undefined,
    lowStockOnly: lowStockFilter === "low",
  })

  const { data: categories = [] } = useCategories()

  // isFetched stays true once the first fetch completes — safe to use directly
  const hasLoadedOnce = isFetched

  // Dialog state
  const [adjustTarget, setAdjustTarget] = useState<InventoryVariant | null>(null)
  const [entryTarget, setEntryTarget] = useState<InventoryVariant | null>(null)
  const [historyTarget, setHistoryTarget] = useState<InventoryVariant | null>(null)

  const columns = useMemo(
    () =>
      getInventoryColumns({
        onAdjust: setAdjustTarget,
        onAddStock: setEntryTarget,
        onHistory: setHistoryTarget,
      }),
    []
  )

  // Build category options (parent + children grouped)
  const categoryOptions = useMemo(() => {
    const parents = categories.filter((c) => !c.parent_id)
    const children = categories.filter((c) => c.parent_id)

    const options: { value: string; label: string; isParent: boolean }[] = []
    for (const parent of parents) {
      options.push({ value: parent.id, label: parent.name, isParent: true })
      const subs = children.filter((c) => c.parent_id === parent.id)
      for (const sub of subs) {
        options.push({ value: sub.id, label: sub.name, isParent: false })
      }
    }
    return options
  }, [categories])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: hasLoadedOnce ? 1 : 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="space-y-4 overflow-hidden rounded-2xl border border-amber-100 bg-gradient-to-b from-white to-amber-50/30 p-4 shadow-sm sm:p-6"
    >
      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-sm">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-neutral-400" />
          <Input
            placeholder="Buscar por producto, marca o codigo..."
            value={search}
            onChange={(e) => setSearch(e.target.value || null)}
            className="pl-9"
          />
        </div>

        <Select
          value={categoryFilter || null}
          onValueChange={(v) => setCategoryFilter(v)}
        >
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Todas las categorias" />
          </SelectTrigger>
          <SelectContent>
            {categoryOptions.map((opt) => (
              <SelectItem
                key={opt.value}
                value={opt.value}
                className={opt.isParent ? "font-semibold" : "pl-6"}
              >
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex gap-1">
          {LOW_STOCK_TABS.map((tab) => (
            <Button
              key={tab.value}
              variant={lowStockFilter === tab.value ? "default" : "ghost"}
              size="sm"
              onClick={() => setLowStockFilter(tab.value || null)}
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
        style={{ opacity: isFetching && hasLoadedOnce ? 0.5 : 1 }}
      >
        {/* Mobile cards */}
        <div className="flex flex-col gap-3 sm:hidden">
          {variants.length > 0 ? (
            variants.map((v) => (
              <InventoryCardMobile
                key={v.id}
                variant={v}
                onAdjust={setAdjustTarget}
                onAddStock={setEntryTarget}
                onHistory={setHistoryTarget}
              />
            ))
          ) : (
            <EmptyState
              icon={search ? Search : Warehouse}
              title={search ? "Sin resultados" : "Sin inventario"}
              description={
                search
                  ? "Intenta con otro termino de busqueda."
                  : "Los productos con stock apareceran aqui."
              }
            />
          )}
        </div>

        {/* Desktop table */}
        <div className="hidden sm:block">
          <DataTable
            columns={columns}
            data={variants}
            isLoading={isLoading}
            pageSize={20}
            emptyState={
              search || lowStockFilter ? (
                <EmptyState
                  icon={Search}
                  title="Sin resultados"
                  description="Intenta con otros filtros."
                />
              ) : (
                <EmptyState
                  icon={Warehouse}
                  title="Sin inventario"
                  description="Los productos con stock apareceran aqui."
                />
              )
            }
          />
        </div>
      </div>

      {/* Dialogs */}
      <StockAdjustmentDialog
        variant={adjustTarget}
        onOpenChange={(open) => !open && setAdjustTarget(null)}
      />
      <StockEntryDialog
        variant={entryTarget}
        onOpenChange={(open) => !open && setEntryTarget(null)}
      />
      <MovementHistoryDialog
        variant={historyTarget}
        onOpenChange={(open) => !open && setHistoryTarget(null)}
      />
    </motion.div>
  )
}
