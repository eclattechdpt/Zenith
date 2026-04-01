"use client"

import { useState, useCallback, useEffect } from "react"
import { AnimatePresence, motion } from "motion/react"
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  Receipt,
  Eye,
  EyeOff,
} from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import { usePOSDashboardStats } from "../queries"
import { CountUp } from "./count-up"

const SPRING = { type: "spring" as const, stiffness: 100, damping: 20 }

export function POSKpiWidgets() {
  const { data: stats } = usePOSDashboardStats()
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    setVisible(localStorage.getItem("pos-kpi-visible") !== "false")
  }, [])

  const toggleVisible = useCallback(() => {
    setVisible((prev) => {
      const next = !prev
      localStorage.setItem("pos-kpi-visible", String(next))
      return next
    })
  }, [])

  const revenue = stats?.todayRevenue ?? 0
  const units = stats?.todayUnitsSold ?? 0
  const transactions = stats?.todayTransactions ?? 0
  const avgTicket = stats?.avgTicket ?? 0
  const vsYesterday = stats?.revenueVsYesterday ?? 0
  const isUp = vsYesterday >= 0

  const hiddenPlaceholder = "******"

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-5">
      {/* ── Revenue ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={SPRING}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-rose-500 to-rose-600 p-6 shadow-sm shadow-rose-500/10"
      >
        {/* Decorative ring */}
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full border-[20px] border-white/10" />

        {/* Eye toggle */}
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
            <DollarSign className="h-4 w-4 text-white" />
          </div>
          <p className="text-[11px] font-bold uppercase tracking-[2px] text-rose-100">
            Ventas hoy
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
                value={revenue}
                format={formatCurrency}
                className="mt-2 block font-display text-[36px] font-semibold tracking-[-1px] text-white sm:text-[42px]"
              />
              <div className="mt-1.5 flex items-center gap-3">
                <span className="text-[13px] font-medium text-rose-100">
                  {transactions} transacciones
                </span>
                {vsYesterday !== 0 && (
                  <span
                    className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-bold ${
                      isUp
                        ? "bg-white/20 text-white"
                        : "bg-rose-900/30 text-rose-200"
                    }`}
                  >
                    {isUp ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    {isUp ? "+" : ""}
                    {Math.round(vsYesterday)}%
                  </span>
                )}
              </div>
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

      {/* ── Units sold ── */}
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
            <Package className="h-4 w-4 text-teal-500" />
          </div>
          <p className="text-[11px] font-bold uppercase tracking-[2px] text-neutral-400">
            Unidades vendidas
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
                value={units}
                className="mt-2 block font-display text-[36px] font-semibold tracking-[-1px] text-neutral-900 sm:text-[42px]"
              />
              <p className="mt-1.5 text-[13px] font-medium text-neutral-400">
                hoy
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

      {/* ── Avg ticket ── */}
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
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blush-50">
            <Receipt className="h-4 w-4 text-blush-500" />
          </div>
          <p className="text-[11px] font-bold uppercase tracking-[2px] text-neutral-400">
            Ticket promedio
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
                value={avgTicket}
                format={formatCurrency}
                className="mt-2 block font-display text-[36px] font-semibold tracking-[-1px] text-neutral-900 sm:text-[42px]"
              />
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
