"use client"

import {
  ImageIcon,
  HardDrive,
  Globe,
  ImageOff,
  Database,
} from "lucide-react"

import { Skeleton as BoneyardSkeleton } from "boneyard-js/react"

import { StorageOverviewFixture } from "./fixtures/storage-overview-fixture"
import type { MediaStats } from "../types"

interface StorageOverviewProps {
  stats: MediaStats
  isLoading: boolean
}

const kpis = [
  {
    key: "total" as const,
    label: "Total productos",
    icon: ImageIcon,
    bg: "bg-neutral-50",
    iconColor: "text-neutral-500",
    valueColor: "text-neutral-900",
  },
  {
    key: "supabase" as const,
    label: "En Supabase",
    icon: Database,
    bg: "bg-teal-50",
    iconColor: "text-teal-500",
    valueColor: "text-teal-700",
  },
  {
    key: "external" as const,
    label: "URL externa",
    icon: Globe,
    bg: "bg-blue-50",
    iconColor: "text-blue-500",
    valueColor: "text-blue-700",
  },
  {
    key: "withoutImage" as const,
    label: "Sin imagen",
    icon: ImageOff,
    bg: "bg-amber-50",
    iconColor: "text-amber-500",
    valueColor: "text-amber-700",
  },
] as const

export function StorageOverview({ stats, isLoading }: StorageOverviewProps) {
  // Coverage bar segments
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
          {kpis.map((kpi) => (
            <div
              key={kpi.key}
              className="flex items-center gap-3 rounded-xl border border-neutral-200/60 bg-white p-3.5"
            >
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${kpi.bg}`}
              >
                <kpi.icon className={`h-4 w-4 ${kpi.iconColor}`} />
              </div>
              <div className="min-w-0">
                <p
                  className={`text-lg font-semibold leading-none ${kpi.valueColor}`}
                >
                  {stats[kpi.key]}
                </p>
                <p className="mt-0.5 truncate text-[11px] text-neutral-400">
                  {kpi.label}
                </p>
              </div>
            </div>
          ))}
        </div>
      </BoneyardSkeleton>

      {/* Coverage bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-medium uppercase tracking-[1.5px] text-neutral-400">
            <HardDrive className="mr-1 inline h-3 w-3" />
            Cobertura de imagenes
          </p>
          <p className="text-[11px] text-neutral-400">
            {stats.withImage} de {stats.total} productos con imagen
          </p>
        </div>
        <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-neutral-100">
          {supabasePct > 0 && (
            <div
              className="h-full bg-teal-400 transition-all duration-500"
              style={{ width: `${supabasePct}%` }}
              title={`Supabase: ${stats.supabase}`}
            />
          )}
          {externalPct > 0 && (
            <div
              className="h-full bg-blue-400 transition-all duration-500"
              style={{ width: `${externalPct}%` }}
              title={`Externas: ${stats.external}`}
            />
          )}
          {dataPct > 0 && (
            <div
              className="h-full bg-violet-400 transition-all duration-500"
              style={{ width: `${dataPct}%` }}
              title={`Data URL: ${stats.data}`}
            />
          )}
          {nonePct > 0 && (
            <div
              className="h-full bg-neutral-200 transition-all duration-500"
              style={{ width: `${nonePct}%` }}
              title={`Sin imagen: ${stats.withoutImage}`}
            />
          )}
        </div>
        {/* Legend */}
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          <LegendDot color="bg-teal-400" label="Supabase" />
          <LegendDot color="bg-blue-400" label="Externa" />
          <LegendDot color="bg-violet-400" label="Data URL" />
          <LegendDot color="bg-neutral-200" label="Sin imagen" />
        </div>
      </div>
    </div>
  )
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5 text-[11px] text-neutral-500">
      <span className={`inline-block h-2 w-2 rounded-full ${color}`} />
      {label}
    </span>
  )
}
