import { Sidebar } from "@/components/layout/sidebar"
import { MobileNav } from "@/components/layout/mobile-nav"
import { ModuleAccentScope } from "@/components/shared/module-accent-scope"
import { ValeReadyBanner } from "@/features/vales/components/vale-ready-banner"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="h-svh bg-neutral-50">
      {/* Syncs [data-module] on <html> with current route for accent theming */}
      <ModuleAccentScope />
      {/* Mobile nav (fixed, outside flow) */}
      <MobileNav />
      <div className="flex h-svh overflow-hidden">
        <Sidebar />

        {/* Main area */}
        <div className="flex min-w-0 flex-1 flex-col">
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-neutral-50">
            <div className="px-5 pt-4 sm:px-8">
              <ValeReadyBanner />
            </div>
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}
