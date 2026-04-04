"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  Warehouse,
  Truck,
  Archive,
  ArrowRight,
  CalendarDays,
  AlertTriangle,
  Package,
  TrendingUp,
  Eye,
  EyeOff,
  ShieldCheck,
  BarChart3,
} from "lucide-react"
import { motion, AnimatePresence } from "motion/react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/utils"
import {
  useInventorySummary,
  useLowStockAlerts,
  useTransitMonthSummary,
} from "@/features/inventario/queries"

// ── Animations ──

const SPRING_HOVER = { type: "spring" as const, stiffness: 300, damping: 20 }

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.05 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 12, filter: "blur(4px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const },
  },
}

const MONTH_SHORT = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
]

export default function InventarioPage() {
  const { data: summary } = useInventorySummary()
  const { data: lowStockItems = [] } = useLowStockAlerts()
  const currentYear = new Date().getFullYear()
  const { data: monthSummary = [] } = useTransitMonthSummary(currentYear)
  const today = format(new Date(), "EEEE, d 'de' MMMM", { locale: es })

  // ── Visibility toggle (persisted) ──
  const [visible, setVisible] = useState(true)
  useEffect(() => {
    const stored = localStorage.getItem("zenith-inv-visible")
    if (stored === "false") setVisible(false)
  }, [])
  function toggleVisible() {
    setVisible((v) => {
      localStorage.setItem("zenith-inv-visible", String(!v))
      return !v
    })
  }

  // ── Derived data ──
  const outOfStockCount = lowStockItems.filter((v) => v.stock <= 0).length
  const lowStockCount = lowStockItems.filter((v) => v.stock > 0).length
  const totalWeeks = monthSummary.reduce((s, m) => s + m.week_count, 0)
  const transitMaxMonth = Math.max(...monthSummary.map((m) => m.total_value), 1)
  const grandTotal = summary?.grand_total ?? 0
  const initialPct = grandTotal > 0 ? Math.round(((summary?.initial_load_total ?? 0) / grandTotal) * 100) : 0

  const fmtValue = (val: number) => (visible ? formatCurrency(val) : "******")

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="min-w-0 flex-1 p-5 sm:p-8"
    >
      {/* ── Header ── */}
      <motion.div variants={itemVariants} className="text-center sm:text-left">
        <p className="flex items-center justify-center gap-1.5 text-[11px] font-bold uppercase tracking-[2px] text-neutral-400 sm:justify-start">
          <CalendarDays className="h-3.5 w-3.5" />
          {today}
        </p>
        <h1 className="mt-2 font-display text-[32px] font-semibold leading-none tracking-[-1px] text-neutral-950 sm:text-[40px]">
          Inventario
        </h1>
      </motion.div>

      {/* ── Grand Total Widget ── */}
      {summary && (
        <motion.div
          variants={itemVariants}
          className="relative mt-6 overflow-hidden rounded-2xl border border-neutral-200/60 bg-gradient-to-br from-neutral-900 to-neutral-800 p-5 shadow-sm sm:p-6"
        >
          {/* Decorative ring */}
          <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full border-[20px] border-white/[0.04]" />

          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[2px] text-neutral-400">
                Valor total combinado
              </p>
              <AnimatePresence mode="wait">
                {visible ? (
                  <motion.p
                    key="value"
                    initial={{ opacity: 0, filter: "blur(8px)" }}
                    animate={{ opacity: 1, filter: "blur(0px)" }}
                    exit={{ opacity: 0, filter: "blur(8px)" }}
                    transition={{ duration: 0.2 }}
                    className="mt-1.5 font-display text-[36px] font-bold leading-none tracking-[-1px] text-white tabular-nums sm:text-[42px]"
                  >
                    {formatCurrency(grandTotal)}
                  </motion.p>
                ) : (
                  <motion.p
                    key="hidden"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="mt-1.5 font-display text-[36px] font-bold leading-none tracking-[4px] text-white/50 sm:text-[42px]"
                  >
                    ******
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
            <button
              onClick={toggleVisible}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-white/40 transition-colors hover:bg-white/10 hover:text-white"
            >
              {visible ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
            </button>
          </div>

          {/* Breakdown pills */}
          <div className="mt-4 flex flex-wrap gap-3">
            <div className="flex items-center gap-2 rounded-lg bg-white/[0.07] px-3 py-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-400" />
              <span className="text-[11px] text-neutral-400">Fisico</span>
              <span className="text-[12px] font-bold text-white tabular-nums">
                {fmtValue(summary.physical_total)}
              </span>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-white/[0.07] px-3 py-1.5">
              <span className="h-2 w-2 rounded-full bg-blue-400" />
              <span className="text-[11px] text-neutral-400">Transito</span>
              <span className="text-[12px] font-bold text-white tabular-nums">
                {fmtValue(summary.transit_total)}
              </span>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-white/[0.07] px-3 py-1.5">
              <span className="h-2 w-2 rounded-full bg-slate-400" />
              <span className="text-[11px] text-neutral-400">Carga inicial</span>
              <span className="text-[12px] font-bold text-white tabular-nums">
                {fmtValue(summary.initial_load_total)}
              </span>
            </div>
          </div>
        </motion.div>
      )}

      {/* ── Physical Inventory Panel (full width) ── */}
      <motion.div variants={itemVariants} className="mt-6" whileHover={{ y: -2 }} transition={SPRING_HOVER}>
        <Link
          href="/inventario/fisico"
          className="group block rounded-2xl border border-amber-200/60 bg-white shadow-sm transition-[border-color,box-shadow] duration-200 hover:border-amber-300 hover:shadow-md hover:shadow-amber-500/8"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-5 sm:px-6 sm:pt-6">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-amber-50">
                <Warehouse className="size-5 text-amber-600" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-[13px] font-semibold text-neutral-950">Inventario Fisico</p>
                <p className="text-[11px] text-neutral-500">Stock actual del almacen</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <p className="font-display text-xl font-bold tracking-[-0.5px] text-neutral-950 tabular-nums sm:text-2xl">
                {fmtValue(summary?.physical_total ?? 0)}
              </p>
              <ArrowRight className="size-4 text-neutral-300 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-neutral-500" />
            </div>
          </div>

          {/* Content: two columns on desktop */}
          <div className="mt-3 grid border-t border-neutral-100 sm:grid-cols-2">
            {/* Left: Low stock alerts */}
            <div className="px-5 py-4 sm:border-r sm:border-neutral-100 sm:px-6">
              <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-600">
                <AlertTriangle className="size-3" />
                Alertas de stock
              </p>
              {lowStockItems.length > 0 ? (
                <>
                  <div className="mt-2 flex gap-3">
                    {outOfStockCount > 0 && (
                      <span className="rounded-md bg-rose-50 px-2 py-0.5 text-[11px] font-bold text-rose-600">
                        {outOfStockCount} sin stock
                      </span>
                    )}
                    {lowStockCount > 0 && (
                      <span className="rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-600">
                        {lowStockCount} bajo
                      </span>
                    )}
                  </div>
                  <div className="mt-3 space-y-1.5">
                    {lowStockItems.slice(0, 6).map((v) => (
                      <div key={v.id} className="flex items-center justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <span className="truncate text-[12px] text-neutral-700">
                            {v.products.name}
                          </span>
                          {v.products.brand && (
                            <span className="ml-1.5 text-[10px] text-neutral-400">{v.products.brand}</span>
                          )}
                        </div>
                        <Badge
                          variant="outline"
                          className={`shrink-0 text-[9px] ${
                            v.stock <= 0
                              ? "border-rose-200 bg-rose-50 text-rose-700"
                              : "border-amber-200 bg-amber-50 text-amber-700"
                          }`}
                        >
                          {v.stock <= 0 ? "Sin stock" : `${v.stock} / ${v.stock_min}`}
                        </Badge>
                      </div>
                    ))}
                    {lowStockItems.length > 6 && (
                      <p className="text-[11px] font-medium text-neutral-400">
                        +{lowStockItems.length - 6} mas...
                      </p>
                    )}
                  </div>
                </>
              ) : (
                <p className="mt-2 flex items-center gap-1.5 text-[11px] font-medium text-emerald-600">
                  <ShieldCheck className="size-3.5" />
                  Todo en orden — sin alertas de stock
                </p>
              )}
            </div>

            {/* Right: Stock health summary */}
            <div className="border-t border-neutral-100 px-5 py-4 sm:border-t-0 sm:px-6">
              <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                <BarChart3 className="size-3" />
                Resumen
              </p>
              <div className="mt-3 space-y-3">
                {/* Health bar */}
                <div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-neutral-500">Salud del inventario</span>
                    <span className="font-semibold text-neutral-700">
                      {lowStockItems.length === 0
                        ? "Excelente"
                        : lowStockItems.length <= 3
                          ? "Buena"
                          : "Requiere atencion"}
                    </span>
                  </div>
                  <div className="mt-1.5 flex h-2 gap-0.5 overflow-hidden rounded-full">
                    {outOfStockCount > 0 && (
                      <div
                        className="rounded-full bg-rose-400"
                        style={{ flex: outOfStockCount }}
                      />
                    )}
                    {lowStockCount > 0 && (
                      <div
                        className="rounded-full bg-amber-300"
                        style={{ flex: lowStockCount }}
                      />
                    )}
                    <div
                      className="rounded-full bg-emerald-300"
                      style={{ flex: Math.max(20 - lowStockItems.length, 1) }}
                    />
                  </div>
                  <div className="mt-1.5 flex gap-3 text-[10px] text-neutral-400">
                    <span className="flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" /> OK
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-300" /> Bajo
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-rose-400" /> Agotado
                    </span>
                  </div>
                </div>

                {/* Quick stats */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-neutral-50 px-3 py-2">
                    <p className="text-[10px] text-neutral-400">Alertas totales</p>
                    <p className="text-lg font-bold text-neutral-950 tabular-nums">{lowStockItems.length}</p>
                  </div>
                  <div className="rounded-lg bg-neutral-50 px-3 py-2">
                    <p className="text-[10px] text-neutral-400">Valor inventario</p>
                    <p className="text-lg font-bold text-neutral-950 tabular-nums">
                      {visible ? formatCurrency(summary?.physical_total ?? 0) : "******"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Link>
      </motion.div>

      {/* ── Transit + Initial Load (side by side) ── */}
      <motion.div variants={itemVariants} className="mt-5 grid gap-5 lg:grid-cols-5">
        {/* ─── Transit Panel (3/5 width) ─── */}
        <motion.div className="lg:col-span-3" whileHover={{ y: -2 }} transition={SPRING_HOVER}>
          <Link
            href="/inventario/transito"
            className="group flex h-full flex-col rounded-2xl border border-blue-200/60 bg-white shadow-sm transition-[border-color,box-shadow] duration-200 hover:border-blue-300 hover:shadow-md hover:shadow-blue-500/8"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 sm:px-6 sm:pt-6">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-blue-50">
                  <Truck className="size-5 text-blue-600" strokeWidth={1.5} />
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-neutral-950">En Transito</p>
                  <p className="text-[11px] text-neutral-500">Reposiciones semanales</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <p className="font-display text-xl font-bold tracking-[-0.5px] text-neutral-950 tabular-nums sm:text-2xl">
                  {fmtValue(summary?.transit_total ?? 0)}
                </p>
                <ArrowRight className="size-4 text-neutral-300 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-neutral-500" />
              </div>
            </div>

            {/* Content */}
            <div className="mt-3 flex-1 border-t border-neutral-100 px-5 py-4 sm:px-6">
              <div className="flex items-center justify-between">
                <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-blue-600">
                  <TrendingUp className="size-3" />
                  {currentYear}
                </p>
                <div className="flex gap-3 text-[11px] text-neutral-500">
                  <span><strong className="text-neutral-700">{monthSummary.length}</strong> {monthSummary.length === 1 ? "mes" : "meses"}</span>
                  <span><strong className="text-neutral-700">{totalWeeks}</strong> {totalWeeks === 1 ? "semana" : "semanas"}</span>
                </div>
              </div>
              {monthSummary.length > 0 ? (
                <div className="mt-3 space-y-1.5">
                  {monthSummary.map((m) => {
                    const pct = (m.total_value / transitMaxMonth) * 100
                    return (
                      <div key={m.month} className="flex items-center gap-2">
                        <span className="w-8 shrink-0 text-[11px] font-medium text-neutral-500">
                          {MONTH_SHORT[m.month - 1]}
                        </span>
                        <div className="h-5 flex-1 overflow-hidden rounded-md bg-neutral-50">
                          <div
                            className="h-full rounded-md bg-blue-200 transition-all duration-500"
                            style={{ width: `${Math.max(pct, 4)}%` }}
                          />
                        </div>
                        <span className="w-20 shrink-0 text-right text-[11px] font-semibold text-neutral-600 tabular-nums">
                          {visible ? formatCurrency(m.total_value) : "******"}
                        </span>
                        <span className="w-12 shrink-0 text-right text-[10px] text-neutral-400">
                          {m.week_count} sem
                        </span>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="mt-3 flex items-center gap-1.5 text-[11px] font-medium text-neutral-400">
                  <Truck className="size-3.5" />
                  Sin registros en {currentYear}
                </p>
              )}
            </div>
          </Link>
        </motion.div>

        {/* ─── Initial Load Panel (2/5 width) ─── */}
        <motion.div className="lg:col-span-2" whileHover={{ y: -2 }} transition={SPRING_HOVER}>
          <Link
            href="/inventario/carga-inicial"
            className="group flex h-full flex-col rounded-2xl border border-slate-200/60 bg-white shadow-sm transition-[border-color,box-shadow] duration-200 hover:border-slate-300 hover:shadow-md hover:shadow-slate-500/8"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 sm:px-6 sm:pt-6">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-slate-50">
                  <Archive className="size-5 text-slate-500" strokeWidth={1.5} />
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-neutral-950">Carga Inicial</p>
                  <p className="text-[11px] text-neutral-500">Referencia historica</p>
                </div>
              </div>
              <ArrowRight className="size-4 text-neutral-300 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-neutral-500" />
            </div>

            {/* Value */}
            <div className="mt-1 px-5 sm:px-6">
              <p className="font-display text-xl font-bold tracking-[-0.5px] text-neutral-950 tabular-nums sm:text-2xl">
                {fmtValue(summary?.initial_load_total ?? 0)}
              </p>
            </div>

            {/* Content */}
            <div className="mt-3 flex-1 border-t border-neutral-100 px-5 py-4 sm:px-6">
              <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                <Archive className="size-3" />
                Inventario de referencia
              </p>

              {/* Proportion of total */}
              <div className="mt-3 space-y-3">
                <div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-neutral-500">Proporcion del total</span>
                    <span className="font-bold text-neutral-700">{initialPct}%</span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-neutral-100">
                    <div
                      className="h-full rounded-full bg-slate-300 transition-all duration-500"
                      style={{ width: `${initialPct}%` }}
                    />
                  </div>
                </div>

                <div className="rounded-lg bg-neutral-50 px-3 py-2">
                  <p className="text-[10px] text-neutral-400">Descripcion</p>
                  <p className="mt-0.5 text-[12px] leading-relaxed text-neutral-600">
                    Stock inicial al configurar el sistema. No se modifica con ventas ni devoluciones.
                  </p>
                </div>

                <div className="rounded-lg bg-neutral-50 px-3 py-2">
                  <p className="text-[10px] text-neutral-400">Valor registrado</p>
                  <p className="mt-0.5 text-[14px] font-bold text-neutral-950 tabular-nums">
                    {fmtValue(summary?.initial_load_total ?? 0)}
                  </p>
                </div>
              </div>
            </div>
          </Link>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}
