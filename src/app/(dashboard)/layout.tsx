import { Sidebar } from "@/components/layout/sidebar"
import { MobileNav } from "@/components/layout/mobile-nav"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-svh bg-white p-0 lg:p-3">
      {/* Mobile nav (fixed, outside flow) */}
      <MobileNav />
      {/* Rounded container */}
      <div className="flex min-h-svh overflow-hidden bg-neutral-50 lg:h-[calc(100svh-24px)] lg:min-h-0 lg:rounded-2xl lg:shadow-sm">
        <Sidebar />

        {/* Main area */}
        <div className="flex flex-1 flex-col bg-white lg:rounded-l-2xl lg:shadow-[inset_2px_2px_8px_-4px_rgba(0,0,0,0.06)]">
          <main className="flex-1 overflow-y-auto bg-white lg:rounded-l-2xl p-4 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}
