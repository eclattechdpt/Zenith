"use client"

import { useState, useCallback, useEffect } from "react"
import { AnimatePresence, motion } from "motion/react"
import {
  Warehouse,
  DollarSign,
  AlertTriangle,
  Eye,
  EyeOff,
  Archive,
  Package,
} from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import { CountUp } from "@/features/pos/components/count-up"

import type { InventoryType } from "../types"

const SPRING = { type: "spring" as const, stiffness: 100, damping: 20 }
const HIDDEN = "******"

// ── Config per inventory type ──

const TYPE_CONFIG = {
  physical: {
    primaryIcon: Warehouse,
    primaryLabel: "Total variantes",
    primarySubtitle: "con stock registrado",
    primaryGradient: "bg-gradient-to-br from-amber-500 to-amber-600",
    primaryShadow: "shadow-amber-500/10",
    primaryIconBg: "bg-white/20",
    primaryIconColor: "text-white",
    primaryLabelColor: "text-amber-100",
    primarySubColor: "text-amber-100",
    primaryHiddenText: "text-white/40",
    primaryHiddenSub: "text-amber-200/50",
    toggleColor: "text-white/50 hover:text-white",
    valueLabel: "Valor en inventario",
    valueSubtitle: "stock total valorizado",
    alertLabel: "Stock bajo",
    alertSubtitle: "variantes por reabastecer",
    storageKey: "zenith-inv-physical-kpi-visible",
  },
  initial_load: {
    primaryIcon: Archive,
    primaryLabel: "Total variantes",
    primarySubtitle: "con stock registrado",
    primaryGradient: "bg-gradient-to-br from-slate-500 to-slate-600",
    primaryShadow: "shadow-slate-500/10",
    primaryIconBg: "bg-white/20",
    primaryIconColor: "text-white",
    primaryLabelColor: "text-slate-100",
    primarySubColor: "text-slate-100",
    primaryHiddenText: "text-white/40",
    primaryHiddenSub: "text-slate-200/50",
    toggleColor: "text-white/50 hover:text-white",
    valueLabel: "Valor registrado",
    valueSubtitle: "carga inicial valorizada",
    alertLabel: "Con override",
    alertSubtitle: "nombre o precio editado",
    storageKey: "zenith-inv-initial-kpi-visible",
  },
} as const

interface InventoryKpiWidgetsProps {
  inventoryType: InventoryType
  totalVariants: number
  totalValue: number
  alertCount: number
}

export function InventoryKpiWidgets({
  inventoryType,
  totalVariants,
  totalValue,
  alertCount,
}: InventoryKpiWidgetsProps) {
  const cfg = TYPE_CONFIG[inventoryType]

  const [visible, setVisible] = useState(true)
  useEffect(() => {
    setVisible(localStorage.getItem(cfg.storageKey) !== "false")
  }, [cfg.storageKey])

  const toggleVisible = useCallback(() => {
    setVisible((prev) => {
      const next = !prev
      localStorage.setItem(cfg.storageKey, String(next))
      return next
    })
  }, [cfg.storageKey])

  const PrimaryIcon = cfg.primaryIcon

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-5">
      {/* Primary: total variants */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={SPRING}
        className={`relative overflow-hidden rounded-2xl p-6 shadow-sm ${cfg.primaryGradient} ${cfg.primaryShadow}`}
      >
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full border-[20px] border-white/10" />

        <Tooltip>
          <TooltipTrigger
            render={
              <button
                onClick={toggleVisible}
                className={`absolute right-3.5 top-3.5 z-10 flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${cfg.toggleColor}`}
              />
            }
          >
            {visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
          </TooltipTrigger>
          <TooltipContent side="bottom" sideOffset={6}>
            {visible ? "Ocultar estadisticas" : "Mostrar estadisticas"}
          </TooltipContent>
        </Tooltip>

        <div className="flex items-center gap-2">
          <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${cfg.primaryIconBg}`}>
            <PrimaryIcon className={`h-4 w-4 ${cfg.primaryIconColor}`} />
          </div>
          <p className={`text-[11px] font-bold uppercase tracking-[2px] ${cfg.primaryLabelColor}`}>
            {cfg.primaryLabel}
          </p>
        </div>

        <AnimatePresence mode="wait">
          {visible ? (
            <motion.div
              key="visible"
              initial={{ opacity: 0, filter: "blur(4px)" }}
              animate={{ opacity: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, filter: "blur(4px)" }}
              transition={{ duration: 0.2 }}
            >
              <CountUp
                value={totalVariants}
                className="mt-2 block font-display text-[36px] font-semibold tracking-[-1px] text-white sm:text-[42px]"
              />
              <p className={`mt-1.5 text-[13px] font-medium ${cfg.primarySubColor}`}>
                {cfg.primarySubtitle}
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="hidden"
              initial={{ opacity: 0, filter: "blur(4px)" }}
              animate={{ opacity: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, filter: "blur(4px)" }}
              transition={{ duration: 0.2 }}
            >
              <p className={`mt-2 font-display text-[36px] font-semibold tracking-[4px] sm:text-[42px] ${cfg.primaryHiddenText}`}>
                {HIDDEN}
              </p>
              <p className={`mt-1.5 text-[13px] font-medium ${cfg.primaryHiddenSub}`}>
                Oculto
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Value card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...SPRING, delay: 0.06 }}
        className="relative overflow-hidden rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm shadow-neutral-900/[0.03]"
      >
        <Tooltip>
          <TooltipTrigger
            render={
              <button
                onClick={toggleVisible}
                className="absolute right-3.5 top-3.5 z-10 flex h-7 w-7 items-center justify-center rounded-lg text-neutral-300 transition-colors hover:text-neutral-500"
              />
            }
          >
            {visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
          </TooltipTrigger>
          <TooltipContent side="bottom" sideOffset={6}>
            {visible ? "Ocultar estadisticas" : "Mostrar estadisticas"}
          </TooltipContent>
        </Tooltip>

        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50">
            <DollarSign className="h-4 w-4 text-teal-500" />
          </div>
          <p className="text-[11px] font-bold uppercase tracking-[2px] text-neutral-400">
            {cfg.valueLabel}
          </p>
        </div>

        <AnimatePresence mode="wait">
          {visible ? (
            <motion.div
              key="visible"
              initial={{ opacity: 0, filter: "blur(4px)" }}
              animate={{ opacity: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, filter: "blur(4px)" }}
              transition={{ duration: 0.2 }}
            >
              <CountUp
                value={totalValue}
                format={formatCurrency}
                className="mt-2 block font-display text-[36px] font-semibold tracking-[-1px] text-neutral-900 sm:text-[42px]"
              />
              <p className="mt-1.5 text-[13px] font-medium text-neutral-400">
                {cfg.valueSubtitle}
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="hidden"
              initial={{ opacity: 0, filter: "blur(4px)" }}
              animate={{ opacity: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, filter: "blur(4px)" }}
              transition={{ duration: 0.2 }}
            >
              <p className="mt-2 font-display text-[36px] font-semibold tracking-[4px] text-neutral-300 sm:text-[42px]">
                {HIDDEN}
              </p>
              <p className="mt-1.5 text-[13px] font-medium text-neutral-300">
                Oculto
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Alert / override count */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...SPRING, delay: 0.12 }}
        className="relative overflow-hidden rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm shadow-neutral-900/[0.03]"
      >
        <Tooltip>
          <TooltipTrigger
            render={
              <button
                onClick={toggleVisible}
                className="absolute right-3.5 top-3.5 z-10 flex h-7 w-7 items-center justify-center rounded-lg text-neutral-300 transition-colors hover:text-neutral-500"
              />
            }
          >
            {visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
          </TooltipTrigger>
          <TooltipContent side="bottom" sideOffset={6}>
            {visible ? "Ocultar estadisticas" : "Mostrar estadisticas"}
          </TooltipContent>
        </Tooltip>

        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50">
            {inventoryType === "initial_load" ? (
              <Package className="h-4 w-4 text-amber-500" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            )}
          </div>
          <p className="text-[11px] font-bold uppercase tracking-[2px] text-neutral-400">
            {cfg.alertLabel}
          </p>
        </div>

        <AnimatePresence mode="wait">
          {visible ? (
            <motion.div
              key="visible"
              initial={{ opacity: 0, filter: "blur(4px)" }}
              animate={{ opacity: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, filter: "blur(4px)" }}
              transition={{ duration: 0.2 }}
            >
              <CountUp
                value={alertCount}
                className="mt-2 block font-display text-[36px] font-semibold tracking-[-1px] text-neutral-900 sm:text-[42px]"
              />
              <p className="mt-1.5 text-[13px] font-medium text-neutral-400">
                {cfg.alertSubtitle}
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="hidden"
              initial={{ opacity: 0, filter: "blur(4px)" }}
              animate={{ opacity: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, filter: "blur(4px)" }}
              transition={{ duration: 0.2 }}
            >
              <p className="mt-2 font-display text-[36px] font-semibold tracking-[4px] text-neutral-300 sm:text-[42px]">
                {HIDDEN}
              </p>
              <p className="mt-1.5 text-[13px] font-medium text-neutral-300">
                Oculto
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
