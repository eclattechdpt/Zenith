import imageCompression from "browser-image-compression"

import { createClient } from "./client"

const BUCKET = "product-images"
const TENANT_ID = process.env.NEXT_PUBLIC_TENANT_ID!
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!

// ── Compression (runs client-side before upload) ──

const COMPRESSION_OPTIONS = {
  maxSizeMB: 0.03, // 30 KB max — product cards render at ~300px, 400px source is plenty
  maxWidthOrHeight: 400,
  useWebWorker: true,
  fileType: "image/webp" as const,
  initialQuality: 0.7,
}

export async function compressImage(file: File): Promise<File> {
  // Skip compression for very small files (< 10KB) — already tiny
  if (file.size < 10_000) return file
  return imageCompression(file, COMPRESSION_OPTIONS)
}

// ── Upload ──

/**
 * Compresses and uploads a product image to Supabase Storage.
 * Returns the public URL for `image_url` column.
 */
export async function uploadProductImage(
  file: File,
  productId: string
): Promise<string> {
  const compressed = await compressImage(file)

  const ext = "webp"
  const path = `${TENANT_ID}/${productId}.${ext}`

  const supabase = createClient()

  // Remove existing image at this path first (upsert)
  await supabase.storage.from(BUCKET).remove([path])

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, compressed, {
      contentType: "image/webp",
      cacheControl: "31536000",  // 1 year — images are immutable (re-upload = new version)
      upsert: true,
    })

  if (error) throw new Error(`Error al subir imagen: ${error.message}`)

  return getPublicUrl(path)
}

// ── Delete ──

/**
 * Deletes a product image from storage.
 * Accepts either a full public URL or a storage path.
 */
export async function deleteProductImage(urlOrPath: string): Promise<void> {
  const path = extractStoragePath(urlOrPath)
  if (!path) return

  const supabase = createClient()
  await supabase.storage.from(BUCKET).remove([path])
}

// ── URL helpers ──

export function getPublicUrl(storagePath: string): string {
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${storagePath}`
}

/**
 * Checks if a URL points to our Supabase Storage bucket.
 */
export function isStorageUrl(url: string): boolean {
  return url.includes(`/storage/v1/object/public/${BUCKET}/`)
}

/**
 * Extracts the storage path from a full public URL.
 * Returns null if the URL isn't from our bucket.
 */
function extractStoragePath(url: string): string | null {
  const marker = `/storage/v1/object/public/${BUCKET}/`
  const idx = url.indexOf(marker)
  if (idx === -1) return null
  return url.slice(idx + marker.length)
}

// ── Validation ──

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/jpg",
])
const SILENT_MAX = 15 * 1024 * 1024 // 15 MB — compress silently
const HARD_MAX = 25 * 1024 * 1024   // 25 MB — hard block

export type ValidationResult = {
  status: "ok" | "warn" | "blocked"
  message: string | null
}

export function validateImageFile(file: File): ValidationResult {
  if (!ALLOWED_TYPES.has(file.type)) {
    return { status: "blocked", message: "Solo se permiten imagenes JPG, PNG o WebP" }
  }
  if (file.size > HARD_MAX) {
    return { status: "blocked", message: "Imagen demasiado grande (max 25 MB)" }
  }
  if (file.size > SILENT_MAX) {
    return { status: "warn", message: "Imagen pesada, se optimizara automaticamente" }
  }
  return { status: "ok", message: null }
}

// ── Image metadata ──

export type ImageHosting = "supabase" | "url" | "data" | "pending"

export interface ImageMeta {
  hosting: ImageHosting
  /** Human-readable label for the hosting type */
  label: string
  /** Domain for URL images, "Supabase Storage" for stored, "Local" for blobs */
  source: string
  /** Short detail line (format, domain hint, etc.) */
  detail: string
}

/**
 * Extracts display metadata from an image URL for the image picker info bar.
 */
export function getImageMeta(url: string | null | undefined): ImageMeta | null {
  if (!url) return null

  if (url.startsWith("blob:")) {
    return {
      hosting: "pending",
      label: "Pendiente",
      source: "Local",
      detail: "Se subira al crear el producto",
    }
  }

  if (url.startsWith("data:")) {
    const mimeMatch = url.match(/^data:(image\/[^;,]+)/)
    const format = mimeMatch?.[1]?.split("/")[1]?.toUpperCase() ?? "Imagen"
    // Estimate raw size: base64 portion is ~75% of the encoded string length
    const commaIdx = url.indexOf(",")
    const base64Len = commaIdx > 0 ? url.length - commaIdx - 1 : 0
    const estimatedBytes = Math.floor(base64Len * 0.75)
    const sizeStr = estimatedBytes > 1024
      ? `~${(estimatedBytes / 1024).toFixed(0)} KB`
      : `~${estimatedBytes} B`
    return {
      hosting: "data",
      label: "Data URL",
      source: "Imagen embebida",
      detail: `${format} · ${sizeStr} · Se recomienda optimizar`,
    }
  }

  if (isStorageUrl(url)) {
    return {
      hosting: "supabase",
      label: "Supabase Storage",
      source: "Almacenamiento propio",
      detail: "Optimizada · WebP",
    }
  }

  // External URL — extract domain
  let domain = ""
  try {
    domain = new URL(url).hostname.replace(/^www\./, "")
  } catch {
    domain = "URL externa"
  }

  return {
    hosting: "url",
    label: "URL Externa",
    source: domain,
    detail: "Depende del servidor externo",
  }
}

// ── Data URL detection & conversion ──

/**
 * Checks if a string is a data URL (data:image/...).
 */
export function isDataUrl(url: string): boolean {
  return url.startsWith("data:image/")
}

/**
 * Converts a data URL to a File object.
 * Handles base64-encoded and raw data URLs.
 */
export async function dataUrlToFile(dataUrl: string): Promise<File> {
  const match = dataUrl.match(/^data:(image\/[^;,]+)/)
  if (!match) throw new Error("Data URL invalida o no es una imagen")

  const mimeType = match[1]

  // Convert to blob via fetch — cleanest cross-browser approach
  const res = await fetch(dataUrl)
  const blob = await res.blob()

  if (blob.size > HARD_MAX) {
    throw new Error("Imagen demasiado grande (max 25 MB)")
  }

  const ext = mimeType.split("/")[1]?.replace("jpeg", "jpg") ?? "png"
  return new File([blob], `embedded.${ext}`, { type: mimeType })
}

// ── URL → File (via server proxy to bypass CORS, or direct decode) ──

/**
 * Converts any image URL to a File object.
 * - data: URLs are decoded client-side (no server needed)
 * - http/https URLs go through the image proxy to bypass CORS
 */
export async function fetchImageFromUrl(url: string): Promise<File> {
  // Data URLs — decode directly, no proxy needed
  if (isDataUrl(url)) {
    return dataUrlToFile(url)
  }

  // HTTP(S) URLs — fetch via server proxy
  const res = await fetch("/api/image-proxy", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  })

  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(
      (data as { error?: string }).error ??
        "No se pudo descargar la imagen. Verifica la URL."
    )
  }

  const contentType = res.headers.get("content-type") ?? "image/jpeg"
  const blob = await res.blob()
  const ext = contentType.split("/")[1]?.replace("jpeg", "jpg") ?? "jpg"
  return new File([blob], `downloaded.${ext}`, { type: contentType })
}
