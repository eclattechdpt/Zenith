import { ImageResponse } from "next/og"

export const runtime = "edge"
export const size = { width: 180, height: 180 }
export const contentType = "image/png"

export default async function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background:
            "linear-gradient(135deg, #4C0519 0%, #871335 45%, #E11D52 100%)",
          borderRadius: 40,
        }}
      >
        <div
          style={{
            fontSize: 112,
            fontWeight: 600,
            color: "#FFE4EA",
            fontFamily: "serif",
            letterSpacing: -4,
            lineHeight: 1,
            textShadow: "0 4px 24px rgba(255,157,181,0.5)",
          }}
        >
          é
        </div>
      </div>
    ),
    { ...size },
  )
}
