"use client"

import { useState, useRef, useMemo, useCallback, useEffect, memo } from "react"
import { Search, X, Filter, ChevronDown } from "lucide-react"
import { motion, AnimatePresence } from "motion/react"
import { useDebounce } from "@/hooks/use-debounce"
import { useCategories } from "@/features/productos/queries"
import { useAllPOSProducts } from "../queries"
import type { POSProductWithImage } from "../queries"
import { POSProductCard } from "./pos-product-card"

// ── Custom lipstick icon (matches Lucide stroke style) ─────────────────────

function LipstickIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect x="8" y="14" width="8" height="8" rx="1" />
      <rect x="9" y="11" width="6" height="3" rx="0.5" />
      <path d="M9 11V7l6-3v7" />
    </svg>
  )
}

// ── Spring configs ──────────────────────────────────────────────────────────
// All near or above critical damping (ζ ≥ ~0.8) to prevent overshoot/wobble.
// SPRING_SMOOTH is critically damped (ζ ≈ 1.01) — used for anything that
// changes layout height so it never overshoots and causes content to bounce.

const SPRING_SNAPPY = { type: "spring" as const, stiffness: 500, damping: 35 }
const SPRING_SMOOTH = { type: "spring" as const, stiffness: 300, damping: 35 }
const SPRING_GENTLE = { type: "spring" as const, stiffness: 200, damping: 28 }

// 1 row of pills (~30px pill + py-1 padding on inner = ~38px, plus headroom)
const PILL_ROW_H = 48

// ── Stagger variants (opacity + blur only — no Y offset to avoid clipping) ─

const pillContainerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.04, delayChildren: 0.15 },
  },
}

const pillItemVariants = {
  hidden: { opacity: 0, filter: "blur(4px)" },
  visible: {
    opacity: 1,
    filter: "blur(0px)",
    transition: { duration: 0.2, ease: "easeOut" as const },
  },
}

// ── Category Pill (multi-select) ────────────────────────────────────────────

interface CategoryPillProps {
  label: string
  isActive: boolean
  onClick: () => void
}

const CategoryPill = memo(function CategoryPill({
  label,
  isActive,
  onClick,
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
            className="absolute inset-0 rounded-lg bg-rose-500 shadow-sm shadow-rose-500/20"
          />
        )}
      </AnimatePresence>
      <span className="relative z-[1]">{label}</span>
    </motion.button>
  )
})

// ── Main Grid ───────────────────────────────────────────────────────────────

interface POSProductGridProps {
  onAdd: (product: POSProductWithImage) => void
  onEditProduct?: (productId: string) => void
}

export function POSProductGrid({ onAdd, onEditProduct }: POSProductGridProps) {
  const [search, setSearch] = useState("")
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(
    new Set()
  )
  const [isFocused, setIsFocused] = useState(false)
  const [pillsExpanded, setPillsExpanded] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const pillsInnerRef = useRef<HTMLDivElement>(null)
  const [contentHeight, setContentHeight] = useState(PILL_ROW_H)
  const debouncedSearch = useDebounce(search, 250)

  const { data: categories } = useCategories()

  // ── Measure pills wrap height via ResizeObserver ──
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

  // ── Build category filter IDs (each selected parent + children) ──
  const categoryIds = useMemo(() => {
    if (selectedCategories.size === 0 || !categories) return null
    const ids: string[] = []
    for (const catId of selectedCategories) {
      ids.push(catId)
      const cat = categories.find((c) => c.id === catId)
      if (cat && !cat.parent_id) {
        categories
          .filter((c) => c.parent_id === catId)
          .forEach((c) => ids.push(c.id))
      }
    }
    return [...new Set(ids)]
  }, [selectedCategories, categories])

  const { data: products, isLoading, isFetching } = useAllPOSProducts(
    debouncedSearch,
    categoryIds
  )

  // Parent categories for pills
  const parentCategories = useMemo(
    () => (categories ?? []).filter((c) => !c.parent_id),
    [categories]
  )

  // ── Handlers ──

  const handleClear = useCallback(() => {
    setSearch("")
    inputRef.current?.focus()
  }, [])

  const handleCategoryToggle = useCallback((id: string) => {
    setSelectedCategories((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const handleClearAll = useCallback(() => {
    setSearch("")
    setSelectedCategories(new Set())
  }, [])

  // ── Derived state ──

  const resultCount = (products ?? []).length
  const isFiltering =
    debouncedSearch.trim().length > 0 || selectedCategories.size > 0
  const isSearching = search !== debouncedSearch

  const selectedNames = useMemo(() => {
    if (selectedCategories.size === 0) return ""
    return [...selectedCategories]
      .map((id) => parentCategories.find((c) => c.id === id)?.name)
      .filter(Boolean)
      .join(", ")
  }, [selectedCategories, parentCategories])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="rounded-2xl border border-neutral-200/60 bg-neutral-50 p-5 shadow-sm shadow-neutral-900/[0.03] sm:p-7"
    >
      {/* ══════ Controls — toolbar ══════ */}
      <div className="rounded-xl border border-neutral-100/80 bg-white p-4 sm:p-5">
      <div>
        {/* Row 1: Title + Search */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="flex items-center gap-2 text-[13px] font-bold uppercase tracking-[1.5px] text-neutral-400">
            <LipstickIcon className="h-4 w-4 text-rose-300" />
            Todos los productos
            <AnimatePresence mode="wait">
              {!isLoading && (
                <motion.span
                  key={resultCount}
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.85 }}
                  transition={SPRING_SNAPPY}
                  className="ml-1 inline-flex h-5 min-w-[28px] items-center justify-center rounded-full bg-rose-50 px-1.5 text-[11px] font-bold tabular-nums text-rose-500"
                >
                  {resultCount}
                </motion.span>
              )}
            </AnimatePresence>
          </h2>

          {/* Search input */}
          <div className="relative w-full sm:w-72">
            <motion.div
              className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2"
              animate={{
                scale: isFocused ? 1.08 : 1,
                color: isFocused
                  ? "rgb(244, 63, 94)"
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
                  ? "0 0 0 3px rgba(244, 63, 94, 0.06), 0 2px 8px rgba(0,0,0,0.03)"
                  : "0 0 0 0px rgba(244, 63, 94, 0), 0 0px 0px rgba(0,0,0,0)",
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
                className="h-10 w-full rounded-xl border border-neutral-200/80 bg-neutral-50/80 pl-10 pr-9 text-[13px] font-medium text-neutral-700 outline-none transition-colors duration-150 placeholder:text-neutral-300 focus:border-rose-200/80"
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
                  className="absolute bottom-0 left-3 right-3 h-[2px] origin-left rounded-full bg-gradient-to-r from-rose-400 to-rose-300"
                />
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Row 2: Wrapping category pills with expand/collapse */}
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
                  isActive={selectedCategories.size === 0}
                  onClick={() => setSelectedCategories(new Set())}
                />
              </motion.div>
              {parentCategories.map((cat) => (
                <motion.div key={cat.id} variants={pillItemVariants}>
                  <CategoryPill
                    label={cat.name}
                    isActive={selectedCategories.has(cat.id)}
                    onClick={() => handleCategoryToggle(cat.id)}
                  />
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Expand/collapse chevron (appears only when pills wrap past 1 row) */}
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

        {/* Row 3: Active filter bar — CSS grid-rows for smooth height */}
        <div
          className="grid transition-all duration-200 ease-in-out"
          style={{
            gridTemplateRows: isFiltering ? "1fr" : "0fr",
            opacity: isFiltering ? 1 : 0,
            marginTop: isFiltering ? 12 : 0,
          }}
        >
          <div className="min-h-0 overflow-hidden">
            <div className="flex items-center gap-2 rounded-lg bg-rose-50/60 px-3 py-2">
              <Filter className="h-3 w-3 flex-shrink-0 text-rose-400" />
              <span className="truncate text-[11px] font-semibold text-neutral-500">
                {debouncedSearch && (
                  <>&ldquo;{debouncedSearch}&rdquo;</>
                )}
                {debouncedSearch && selectedNames && " en "}
                {selectedNames && (
                  <span className="text-rose-500">{selectedNames}</span>
                )}
              </span>
              <button
                onClick={handleClearAll}
                className="ml-auto flex-shrink-0 text-[11px] font-bold text-rose-400 transition-colors hover:text-rose-500"
              >
                Limpiar
              </button>
            </div>
          </div>
        </div>
      </div>
      </div>

      {/* ══════ Results ══════ */}
      <motion.div
        className="mt-6"
        animate={{ opacity: isFetching && !isLoading ? 0.5 : 1 }}
        transition={{ duration: 0.15 }}
      >
        {isLoading ? (
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="h-[240px] animate-pulse rounded-2xl bg-neutral-100/80"
                style={{ animationDelay: `${i * 80}ms` }}
              />
            ))}
          </div>
        ) : resultCount === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="flex h-48 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-neutral-200 bg-white/50"
          >
            <motion.div
              animate={{ y: [0, -4, 0] }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <Search className="h-6 w-6 text-neutral-300" />
            </motion.div>
            <p className="text-sm font-semibold text-neutral-400">
              No se encontraron productos
            </p>
            {isFiltering && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15, duration: 0.2 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleClearAll}
                className="mt-1 text-xs font-bold text-rose-400 transition-colors hover:text-rose-500"
              >
                Limpiar filtros
              </motion.button>
            )}
          </motion.div>
        ) : (
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
            {(products ?? []).map((product) => (
              <POSProductCard
                key={product.id}
                product={product}
                onAdd={onAdd}
                onEdit={onEditProduct}
              />
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}
