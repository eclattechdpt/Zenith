"use client"

import { useMemo, useState } from "react"
import {
  Activity as ActivityIcon,
  Search,
  X,
  Inbox,
} from "lucide-react"
import { motion, LayoutGroup } from "motion/react"
import {
  format,
  isToday,
  isYesterday,
  startOfDay,
} from "date-fns"
import { es } from "date-fns/locale"

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn, formatCurrency } from "@/lib/utils"
import { useActivityFeed, type FullActivityItem } from "../queries"
import { activityIconMap, activityStyleMap } from "./activity-feed"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type FilterKey =
  | "all"
  | "ventas"
  | "devoluciones"
  | "vales"
  | "notas_credito"
  | "canceladas"
  | "exportaciones"

const FILTERS: { key: FilterKey; label: string; tipos: string[] }[] = [
  { key: "all", label: "Todos", tipos: [] },
  { key: "ventas", label: "Ventas", tipos: ["venta", "pendiente"] },
  { key: "devoluciones", label: "Devoluciones", tipos: ["devolucion"] },
  { key: "vales", label: "Vales", tipos: ["vale", "vale_completado"] },
  {
    key: "notas_credito",
    label: "Notas de crédito",
    tipos: ["nota_credito", "nota_liquidada"],
  },
  { key: "canceladas", label: "Canceladas", tipos: ["cancelacion"] },
  { key: "exportaciones", label: "Exportaciones", tipos: ["exportacion"] },
]

const SPRING = { type: "spring" as const, stiffness: 260, damping: 26 }

function dayLabel(d: Date): string {
  if (isToday(d)) return "Hoy"
  if (isYesterday(d)) return "Ayer"
  const formatted = format(d, "EEEE d 'de' MMMM", { locale: es })
  return formatted.charAt(0).toUpperCase() + formatted.slice(1)
}

function shortDate(d: Date): string | null {
  if (isToday(d) || isYesterday(d)) {
    return format(d, "d 'de' MMM", { locale: es })
  }
  return null
}

export function ActivityFeedDialog({ open, onOpenChange }: Props) {
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<FilterKey>("all")
  const { data, isPending } = useActivityFeed({ enabled: open })

  const filtered = useMemo(() => {
    if (!data) return []
    const activeTipos = FILTERS.find((f) => f.key === filter)?.tipos ?? []
    const q = search.trim().toLowerCase()
    return data.filter((it) => {
      if (activeTipos.length > 0 && !activeTipos.includes(it.tipo)) return false
      if (!q) return true
      return (
        it.descripcion.toLowerCase().includes(q) ||
        it.detalle.toLowerCase().includes(q)
      )
    })
  }, [data, filter, search])

  const grouped = useMemo(() => {
    const groups = new Map<number, FullActivityItem[]>()
    for (const it of filtered) {
      const key = startOfDay(new Date(it.createdAt)).getTime()
      const arr = groups.get(key) ?? []
      arr.push(it)
      groups.set(key, arr)
    }
    return Array.from(groups.entries())
      .sort((a, b) => b[0] - a[0])
      .map(([key, items]) => ({ key, date: new Date(key), items }))
  }, [filtered])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="flex h-[85vh] w-[95vw] flex-col gap-0 overflow-hidden bg-white p-0 sm:max-w-2xl sm:rounded-2xl"
      >
        {/* Header */}
        <div className="shrink-0 border-b border-neutral-100 px-6 pt-6 pb-4">
          <div className="flex items-start gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-blush-100">
              <ActivityIcon
                className="size-5 text-blush-600"
                strokeWidth={1.75}
              />
            </div>
            <div className="min-w-0 flex-1">
              <DialogTitle className="font-heading text-[17px] text-neutral-900">
                Actividad reciente
              </DialogTitle>
              <p className="mt-0.5 text-[12px] text-neutral-500">
                Últimos 30 días
                {data && (
                  <span className="ml-1.5 inline-flex items-center rounded-full bg-neutral-100 px-1.5 py-0.5 text-[10px] font-semibold text-neutral-600 tabular-nums">
                    {filtered.length}{" "}
                    {filtered.length === 1 ? "evento" : "eventos"}
                  </span>
                )}
              </p>
            </div>
            <motion.button
              type="button"
              onClick={() => onOpenChange(false)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.9 }}
              className="flex size-8 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700"
              aria-label="Cerrar"
            >
              <X className="size-4" />
            </motion.button>
          </div>

          {/* Search */}
          <div className="relative mt-4">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar descripción o detalle"
              className="h-10 w-full rounded-lg border border-neutral-200 bg-neutral-50/50 pl-9 pr-9 text-[13px] text-neutral-800 placeholder:text-neutral-400 outline-none transition-colors focus:border-neutral-300 focus:bg-white focus:ring-2 focus:ring-neutral-900/5"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute top-1/2 right-2 flex size-6 -translate-y-1/2 items-center justify-center rounded-md text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          {/* Filter chips */}
          <LayoutGroup id="activity-filter">
            <div className="mt-3 -mx-1 flex gap-1.5 overflow-x-auto scrollbar-none px-1 pb-0.5">
              {FILTERS.map((f) => {
                const active = filter === f.key
                return (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => setFilter(f.key)}
                    className={cn(
                      "relative shrink-0 rounded-full px-3 py-1.5 text-[11px] font-semibold transition-colors",
                      active
                        ? "text-white"
                        : "text-neutral-500 hover:text-neutral-800"
                    )}
                  >
                    {active && (
                      <motion.div
                        layoutId="filter-pill"
                        transition={SPRING}
                        className="absolute inset-0 rounded-full bg-gradient-to-br from-rose-500 to-rose-600 shadow-sm shadow-rose-500/25"
                      />
                    )}
                    <span className="relative z-10">{f.label}</span>
                  </button>
                )
              })}
            </div>
          </LayoutGroup>
        </div>

        {/* List */}
        <div className="min-h-0 flex-1 overflow-y-auto">
          {isPending ? (
            <SkeletonList />
          ) : grouped.length === 0 ? (
            <EmptyState hasFilter={search !== "" || filter !== "all"} />
          ) : (
            <div key={filter} className="pb-4">
              {grouped.map((group, gi) => (
                <section key={group.key} className="relative">
                  <DayHeader
                    label={dayLabel(group.date)}
                    sublabel={shortDate(group.date)}
                    count={group.items.length}
                  />
                  <div className="space-y-0.5 px-3 pt-1 pb-2">
                    {group.items.map((item, i) => (
                      <ActivityRow
                        key={item.id}
                        item={item}
                        delay={Math.min(gi * 0.04 + i * 0.015, 0.45)}
                      />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function DayHeader({
  label,
  sublabel,
  count,
}: {
  label: string
  sublabel: string | null
  count: number
}) {
  return (
    <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-md">
      <div className="mx-3 flex items-baseline justify-between gap-3 border-b border-neutral-100 py-3">
        <div className="flex min-w-0 items-baseline gap-2">
          <h3 className="truncate text-[13px] font-bold text-neutral-900">
            {label}
          </h3>
          {sublabel && (
            <span className="shrink-0 text-[11px] font-medium text-neutral-400 tabular-nums">
              {sublabel}
            </span>
          )}
        </div>
        <span className="shrink-0 rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-bold tabular-nums text-neutral-600">
          {count} {count === 1 ? "evento" : "eventos"}
        </span>
      </div>
    </div>
  )
}

function ActivityRow({
  item,
  delay,
}: {
  item: FullActivityItem
  delay: number
}) {
  const Icon = activityIconMap[item.tipo] ?? activityIconMap.venta
  const styles = activityStyleMap[item.tipo] ?? activityStyleMap.venta
  const isNegative = item.monto !== null && item.monto < 0
  const time = format(new Date(item.createdAt), "HH:mm")

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...SPRING, delay }}
      whileHover={{ x: 2 }}
      className="group flex items-center gap-3 rounded-xl px-4 py-2.5 transition-colors hover:bg-neutral-50"
    >
      <div
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-105",
          styles.bg
        )}
      >
        <Icon className={cn("size-4", styles.color)} strokeWidth={1.75} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-semibold text-neutral-800">
          {item.descripcion}
        </p>
        <p className="truncate text-[11px] text-neutral-500">{item.detalle}</p>
      </div>
      <div className="shrink-0 text-right">
        {item.monto !== null ? (
          <span
            className={cn(
              "text-[13px] font-bold tabular-nums",
              isNegative ? "text-rose-500" : "text-neutral-900"
            )}
          >
            {isNegative ? "-" : ""}
            {formatCurrency(Math.abs(item.monto))}
          </span>
        ) : (
          <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-semibold text-violet-600">
            exportado
          </span>
        )}
        <p className="text-[10px] text-neutral-400 tabular-nums">{time}</p>
      </div>
    </motion.div>
  )
}

function SkeletonList() {
  return (
    <div className="space-y-2 px-4 py-2">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 rounded-xl px-2 py-2.5"
        >
          <div className="size-9 shrink-0 animate-pulse rounded-xl bg-neutral-100" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 w-2/3 animate-pulse rounded bg-neutral-100" />
            <div className="h-2.5 w-1/2 animate-pulse rounded bg-neutral-100" />
          </div>
          <div className="h-4 w-16 animate-pulse rounded bg-neutral-100" />
        </div>
      ))}
    </div>
  )
}

function EmptyState({ hasFilter }: { hasFilter: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={SPRING}
      className="flex h-full min-h-[260px] flex-col items-center justify-center px-6 text-center"
    >
      <motion.div
        animate={{ y: [0, -4, 0] }}
        transition={{ repeat: Infinity, duration: 2.8, ease: "easeInOut" }}
        className="mb-3 flex size-14 items-center justify-center rounded-2xl bg-neutral-100"
      >
        <Inbox className="size-6 text-neutral-400" strokeWidth={1.75} />
      </motion.div>
      <p className="text-[13px] font-semibold text-neutral-800">
        {hasFilter ? "Sin resultados" : "Sin actividad"}
      </p>
      <p className="mt-1 max-w-[280px] text-[11px] text-neutral-500">
        {hasFilter
          ? "Prueba con otros filtros o limpia la búsqueda."
          : "No hay eventos registrados en los últimos 30 días."}
      </p>
    </motion.div>
  )
}
