"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion } from "motion/react"
import {
  LayoutDashboard,
  Monitor,
  Package,
  Warehouse,
  Users,
  Receipt,
  Settings,
  HelpCircle,
  LogOut,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { logout } from "@/features/auth/actions"

const navItems = [
  { href: "/", label: "Inicio", icon: LayoutDashboard },
  { href: "/pos", label: "Punto de venta", icon: Monitor },
  { href: "/productos", label: "Productos", icon: Package },
  { href: "/inventario", label: "Inventario", icon: Warehouse },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/ventas", label: "Ventas", icon: Receipt },
  { href: "/configuracion", label: "Configuracion", icon: Settings },
]

/**
 * Concave scoops using inline SVG paths.
 *
 * Each scoop is an S×S SVG positioned above/below the active tab
 * on the right side. The SVG path fills the area connecting the
 * tab to the right edge, with a quarter-circle concave curve
 * where the sidebar background shows through.
 */
const S = 20

function ScoopTop() {
  return (
    <svg
      className="absolute right-0 pointer-events-none"
      style={{ top: -S, width: S, height: S }}
      viewBox={`0 0 ${S} ${S}`}
      fill="white"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d={`M${S} 0L${S} ${S}L0 ${S}A${S} ${S} 0 0 0 ${S} 0Z`} />
    </svg>
  )
}

function ScoopBottom() {
  return (
    <svg
      className="absolute right-0 pointer-events-none"
      style={{ bottom: -S, width: S, height: S }}
      viewBox={`0 0 ${S} ${S}`}
      fill="white"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d={`M${S} ${S}L${S} 0L0 0A${S} ${S} 0 0 1 ${S} ${S}Z`} />
    </svg>
  )
}

// ── DEBUG: flip to false for production ──
const DEBUG_PINK = true
const sidebarBg = DEBUG_PINK ? "bg-rose-300" : "bg-neutral-50"

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className={`hidden h-full w-[210px] shrink-0 flex-col ${sidebarBg} lg:flex`}>
      {/* Logo */}
      <div className="flex items-center px-6 pb-2 pt-7">
        <Image
          src="/ZenitLogo_DarkWithPink.svg"
          alt="Zenith"
          width={95}
          height={31}
          priority
        />
      </div>

      {/* Navigation */}
      <nav className="flex-1 pl-3 pt-8">
        <div className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href)

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative flex items-center gap-3 py-3 pl-3 pr-4 text-[13px] transition-colors duration-[200ms]",
                  isActive
                    ? "z-10 font-semibold"
                    : "font-medium text-neutral-500 hover:text-neutral-800"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute inset-0 rounded-l-[22px] bg-white"
                    style={{ overflow: "visible" }}
                    transition={{
                      type: "spring",
                      stiffness: 300,
                      damping: 32,
                      mass: 0.8,
                    }}
                  >
                    <ScoopTop />
                    <ScoopBottom />
                  </motion.div>
                )}

                <span className="relative z-10 flex items-center gap-3">
                  <Icon
                    className={cn(
                      "size-[17px] transition-colors duration-[200ms]",
                      isActive ? "text-rose-500" : "text-neutral-400"
                    )}
                    strokeWidth={isActive ? 2 : 1.5}
                  />
                  <span className={isActive ? "text-neutral-900" : undefined}>
                    {item.label}
                  </span>
                </span>
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Bottom section */}
      <div className="space-y-0.5 px-3 pb-5">
        <button
          type="button"
          className="flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium text-neutral-500 transition-colors duration-[200ms] hover:bg-white/60 hover:text-neutral-800"
        >
          <HelpCircle className="size-[17px] text-neutral-400" strokeWidth={1.5} />
          Ayuda
        </button>
        <form action={logout}>
          <button
            type="submit"
            className="flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium text-neutral-500 transition-colors duration-[200ms] hover:bg-rose-50 hover:text-rose-600"
          >
            <LogOut className="size-[17px] text-neutral-400" strokeWidth={1.5} />
            Cerrar sesion
          </button>
        </form>
      </div>
    </aside>
  )
}
