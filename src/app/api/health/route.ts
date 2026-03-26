import { NextResponse } from "next/server"

export type HealthStatus = "online" | "warning" | "error"

export interface HealthResponse {
  status: HealthStatus
  message?: string
  latencyMs?: number
}

const SLOW_THRESHOLD_MS = 3000
const TIMEOUT_MS = 8000

/**
 * Pings the Supabase REST API root. Any HTTP response (even 4xx) means
 * the project is alive. Only network/timeout errors indicate downtime.
 * This bypasses RLS since we never query a table.
 */
export async function GET(): Promise<NextResponse<HealthResponse>> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    return NextResponse.json({
      status: "error" as const,
      message: "Configuracion de Supabase no encontrada.",
    })
  }

  const start = performance.now()

  try {
    const res = await fetch(`${url}/rest/v1/`, {
      method: "HEAD",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
      },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })

    const latencyMs = Math.round(performance.now() - start)

    // Supabase returns 404 on paused projects via its proxy,
    // and 503/502 when the project is waking up or down.
    if (res.status === 503 || res.status === 502) {
      return NextResponse.json({
        status: "error" as const,
        message: "El servidor esta temporalmente fuera de servicio. Puede estar pausado o reiniciando.",
        latencyMs,
      })
    }

    // Any other HTTP response means the server is reachable
    if (latencyMs > SLOW_THRESHOLD_MS) {
      return NextResponse.json({
        status: "warning" as const,
        message: "Rendimiento reducido — la respuesta tomo mas de 3 segundos.",
        latencyMs,
      })
    }

    return NextResponse.json({ status: "online" as const, latencyMs })
  } catch (err) {
    const latencyMs = Math.round(performance.now() - start)
    const msg = err instanceof Error ? err.message.toLowerCase() : ""

    if (msg.includes("timeout") || msg.includes("abort")) {
      return NextResponse.json({
        status: "error" as const,
        message: "El servidor no respondio a tiempo. Puede estar pausado o inaccesible.",
        latencyMs,
      })
    }

    return NextResponse.json({
      status: "error" as const,
      message: "Sin conexion al servidor. Verifica tu conexion a internet.",
      latencyMs,
    })
  }
}
