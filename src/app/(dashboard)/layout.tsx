import { Sidebar } from "@/components/layout/sidebar"
import { MobileNav } from "@/components/layout/mobile-nav"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="h-svh bg-neutral-50">
      {/* Mobile nav (fixed, outside flow) */}
      <MobileNav />
      <div className="flex h-svh overflow-hidden">
        <Sidebar />

        {/* Main area */}
        <div className="flex min-w-0 flex-1 flex-col">
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-neutral-50">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}
