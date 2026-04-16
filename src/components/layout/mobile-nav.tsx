"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import {
  Menu,
  LayoutDashboard,
  ScanBarcode,
  Package,
  Warehouse,
  Users,
  Receipt,
  Ticket,
  FileText,
  BarChart3,
  Settings,
  HelpCircle,
  LogOut,
} from "lucide-react"

import { useRouter } from "next/navigation"
import { sileo } from "sileo"

import { cn } from "@/lib/utils"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { logout } from "@/features/auth/actions"

const MS = 12
const S = 16

function MobileScoopTop() {
  return (
    <svg
      className="absolute left-0 fill-neutral-100 pointer-events-none"
      style={{ top: -MS, width: MS, height: MS }}
      viewBox={`0 0 ${MS} ${MS}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d={`M0 0L0 ${MS}L${MS} ${MS}A${MS} ${MS} 0 0 1 0 0Z`} />
    </svg>
  )
}

function MobileScoopBottom() {
  return (
    <svg
      className="absolute left-0 fill-neutral-100 pointer-events-none"
      style={{ bottom: -MS, width: MS, height: MS }}
      viewBox={`0 0 ${MS} ${MS}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d={`M0 ${MS}L0 0L${MS} 0A${MS} ${MS} 0 0 0 0 ${MS}Z`} />
    </svg>
  )
}

function NavScoopTop() {
  return (
    <svg
      className="absolute left-0 pointer-events-none"
      style={{ top: -S, width: S, height: S }}
      viewBox={`0 0 ${S} ${S}`}
      fill="white"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d={`M0 0L0 ${S}L${S} ${S}A${S} ${S} 0 0 1 0 0Z`} />
    </svg>
  )
}

function NavScoopBottom() {
  return (
    <svg
      className="absolute left-0 pointer-events-none"
      style={{ bottom: -S, width: S, height: S }}
      viewBox={`0 0 ${S} ${S}`}
      fill="white"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d={`M0 ${S}L0 0L${S} 0A${S} ${S} 0 0 0 0 ${S}Z`} />
    </svg>
  )
}

const navItems = [
  { href: "/", label: "Inicio", icon: LayoutDashboard },
  { href: "/pos", label: "Punto de venta", icon: ScanBarcode },
  { href: "/productos", label: "Productos", icon: Package },
  { href: "/inventario", label: "Inventario", icon: Warehouse },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/ventas", label: "Ventas", icon: Receipt },
  { href: "/vales", label: "Vales", icon: Ticket },
  { href: "/notas-credito", label: "Notas de credito", icon: FileText },
  { href: "/reportes", label: "Reportes", icon: BarChart3 },
  { href: "/configuracion", label: "Configuracion", icon: Settings },
]

export function MobileNav() {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)

  async function handleLogout() {
    await logout()
    sileo.success({ title: "Sesion cerrada", description: "Tu sesion se cerro correctamente" })
    router.push("/login")
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        className="fixed left-0 top-10 z-50 flex items-center justify-center rounded-l-none rounded-r-[16px] bg-neutral-100 py-2.5 pl-4 pr-3 lg:hidden"
        style={{ overflow: "visible" }}
        aria-label="Abrir menu"
      >
        <MobileScoopTop />
        <MobileScoopBottom />
        <Menu className="size-4 text-neutral-600" strokeWidth={1.75} />
      </SheetTrigger>
      <SheetContent side="left" className="w-[260px] bg-neutral-100 p-0">
        {/* Logo */}
        <div className="flex items-center px-6 pb-2 pt-7">
          <Image
            src="/EclatLogo_DarkWithPink.svg"
            alt="Eclat"
            width={140}
            height={47}
          />
        </div>

        {/* Navigation */}
        <nav className="pr-3 pt-8">
          <div className="space-y-1.5">
            {navItems.map((item) => {
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href)
              const Icon = item.icon

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "group relative flex items-center gap-3 py-3 pl-4 pr-3 text-[13px] transition-colors duration-[200ms]",
                    isActive
                      ? "font-semibold"
                      : "font-medium text-neutral-500 hover:text-neutral-800"
                  )}
                >
                  <AnimatePresence>
                    {isActive && (
                      <motion.div
                        layoutId="mobile-nav-active"
                        className="absolute inset-0 rounded-r-[22px] bg-white"
                        style={{ overflow: "visible" }}
                        initial={{ x: -30, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -30, opacity: 0 }}
                        transition={{
                          type: "spring",
                          stiffness: 300,
                          damping: 32,
                          mass: 0.8,
                        }}
                      >
                        <NavScoopTop />
                        <NavScoopBottom />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <span className="relative z-10 flex items-center gap-3">
                    <Icon
                      className={cn(
                        "size-[17px] shrink-0 transition-colors duration-[200ms]",
                        isActive ? "text-rose-500" : "text-neutral-400 group-hover:text-neutral-600"
                      )}
                      strokeWidth={isActive ? 2 : 1.5}
                    />
                    <span className={cn(isActive ? "text-neutral-900" : undefined)}>
                      {item.label}
                    </span>
                  </span>
                </Link>
              )
            })}
          </div>
        </nav>

        {/* Bottom section */}
        <div className="absolute inset-x-0 bottom-0 space-y-0.5 px-3 pb-5">
          <Link
            href="/ayuda"
            onClick={() => setOpen(false)}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium text-neutral-500 transition-colors duration-[200ms] hover:bg-white/60 hover:text-neutral-800"
          >
            <HelpCircle className="size-[17px] text-neutral-400" strokeWidth={1.5} />
            Ayuda
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium text-neutral-500 transition-colors duration-[200ms] hover:bg-rose-50 hover:text-rose-600"
          >
            <LogOut className="size-[17px] text-neutral-400" strokeWidth={1.5} />
            Cerrar sesion
          </button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
