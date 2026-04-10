"use client"

import { useState, useMemo, useCallback } from "react"
import { parseAsString, useQueryState } from "nuqs"
import {
  Search,
  ImageIcon,
  ImageOff,
  Database,
  Globe,
  Code2,
  LayoutGrid,
  List,
  ArrowUpDown,
  ExternalLink,
  CheckSquare,
  Square,
  SlidersHorizontal,
} from "lucide-react"
import { motion } from "motion/react"

import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"

import { Skeleton as BoneyardSkeleton } from "boneyard-js/react"

import { BulkActionToolbar } from "./bulk-action-toolbar"
import { MediaBrowserFixture } from "./fixtures/media-browser-fixture"
import type { MediaItem, ImageHostingType } from "../types"

interface MediaBrowserProps {
  items: MediaItem[]
  isLoading: boolean
  onRefresh: () => void
}

type SortKey = "name" | "brand" | "type"
type ViewMode = "grid" | "list"

const SPRING = { type: "spring" as const, stiffness: 300, damping: 35 }

const hostingConfig: Record<
  ImageHostingType,
  { label: string; icon: typeof Database; badgeClass: string }
> = {
  supabase: {
    label: "Supabase",
    icon: Database,
    badgeClass: "bg-teal-50 text-teal-700 border-teal-200/60",
  },
  url: {
    label: "URL externa",
    icon: Globe,
    badgeClass: "bg-blue-50 text-blue-700 border-blue-200/60",
  },
  data: {
    label: "Data URL",
    icon: Code2,
    badgeClass: "bg-violet-50 text-violet-700 border-violet-200/60",
  },
  none: {
    label: "Sin imagen",
    icon: ImageOff,
    badgeClass: "bg-neutral-100 text-neutral-500 border-neutral-200/60",
  },
}

export { hostingConfig }

export function MediaBrowser({ items, isLoading, onRefresh }: MediaBrowserProps) {
  const [search, setSearch] = useQueryState(
    "media_q",
    parseAsString.withDefault("")
  )
  const [hostingFilter, setHostingFilter] = useState<
    ImageHostingType | "all"
  >("all")
  const [sortKey, setSortKey] = useState<SortKey>("name")
  const [viewMode, setViewMode] = useState<ViewMode>("grid")
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const categories = useMemo(() => {
    const set = new Set<string>()
    for (const item of items) {
      if (item.categoryName) set.add(item.categoryName)
    }
    return [...set].sort()
  }, [items])

  const [categoryFilter, setCategoryFilter] = useState<string>("all")

  const filtered = useMemo(() => {
    let result = [...items]

    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (i) =>
          i.productName.toLowerCase().includes(q) ||
          (i.brand?.toLowerCase().includes(q) ?? false)
      )
    }

    if (hostingFilter !== "all") {
      result = result.filter((i) => i.hostingType === hostingFilter)
    }

    if (categoryFilter !== "all") {
      result = result.filter((i) => i.categoryName === categoryFilter)
    }

    result.sort((a, b) => {
      if (sortKey === "name") return a.productName.localeCompare(b.productName)
      if (sortKey === "brand")
        return (a.brand ?? "").localeCompare(b.brand ?? "")
      const order: Record<ImageHostingType, number> = {
        supabase: 0,
        url: 1,
        data: 2,
        none: 3,
      }
      return order[a.hostingType] - order[b.hostingType]
    })

    return result
  }, [items, search, hostingFilter, categoryFilter, sortKey])

  // Selection helpers
  const toggleSelect = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const toggleSelectAll = useCallback(() => {
    setSelected((prev) => {
      if (prev.size === filtered.length) return new Set()
      return new Set(filtered.map((i) => i.productId))
    })
  }, [filtered])

  const clearSelection = useCallback(() => setSelected(new Set()), [])

  const selectedItems = useMemo(
    () => items.filter((i) => selected.has(i.productId)),
    [items, selected]
  )

  const allSelected = filtered.length > 0 && selected.size === filtered.length

  return (
    <div className="space-y-4">
      {/* Bulk actions */}
      <BulkActionToolbar
        selectedItems={selectedItems}
        allItems={items}
        onClearSelection={clearSelection}
        onComplete={onRefresh}
      />

      {/* Toolbar */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...SPRING, delay: 0.15 }}
        className="rounded-xl border border-neutral-200/60 bg-white p-3"
      >
        <div className="flex flex-wrap items-center gap-2">
          {/* Select all */}
          <button
            onClick={toggleSelectAll}
            className={`flex h-9 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium transition-all ${
              allSelected
                ? "border-violet-300 bg-violet-50 text-violet-600"
                : "border-neutral-200/60 text-neutral-500 hover:border-violet-200 hover:bg-violet-50/50 hover:text-violet-500"
            }`}
            title={allSelected ? "Deseleccionar todo" : "Seleccionar todo"}
          >
            {allSelected ? (
              <CheckSquare className="h-3.5 w-3.5 text-violet-500" />
            ) : (
              <Square className="h-3.5 w-3.5" />
            )}
            <span className="hidden sm:inline">Todo</span>
          </button>

          {/* Search */}
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-violet-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value || null)}
              placeholder="Buscar producto..."
              className="h-9 pl-9 text-sm focus-visible:ring-violet-300"
            />
          </div>

          {/* Filters group */}
          <div className="flex items-center gap-1.5">
            <SlidersHorizontal className="h-3 w-3 text-neutral-300" />

            {/* Hosting filter */}
            <Select
              value={hostingFilter}
              onValueChange={(v) =>
                setHostingFilter(v as ImageHostingType | "all")
              }
            >
              <SelectTrigger className="h-9 w-[150px] text-xs">
                <SelectValue placeholder="Tipo">
                  {hostingFilter === "all"
                    ? "Todos los tipos"
                    : hostingConfig[hostingFilter].label}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                <SelectItem value="supabase">Supabase</SelectItem>
                <SelectItem value="url">URL externa</SelectItem>
                <SelectItem value="data">Data URL</SelectItem>
                <SelectItem value="none">Sin imagen</SelectItem>
              </SelectContent>
            </Select>

            {/* Category filter */}
            {categories.length > 0 && (
              <Select
                value={categoryFilter}
                onValueChange={(v) => setCategoryFilter(v ?? "all")}
              >
                <SelectTrigger className="h-9 w-[160px] text-xs">
                  <SelectValue placeholder="Categoria">
                    {categoryFilter === "all"
                      ? "Todas las categorias"
                      : categoryFilter}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las categorias</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Sort */}
            <Select
              value={sortKey}
              onValueChange={(v) => setSortKey(v as SortKey)}
            >
              <SelectTrigger className="h-9 w-[130px] text-xs">
                <ArrowUpDown className="mr-1 h-3 w-3" />
                <SelectValue>
                  {{ name: "Nombre", brand: "Marca", type: "Tipo imagen" }[sortKey]}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Nombre</SelectItem>
                <SelectItem value="brand">Marca</SelectItem>
                <SelectItem value="type">Tipo imagen</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* View toggle */}
          <div className="flex rounded-lg border border-neutral-200/60 p-0.5">
            <button
              onClick={() => setViewMode("grid")}
              className={`rounded-md p-1.5 transition-all ${
                viewMode === "grid"
                  ? "bg-violet-500 text-white shadow-sm shadow-violet-500/20"
                  : "text-neutral-400 hover:text-violet-500"
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`rounded-md p-1.5 transition-all ${
                viewMode === "list"
                  ? "bg-violet-500 text-white shadow-sm shadow-violet-500/20"
                  : "text-neutral-400 hover:text-violet-500"
              }`}
            >
              <List className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Results count */}
      <div className="flex items-center gap-2">
        <p className="text-[11px] text-neutral-400">
          {filtered.length} producto{filtered.length !== 1 ? "s" : ""}
        </p>
        {selected.size > 0 && (
          <Badge variant="secondary" className="bg-violet-100/60 text-violet-700 text-[10px] px-1.5 py-0">
            {selected.size} seleccionado{selected.size !== 1 ? "s" : ""}
          </Badge>
        )}
      </div>

      {/* Grid / List */}
      <BoneyardSkeleton
        name="media-gallery"
        loading={isLoading}
        animate="shimmer"
        fixture={<MediaBrowserFixture />}
      >
        {filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={SPRING}
            className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-violet-200/50 bg-violet-50/20 py-16"
          >
            <motion.div
              animate={{ y: [0, -5, 0] }}
              transition={{ repeat: Infinity, duration: 2.8, ease: "easeInOut" }}
              className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-100 to-violet-200/60"
            >
              <ImageOff className="size-7 text-violet-400" strokeWidth={1.5} />
            </motion.div>
            <p className="mt-4 text-sm font-semibold text-neutral-500">
              No se encontraron productos
            </p>
            <p className="mt-1 text-xs text-neutral-400">
              Intenta cambiar los filtros o el termino de busqueda
            </p>
          </motion.div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {filtered.map((item, i) => (
              <MediaGridCard
                key={item.productId}
                item={item}
                index={i}
                isSelected={selected.has(item.productId)}
                onToggle={() => toggleSelect(item.productId)}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-1.5">
            {filtered.map((item, i) => (
              <MediaListRow
                key={item.productId}
                item={item}
                index={i}
                isSelected={selected.has(item.productId)}
                onToggle={() => toggleSelect(item.productId)}
              />
            ))}
          </div>
        )}
      </BoneyardSkeleton>
    </div>
  )
}

// ── Grid Card ──

function MediaGridCard({
  item,
  index,
  isSelected,
  onToggle,
}: {
  item: MediaItem
  index: number
  isSelected: boolean
  onToggle: () => void
}) {
  const config = hostingConfig[item.hostingType]
  const Icon = config.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, filter: "blur(3px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ ...SPRING, delay: Math.min(index * 0.03, 0.6) }}
      className={`group cursor-pointer overflow-hidden rounded-xl border bg-white transition-all hover:shadow-md hover:shadow-violet-500/[0.06] ${
        isSelected
          ? "border-violet-300 ring-2 ring-violet-200/50 shadow-sm shadow-violet-500/[0.06]"
          : "border-neutral-200/60 hover:-translate-y-0.5"
      }`}
      onClick={onToggle}
    >
      {/* Image area */}
      <div className="relative aspect-square bg-gradient-to-br from-neutral-50 to-neutral-100/50">
        {item.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.imageUrl}
            alt={item.productName}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-1.5">
            <ImageIcon className="h-8 w-8 text-neutral-200" />
            <span className="text-[10px] text-neutral-300">Sin imagen</span>
          </div>
        )}

        {/* Hosting badge overlay */}
        <div className="absolute left-2 top-2">
          <Badge
            variant="outline"
            className={`gap-1 text-[10px] font-medium shadow-sm ${config.badgeClass}`}
          >
            <Icon className="h-2.5 w-2.5" />
            {config.label}
          </Badge>
        </div>

        {/* Selection checkbox */}
        <div className="absolute right-2 top-2">
          <div
            className={`flex h-5 w-5 items-center justify-center rounded-md border transition-all ${
              isSelected
                ? "border-violet-400 bg-violet-500 text-white shadow-sm shadow-violet-500/30"
                : "border-neutral-300 bg-white/80 text-transparent backdrop-blur-sm group-hover:border-violet-300 group-hover:text-violet-300"
            }`}
          >
            <svg
              viewBox="0 0 12 12"
              className="h-3 w-3"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M2 6l3 3 5-5" />
            </svg>
          </div>
        </div>

        {/* External link icon for URL images */}
        {item.hostingType === "url" && item.imageUrl && (
          <a
            href={item.imageUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="absolute bottom-2 right-2 rounded-md bg-white/90 p-1.5 opacity-0 shadow-sm backdrop-blur-sm transition-opacity group-hover:opacity-100"
          >
            <ExternalLink className="h-3 w-3 text-blue-500" />
          </a>
        )}
      </div>

      {/* Info */}
      <div className="p-2.5">
        <p className="truncate text-xs font-semibold text-neutral-800">
          {item.productName}
        </p>
        <p className="truncate text-[11px] text-neutral-400">
          {item.brand ?? "Sin marca"}
          {item.categoryName ? ` · ${item.categoryName}` : ""}
        </p>
      </div>
    </motion.div>
  )
}

// ── List Row ──

function MediaListRow({
  item,
  index,
  isSelected,
  onToggle,
}: {
  item: MediaItem
  index: number
  isSelected: boolean
  onToggle: () => void
}) {
  const config = hostingConfig[item.hostingType]
  const Icon = config.icon

  return (
    <motion.div
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ ...SPRING, delay: Math.min(index * 0.02, 0.4) }}
      className={`group flex cursor-pointer items-center gap-3 rounded-xl border bg-white p-2.5 transition-all hover:shadow-sm ${
        isSelected
          ? "border-violet-300 ring-2 ring-violet-200/50 bg-violet-50/30"
          : "border-neutral-200/60 hover:border-violet-200/60"
      }`}
      onClick={onToggle}
    >
      {/* Checkbox */}
      <div
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-all ${
          isSelected
            ? "border-violet-400 bg-violet-500 text-white"
            : "border-neutral-300 text-transparent group-hover:border-violet-300 group-hover:text-violet-300"
        }`}
      >
        <svg
          viewBox="0 0 12 12"
          className="h-3 w-3"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M2 6l3 3 5-5" />
        </svg>
      </div>

      {/* Thumbnail */}
      <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-neutral-50 to-neutral-100/50">
        {item.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.imageUrl}
            alt={item.productName}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <ImageIcon className="h-4 w-4 text-neutral-200" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-semibold text-neutral-800">
          {item.productName}
        </p>
        <p className="truncate text-[11px] text-neutral-400">
          {item.brand ?? "Sin marca"}
          {item.categoryName ? ` · ${item.categoryName}` : ""}
        </p>
      </div>

      {/* Badge */}
      <Badge
        variant="outline"
        className={`shrink-0 gap-1 text-[10px] font-medium ${config.badgeClass}`}
      >
        <Icon className="h-2.5 w-2.5" />
        {config.label}
      </Badge>
    </motion.div>
  )
}
