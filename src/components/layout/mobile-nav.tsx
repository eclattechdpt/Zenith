"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import {
  Menu,
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
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
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

export function MobileNav() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        className="flex size-9 items-center justify-center rounded-xl border border-neutral-200 bg-white text-neutral-600 transition-colors hover:bg-neutral-50 lg:hidden"
        aria-label="Abrir menu"
      >
        <Menu className="size-4" strokeWidth={1.75} />
      </SheetTrigger>
      <SheetContent side="left" className="w-[260px] bg-neutral-50 p-0">
        {/* Logo */}
        <div className="flex items-center px-6 pb-2 pt-7">
          <Image
            src="/ZenitLogo_DarkWithPink.svg"
            alt="Zenith"
            width={95}
            height={31}
          />
        </div>

        {/* Navigation */}
        <nav className="space-y-0.5 px-3 pt-8">
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
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] transition-all duration-[200ms]",
                  isActive
                    ? "bg-white font-semibold text-neutral-900 shadow-xs"
                    : "font-medium text-neutral-500 hover:bg-white/60 hover:text-neutral-800"
                )}
              >
                <Icon
                  className={cn(
                    "size-[17px]",
                    isActive
                      ? "text-rose-500"
                      : "text-neutral-400"
                  )}
                  strokeWidth={isActive ? 2 : 1.5}
                />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Bottom section */}
        <div className="absolute inset-x-0 bottom-0 space-y-0.5 px-3 pb-5">
          <button
            type="button"
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium text-neutral-500 transition-colors duration-[200ms] hover:bg-white/60 hover:text-neutral-800"
          >
            <HelpCircle className="size-[17px] text-neutral-400" strokeWidth={1.5} />
            Ayuda
          </button>
          <form action={logout}>
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium text-neutral-500 transition-colors duration-[200ms] hover:bg-rose-50 hover:text-rose-600"
            >
              <LogOut className="size-[17px] text-neutral-400" strokeWidth={1.5} />
              Cerrar sesion
            </button>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  )
}
