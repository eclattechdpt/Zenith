"use client"

import { useState } from "react"
import { CalendarRange, Check, FileSpreadsheet, FileText, Loader2 } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { motion, AnimatePresence } from "motion/react"
import { sileo } from "sileo"
import { useQueryClient } from "@tanstack/react-query"

import { cn } from "@/lib/utils"
import { logExport } from "../actions"

/* ── Types ── */

type ButtonState = "idle" | "loading" | "success"

export interface FormatAction {
  label: string
  format: "pdf" | "excel" | "range"
  onExport: () => Promise<void>
  /** If true, onExport handles its own logging/toast (e.g. opens a dialog) */
  skipAutoLog?: boolean
}

export interface ReportCardColor {
  iconBg: string
  iconColor: string
  accentBorder: string
}

interface ReportCardProps {
  title: string
  description: string
  icon: LucideIcon
  color: ReportCardColor
  actions: FormatAction[]
  delay?: number
}

/* ── Format button colors (no hover — motion handles it) ── */

const FORMAT_STYLES = {
  pdf: {
    icon: FileText,
    border: "border-rose-200",
    text: "text-rose-600",
    loadingText: "text-rose-500",
    hoverBg: "rgba(244, 63, 107, 1)",
    successBg: "bg-emerald-500 text-white border-emerald-500",
  },
  excel: {
    icon: FileSpreadsheet,
    border: "border-emerald-200",
    text: "text-emerald-600",
    loadingText: "text-emerald-500",
    hoverBg: "rgba(5, 150, 105, 1)",
    successBg: "bg-emerald-500 text-white border-emerald-500",
  },
  range: {
    icon: CalendarRange,
    border: "border-indigo-200",
    text: "text-indigo-600",
    loadingText: "text-indigo-500",
    hoverBg: "rgba(99, 102, 241, 1)",
    successBg: "bg-emerald-500 text-white border-emerald-500",
  },
}

/* ── Spring configs ── */

const ENTER_SPRING = { type: "spring" as const, stiffness: 120, damping: 18 }
const HOVER_SPRING = { type: "spring" as const, stiffness: 600, damping: 30 }
const TAP_SPRING = { type: "spring" as const, stiffness: 800, damping: 35 }
const ICON_SPRING = { type: "spring" as const, stiffness: 600, damping: 20 }

/* ── Component ── */

export function ReportCard({
  title,
  description,
  icon: Icon,
  color,
  actions,
  delay = 0,
}: ReportCardProps) {
  const [states, setStates] = useState<Record<string, ButtonState>>({})
  const queryClient = useQueryClient()

  async function handleExport(action: FormatAction) {
    const key = action.label

    if (action.skipAutoLog) {
      await action.onExport()
      return
    }

    setStates((prev) => ({ ...prev, [key]: "loading" }))
    try {
      await action.onExport()
      try {
        await logExport(title, action.format === "range" ? "pdf" : action.format)
        queryClient.invalidateQueries({ queryKey: ["export-logs"] })
      } catch {
        sileo.warning({ title: "Exportacion exitosa", description: "El registro de exportacion no se pudo guardar" })
      }
      setStates((prev) => ({ ...prev, [key]: "success" }))
      sileo.success({ title: `${title} exportado correctamente`, description: "El archivo se descargo automaticamente" })
      setTimeout(() => setStates((prev) => ({ ...prev, [key]: "idle" })), 1500)
    } catch {
      setStates((prev) => ({ ...prev, [key]: "idle" }))
      sileo.error({ title: `Error al exportar ${title.toLowerCase()}` })
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, filter: "blur(4px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ ...ENTER_SPRING, delay }}
      whileHover={{ y: -3, boxShadow: "0 8px 30px rgba(0, 0, 0, 0.06)" }}
      className={cn(
        "group flex flex-col rounded-2xl border bg-white p-5 sm:p-6",
        "border-l-[3px] border-neutral-200/60",
        color.accentBorder
      )}
      style={{ willChange: "transform" }}
    >
      {/* Header */}
      <div className="mb-5 flex items-start gap-3.5">
        <motion.div
          whileHover={{ scale: 1.08, rotate: -2 }}
          transition={HOVER_SPRING}
          className={cn(
            "flex size-12 shrink-0 items-center justify-center rounded-xl",
            color.iconBg
          )}
        >
          <Icon className={cn("size-6", color.iconColor)} strokeWidth={1.75} />
        </motion.div>
        <div className="min-w-0">
          <h3 className="text-base font-bold text-neutral-900">{title}</h3>
          <p className="mt-0.5 text-xs text-neutral-500">{description}</p>
        </div>
      </div>

      {/* Format action buttons */}
      <div className="mt-auto flex flex-wrap gap-2.5">
        {actions.map((action) => {
          const key = action.label
          const state = states[key] ?? "idle"
          const fmt = FORMAT_STYLES[action.format]
          const FormatIcon = fmt.icon
          const isIdle = state === "idle"
          const isLoading = state === "loading"
          const isSuccess = state === "success"

          return (
            <motion.button
              key={key}
              type="button"
              disabled={isLoading}
              onClick={() => handleExport(action)}
              whileHover={isIdle ? {
                backgroundColor: fmt.hoverBg,
                color: "#ffffff",
                scale: 1.03,
                borderColor: fmt.hoverBg,
              } : undefined}
              whileTap={isIdle ? { scale: 0.95 } : undefined}
              transition={isIdle ? TAP_SPRING : undefined}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg border px-3.5 py-2 text-[13px] font-semibold",
                isIdle && cn(fmt.border, fmt.text),
                isLoading && cn(fmt.border, fmt.loadingText, "cursor-wait"),
                isSuccess && fmt.successBg
              )}
              style={{ willChange: "transform, background-color" }}
            >
              <AnimatePresence mode="wait" initial={false}>
                {isLoading ? (
                  <motion.span
                    key="loading"
                    initial={{ opacity: 0, scale: 0.3, rotate: -120 }}
                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                    exit={{ opacity: 0, scale: 0.3 }}
                    transition={ICON_SPRING}
                  >
                    <Loader2 className="size-4 animate-spin" />
                  </motion.span>
                ) : isSuccess ? (
                  <motion.span
                    key="success"
                    initial={{ opacity: 0, scale: 0, rotate: -90 }}
                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                    exit={{ opacity: 0, scale: 0.3 }}
                    transition={ICON_SPRING}
                  >
                    <Check className="size-4" strokeWidth={2.5} />
                  </motion.span>
                ) : (
                  <motion.span
                    key="idle"
                    initial={{ opacity: 0, scale: 0.3 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.3 }}
                    transition={{ duration: 0.1 }}
                  >
                    <FormatIcon className="size-4" />
                  </motion.span>
                )}
              </AnimatePresence>
              <span>
                {isLoading
                  ? "Exportando..."
                  : isSuccess
                    ? "Listo"
                    : action.label}
              </span>
            </motion.button>
          )
        })}
      </div>
    </motion.div>
  )
}
