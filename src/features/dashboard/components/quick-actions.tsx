"use client"

import Link from "next/link"
import { motion } from "motion/react"
import { PlusCircle, Boxes, UserPlus, ArrowUpRight } from "lucide-react"

const SPRING = { type: "spring" as const, stiffness: 100, damping: 20 }

const actions = [
  {
    href: "/pos",
    label: "Nueva venta",
    subtitle: "Acceder a caja",
    icon: PlusCircle,
    iconBg: "bg-rose-50",
    iconColor: "text-rose-500",
    hoverShadow: "hover:shadow-[0_4px_20px_rgba(244,63,107,0.12)]",
  },
  {
    href: "/productos",
    label: "Ver productos",
    subtitle: "Catalogo y detalles",
    icon: Boxes,
    iconBg: "bg-teal-50",
    iconColor: "text-teal-500",
    hoverShadow: "hover:shadow-[0_4px_20px_rgba(37,166,182,0.12)]",
  },
  {
    href: "/clientes",
    label: "Registrar cliente",
    subtitle: "Nuevo cliente",
    icon: UserPlus,
    iconBg: "bg-blush-50",
    iconColor: "text-blush-500",
    hoverShadow: "hover:shadow-[0_4px_20px_rgba(255,150,174,0.12)]",
  },
]

export function QuickActions() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-5">
      {actions.map((action, i) => {
        const Icon = action.icon
        return (
          <motion.div
            key={action.href}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...SPRING, delay: i * 0.06 }}
            whileHover={{ y: -2 }}
          >
            <Link
              href={action.href}
              className={`group flex items-center gap-4 rounded-2xl border border-neutral-200/60 bg-white p-5 shadow-sm shadow-neutral-900/[0.03] transition-all duration-200 hover:border-neutral-300 ${action.hoverShadow}`}
            >
              <div
                className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${action.iconBg} transition-colors duration-200`}
              >
                <Icon
                  className={`size-5 ${action.iconColor}`}
                  strokeWidth={1.75}
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-neutral-900">
                  {action.label}
                </p>
                <p className="text-[11px] text-neutral-400">
                  {action.subtitle}
                </p>
              </div>
              <ArrowUpRight
                className="size-4 shrink-0 text-neutral-300 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-neutral-400"
                strokeWidth={2}
              />
            </Link>
          </motion.div>
        )
      })}
    </div>
  )
}
