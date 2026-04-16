import { ImageResponse } from "next/og"

export const runtime = "edge"
export const alt = "Eclat POS — Sistema de punto de venta"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

function resolveHost(): string {
  const raw =
    process.env.NEXT_PUBLIC_APP_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : null)
  if (!raw) return "eclatpos.app"
  try {
    return new URL(raw).host
  } catch {
    return "eclatpos.app"
  }
}

export default async function OpengraphImage() {
  const host = resolveHost()
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "96px 112px",
          background:
            "linear-gradient(135deg, #4C0519 0%, #871335 45%, #E11D52 100%)",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 14,
              height: 14,
              borderRadius: 999,
              background: "#FF9DB5",
              boxShadow: "0 0 24px rgba(255,157,181,0.8)",
            }}
          />
          <span
            style={{
              fontSize: 22,
              letterSpacing: 8,
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.75)",
              fontWeight: 600,
            }}
          >
            Eclat POS
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div
            style={{
              fontSize: 112,
              lineHeight: 1,
              fontWeight: 500,
              letterSpacing: -3,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <span>Vende con estilo,</span>
            <span>sin esfuerzo.</span>
          </div>
          <div
            style={{
              fontSize: 28,
              color: "rgba(255,255,255,0.7)",
              maxWidth: 720,
              lineHeight: 1.35,
            }}
          >
            Punto de venta, inventario y clientes — todo tu negocio de belleza
            en un solo lugar.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 20,
            color: "rgba(255,255,255,0.55)",
          }}
        >
          <span>{host}</span>
          <span>Powered by Abbrix</span>
        </div>
      </div>
    ),
    { ...size },
  )
}
