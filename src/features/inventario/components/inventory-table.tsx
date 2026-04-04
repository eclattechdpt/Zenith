"use client"

import { useMemo, useState, useRef, useCallback, useEffect, memo } from "react"
import {
  Search,
  X,
  Filter,
  ChevronDown,
  Warehouse,
  Archive,
  LayoutGrid,
  List,
  Eye,
  EyeOff,
} from "lucide-react"
import { useQueryState, parseAsString } from "nuqs"
import { motion, AnimatePresence } from "motion/react"

import { DataTable } from "@/components/shared/data-table"
import { formatCurrency } from "@/lib/utils"
import { useDebounce } from "@/hooks/use-debounce"

import { useInventory, useInitialLoadInventory } from "../queries"
import { useCategories } from "@/features/productos/queries"
import type { InventoryVariant, InventoryType } from "../types"
import { getInventoryColumns } from "./inventory-columns"
import { InventoryCardMobile } from "./inventory-card-mobile"
import { InventoryGridCard } from "./inventory-grid-card"
import { StockAdjustmentDialog } from "./stock-adjustment-dialog"
import { StockEntryDialog } from "./stock-entry-dialog"
import { MovementHistoryDialog } from "./movement-history-dialog"
import { InitialLoadEditDialog } from "./initial-load-edit-dialog"

// ── Spring configs (matching POS) ──────────────────────────────────────────

const SPRING_SNAPPY = { type: "spring" as const, stiffness: 500, damping: 35 }
const SPRING_SMOOTH = { type: "spring" as const, stiffness: 300, damping: 35 }
const PILL_ROW_H = 48

// ── Pill stagger variants ──────────────────────────────────────────────────

const pillContainerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.04, delayChildren: 0.15 } },
}
const pillItemVariants = {
  hidden: { opacity: 0, filter: "blur(4px)" },
  visible: {
    opacity: 1,
    filter: "blur(0px)",
    transition: { duration: 0.2, ease: "easeOut" as const },
  },
}

// ── Card stagger variants ──────────────────────────────────────────────────

const cardListVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05, delayChildren: 0.08 } },
}
const cardItemVariants = {
  hidden: { opacity: 0, y: 12, filter: "blur(4px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const },
  },
}

// ── Accent config per inventory type ───────────────────────────────────────

function getAccentConfig(type: InventoryType) {
  if (type === "initial_load") {
    return {
      ring: "rgba(100, 116, 139, 0.06)",
      focusColor: "rgb(100, 116, 139)",
      neutralColor: "rgb(163, 163, 163)",
      dimColor: "rgb(212, 212, 212)",
      gradient: "from-slate-400 to-slate-300",
      badgeBg: "bg-slate-50",
      badgeText: "text-slate-500",
      pillBg: "bg-slate-500 shadow-sm shadow-slate-500/20",
      toggleActive: "text-slate-500",
      filterBg: "bg-slate-50/60",
      filterIcon: "text-slate-400",
      filterAccent: "text-slate-500",
      clearBtn: "text-slate-400 hover:text-slate-500",
      icon: Archive,
      label: "Carga Inicial",
    }
  }
  return {
    ring: "rgba(245, 158, 11, 0.06)",
    focusColor: "rgb(245, 158, 11)",
    neutralColor: "rgb(163, 163, 163)",
    dimColor: "rgb(212, 212, 212)",
    gradient: "from-amber-400 to-amber-300",
    badgeBg: "bg-amber-50",
    badgeText: "text-amber-600",
    pillBg: "bg-amber-500 shadow-sm shadow-amber-500/20",
    toggleActive: "text-amber-600",
    filterBg: "bg-amber-50/60",
    filterIcon: "text-amber-400",
    filterAccent: "text-amber-500",
    clearBtn: "text-amber-400 hover:text-amber-500",
    icon: Warehouse,
    label: "Inventario Fisico",
  }
}

// ── Category Pill ──────────────────────────────────────────────────────────

interface CategoryPillProps {
  label: string
  isActive: boolean
  onClick: () => void
  pillBg: string
}

const CategoryPill = memo(function CategoryPill({
  label,
  isActive,
  onClick,
  pillBg,
}: CategoryPillProps) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      transition={SPRING_SNAPPY}
      className={`relative flex-shrink-0 whitespace-nowrap rounded-lg px-3 py-1.5 text-[12px] font-semibold transition-colors duration-150 ${
        isActive
          ? "text-white"
          : "text-neutral-500 hover:bg-neutral-100/80 hover:text-neutral-700"
      }`}
    >
      <AnimatePresence>
        {isActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className={`absolute inset-0 rounded-lg ${pillBg}`}
          />
        )}
      </AnimatePresence>
      <span className="relative z-[1]">{label}</span>
    </motion.button>
  )
})

// ── Main Component ─────────────────────────────────────────────────────────

interface InventoryTableProps {
  inventoryType?: InventoryType
}

export function InventoryTable({
  inventoryType = "physical",
}: InventoryTableProps) {
  const accent = getAccentConfig(inventoryType)
  const AccentIcon = accent.icon

  // ── View mode (grid/list, matching productos) ──
  const [viewMode, setViewMode] = useState<"grid" | "list">("list")

  // ── Visibility toggle (persisted, matching POS) ──
  const [visible, setVisible] = useState(true)
  useEffect(() => {
    const stored = localStorage.getItem("zenith-inv-stats-visible")
    if (stored === "false") setVisible(false)
  }, [])
  const toggleVisible = useCallback(() => {
    setVisible((prev) => {
      const next = !prev
      localStorage.setItem("zenith-inv-stats-visible", String(next))
      return next
    })
  }, [])

  // ── Search state (local + debounce) ──
  const [search, setSearch] = useState("")
  const [isFocused, setIsFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const debouncedSearch = useDebounce(search, 250)
  const isSearching = search !== debouncedSearch

  // ── URL-persisted filters ──
  const [categoryFilter, setCategoryFilter] = useQueryState(
    "cat",
    parseAsString.withDefault("")
  )
  const [lowStockFilter, setLowStockFilter] = useQueryState(
    "stock",
    parseAsString.withDefault("")
  )

  // ── Pills expand/collapse ──
  const pillsInnerRef = useRef<HTMLDivElement>(null)
  const [contentHeight, setContentHeight] = useState(PILL_ROW_H)
  const [pillsExpanded, setPillsExpanded] = useState(false)

  useEffect(() => {
    const el = pillsInnerRef.current
    if (!el) return
    const observer = new ResizeObserver(() => {
      const h = el.offsetHeight
      if (h > 0) setContentHeight(h)
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const hasOverflow = contentHeight > PILL_ROW_H + 4

  // ── Categories ──
  const { data: categories = [] } = useCategories()

  const parentCategories = useMemo(
    () => categories.filter((c) => !c.parent_id),
    [categories]
  )

  const expandedCategoryIds = useMemo(() => {
    if (!categoryFilter) return undefined
    const ids: string[] = [categoryFilter]
    const cat = categories.find((c) => c.id === categoryFilter)
    if (cat && !cat.parent_id) {
      categories
        .filter((c) => c.parent_id === categoryFilter)
        .forEach((c) => ids.push(c.id))
    }
    return [...new Set(ids)]
  }, [categoryFilter, categories])

  // ── Queries ──
  const filters = {
    search: debouncedSearch || undefined,
    categoryIds: expandedCategoryIds,
    lowStockOnly: lowStockFilter === "low",
  }

  const physicalQuery = useInventory(filters, {
    enabled: inventoryType === "physical",
  })
  const initialLoadQuery = useInitialLoadInventory(filters, {
    enabled: inventoryType === "initial_load",
  })

  const activeQuery =
    inventoryType === "physical" ? physicalQuery : initialLoadQuery

  const variants = activeQuery.data ?? []
  const isLoading = activeQuery.isLoading
  const isFetched = activeQuery.isFetched
  const isFetching = activeQuery.isFetching
  const hasLoadedOnce = isFetched
  const resultCount = variants.length

  // ── Dialog state ──
  const [adjustTarget, setAdjustTarget] = useState<InventoryVariant | null>(null)
  const [entryTarget, setEntryTarget] = useState<InventoryVariant | null>(null)
  const [historyTarget, setHistoryTarget] = useState<InventoryVariant | null>(null)
  const [editTarget, setEditTarget] = useState<InventoryVariant | null>(null)

  const columns = useMemo(
    () =>
      getInventoryColumns({
        onAdjust: setAdjustTarget,
        onAddStock: setEntryTarget,
        onHistory: setHistoryTarget,
        onEdit: inventoryType === "initial_load" ? setEditTarget : undefined,
        inventoryType,
      }),
    [inventoryType]
  )

  // ── Total value ──
  const totalValue = useMemo(() => {
    return variants.reduce((sum, v) => {
      const stock =
        inventoryType === "initial_load" ? v.initial_stock : v.stock
      const price =
        inventoryType === "initial_load" && v.override_price != null
          ? v.override_price
          : v.price
      return sum + stock * price
    }, 0)
  }, [variants, inventoryType])

  // ── Derived state ──
  const isFiltering =
    debouncedSearch.trim().length > 0 ||
    !!categoryFilter ||
    lowStockFilter === "low"

  const selectedCategoryName = useMemo(() => {
    if (!categoryFilter) return ""
    return (
      parentCategories.find((c) => c.id === categoryFilter)?.name ??
      categories.find((c) => c.id === categoryFilter)?.name ??
      ""
    )
  }, [categoryFilter, parentCategories, categories])

  // ── Handlers ──
  const handleClear = useCallback(() => {
    setSearch("")
    inputRef.current?.focus()
  }, [])

  const handleCategoryToggle = useCallback(
    (id: string) => {
      setCategoryFilter((prev) => (prev === id ? null : id))
    },
    [setCategoryFilter]
  )

  const handleClearAll = useCallback(() => {
    setSearch("")
    setCategoryFilter(null)
    setLowStockFilter(null)
  }, [setCategoryFilter, setLowStockFilter])

  return (
    <div className="rounded-2xl border border-neutral-200/60 bg-neutral-50 p-5 shadow-sm shadow-neutral-900/[0.03] sm:p-7">
      {/* ══════ Toolbar ══════ */}
      <div className="rounded-xl border border-neutral-100/80 bg-white p-4 sm:p-5">
        {/* Row 1: Title + Toggles + Search */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <h2 className="flex items-center gap-2 text-[13px] font-bold uppercase tracking-[1.5px] text-neutral-400">
              <AccentIcon className="h-4 w-4" style={{ color: accent.focusColor }} />
              {accent.label}
              <AnimatePresence mode="wait">
                {hasLoadedOnce && (
                  <motion.span
                    key={resultCount}
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.85 }}
                    transition={SPRING_SNAPPY}
                    className={`ml-1 inline-flex h-5 min-w-[28px] items-center justify-center rounded-full px-1.5 text-[11px] font-bold tabular-nums ${accent.badgeBg} ${accent.badgeText}`}
                  >
                    {resultCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </h2>

            {/* View mode toggle (matching productos) */}
            <div className="ml-2 hidden items-center gap-0.5 rounded-lg border border-neutral-100 bg-neutral-50 p-0.5 sm:flex">
              <button
                onClick={() => setViewMode("grid")}
                className={`flex h-7 w-7 items-center justify-center rounded-md transition-colors ${
                  viewMode === "grid"
                    ? `bg-white ${accent.toggleActive} shadow-sm`
                    : "text-neutral-400 hover:text-neutral-600"
                }`}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`flex h-7 w-7 items-center justify-center rounded-md transition-colors ${
                  viewMode === "list"
                    ? `bg-white ${accent.toggleActive} shadow-sm`
                    : "text-neutral-400 hover:text-neutral-600"
                }`}
              >
                <List className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Visibility toggle (matching POS) */}
            <button
              onClick={toggleVisible}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600"
            >
              {visible ? (
                <Eye className="h-3.5 w-3.5" />
              ) : (
                <EyeOff className="h-3.5 w-3.5" />
              )}
            </button>
          </div>

          {/* Animated search input */}
          <div className="relative w-full sm:w-72">
            <motion.div
              className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2"
              animate={{
                scale: isFocused ? 1.08 : 1,
                color: isFocused
                  ? accent.focusColor
                  : search
                    ? accent.neutralColor
                    : accent.dimColor,
              }}
              transition={SPRING_SNAPPY}
            >
              <Search className="h-4 w-4" />
            </motion.div>

            <motion.div
              animate={{
                boxShadow: isFocused
                  ? `0 0 0 3px ${accent.ring}, 0 2px 8px rgba(0,0,0,0.03)`
                  : "0 0 0 0px rgba(0,0,0,0), 0 0px 0px rgba(0,0,0,0)",
              }}
              transition={SPRING_SNAPPY}
              className="rounded-xl"
            >
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder="Producto, marca o codigo..."
                className="h-10 w-full rounded-xl border border-neutral-200/80 bg-neutral-50/80 pl-10 pr-9 text-[13px] font-medium text-neutral-700 outline-none transition-colors duration-150 placeholder:text-neutral-300"
              />
            </motion.div>

            <AnimatePresence>
              {search.length > 0 && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.5, rotate: -90 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  exit={{ opacity: 0, scale: 0.5, rotate: 90 }}
                  transition={SPRING_SMOOTH}
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
                  className={`absolute bottom-0 left-3 right-3 h-[2px] origin-left rounded-full bg-gradient-to-r ${accent.gradient}`}
                />
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Row 2: Category pills + Low stock pills */}
        <div className="mt-3 flex items-start gap-1.5">
          <div
            className="min-w-0 flex-1 overflow-hidden transition-[height] duration-200 ease-in-out"
            style={{ height: pillsExpanded ? contentHeight : PILL_ROW_H }}
          >
            <motion.div
              ref={pillsInnerRef}
              className="flex flex-wrap items-center gap-1.5 py-1"
              variants={pillContainerVariants}
              initial="hidden"
              animate="visible"
            >
              <motion.div variants={pillItemVariants}>
                <CategoryPill
                  label="Todas"
                  isActive={!categoryFilter}
                  onClick={() => setCategoryFilter(null)}
                  pillBg={accent.pillBg}
                />
              </motion.div>
              {parentCategories.map((cat) => (
                <motion.div key={cat.id} variants={pillItemVariants}>
                  <CategoryPill
                    label={cat.name}
                    isActive={categoryFilter === cat.id}
                    onClick={() => handleCategoryToggle(cat.id)}
                    pillBg={accent.pillBg}
                  />
                </motion.div>
              ))}

              {inventoryType === "physical" && (
                <>
                  <motion.div
                    variants={pillItemVariants}
                    className="mx-1 h-5 w-px bg-neutral-200"
                  />
                  <motion.div variants={pillItemVariants}>
                    <CategoryPill
                      label="Stock bajo"
                      isActive={lowStockFilter === "low"}
                      onClick={() =>
                        setLowStockFilter((prev) =>
                          prev === "low" ? null : "low"
                        )
                      }
                      pillBg="bg-rose-500 shadow-sm shadow-rose-500/20"
                    />
                  </motion.div>
                </>
              )}
            </motion.div>
          </div>

          <AnimatePresence>
            {hasOverflow && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                onClick={() => setPillsExpanded((v) => !v)}
                whileTap={{ scale: 0.9 }}
                className="mt-2 flex-shrink-0 rounded-md p-1 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600"
              >
                <motion.div
                  animate={{ rotate: pillsExpanded ? 180 : 0 }}
                  transition={SPRING_SNAPPY}
                >
                  <ChevronDown className="h-3.5 w-3.5" />
                </motion.div>
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* Row 3: Active filter bar */}
        <div
          className="grid transition-all duration-200 ease-in-out"
          style={{
            gridTemplateRows: isFiltering ? "1fr" : "0fr",
            opacity: isFiltering ? 1 : 0,
            marginTop: isFiltering ? 12 : 0,
          }}
        >
          <div className="min-h-0 overflow-hidden">
            <div className={`flex items-center gap-2 rounded-lg ${accent.filterBg} px-3 py-2`}>
              <Filter className={`h-3 w-3 flex-shrink-0 ${accent.filterIcon}`} />
              <span className="truncate text-[11px] font-semibold text-neutral-500">
                {debouncedSearch && <>&ldquo;{debouncedSearch}&rdquo;</>}
                {debouncedSearch && selectedCategoryName && " en "}
                {selectedCategoryName && (
                  <span className={accent.filterAccent}>{selectedCategoryName}</span>
                )}
                {lowStockFilter === "low" && (
                  <span className="text-rose-500">
                    {(debouncedSearch || selectedCategoryName) && " · "}Stock bajo
                  </span>
                )}
              </span>
              <button
                onClick={handleClearAll}
                className={`ml-auto flex-shrink-0 text-[11px] font-bold transition-colors ${accent.clearBtn}`}
              >
                Limpiar
              </button>
            </div>
          </div>
        </div>

        {/* Total value strip */}
        {hasLoadedOnce && (
          <div className="mt-3 flex items-center justify-between rounded-lg bg-neutral-50 px-4 py-2.5">
            <span className="text-[12px] font-semibold text-neutral-500">
              Valor total del inventario
            </span>
            <AnimatePresence mode="wait">
              {visible ? (
                <motion.span
                  key="val"
                  initial={{ opacity: 0, filter: "blur(4px)" }}
                  animate={{ opacity: 1, filter: "blur(0px)" }}
                  exit={{ opacity: 0, filter: "blur(4px)" }}
                  transition={{ duration: 0.2 }}
                  className="text-[15px] font-bold text-neutral-950 tabular-nums"
                >
                  {formatCurrency(totalValue)}
                </motion.span>
              ) : (
                <motion.span
                  key="hid"
                  initial={{ opacity: 0, filter: "blur(4px)" }}
                  animate={{ opacity: 1, filter: "blur(0px)" }}
                  exit={{ opacity: 0, filter: "blur(4px)" }}
                  transition={{ duration: 0.2 }}
                  className="text-[15px] font-bold tracking-[2px] text-neutral-400 tabular-nums"
                >
                  ******
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* ══════ Results ══════ */}
      <motion.div
        className="mt-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: hasLoadedOnce ? (isFetching ? 0.5 : 1) : 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
      >
        {/* Mobile: always cards */}
        <div className="sm:hidden">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="h-[88px] animate-pulse rounded-2xl bg-neutral-100/80"
                  style={{ animationDelay: `${i * 80}ms` }}
                />
              ))}
            </div>
          ) : variants.length > 0 ? (
            <motion.div
              className="flex flex-col gap-3"
              variants={cardListVariants}
              initial="hidden"
              animate="visible"
            >
              {variants.map((v) => (
                <motion.div key={v.id} variants={cardItemVariants}>
                  <InventoryCardMobile
                    variant={v}
                    inventoryType={inventoryType}
                    visible={visible}
                    onAdjust={setAdjustTarget}
                    onAddStock={setEntryTarget}
                    onHistory={setHistoryTarget}
                    onEdit={inventoryType === "initial_load" ? setEditTarget : undefined}
                  />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <EmptyResults
              hasSearch={!!search}
              isFiltering={isFiltering}
              accentClear={accent.clearBtn}
              onClearAll={handleClearAll}
            />
          )}
        </div>

        {/* Desktop: grid or list based on viewMode */}
        <div className="hidden sm:block">
          {isLoading ? (
            viewMode === "grid" ? (
              <div className="grid grid-cols-2 gap-5 lg:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-[240px] animate-pulse rounded-2xl bg-neutral-100/80"
                    style={{ animationDelay: `${i * 80}ms` }}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-14 animate-pulse rounded-xl bg-neutral-100/80"
                    style={{ animationDelay: `${i * 80}ms` }}
                  />
                ))}
              </div>
            )
          ) : variants.length > 0 ? (
            viewMode === "grid" ? (
              <motion.div
                className="grid grid-cols-2 gap-5 lg:grid-cols-3 xl:grid-cols-4"
                variants={cardListVariants}
                initial="hidden"
                animate="visible"
              >
                {variants.map((v) => (
                  <motion.div key={v.id} variants={cardItemVariants}>
                    <InventoryGridCard
                      variant={v}
                      inventoryType={inventoryType}
                      visible={visible}
                      onAdjust={setAdjustTarget}
                      onAddStock={setEntryTarget}
                      onHistory={setHistoryTarget}
                      onEdit={inventoryType === "initial_load" ? setEditTarget : undefined}
                    />
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <DataTable
                columns={columns}
                data={variants}
                isLoading={false}
                pageSize={20}
              />
            )
          ) : (
            <EmptyResults
              hasSearch={!!search}
              isFiltering={isFiltering}
              accentClear={accent.clearBtn}
              onClearAll={handleClearAll}
            />
          )}
        </div>
      </motion.div>

      {/* ══════ Dialogs ══════ */}
      <StockAdjustmentDialog
        variant={adjustTarget}
        inventoryType={inventoryType}
        onOpenChange={(open) => !open && setAdjustTarget(null)}
      />
      <StockEntryDialog
        variant={entryTarget}
        inventoryType={inventoryType}
        onOpenChange={(open) => !open && setEntryTarget(null)}
      />
      <MovementHistoryDialog
        variant={historyTarget}
        inventoryType={inventoryType}
        onOpenChange={(open) => !open && setHistoryTarget(null)}
      />
      {inventoryType === "initial_load" && (
        <InitialLoadEditDialog
          variant={editTarget}
          onOpenChange={(open) => !open && setEditTarget(null)}
        />
      )}
    </div>
  )
}

// ── Empty state ────────────────────────────────────────────────────────────

function EmptyResults({
  hasSearch,
  isFiltering,
  accentClear,
  onClearAll,
}: {
  hasSearch: boolean
  isFiltering: boolean
  accentClear: string
  onClearAll: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="flex h-48 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-neutral-200 bg-white/50"
    >
      <motion.div
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
      >
        <Search className="h-6 w-6 text-neutral-300" />
      </motion.div>
      <p className="text-sm font-semibold text-neutral-400">
        {hasSearch ? "Sin resultados" : "Sin inventario"}
      </p>
      <p className="text-xs text-neutral-400/70">
        {hasSearch
          ? "Intenta con otro termino de busqueda."
          : "Los productos con stock apareceran aqui."}
      </p>
      {isFiltering && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.2 }}
          whileTap={{ scale: 0.95 }}
          onClick={onClearAll}
          className={`mt-1 text-xs font-bold transition-colors ${accentClear}`}
        >
          Limpiar filtros
        </motion.button>
      )}
    </motion.div>
  )
}
