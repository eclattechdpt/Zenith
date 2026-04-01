"use client"

import Link from "next/link"
import { Warehouse, Truck, Archive, ArrowRight } from "lucide-react"
import { motion } from "motion/react"

import { formatCurrency } from "@/lib/utils"
import { useInventorySummary } from "@/features/inventario/queries"

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20, filter: "blur(4px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  },
}

const INVENTORY_CARDS = [
  {
    title: "Inventario Fisico",
    subtitle: "Stock actual y ventas",
    href: "/inventario/fisico",
    icon: Warehouse,
    key: "physical_total" as const,
    borderColor: "border-amber-200",
    iconBg: "bg-amber-50",
    iconColor: "text-amber-600",
    hoverShadow: "hover:shadow-amber-100/60",
  },
  {
    title: "Inventario en Transito",
    subtitle: "Reposiciones semanales",
    href: "/inventario/transito",
    icon: Truck,
    key: "transit_total" as const,
    borderColor: "border-blue-200",
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
    hoverShadow: "hover:shadow-blue-100/60",
  },
  {
    title: "Carga Inicial",
    subtitle: "Referencia historica",
    href: "/inventario/carga-inicial",
    icon: Archive,
    key: "initial_load_total" as const,
    borderColor: "border-slate-200",
    iconBg: "bg-slate-50",
    iconColor: "text-slate-600",
    hoverShadow: "hover:shadow-slate-100/60",
  },
]

export default function InventarioPage() {
  const { data: summary } = useInventorySummary()

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="flex flex-col gap-6"
    >
      {/* Header */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="text-center sm:text-left">
          <h1 className="font-display text-2xl font-semibold tracking-tight text-neutral-950">
            Inventario
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            Gestion de inventarios fisico, en transito y carga inicial
          </p>
        </div>
      </motion.div>

      {/* Grand total */}
      {summary && (
        <motion.div
          variants={itemVariants}
          className="rounded-2xl border border-neutral-200 bg-gradient-to-b from-white to-neutral-50/50 p-5 shadow-sm"
        >
          <p className="text-xs font-medium uppercase tracking-wider text-neutral-400">
            Valor total combinado
          </p>
          <p className="mt-1 font-display text-3xl font-bold text-neutral-950 tabular-nums">
            {formatCurrency(summary.grand_total)}
          </p>
          <div className="mt-3 flex flex-wrap gap-4 text-xs text-neutral-500">
            <span>
              Fisico:{" "}
              <strong className="text-neutral-700">
                {formatCurrency(summary.physical_total)}
              </strong>
            </span>
            <span>
              En transito:{" "}
              <strong className="text-neutral-700">
                {formatCurrency(summary.transit_total)}
              </strong>
            </span>
            <span>
              Carga inicial:{" "}
              <strong className="text-neutral-700">
                {formatCurrency(summary.initial_load_total)}
              </strong>
            </span>
          </div>
        </motion.div>
      )}

      {/* Inventory cards */}
      <motion.div
        variants={itemVariants}
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
      >
        {INVENTORY_CARDS.map((card) => {
          const Icon = card.icon
          const value = summary?.[card.key] ?? 0

          return (
            <Link
              key={card.href}
              href={card.href}
              className={`group flex items-center gap-4 rounded-2xl border ${card.borderColor} bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md ${card.hoverShadow}`}
            >
              <div
                className={`flex size-12 shrink-0 items-center justify-center rounded-xl ${card.iconBg}`}
              >
                <Icon className={`size-6 ${card.iconColor}`} strokeWidth={1.5} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-neutral-950">{card.title}</p>
                <p className="text-xs text-neutral-500">{card.subtitle}</p>
                {summary && (
                  <p className="mt-1 text-sm font-bold text-neutral-700 tabular-nums">
                    {formatCurrency(value)}
                  </p>
                )}
              </div>
              <ArrowRight className="size-4 shrink-0 text-neutral-300 transition-colors group-hover:text-neutral-500" />
            </Link>
          )
        })}
      </motion.div>
    </motion.div>
  )
}
