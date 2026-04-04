"use client"

import { useState, useCallback, useEffect } from "react"
import { AnimatePresence, motion } from "motion/react"
import {
  Package,
  DollarSign,
  AlertTriangle,
  Eye,
  EyeOff,
} from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import { CountUp } from "@/features/pos/components/count-up"
import { useProductStats } from "../queries"

const SPRING = { type: "spring" as const, stiffness: 100, damping: 20 }

export function ProductKpiWidgets() {
  const { data: stats } = useProductStats()
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    setVisible(localStorage.getItem("products-kpi-visible") !== "false")
  }, [])

  const toggleVisible = useCallback(() => {
    setVisible((prev) => {
      const next = !prev
      localStorage.setItem("products-kpi-visible", String(next))
      return next
    })
  }, [])

  const totalProducts = stats?.totalProducts ?? 0
  const inventoryValue = stats?.inventoryValue ?? 0
  const lowStockCount = stats?.lowStockCount ?? 0

  const hiddenPlaceholder = "******"

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-5">
      {/* Total productos */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={SPRING}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-rose-500 to-rose-600 p-6 shadow-sm shadow-rose-500/10"
      >
        {/* Decorative ring */}
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full border-[20px] border-white/10" />

        <Tooltip>
          <TooltipTrigger
            render={
              <button
                onClick={toggleVisible}
                className="absolute right-3.5 top-3.5 z-10 flex h-7 w-7 items-center justify-center rounded-lg text-white/50 transition-colors hover:text-white"
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
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20">
            <Package className="h-4 w-4 text-white" />
          </div>
          <p className="text-[11px] font-bold uppercase tracking-[2px] text-rose-100">
            Total productos
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
                value={totalProducts}
                className="mt-2 block font-display text-[36px] font-semibold tracking-[-1px] text-white sm:text-[42px]"
              />
              <p className="mt-1.5 text-[13px] font-medium text-rose-100">
                productos activos
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
              <p className="mt-2 font-display text-[36px] font-semibold tracking-[4px] text-white/40 sm:text-[42px]">
                {hiddenPlaceholder}
              </p>
              <p className="mt-1.5 text-[13px] font-medium text-rose-200/50">
                Oculto
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Valor en inventario */}
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
            Valor en inventario
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
                value={inventoryValue}
                format={formatCurrency}
                className="mt-2 block font-display text-[36px] font-semibold tracking-[-1px] text-neutral-900 sm:text-[42px]"
              />
              <p className="mt-1.5 text-[13px] font-medium text-neutral-400">
                stock total valorizado
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
                {hiddenPlaceholder}
              </p>
              <p className="mt-1.5 text-[13px] font-medium text-neutral-300">
                Oculto
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Stock bajo */}
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
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </div>
          <p className="text-[11px] font-bold uppercase tracking-[2px] text-neutral-400">
            Stock bajo
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
                value={lowStockCount}
                className="mt-2 block font-display text-[36px] font-semibold tracking-[-1px] text-neutral-900 sm:text-[42px]"
              />
              <p className="mt-1.5 text-[13px] font-medium text-neutral-400">
                variantes por reabastecer
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
                {hiddenPlaceholder}
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
