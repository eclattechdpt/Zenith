"use client"

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
} from "lucide-react"

import { KpiCard } from "@/components/shared/kpi-card"
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

  return (
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
      <KpiCard
        title="Registros"
        value={isLoading ? 0 : (data?.registrosTotales ?? 0)}
        subtitle="Total filas en tablas clave"
        icon={Database}
        iconBg="bg-slate-100"
        iconColor="text-slate-500"
        delay={0.12}
      />
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
        exit={{ opacity: 0, y: -8, filter: "blur(4px)" }}
        transition={{ ...SPRING_SMOOTH, duration: 0.25 }}
      >
        <Component />
      </motion.div>
    </AnimatePresence>
  )
}
