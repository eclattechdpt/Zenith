"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import {
  Download,
  Trash2,
  RefreshCw,
  FileSpreadsheet,
  X,
  Loader2,
  CheckCircle2,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { toast } from "sonner"

import {
  uploadProductImage,
  fetchImageFromUrl,
  compressImage,
} from "@/lib/supabase/storage"
import { updateProductImageUrl, findOrphanedFiles, deleteStorageFiles } from "../actions"
import { exportMediaAudit } from "./media-export"
import type { MediaItem } from "../types"

interface BulkActionToolbarProps {
  selectedItems: MediaItem[]
  allItems: MediaItem[]
  onClearSelection: () => void
  onComplete: () => void
}

type BulkAction = "optimize" | "orphan" | "recompress" | "export"

export function BulkActionToolbar({
  selectedItems,
  allItems,
  onClearSelection,
  onComplete,
}: BulkActionToolbarProps) {
  const [running, setRunning] = useState<BulkAction | null>(null)
  const [progress, setProgress] = useState({ current: 0, total: 0 })
  const [orphanConfirm, setOrphanConfirm] = useState(false)
  const [orphanCount, setOrphanCount] = useState(0)
  const [orphanPaths, setOrphanPaths] = useState<string[]>([])

  const count = selectedItems.length
  const hasUrlItems = selectedItems.some((i) => i.hostingType === "url" || i.hostingType === "data")
  const hasSupabaseItems = selectedItems.some((i) => i.hostingType === "supabase")

  // ── Batch Optimize ──
  async function handleBatchOptimize() {
    const toOptimize = selectedItems.filter(
      (i) => (i.hostingType === "url" || i.hostingType === "data") && i.imageUrl
    )
    if (toOptimize.length === 0) {
      toast.warning("Selecciona productos con URL externa o Data URL para optimizar")
      return
    }

    setRunning("optimize")
    setProgress({ current: 0, total: toOptimize.length })

    let success = 0
    let failed = 0

    for (const item of toOptimize) {
      try {
        const file = await fetchImageFromUrl(item.imageUrl!)
        const publicUrl = await uploadProductImage(file, item.productId)
        const result = await updateProductImageUrl(item.productId, publicUrl)
        if (result.error) throw new Error(result.error)
        success++
      } catch {
        failed++
      }
      setProgress((p) => ({ ...p, current: p.current + 1 }))
    }

    setRunning(null)
    onClearSelection()
    onComplete()

    if (failed === 0) {
      toast.success(`${success} imagen${success !== 1 ? "es" : ""} optimizada${success !== 1 ? "s" : ""} y subida${success !== 1 ? "s" : ""} a Supabase`)
    } else {
      toast.warning(`Optimizacion parcial: ${success} exitosa${success !== 1 ? "s" : ""}, ${failed} fallida${failed !== 1 ? "s" : ""}`)
    }
  }

  // ── Orphan Cleanup ──
  async function handleOrphanScan() {
    setRunning("orphan")
    const result = await findOrphanedFiles()
    setRunning(null)

    if (result.error) {
      toast.error(result.error)
      return
    }

    if (result.data!.length === 0) {
      toast.success("No hay archivos sin vincular en el almacenamiento")
      return
    }

    setOrphanCount(result.data!.length)
    setOrphanPaths(result.data!.map((o) => o.path))
    setOrphanConfirm(true)
  }

  async function handleOrphanDelete() {
    setOrphanConfirm(false)
    setRunning("orphan")

    const result = await deleteStorageFiles(orphanPaths)
    setRunning(null)

    if (result.error) {
      toast.error(result.error)
      return
    }

    toast.success(`${result.data} archivo${result.data !== 1 ? "s" : ""} huerfano${result.data !== 1 ? "s" : ""} eliminado${result.data !== 1 ? "s" : ""}`)
    onComplete()
  }

  // ── Re-compress ──
  async function handleRecompress() {
    const toRecompress = selectedItems.filter(
      (i) => i.hostingType === "supabase" && i.imageUrl
    )
    if (toRecompress.length === 0) {
      toast.warning("Selecciona productos con imagen en Supabase para re-comprimir")
      return
    }

    setRunning("recompress")
    setProgress({ current: 0, total: toRecompress.length })

    let success = 0
    let failed = 0

    for (const item of toRecompress) {
      try {
        // Download current image
        const res = await fetch(item.imageUrl!)
        const blob = await res.blob()
        const file = new File([blob], "recompress.webp", { type: blob.type })
        // Re-compress with current settings
        const compressed = await compressImage(file)
        // Re-upload
        const publicUrl = await uploadProductImage(compressed, item.productId)
        const result = await updateProductImageUrl(item.productId, publicUrl)
        if (result.error) throw new Error(result.error)
        success++
      } catch {
        failed++
      }
      setProgress((p) => ({ ...p, current: p.current + 1 }))
    }

    setRunning(null)
    onClearSelection()
    onComplete()

    if (failed === 0) {
      toast.success(`${success} imagen${success !== 1 ? "es" : ""} re-comprimida${success !== 1 ? "s" : ""}`)
    } else {
      toast.warning(`Re-compresion parcial: ${success} exitosa${success !== 1 ? "s" : ""}, ${failed} fallida${failed !== 1 ? "s" : ""}`)
    }
  }

  // ── Export Audit ──
  async function handleExport() {
    setRunning("export")
    try {
      exportMediaAudit(allItems)
      toast.success("Archivo Excel descargado")
    } catch {
      toast.error("No se pudo generar el archivo")
    }
    setRunning(null)
  }

  return (
    <>
      <AnimatePresence>
        {count > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.2 }}
            className="flex flex-wrap items-center gap-2 rounded-xl border border-violet-200/60 bg-violet-50/50 p-3"
          >
            {/* Selection count */}
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-violet-500" />
              <span className="text-xs font-medium text-violet-700">
                {count} seleccionado{count !== 1 ? "s" : ""}
              </span>
              <button
                onClick={onClearSelection}
                className="rounded-md p-0.5 text-violet-400 transition-colors hover:text-violet-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="mx-1 h-4 w-px bg-violet-200" />

            {/* Actions */}
            <Button
              variant="outline"
              size="sm"
              className="h-7 gap-1.5 border-violet-200 text-xs text-violet-700 hover:bg-violet-100"
              onClick={handleBatchOptimize}
              disabled={running !== null || !hasUrlItems}
              title={!hasUrlItems ? "Selecciona productos con URL externa" : undefined}
            >
              {running === "optimize" ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Download className="h-3 w-3" />
              )}
              Optimizar
              {running === "optimize" && (
                <span className="tabular-nums">
                  {progress.current}/{progress.total}
                </span>
              )}
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="h-7 gap-1.5 border-violet-200 text-xs text-violet-700 hover:bg-violet-100"
              onClick={handleRecompress}
              disabled={running !== null || !hasSupabaseItems}
              title={!hasSupabaseItems ? "Selecciona productos con imagen en Supabase" : undefined}
            >
              {running === "recompress" ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <RefreshCw className="h-3 w-3" />
              )}
              Re-comprimir
              {running === "recompress" && (
                <span className="tabular-nums">
                  {progress.current}/{progress.total}
                </span>
              )}
            </Button>

            <div className="mx-1 h-4 w-px bg-violet-200" />

            <Button
              variant="outline"
              size="sm"
              className="h-7 gap-1.5 border-amber-200 text-xs text-amber-700 hover:bg-amber-50"
              onClick={handleOrphanScan}
              disabled={running !== null}
            >
              {running === "orphan" ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Trash2 className="h-3 w-3" />
              )}
              Limpiar huerfanos
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="h-7 gap-1.5 border-neutral-200 text-xs text-neutral-600 hover:bg-neutral-50"
              onClick={handleExport}
              disabled={running !== null}
            >
              {running === "export" ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <FileSpreadsheet className="h-3 w-3" />
              )}
              Exportar auditoria
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Orphan confirm dialog */}
      <ConfirmDialog
        open={orphanConfirm}
        onOpenChange={setOrphanConfirm}
        title="Limpiar archivos huerfanos"
        description={`Se encontraron ${orphanCount} archivo${orphanCount !== 1 ? "s" : ""} en el almacenamiento que no estan vinculados a ningun producto activo. ¿Deseas eliminarlos?`}
        confirmLabel="Eliminar"
        onConfirm={handleOrphanDelete}
        variant="destructive"
      />
    </>
  )
}
