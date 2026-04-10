"use client"

import {
  ImageIcon,
  HardDrive,
  Globe,
  ImageOff,
  Database,
} from "lucide-react"
import { motion } from "motion/react"

import { Skeleton as BoneyardSkeleton } from "boneyard-js/react"

import { StorageOverviewFixture } from "./fixtures/storage-overview-fixture"
import type { MediaStats } from "../types"

interface StorageOverviewProps {
  stats: MediaStats
  isLoading: boolean
}

const SPRING = { type: "spring" as const, stiffness: 300, damping: 35 }

const kpis = [
  {
    key: "total" as const,
    label: "Total productos",
    icon: ImageIcon,
    bg: "bg-violet-50",
    iconBg: "bg-violet-100",
    iconColor: "text-violet-500",
    valueColor: "text-violet-700",
    borderColor: "border-violet-100",
  },
  {
    key: "supabase" as const,
    label: "En Supabase",
    icon: Database,
    bg: "bg-teal-50/50",
    iconBg: "bg-teal-100",
    iconColor: "text-teal-500",
    valueColor: "text-teal-700",
    borderColor: "border-teal-100",
  },
  {
    key: "external" as const,
    label: "URL externa",
    icon: Globe,
    bg: "bg-blue-50/50",
    iconBg: "bg-blue-100",
    iconColor: "text-blue-500",
    valueColor: "text-blue-700",
    borderColor: "border-blue-100",
  },
  {
    key: "withoutImage" as const,
    label: "Sin imagen",
    icon: ImageOff,
    bg: "bg-amber-50/50",
    iconBg: "bg-amber-100",
    iconColor: "text-amber-500",
    valueColor: "text-amber-700",
    borderColor: "border-amber-100",
  },
] as const

export function StorageOverview({ stats, isLoading }: StorageOverviewProps) {
  const total = stats.total || 1
  const supabasePct = (stats.supabase / total) * 100
  const externalPct = (stats.external / total) * 100
  const dataPct = (stats.data / total) * 100
  const nonePct = (stats.withoutImage / total) * 100

  return (
    <div className="space-y-5">
      {/* KPI cards */}
      <BoneyardSkeleton
        name="storage-overview"
        loading={isLoading}
        animate="shimmer"
        fixture={<StorageOverviewFixture />}
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {kpis.map((kpi, i) => (
            <motion.div
              key={kpi.key}
              initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ ...SPRING, delay: i * 0.06 }}
              className={`group flex items-center gap-3 rounded-xl border ${kpi.borderColor} ${kpi.bg} p-3.5 transition-shadow hover:shadow-sm`}
            >
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${kpi.iconBg}`}
              >
                <kpi.icon className={`h-4 w-4 ${kpi.iconColor}`} />
              </div>
              <div className="min-w-0">
                <p
                  className={`text-lg font-bold leading-none tabular-nums ${kpi.valueColor}`}
                >
                  {stats[kpi.key]}
                </p>
                <p className="mt-0.5 truncate text-[11px] text-neutral-400">
                  {kpi.label}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </BoneyardSkeleton>

      {/* Coverage bar */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...SPRING, delay: 0.3 }}
        className="rounded-xl border border-neutral-200/60 bg-white p-4"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <HardDrive className="h-3.5 w-3.5 text-violet-400" />
            <p className="text-[10px] font-bold uppercase tracking-[1.5px] text-neutral-400">
              Cobertura de imagenes
            </p>
          </div>
          <p className="text-[11px] font-medium text-neutral-500">
            <span className="text-violet-600 font-semibold">{stats.withImage}</span>
            {" "}de {stats.total} con imagen
          </p>
        </div>

        <div className="flex h-3 w-full overflow-hidden rounded-full bg-neutral-100">
          {supabasePct > 0 && (
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${supabasePct}%` }}
              transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-teal-400 to-teal-500 first:rounded-l-full last:rounded-r-full"
              title={`Supabase: ${stats.supabase}`}
            />
          )}
          {externalPct > 0 && (
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${externalPct}%` }}
              transition={{ duration: 0.6, delay: 0.5, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-blue-400 to-blue-500 first:rounded-l-full last:rounded-r-full"
              title={`Externas: ${stats.external}`}
            />
          )}
          {dataPct > 0 && (
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${dataPct}%` }}
              transition={{ duration: 0.6, delay: 0.6, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-violet-400 to-violet-500 first:rounded-l-full last:rounded-r-full"
              title={`Data URL: ${stats.data}`}
            />
          )}
        </div>

        {/* Legend */}
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1">
          <LegendDot color="bg-teal-400" label="Supabase" value={stats.supabase} />
          <LegendDot color="bg-blue-400" label="Externa" value={stats.external} />
          <LegendDot color="bg-violet-400" label="Data URL" value={stats.data} />
          <LegendDot color="bg-neutral-200" label="Sin imagen" value={stats.withoutImage} />
        </div>
      </motion.div>
    </div>
  )
}

function LegendDot({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <span className="flex items-center gap-1.5 text-[11px] text-neutral-500">
      <span className={`inline-block h-2.5 w-2.5 rounded-full ${color}`} />
      {label}
      <span className="font-semibold tabular-nums text-neutral-600">{value}</span>
    </span>
  )
}
