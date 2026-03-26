import { Sidebar } from "@/components/layout/sidebar"
import { MobileNav } from "@/components/layout/mobile-nav"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-svh bg-neutral-200 p-0 lg:p-3">
      {/* Mobile nav (fixed, outside flow) */}
      <MobileNav />
      {/* Rounded container */}
      <div className="flex min-h-svh overflow-hidden bg-neutral-50 lg:h-[calc(100svh-24px)] lg:min-h-0 lg:rounded-2xl lg:shadow-sm">
        <Sidebar />

        {/* Main area */}
        <div className="flex flex-1 flex-col bg-white">
          <main className="flex-1 overflow-y-auto bg-white p-4 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}
