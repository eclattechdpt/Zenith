"use client"

import { useState } from "react"
import { Download, Loader2, FileSpreadsheet, FileText } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { motion } from "motion/react"
import { toast } from "sonner"

import { useQueryClient } from "@tanstack/react-query"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { logExport } from "../actions"

export interface ExportCardColor {
  /** Card background tint, e.g. "bg-rose-50/40" */
  cardBg: string
  /** Card border color, e.g. "border-rose-200/50" */
  cardBorder: string
  /** Icon container bg, e.g. "bg-rose-100" */
  iconBg: string
  /** Icon color, e.g. "text-rose-500" */
  iconColor: string
  /** Hover shadow, e.g. "hover:shadow-[0_4px_20px_rgba(244,63,107,0.12)]" */
  hoverShadow: string
  /** Button accent classes */
  buttonClass: string
}

interface ExportCardProps {
  title: string
  description: string
  icon: LucideIcon
  format: "excel" | "pdf"
  color: ExportCardColor
  onExport: () => Promise<void>
  delay?: number
  /** Skip auto-log and toast — useful when onExport opens a dialog that handles its own export */
  skipAutoLog?: boolean
}

const FORMAT_CONFIG = {
  excel: {
    label: "Excel",
    icon: FileSpreadsheet,
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  pdf: {
    label: "PDF",
    icon: FileText,
    badgeClass: "bg-rose-50 text-rose-700 border-rose-200",
  },
}

const SPRING = { type: "spring" as const, stiffness: 100, damping: 20 }

export function ExportCard({
  title,
  description,
  icon: Icon,
  format,
  color,
  onExport,
  delay = 0,
  skipAutoLog = false,
}: ExportCardProps) {
  const [isExporting, setIsExporting] = useState(false)
  const config = FORMAT_CONFIG[format]
  const queryClient = useQueryClient()

  async function handleExport() {
    if (isExporting) return
    if (skipAutoLog) {
      await onExport()
      return
    }
    setIsExporting(true)
    try {
      await onExport()
      await logExport(title, format)
      queryClient.invalidateQueries({ queryKey: ["export-logs"] })
      toast.success(`${title} exportado correctamente`)
    } catch {
      toast.error(`Error al exportar ${title.toLowerCase()}`)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...SPRING, delay }}
      whileHover={{ y: -2 }}
      className={cn(
        "rounded-2xl border p-5 flex flex-col gap-3 transition-all duration-200",
        color.cardBg,
        color.cardBorder,
        color.hoverShadow
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex size-11 items-center justify-center rounded-xl",
              color.iconBg
            )}
          >
            <Icon className={cn("size-5", color.iconColor)} strokeWidth={1.75} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-neutral-900">{title}</h3>
            <p className="text-[11px] text-neutral-500 mt-0.5">{description}</p>
          </div>
        </div>
        <Badge variant="outline" className={cn("text-[10px]", config.badgeClass)}>
          {config.label}
        </Badge>
      </div>

      <Button
        size="sm"
        onClick={handleExport}
        disabled={isExporting}
        className={cn("w-full mt-auto", color.buttonClass)}
      >
        {isExporting ? (
          <Loader2 className="mr-1.5 size-3.5 animate-spin" />
        ) : (
          <Download className="mr-1.5 size-3.5" />
        )}
        {isExporting ? "Exportando..." : "Descargar"}
      </Button>
    </motion.div>
  )
}
