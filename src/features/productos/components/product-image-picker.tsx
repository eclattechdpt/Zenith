"use client"

import { useState, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "motion/react"
import {
  ImagePlus,
  Link2,
  Upload,
  X,
  Loader2,
  AlertCircle,
  AlertTriangle,
  Check,
  Sparkles,
  Download,
  ExternalLink,
  RefreshCw,
  Trash2,
  Server,
  Globe,
  Clock,
} from "lucide-react"

import { Input } from "@/components/ui/input"
import {
  uploadProductImage,
  deleteProductImage,
  isStorageUrl,
  isDataUrl,
  validateImageFile,
  fetchImageFromUrl,
  compressImage,
  getImageMeta,
  type ImageHosting,
} from "@/lib/supabase/storage"

const SPRING_SNAPPY = { type: "spring" as const, stiffness: 500, damping: 35 }

type Mode = "url" | "upload"

interface ProductImagePickerProps {
  /** Current image URL (external or Supabase Storage) */
  value: string | null | undefined
  /** Called with the new URL (or null to remove) */
  onChange: (url: string | null) => void
  /** Product ID — needed for storage path. Omit for new products (upload deferred). */
  productId?: string
  /** Compact layout for dialogs */
  compact?: boolean
}

const HOSTING_CONFIG: Record<ImageHosting, { dot: string; icon: typeof Server }> = {
  supabase: { dot: "bg-teal-400", icon: Server },
  url: { dot: "bg-blue-400", icon: Globe },
  data: { dot: "bg-violet-400", icon: Link2 },
  pending: { dot: "bg-amber-400", icon: Clock },
}

export function ProductImagePicker({
  value,
  onChange,
  productId,
  compact = false,
}: ProductImagePickerProps) {
  const [mode, setMode] = useState<Mode>("upload")
  const [urlInput, setUrlInput] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [warning, setWarning] = useState<string | null>(null)
  const [compressionInfo, setCompressionInfo] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [pendingUrl, setPendingUrl] = useState<string | null>(null)
  // "changing" mode: preview stays visible but picker appears below
  const [isChanging, setIsChanging] = useState(false)
  // Converting URL → Supabase
  const [isConverting, setIsConverting] = useState(false)
  const [convertProgress, setConvertProgress] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  const hasImage = !!value
  const meta = getImageMeta(value)

  // ── Core processing: validate → compress → upload ──

  const processFile = useCallback(
    async (file: File) => {
      setError(null)
      setWarning(null)
      setCompressionInfo(null)

      const validation = validateImageFile(file)
      if (validation.status === "blocked") {
        setError(validation.message)
        return
      }
      if (validation.status === "warn") {
        setWarning(validation.message)
      }

      if (!productId) {
        // New product: compress locally, store file for deferred upload
        setIsUploading(true)
        setUploadProgress("Optimizando...")
        try {
          const compressed = await compressImage(file)
          const blobUrl = URL.createObjectURL(compressed)
          onChange(blobUrl)
          setCompressionInfo(formatSize(compressed.size))
          if (inputRef.current) {
            ;(inputRef.current as HTMLInputElement & { __pendingFile?: File }).__pendingFile = compressed
          }
        } catch (err) {
          setError(err instanceof Error ? err.message : "Error al optimizar imagen")
        } finally {
          setIsUploading(false)
          setUploadProgress("")
        }
        return
      }

      // Existing product: compress and upload directly
      setIsUploading(true)
      setUploadProgress("Optimizando...")

      try {
        setUploadProgress("Subiendo...")
        const publicUrl = await uploadProductImage(file, productId)
        onChange(publicUrl)

        const compressed = await compressImage(file)
        setCompressionInfo(formatSize(compressed.size))
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al subir imagen")
      } finally {
        setIsUploading(false)
        setUploadProgress("")
        setIsChanging(false)
      }
    },
    [productId, onChange]
  )

  // ── File handlers ──

  const handleFileDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) processFile(file)
    },
    [processFile]
  )

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) processFile(file)
      e.target.value = ""
    },
    [processFile]
  )

  // ── URL handler: validate → show choice (or auto-process for data URLs) ──

  const handleUrlSubmit = useCallback(async () => {
    const trimmed = urlInput.trim()
    if (!trimmed) return

    // Data URLs — decode directly and process as a file upload
    if (isDataUrl(trimmed)) {
      setError(null)
      setWarning(null)
      setIsUploading(true)
      setUploadProgress("Decodificando...")
      try {
        const file = await fetchImageFromUrl(trimmed)
        setUploadProgress("Optimizando...")
        await processFile(file)
        setUrlInput("")
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudo procesar la imagen")
        setIsUploading(false)
        setUploadProgress("")
      }
      return
    }

    // Regular URLs — validate and show choice panel
    try {
      new URL(trimmed)
    } catch {
      setError("URL invalida")
      return
    }

    setError(null)
    setWarning(null)
    setPendingUrl(trimmed)
  }, [urlInput, processFile])

  const handleUrlKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault()
        handleUrlSubmit()
      }
    },
    [handleUrlSubmit]
  )

  // ── URL choice actions ──

  const handleDownloadAndOptimize = useCallback(async () => {
    if (!pendingUrl) return

    setIsUploading(true)
    setUploadProgress("Descargando imagen...")
    setCompressionInfo(null)

    try {
      const file = await fetchImageFromUrl(pendingUrl)
      setUploadProgress("Optimizando...")
      await processFile(file)
      setUrlInput("")
      setPendingUrl(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo descargar la imagen")
      setIsUploading(false)
      setUploadProgress("")
    }
  }, [pendingUrl, processFile])

  const handleKeepLink = useCallback(() => {
    if (!pendingUrl) return
    onChange(pendingUrl)
    setUrlInput("")
    setPendingUrl(null)
    setIsChanging(false)
  }, [pendingUrl, onChange])

  const handleCancelChoice = useCallback(() => {
    setPendingUrl(null)
  }, [])

  // ── Convert existing URL → Supabase ──

  const handleConvertToSupabase = useCallback(async () => {
    if (!value || !productId || isStorageUrl(value) || value.startsWith("blob:")) return

    setIsConverting(true)
    setConvertProgress(isDataUrl(value) ? "Decodificando..." : "Descargando...")
    setError(null)
    setCompressionInfo(null)

    try {
      const file = await fetchImageFromUrl(value)
      setConvertProgress("Optimizando...")
      const compressed = await compressImage(file)
      setConvertProgress("Subiendo...")
      const publicUrl = await uploadProductImage(compressed, productId)
      onChange(publicUrl)
      setCompressionInfo(formatSize(compressed.size))
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo descargar la imagen")
    } finally {
      setIsConverting(false)
      setConvertProgress("")
    }
  }, [value, productId, onChange])

  // ── Change mode: show picker below preview ──

  const handleStartChanging = useCallback(() => {
    setIsChanging(true)
    setError(null)
    setWarning(null)
    setCompressionInfo(null)
    setPendingUrl(null)
    setUrlInput("")
  }, [])

  const handleCancelChanging = useCallback(() => {
    setIsChanging(false)
    setError(null)
    setWarning(null)
    setPendingUrl(null)
    setUrlInput("")
  }, [])

  // ── Remove ──

  const handleRemove = useCallback(async () => {
    if (value && isStorageUrl(value)) {
      deleteProductImage(value).catch(() => {})
    }
    if (value?.startsWith("blob:")) {
      URL.revokeObjectURL(value)
    }
    onChange(null)
    setError(null)
    setWarning(null)
    setCompressionInfo(null)
    setIsChanging(false)
  }, [value, onChange])

  // ── Render: Image preview with info bar ──

  if (hasImage && !isChanging) {
    const hostConfig = meta ? HOSTING_CONFIG[meta.hosting] : null
    const HostIcon = hostConfig?.icon ?? Globe

    return (
      <div className="overflow-hidden rounded-xl border border-neutral-200/60 bg-neutral-50">
        {/* Image */}
        <div className={`group relative ${compact ? "h-36" : "h-44"} overflow-hidden bg-neutral-100`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value!}
            alt="Imagen del producto"
            className="h-full w-full object-contain"
            onError={() => setError("No se pudo cargar la imagen")}
          />

          {/* Error overlay */}
          {error && (
            <div className="absolute inset-x-0 bottom-0 bg-red-500/90 px-3 py-1.5 text-center text-[11px] font-medium text-white">
              {error}
            </div>
          )}
        </div>

        {/* Info bar */}
        {meta && (
          <div className="border-t border-neutral-100 bg-white px-4 py-3">
            {/* Converting progress */}
            {isConverting ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2.5"
              >
                <Loader2 className="h-3.5 w-3.5 animate-spin text-teal-500" />
                <p className="text-[12px] font-medium text-teal-600">{convertProgress}</p>
              </motion.div>
            ) : (
              <>
                {/* Type + source row */}
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 flex-shrink-0 rounded-full ${hostConfig?.dot ?? "bg-neutral-300"}`} />
                  <HostIcon className="h-3 w-3 flex-shrink-0 text-neutral-400" />
                  <span className="text-[12px] font-semibold text-neutral-700">{meta.label}</span>
                  <span className="text-[10px] text-neutral-300">·</span>
                  <span className="min-w-0 truncate text-[11px] text-neutral-400">{meta.source}</span>
                </div>

                {/* Detail line */}
                <div className="mt-1 flex items-center gap-2">
                  <p className="text-[10px] text-neutral-400">{meta.detail}</p>
                  {compressionInfo && (
                    <span className="flex items-center gap-0.5 rounded-full bg-teal-50 px-1.5 py-0.5 text-[9px] font-bold text-teal-600">
                      <Sparkles className="h-2.5 w-2.5" />
                      {compressionInfo}
                    </span>
                  )}
                </div>

                {/* Actions row */}
                <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                  {/* Convert to Supabase — for URL and data URL images with a productId */}
                  {(meta.hosting === "url" || meta.hosting === "data") && productId && (
                    <motion.button
                      type="button"
                      onClick={handleConvertToSupabase}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      transition={SPRING_SNAPPY}
                      className="flex items-center gap-1.5 rounded-lg bg-teal-50 px-2.5 py-1.5 text-[11px] font-semibold text-teal-700 transition-colors hover:bg-teal-100"
                    >
                      <Download className="h-3 w-3" />
                      {meta.hosting === "data" ? "Optimizar a Supabase" : "Descargar a Supabase"}
                    </motion.button>
                  )}

                  {/* Convert hint for new products with URL/data */}
                  {(meta.hosting === "url" || meta.hosting === "data") && !productId && (
                    <span className="flex items-center gap-1 text-[10px] text-amber-500">
                      <AlertTriangle className="h-3 w-3" />
                      Se podra optimizar despues de crear
                    </span>
                  )}

                  <motion.button
                    type="button"
                    onClick={handleStartChanging}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    transition={SPRING_SNAPPY}
                    className="flex items-center gap-1.5 rounded-lg bg-neutral-100 px-2.5 py-1.5 text-[11px] font-semibold text-neutral-500 transition-colors hover:bg-neutral-200 hover:text-neutral-700"
                  >
                    <RefreshCw className="h-3 w-3" />
                    Cambiar
                  </motion.button>

                  <motion.button
                    type="button"
                    onClick={handleRemove}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    transition={SPRING_SNAPPY}
                    className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold text-neutral-400 transition-colors hover:bg-red-50 hover:text-red-500"
                  >
                    <Trash2 className="h-3 w-3" />
                    Eliminar
                  </motion.button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    )
  }

  // ── Render: Picker (no image, or "changing" mode) ──

  return (
    <div className="overflow-hidden rounded-xl border border-neutral-200/60 bg-neutral-50/50">
      {/* Changing header: mini preview + cancel */}
      {isChanging && hasImage && (
        <div className="flex items-center gap-3 border-b border-neutral-100 bg-white px-4 py-2.5">
          <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg bg-neutral-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value!} alt="" className="h-full w-full object-cover" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold text-neutral-500">Cambiando imagen</p>
            <p className="truncate text-[10px] text-neutral-400">
              Selecciona una nueva imagen para reemplazar la actual
            </p>
          </div>
          <button
            type="button"
            onClick={handleCancelChanging}
            className="rounded-lg p-1.5 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Mode tabs */}
      <div className="flex border-b border-neutral-100">
        <button
          type="button"
          onClick={() => { setMode("upload"); setError(null); setWarning(null); setPendingUrl(null) }}
          className={`flex flex-1 items-center justify-center gap-1.5 py-2.5 text-[11px] font-semibold uppercase tracking-wider transition-colors ${
            mode === "upload"
              ? "border-b-2 border-rose-400 text-rose-500"
              : "text-neutral-400 hover:text-neutral-600"
          }`}
        >
          <Upload className="h-3 w-3" />
          Subir archivo
        </button>
        <button
          type="button"
          onClick={() => { setMode("url"); setError(null); setWarning(null) }}
          className={`flex flex-1 items-center justify-center gap-1.5 py-2.5 text-[11px] font-semibold uppercase tracking-wider transition-colors ${
            mode === "url"
              ? "border-b-2 border-rose-400 text-rose-500"
              : "text-neutral-400 hover:text-neutral-600"
          }`}
        >
          <Link2 className="h-3 w-3" />
          URL
        </button>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait" initial={false}>
        {mode === "upload" ? (
          <motion.div
            key="upload"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.15 }}
            className="p-4"
          >
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleFileDrop}
              onClick={() => !isUploading && inputRef.current?.click()}
              className={`flex cursor-pointer flex-col items-center gap-2.5 rounded-lg border-2 border-dashed py-6 transition-colors ${
                isDragging
                  ? "border-rose-300 bg-rose-50/50"
                  : "border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50"
              } ${isUploading ? "pointer-events-none opacity-60" : ""}`}
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-6 w-6 animate-spin text-rose-400" />
                  <p className="text-[12px] font-medium text-neutral-500">
                    {uploadProgress}
                  </p>
                </>
              ) : (
                <>
                  <motion.div
                    animate={isDragging ? { scale: 1.15, y: -2 } : { scale: 1, y: 0 }}
                    transition={SPRING_SNAPPY}
                  >
                    <ImagePlus
                      className={`h-7 w-7 ${isDragging ? "text-rose-400" : "text-neutral-300"}`}
                      strokeWidth={1.5}
                    />
                  </motion.div>
                  <div className="text-center">
                    <p className="text-[12px] font-semibold text-neutral-500">
                      {isDragging ? "Suelta la imagen aqui" : "Arrastra o haz clic"}
                    </p>
                    <p className="mt-0.5 text-[10px] text-neutral-400">
                      JPG, PNG o WebP · Max 25 MB
                    </p>
                  </div>
                </>
              )}
            </div>

            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleFileInput}
            />
          </motion.div>
        ) : (
          <motion.div
            key="url"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.15 }}
            className="p-4"
          >
            {isUploading ? (
              /* Loading state during download+compress */
              <div className="flex flex-col items-center gap-2.5 py-4">
                <Loader2 className="h-6 w-6 animate-spin text-rose-400" />
                <p className="text-[12px] font-medium text-neutral-500">
                  {uploadProgress}
                </p>
              </div>
            ) : pendingUrl ? (
              /* Choice panel: download vs keep link */
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-2"
              >
                {/* URL preview */}
                <div className="flex items-center gap-2 rounded-lg bg-neutral-100/80 px-3 py-2">
                  <Link2 className="h-3.5 w-3.5 flex-shrink-0 text-neutral-400" />
                  <p className="min-w-0 flex-1 truncate text-[11px] text-neutral-500">
                    {pendingUrl}
                  </p>
                  <button type="button" onClick={handleCancelChoice} className="text-neutral-400 hover:text-neutral-600">
                    <X className="h-3 w-3" />
                  </button>
                </div>

                {/* Option 1: Download & optimize (recommended) */}
                <button
                  type="button"
                  onClick={handleDownloadAndOptimize}
                  className="group/opt flex w-full items-start gap-3 rounded-lg border border-teal-200/60 bg-teal-50/30 p-3 text-left transition-colors hover:border-teal-300 hover:bg-teal-50/60"
                >
                  <div className="mt-0.5 rounded-md bg-teal-100 p-1.5">
                    <Download className="h-3.5 w-3.5 text-teal-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="text-[12px] font-semibold text-teal-700">Descargar y optimizar</p>
                      <span className="rounded-full bg-teal-500 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-white">
                        Recomendado
                      </span>
                    </div>
                    <p className="mt-0.5 text-[10px] text-teal-600/70">
                      Se guarda en tu almacenamiento, optimizada a ~10 KB
                    </p>
                  </div>
                </button>

                {/* Option 2: Keep external link */}
                <button
                  type="button"
                  onClick={handleKeepLink}
                  className="group/opt flex w-full items-start gap-3 rounded-lg border border-neutral-200/60 bg-white p-3 text-left transition-colors hover:border-neutral-300 hover:bg-neutral-50"
                >
                  <div className="mt-0.5 rounded-md bg-neutral-100 p-1.5">
                    <ExternalLink className="h-3.5 w-3.5 text-neutral-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] font-semibold text-neutral-600">Usar enlace directo</p>
                    <p className="mt-0.5 text-[10px] text-neutral-400">
                      No usa almacenamiento, pero depende del servidor externo
                    </p>
                  </div>
                </button>
              </motion.div>
            ) : (
              /* URL input */
              <>
                <div className="flex gap-2">
                  <Input
                    placeholder="https://ejemplo.com/imagen.jpg"
                    value={urlInput}
                    onChange={(e) => { setUrlInput(e.target.value); setError(null) }}
                    onKeyDown={handleUrlKeyDown}
                    className="h-10 flex-1 rounded-lg border-neutral-200/80 bg-white text-[13px] focus:border-rose-200/80"
                  />
                  <motion.button
                    type="button"
                    onClick={handleUrlSubmit}
                    disabled={!urlInput.trim()}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    transition={SPRING_SNAPPY}
                    className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-accent-500 text-white transition-opacity hover:bg-accent-600 disabled:opacity-40"
                  >
                    <Check className="h-4 w-4" />
                  </motion.button>
                </div>
                <p className="mt-2 text-[10px] text-neutral-400">
                  Pega la URL de cualquier imagen publica
                </p>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Warning message (amber) */}
      <AnimatePresence>
        {warning && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-1.5 border-t border-amber-100 bg-amber-50/50 px-4 py-2">
              <AlertTriangle className="h-3 w-3 flex-shrink-0 text-amber-500" />
              <p className="text-[11px] font-medium text-amber-600">{warning}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error message (red) */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-1.5 border-t border-red-100 bg-red-50/50 px-4 py-2">
              <AlertCircle className="h-3 w-3 flex-shrink-0 text-red-400" />
              <p className="text-[11px] font-medium text-red-500">{error}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Helpers ──

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  return `${(bytes / 1024).toFixed(1)} KB`
}

/**
 * Retrieves a pending file from the image picker's input ref.
 * Used during product creation to defer upload until after product insert.
 */
export function getPendingFile(
  pickerElement: HTMLElement | null
): File | undefined {
  if (!pickerElement) return undefined
  const input = pickerElement.querySelector<
    HTMLInputElement & { __pendingFile?: File }
  >("input[type='file']")
  return input?.__pendingFile
}
