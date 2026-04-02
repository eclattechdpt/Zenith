"use client"

import { useState } from "react"
import { Download, Loader2, FileSpreadsheet, FileText } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface ExportCardProps {
  title: string
  description: string
  icon: LucideIcon
  format: "excel" | "pdf"
  onExport: () => Promise<void>
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

export function ExportCard({
  title,
  description,
  icon: Icon,
  format,
  onExport,
}: ExportCardProps) {
  const [isExporting, setIsExporting] = useState(false)
  const config = FORMAT_CONFIG[format]

  async function handleExport() {
    if (isExporting) return
    setIsExporting(true)
    try {
      await onExport()
      toast.success(`${title} exportado correctamente`)
    } catch {
      toast.error(`Error al exportar ${title.toLowerCase()}`)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="rounded-2xl border border-neutral-100 bg-white p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-neutral-50">
            <Icon className="size-5 text-neutral-500" strokeWidth={1.5} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-neutral-950">{title}</h3>
            <p className="text-xs text-neutral-500 mt-0.5">{description}</p>
          </div>
        </div>
        <Badge variant="outline" className={`text-[10px] ${config.badgeClass}`}>
          {config.label}
        </Badge>
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={handleExport}
        disabled={isExporting}
        className="w-full mt-auto"
      >
        {isExporting ? (
          <Loader2 className="mr-1.5 size-3.5 animate-spin" />
        ) : (
          <Download className="mr-1.5 size-3.5" />
        )}
        {isExporting ? "Exportando..." : "Descargar"}
      </Button>
    </div>
  )
}
