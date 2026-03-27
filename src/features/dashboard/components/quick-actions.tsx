"use client"

import Link from "next/link"
import { motion } from "motion/react"
import { PlusCircle, Boxes, UserPlus, ArrowUpRight } from "lucide-react"

const actions = [
  {
    href: "/pos",
    label: "Nueva venta",
    subtitle: "Acceder a caja",
    icon: PlusCircle,
    iconBg: "bg-rose-100 group-hover:bg-rose-200",
    iconColor: "text-rose-600",
    hoverBorder: "hover:border-rose-200",
    arrowHover: "group-hover:text-rose-400",
  },
  {
    href: "/productos",
    label: "Ver productos",
    subtitle: "Catalogo y detalles",
    icon: Boxes,
    iconBg: "bg-teal-100 group-hover:bg-teal-200",
    iconColor: "text-teal-600",
    hoverBorder: "hover:border-teal-200",
    arrowHover: "group-hover:text-teal-400",
  },
  {
    href: "/clientes",
    label: "Registrar cliente",
    subtitle: "Nuevo cliente",
    icon: UserPlus,
    iconBg: "bg-blush-100 group-hover:bg-blush-200",
    iconColor: "text-blush-600",
    hoverBorder: "hover:border-blush-200",
    arrowHover: "group-hover:text-blush-400",
  },
]

export function QuickActions() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {actions.map((action) => {
        const Icon = action.icon
        return (
          <motion.div
            key={action.href}
            whileHover={{ y: -2 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
          >
            <Link
              href={action.href}
              className={`group flex items-center gap-4 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm transition-all duration-200 ${action.hoverBorder} hover:shadow-md`}
            >
              <div
                className={`flex size-12 shrink-0 items-center justify-center rounded-xl transition-colors duration-200 ${action.iconBg}`}
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
                <p className="text-[11px] text-neutral-500">
                  {action.subtitle}
                </p>
              </div>
              <ArrowUpRight
                className={`size-4 shrink-0 text-neutral-300 transition-all duration-200 group-hover:translate-x-0.5 ${action.arrowHover}`}
                strokeWidth={2}
              />
            </Link>
          </motion.div>
        )
      })}
    </div>
  )
}
