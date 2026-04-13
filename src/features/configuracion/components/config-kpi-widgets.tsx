"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import {
  FolderTree,
  Layers,
  PackageX,
  Percent,
  Users,
  TrendingDown,
  ImageIcon,
  ImagePlus,
  ImageOff,
  Terminal,
  Activity,
  Database,
  ChevronDown,
} from "lucide-react"

import { KpiCard } from "@/components/shared/kpi-card"
import { cn } from "@/lib/utils"
import {
  useCategoriaStats,
  useDescuentoStats,
  useImagenStats,
  useDevStats,
} from "../queries"

type TabId = "categorias" | "descuentos" | "imagenes" | "desarrollo"

interface ConfigKpiWidgetsProps {
  activeTab: TabId
}

const SPRING_SMOOTH = { type: "spring" as const, stiffness: 300, damping: 35 }

const TABLE_SERIES = [
  { key: "products" as const,            label: "Productos",   color: "bg-rose-400",    dot: "bg-rose-400"    },
  { key: "productVariants" as const,     label: "Variantes",   color: "bg-amber-400",   dot: "bg-amber-400"   },
  { key: "customers" as const,           label: "Clientes",    color: "bg-teal-400",    dot: "bg-teal-400"    },
  { key: "sales" as const,               label: "Ventas",      color: "bg-blue-400",    dot: "bg-blue-400"    },
  { key: "inventoryMovements" as const,  label: "Movimientos", color: "bg-slate-400",   dot: "bg-slate-400"   },
]

function CategoriasKpis() {
  const { data, isLoading } = useCategoriaStats()

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-5">
      <KpiCard
        title="Categorias"
        value={isLoading ? 0 : (data?.totalCategorias ?? 0)}
        subtitle="Categorias principales"
        icon={FolderTree}
        variant="hero"
        heroGradient="from-rose-500 to-rose-600"
        heroShadow="shadow-rose-500/10"
        delay={0}
      />
      <KpiCard
        title="Subcategorias"
        value={isLoading ? 0 : (data?.totalSubcategorias ?? 0)}
        subtitle="Agrupaciones internas"
        icon={Layers}
        iconBg="bg-amber-50"
        iconColor="text-amber-500"
        delay={0.06}
      />
      <KpiCard
        title="Sin categoria"
        value={isLoading ? 0 : (data?.productosSinCategoria ?? 0)}
        subtitle="Productos sin asignar"
        icon={PackageX}
        iconBg="bg-rose-50"
        iconColor="text-rose-500"
        delay={0.12}
      />
    </div>
  )
}

function DescuentosKpis() {
  const { data, isLoading } = useDescuentoStats()

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-5">
      <KpiCard
        title="Listas de precio"
        value={isLoading ? 0 : (data?.totalListas ?? 0)}
        subtitle="Descuentos configurados"
        icon={Percent}
        variant="hero"
        heroGradient="from-teal-500 to-teal-600"
        heroShadow="shadow-teal-500/10"
        delay={0}
      />
      <KpiCard
        title="Clientes con descuento"
        value={isLoading ? 0 : (data?.clientesConDescuento ?? 0)}
        subtitle="Tienen lista asignada"
        icon={Users}
        iconBg="bg-teal-50"
        iconColor="text-teal-500"
        delay={0.06}
      />
      <KpiCard
        title="Descuento promedio"
        value={isLoading ? 0 : (data?.descuentoPromedio ?? 0)}
        subtitle="Porcentaje medio aplicado"
        icon={TrendingDown}
        iconBg="bg-violet-50"
        iconColor="text-violet-500"
        format={(n) => `${n.toFixed(1)}%`}
        delay={0.12}
      />
    </div>
  )
}

function ImagenesKpis() {
  const { data, isLoading } = useImagenStats()

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-5">
      <KpiCard
        title="Productos"
        value={isLoading ? 0 : (data?.totalArchivos ?? 0)}
        subtitle="Total en catalogo"
        icon={ImageIcon}
        variant="hero"
        heroGradient="from-violet-500 to-violet-600"
        heroShadow="shadow-violet-500/10"
        delay={0}
      />
      <KpiCard
        title="Con imagen"
        value={isLoading ? 0 : (data?.conImagen ?? 0)}
        subtitle="Listos para mostrar"
        icon={ImagePlus}
        iconBg="bg-emerald-50"
        iconColor="text-emerald-500"
        delay={0.06}
      />
      <KpiCard
        title="Sin imagen"
        value={isLoading ? 0 : (data?.sinImagen ?? 0)}
        subtitle="Pendientes de imagen"
        icon={ImageOff}
        iconBg="bg-amber-50"
        iconColor="text-amber-500"
        delay={0.12}
      />
    </div>
  )
}

function DesarrolloKpis() {
  const { data, isLoading } = useDevStats()
  const [showBreakdown, setShowBreakdown] = useState(false)

  const total = data?.registrosTotales ?? 0
  const breakdown = data?.breakdown

  return (
    <div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-5">
        <KpiCard
          title="Estado"
          value={isLoading ? 0 : 1}
          subtitle={isLoading ? "Verificando..." : data?.estado === "ok" ? "Sistema operativo" : "Error de conexion"}
          icon={Terminal}
          variant="hero"
          heroGradient="from-neutral-700 to-neutral-800"
          heroShadow="shadow-neutral-700/10"
          format={() => isLoading ? "..." : data?.estado === "ok" ? "Online" : "Error"}
          delay={0}
        />
        <KpiCard
          title="Latencia"
          value={isLoading ? 0 : (data?.latenciaMs ?? 0)}
          subtitle="Milisegundos a Supabase"
          icon={Activity}
          iconBg="bg-blue-50"
          iconColor="text-blue-500"
          format={(n) => `${Math.round(n)} ms`}
          delay={0.06}
        />
        {/* Registros card — clickable to toggle breakdown panel */}
        <div
          role="button"
          aria-expanded={showBreakdown}
          onClick={() => setShowBreakdown((v) => !v)}
          className="relative cursor-pointer rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-300"
        >
          <KpiCard
            title="Registros"
            value={isLoading ? 0 : total}
            subtitle="Total filas en tablas clave"
            icon={Database}
            iconBg="bg-slate-100"
            iconColor="text-slate-500"
            delay={0.12}
          />
          {/* Absolutely positioned — out of flow, adds zero height to the card */}
          <div className="pointer-events-none absolute bottom-5 right-5 flex items-center gap-1 select-none text-[11px] font-medium text-neutral-400">
            <motion.span
              animate={{ rotate: showBreakdown ? 180 : 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="inline-flex"
            >
              <ChevronDown className="size-3.5" />
            </motion.span>
            {showBreakdown ? "Ocultar desglose" : "Ver desglose"}
          </div>
        </div>
      </div>

      {/* ── Drop panel ─────────────────────────────────────────────────── */}
      <AnimatePresence initial={false}>
        {showBreakdown && (
          <motion.div
            key="breakdown-panel"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 35 }}
            className="overflow-hidden"
          >
            <div className="mt-3 rounded-2xl border border-neutral-200/60 bg-neutral-50/40 p-5 space-y-4">
              {/* Header */}
              <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-neutral-400">
                <Database className="h-3.5 w-3.5" />
                Registros por tabla
              </h3>

              {/* Proportional bar */}
              <div className="flex h-2 w-full gap-0.5 overflow-hidden rounded-full">
                {TABLE_SERIES.map(({ key, label, color }, idx) => {
                  const count = breakdown?.[key] ?? 0
                  const pct = total > 0 ? (count / total) * 100 : 0
                  return (
                    <motion.div
                      key={key}
                      title={`${label}: ${count}`}
                      className={cn("h-full", color)}
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.45, delay: idx * 0.05, ease: "easeOut" }}
                    />
                  )
                })}
              </div>

              {/* Per-table tiles */}
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
                {TABLE_SERIES.map(({ key, label, dot }, idx) => {
                  const count = breakdown?.[key] ?? 0
                  const pct = total > 0 ? Math.round((count / total) * 100) : 0
                  return (
                    <motion.div
                      key={key}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25, delay: idx * 0.05 }}
                      className="flex flex-col gap-1.5 rounded-xl border border-neutral-200 bg-white px-3.5 py-3"
                    >
                      <div className="flex items-center gap-1.5">
                        <span className={cn("size-2 shrink-0 rounded-full", dot)} />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 truncate">
                          {label}
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-neutral-800">
                        {isLoading ? "—" : count}
                      </span>
                      <span className="text-[10px] font-medium text-neutral-400">
                        {isLoading ? "" : `${pct}% del total`}
                      </span>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

const KPI_MAP: Record<TabId, React.FC> = {
  categorias: CategoriasKpis,
  descuentos: DescuentosKpis,
  imagenes: ImagenesKpis,
  desarrollo: DesarrolloKpis,
}

export function ConfigKpiWidgets({ activeTab }: ConfigKpiWidgetsProps) {
  const Component = KPI_MAP[activeTab]

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 8, filter: "blur(4px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        exit={{ opacity: 0, filter: "blur(4px)" }}
        transition={{ ...SPRING_SMOOTH, duration: 0.25 }}
      >
        <Component />
      </motion.div>
    </AnimatePresence>
  )
}
