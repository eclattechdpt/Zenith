import { NextRequest, NextResponse } from "next/server"

const HARD_MAX_BYTES = 25 * 1024 * 1024 // 25 MB
const FETCH_TIMEOUT_MS = 15_000

// Content types that are valid images (some CDNs return non-standard types)
const IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
  "image/avif",
  "image/bmp",
  "image/tiff",
  "image/jpg",
])

function isImageContentType(ct: string): boolean {
  // Exact match
  if (IMAGE_TYPES.has(ct)) return true
  // Starts with image/ (catches image/x-icon, etc.)
  if (ct.startsWith("image/")) return true
  // Some CDNs serve images as application/octet-stream with content-disposition
  // We handle that below by checking the response content
  return false
}

export async function POST(req: NextRequest) {
  let body: { url?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Body invalido" }, { status: 400 })
  }

  const url = body.url?.trim()
  if (!url) {
    return NextResponse.json({ error: "URL requerida" }, { status: 400 })
  }

  // Validate URL format — only http/https
  let parsedUrl: URL
  try {
    parsedUrl = new URL(url)
    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      return NextResponse.json(
        { error: "Solo se aceptan URLs http o https" },
        { status: 400 }
      )
    }
  } catch {
    return NextResponse.json({ error: "URL invalida" }, { status: 400 })
  }

  // Fetch the image (follows redirects by default)
  let response: Response
  try {
    response = await fetch(url, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: {
        "User-Agent": "ZenithPOS/1.0 ImageProxy",
        // Accept image/* but also generic types for CDNs that don't set proper Accept
        Accept: "image/webp,image/avif,image/*,*/*;q=0.8",
      },
      redirect: "follow",
    })
  } catch (err) {
    const msg = err instanceof Error && err.name === "TimeoutError"
      ? "Tiempo de espera agotado (15s). El servidor no responde."
      : "No se pudo descargar la imagen. Verifica la URL."
    return NextResponse.json({ error: msg }, { status: 502 })
  }

  if (!response.ok) {
    const statusMessages: Record<number, string> = {
      403: "Acceso denegado por el servidor. La imagen puede requerir autenticacion.",
      404: "Imagen no encontrada. Verifica que la URL sea correcta.",
      429: "Demasiadas peticiones. Intenta de nuevo en unos segundos.",
      500: "Error interno del servidor de origen.",
    }
    const msg = statusMessages[response.status]
      ?? `Error al descargar: ${response.status} ${response.statusText}`
    return NextResponse.json({ error: msg }, { status: 502 })
  }

  // Validate content type
  const rawContentType = response.headers.get("content-type") ?? ""
  const contentType = rawContentType.split(";")[0].trim().toLowerCase()

  // Read body regardless — some servers lie about content-type
  const arrayBuffer = await response.arrayBuffer()

  if (arrayBuffer.byteLength > HARD_MAX_BYTES) {
    return NextResponse.json(
      { error: "La imagen es demasiado grande (max 25 MB)" },
      { status: 413 }
    )
  }

  // Validate it's actually an image
  // Check content-type header first, then fall back to magic bytes
  let resolvedType = contentType
  if (!isImageContentType(contentType)) {
    // Try to detect image from magic bytes
    const detected = detectImageType(new Uint8Array(arrayBuffer.slice(0, 16)))
    if (detected) {
      resolvedType = detected
    } else {
      return NextResponse.json(
        { error: "El recurso no es una imagen. Content-Type: " + (rawContentType || "(sin tipo)") },
        { status: 422 }
      )
    }
  }

  // Check content-length header if available (pre-download guard)
  const contentLength = response.headers.get("content-length")
  if (contentLength && parseInt(contentLength, 10) > HARD_MAX_BYTES) {
    return NextResponse.json(
      { error: "La imagen es demasiado grande (max 25 MB)" },
      { status: 413 }
    )
  }

  return new NextResponse(arrayBuffer, {
    status: 200,
    headers: {
      "Content-Type": resolvedType,
      "Content-Length": String(arrayBuffer.byteLength),
    },
  })
}

/**
 * Detect image type from magic bytes (file signature).
 * Returns MIME type or null if not recognized.
 */
function detectImageType(header: Uint8Array): string | null {
  if (header.length < 4) return null

  // JPEG: FF D8 FF
  if (header[0] === 0xFF && header[1] === 0xD8 && header[2] === 0xFF) {
    return "image/jpeg"
  }
  // PNG: 89 50 4E 47
  if (header[0] === 0x89 && header[1] === 0x50 && header[2] === 0x4E && header[3] === 0x47) {
    return "image/png"
  }
  // WebP: RIFF....WEBP
  if (header[0] === 0x52 && header[1] === 0x49 && header[2] === 0x46 && header[3] === 0x46 &&
      header.length >= 12 && header[8] === 0x57 && header[9] === 0x45 && header[10] === 0x42 && header[11] === 0x50) {
    return "image/webp"
  }
  // GIF: GIF8
  if (header[0] === 0x47 && header[1] === 0x49 && header[2] === 0x46 && header[3] === 0x38) {
    return "image/gif"
  }
  // BMP: BM
  if (header[0] === 0x42 && header[1] === 0x4D) {
    return "image/bmp"
  }
  // AVIF: ....ftypavif (offset 4)
  if (header.length >= 12 && header[4] === 0x66 && header[5] === 0x74 && header[6] === 0x79 && header[7] === 0x70) {
    return "image/avif"
  }

  return null
}
