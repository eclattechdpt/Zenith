"use client"

import { useState, useCallback, useEffect, useRef } from "react"
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
  ChevronsLeft,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { logout } from "@/features/auth/actions"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const navItems = [
  { href: "/", label: "Inicio", icon: LayoutDashboard },
  { href: "/pos", label: "Punto de venta", icon: Monitor },
  { href: "/productos", label: "Productos", icon: Package },
  { href: "/inventario", label: "Inventario", icon: Warehouse },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/ventas", label: "Ventas", icon: Receipt },
  { href: "/configuracion", label: "Configuracion", icon: Settings },
]

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

function SidebarTooltip({
  collapsed,
  children,
}: {
  collapsed: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const onOpenChange = useCallback(
    (nextOpen: boolean) => setOpen(collapsed && nextOpen),
    [collapsed]
  )
  return (
    <Tooltip open={open} onOpenChange={onOpenChange}>
      {children}
    </Tooltip>
  )
}

const EXPANDED_WIDTH = 210
const COLLAPSED_WIDTH = 72
const SIDEBAR_SPRING = { type: "spring" as const, stiffness: 200, damping: 30 }
const FADE_SLOW = { duration: 0.7, ease: "easeInOut" as const }
const FADE_IN_LOGO = { ...FADE_SLOW, delay: 0.1 }
const FADE_IN_TEXT = { ...FADE_SLOW, delay: 0.1 }
const FADE_OUT = { duration: 0.25, ease: "easeInOut" as const }
const FADE_OUT_LOGO = { duration: 0.15, ease: "easeInOut" as const }

export function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return false
    return localStorage.getItem("sidebar-collapsed") === "true"
  })

  const isFirstRender = useRef(true)

  useEffect(() => {
    localStorage.setItem("sidebar-collapsed", String(collapsed))
  }, [collapsed])

  useEffect(() => {
    isFirstRender.current = false
  }, [])

  const noMotion = { duration: 0 }
  const logoFade = isFirstRender.current ? noMotion : collapsed ? FADE_OUT_LOGO : FADE_IN_LOGO
  const textFade = isFirstRender.current ? noMotion : collapsed ? FADE_OUT : FADE_IN_TEXT
  const width = collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH

  return (
    <TooltipProvider delay={300}>
      <motion.aside
        initial={{ width }}
        animate={{ width }}
        transition={isFirstRender.current ? { duration: 0 } : SIDEBAR_SPRING}
        className="hidden h-full shrink-0 flex-col overflow-hidden bg-neutral-100 shadow-[inset_-6px_0_8px_-6px_rgba(0,0,0,0.06)] lg:flex"
      >
        {/* Logo */}
        {/* Logo */}
        <div className="relative h-[60px] pb-2 pt-7">
          <div className="absolute left-5 top-7 flex items-center gap-1">
            <Image
              src="/ZenitLogo_Icon.svg"
              alt="Zenith"
              width={32}
              height={29}
              priority
              className="shrink-0"
            />
            <motion.span
              animate={{ opacity: collapsed ? 0 : 1 }}
              transition={logoFade}
              className="whitespace-nowrap"
            >
              <Image
                src="/ZenitLogo_Text.svg"
                alt="enith"
                width={95}
                height={31}
                className="shrink-0"
              />
            </motion.span>
          </div>
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

              const link = (
                <Link
                  href={item.href}
                  className={cn(
                    "group relative flex items-center gap-3 py-3 pl-3 pr-4 text-[13px] transition-colors duration-[200ms]",
                    isActive
                      ? "font-semibold"
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
                        "size-[17px] shrink-0 transition-colors duration-[200ms]",
                        isActive ? "text-rose-500" : "text-neutral-400 group-hover:text-neutral-600"
                      )}
                      strokeWidth={isActive ? 2 : 1.5}
                    />
                    <motion.span
                      animate={{ opacity: collapsed ? 0 : 1 }}
                      transition={textFade}
                      className={cn("whitespace-nowrap", isActive ? "text-neutral-900" : undefined)}
                    >
                      {item.label}
                    </motion.span>
                  </span>
                </Link>
              )

              return (
                <SidebarTooltip key={item.href} collapsed={collapsed}>
                  <TooltipTrigger render={link} />
                  <TooltipContent side="right" sideOffset={12}>
                    {item.label}
                  </TooltipContent>
                </SidebarTooltip>
              )
            })}
          </div>
        </nav>

        {/* Toggle button */}
        <div className="px-3 pt-2">
          <button
            type="button"
            onClick={() => setCollapsed((v) => !v)}
            className="flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium text-neutral-400 transition-colors duration-[200ms] hover:bg-white/60 hover:text-neutral-600"
          >
            <motion.div
              animate={{ rotate: collapsed ? 180 : 0 }}
              transition={SIDEBAR_SPRING}
            >
              <ChevronsLeft className="size-[17px]" strokeWidth={1.5} />
            </motion.div>
            <motion.span
              animate={{ opacity: collapsed ? 0 : 1 }}
              transition={textFade}
              className="whitespace-nowrap"
            >
              Ocultar
            </motion.span>
          </button>
        </div>

        {/* Bottom section */}
        <div className="space-y-0.5 px-3 pb-5">
          <SidebarTooltip collapsed={collapsed}>
            <TooltipTrigger
              render={
                <button
                  type="button"
                  className="group flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium text-neutral-500 transition-colors duration-[200ms] hover:bg-white/60 hover:text-neutral-800"
                >
                  <HelpCircle className="size-[17px] shrink-0 text-neutral-400 transition-colors duration-[200ms] group-hover:text-neutral-800" strokeWidth={1.5} />
                  <motion.span
                    animate={{ opacity: collapsed ? 0 : 1 }}
                    transition={textFade}
                    className="whitespace-nowrap"
                  >
                    Ayuda
                  </motion.span>
                </button>
              }
            />
            <TooltipContent side="right" sideOffset={12}>
              Ayuda
            </TooltipContent>
          </SidebarTooltip>
          <form action={logout}>
            <SidebarTooltip collapsed={collapsed}>
              <TooltipTrigger
                render={
                  <button
                    type="submit"
                    className="group flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium text-neutral-500 transition-colors duration-[200ms] hover:bg-rose-50 hover:text-rose-600"
                  >
                    <LogOut className="size-[17px] shrink-0 text-neutral-400 transition-colors duration-[200ms] group-hover:text-rose-600" strokeWidth={1.5} />
                    <motion.span
                      animate={{ opacity: collapsed ? 0 : 1 }}
                      transition={textFade}
                      className="whitespace-nowrap"
                    >
                      Cerrar sesion
                    </motion.span>
                  </button>
                }
              />
              <TooltipContent side="right" sideOffset={12}>
                Cerrar sesion
              </TooltipContent>
            </SidebarTooltip>
          </form>
        </div>
      </motion.aside>
    </TooltipProvider>
  )
}
