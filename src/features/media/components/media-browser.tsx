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
} from "lucide-react"

import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"

import { BulkActionToolbar } from "./bulk-action-toolbar"
import type { MediaItem, ImageHostingType } from "../types"

interface MediaBrowserProps {
  items: MediaItem[]
  isLoading: boolean
  onRefresh: () => void
}

type SortKey = "name" | "brand" | "type"
type ViewMode = "grid" | "list"

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

  // Unique categories for filter
  const categories = useMemo(() => {
    const set = new Set<string>()
    for (const item of items) {
      if (item.categoryName) set.add(item.categoryName)
    }
    return [...set].sort()
  }, [items])

  const [categoryFilter, setCategoryFilter] = useState<string>("all")

  // Filter + sort
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

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="aspect-square animate-pulse rounded-xl bg-neutral-100"
          />
        ))}
      </div>
    )
  }

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
      <div className="flex flex-wrap items-center gap-2">
        {/* Select all */}
        <button
          onClick={toggleSelectAll}
          className="flex h-9 items-center gap-1.5 rounded-lg border border-neutral-200/60 px-2.5 text-xs text-neutral-500 transition-colors hover:bg-neutral-50"
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
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value || null)}
            placeholder="Buscar producto..."
            className="h-9 pl-9 text-sm"
          />
        </div>

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

        {/* View toggle */}
        <div className="flex rounded-lg border border-neutral-200/60 p-0.5">
          <button
            onClick={() => setViewMode("grid")}
            className={`rounded-md p-1.5 transition-colors ${
              viewMode === "grid"
                ? "bg-neutral-900 text-white"
                : "text-neutral-400 hover:text-neutral-600"
            }`}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`rounded-md p-1.5 transition-colors ${
              viewMode === "list"
                ? "bg-neutral-900 text-white"
                : "text-neutral-400 hover:text-neutral-600"
            }`}
          >
            <List className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Results count */}
      <p className="text-[11px] text-neutral-400">
        {filtered.length} producto{filtered.length !== 1 ? "s" : ""}
        {selected.size > 0 && (
          <span className="ml-1 text-violet-500">
            · {selected.size} seleccionado{selected.size !== 1 ? "s" : ""}
          </span>
        )}
      </p>

      {/* Grid / List */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-neutral-200 py-16">
          <ImageOff className="h-8 w-8 text-neutral-300" />
          <p className="mt-3 text-sm text-neutral-400">
            No se encontraron productos
          </p>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {filtered.map((item) => (
            <MediaGridCard
              key={item.productId}
              item={item}
              isSelected={selected.has(item.productId)}
              onToggle={() => toggleSelect(item.productId)}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-1.5">
          {filtered.map((item) => (
            <MediaListRow
              key={item.productId}
              item={item}
              isSelected={selected.has(item.productId)}
              onToggle={() => toggleSelect(item.productId)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Grid Card ──

function MediaGridCard({
  item,
  isSelected,
  onToggle,
}: {
  item: MediaItem
  isSelected: boolean
  onToggle: () => void
}) {
  const config = hostingConfig[item.hostingType]
  const Icon = config.icon

  return (
    <div
      className={`group cursor-pointer overflow-hidden rounded-xl border bg-white transition-all hover:shadow-sm ${
        isSelected
          ? "border-violet-300 ring-2 ring-violet-200/50"
          : "border-neutral-200/60"
      }`}
      onClick={onToggle}
    >
      {/* Image area */}
      <div className="relative aspect-square bg-neutral-50">
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
            <ImageIcon className="h-8 w-8 text-neutral-200" />
          </div>
        )}

        {/* Hosting badge overlay */}
        <div className="absolute left-2 top-2">
          <Badge
            variant="outline"
            className={`gap-1 text-[10px] font-medium ${config.badgeClass}`}
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
                ? "border-violet-400 bg-violet-500 text-white"
                : "border-neutral-300 bg-white/80 text-transparent backdrop-blur-sm group-hover:text-neutral-400"
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
            className="absolute bottom-2 right-2 rounded-md bg-white/80 p-1 opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100"
          >
            <ExternalLink className="h-3 w-3 text-neutral-500" />
          </a>
        )}
      </div>

      {/* Info */}
      <div className="p-2.5">
        <p className="truncate text-xs font-medium text-neutral-800">
          {item.productName}
        </p>
        <p className="truncate text-[11px] text-neutral-400">
          {item.brand ?? "Sin marca"}
          {item.categoryName ? ` · ${item.categoryName}` : ""}
        </p>
      </div>
    </div>
  )
}

// ── List Row ──

function MediaListRow({
  item,
  isSelected,
  onToggle,
}: {
  item: MediaItem
  isSelected: boolean
  onToggle: () => void
}) {
  const config = hostingConfig[item.hostingType]
  const Icon = config.icon

  return (
    <div
      className={`group flex cursor-pointer items-center gap-3 rounded-lg border bg-white p-2.5 transition-all hover:shadow-sm ${
        isSelected
          ? "border-violet-300 ring-2 ring-violet-200/50"
          : "border-neutral-200/60"
      }`}
      onClick={onToggle}
    >
      {/* Checkbox */}
      <div
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-all ${
          isSelected
            ? "border-violet-400 bg-violet-500 text-white"
            : "border-neutral-300 text-transparent group-hover:text-neutral-400"
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
      <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-neutral-50">
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
        <p className="truncate text-xs font-medium text-neutral-800">
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
    </div>
  )
}
