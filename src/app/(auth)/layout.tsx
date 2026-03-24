import { Silk } from "@/components/shared/silk-background"
import { LeftPanelAnimations } from "@/features/auth/components/left-panel-animations"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      {/* ── Desktop: split layout ── */}
      <div className="hidden min-h-svh w-full bg-white lg:flex">
        {/* Left — Login form */}
        <div className="relative flex flex-1 flex-col items-center justify-center px-10">
          {children}
        </div>

        {/* Right — Silk "window" */}
        <div className="relative w-[52%] p-4">
          <div className="relative h-full w-full overflow-hidden rounded-3xl">
            <div className="absolute inset-0">
              <Silk
                color="#FF6B8A"
                speed={3}
                scale={1}
                noiseIntensity={1.5}
                rotation={0}
              />
            </div>
            <div className="relative z-10 flex h-full flex-col justify-between p-10">
              <LeftPanelAnimations />
            </div>
          </div>
        </div>
      </div>

      {/* ── Mobile: full Silk background + floating card ── */}
      <div className="relative flex min-h-svh w-full items-center justify-center p-5 lg:hidden">
        {/* Full-bleed Silk */}
        <div className="absolute inset-0">
          <Silk
            color="#FF6B8A"
            speed={3}
            scale={1}
            noiseIntensity={1.5}
            rotation={0}
          />
        </div>

        {/* Floating card */}
        <div className="relative z-10 flex w-full max-w-md flex-col items-center rounded-3xl bg-white/90 px-6 py-10 shadow-2xl backdrop-blur-xl sm:px-10">
          {children}
        </div>
      </div>
    </>
  )
}
