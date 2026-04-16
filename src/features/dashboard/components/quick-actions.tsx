"use client"

import Link from "next/link"
import { motion } from "motion/react"
import { PlusCircle, Boxes, UserPlus, ArrowUpRight } from "lucide-react"
import type { LucideIcon } from "lucide-react"

const SPRING = { type: "spring" as const, stiffness: 100, damping: 20 }

type Tier = "accent" | "dark" | "light"

interface Action {
  href: string
  label: string
  icon: LucideIcon
  tier: Tier
}

const actions: Action[] = [
  {
    href: "/pos?action=new",
    label: "Nueva venta",
    icon: PlusCircle,
    tier: "accent",
  },
  {
    href: "/productos",
    label: "Ver productos",
    icon: Boxes,
    tier: "dark",
  },
  {
    href: "/clientes?action=new",
    label: "Registrar cliente",
    icon: UserPlus,
    tier: "light",
  },
]

type TierStyles = {
  surface: string
  text: string
  iconContainer: string
  icon: string
  chevronContainer: string
  chevron: string
}

const TIER_CLASSES: Record<Tier, TierStyles> = {
  accent: {
    surface:
      "bg-gradient-to-br from-accent-500 to-accent-600 shadow-accent-500/20",
    text: "text-white",
    iconContainer: "",
    icon: "text-white",
    chevronContainer: "bg-white/15 group-hover:bg-white/25",
    chevron: "text-white",
  },
  dark: {
    surface: "bg-neutral-900 shadow-neutral-900/20",
    text: "text-white",
    iconContainer: "",
    icon: "text-white",
    chevronContainer: "bg-white/10 group-hover:bg-white/20",
    chevron: "text-white",
  },
  light: {
    surface: "border border-neutral-200 bg-white shadow-neutral-900/[0.03]",
    text: "text-neutral-900",
    iconContainer: "",
    icon: "text-neutral-700",
    chevronContainer: "bg-neutral-100 group-hover:bg-neutral-200",
    chevron: "text-neutral-600",
  },
}

export function QuickActions() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-5">
      {actions.map((action, i) => {
        const Icon = action.icon
        const tier = TIER_CLASSES[action.tier]
        return (
          <motion.div
            key={action.href}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...SPRING, delay: i * 0.06 }}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
          >
            <Link
              href={action.href}
              className={`group flex items-center gap-4 rounded-3xl p-5 shadow-sm transition-shadow hover:shadow-md ${tier.surface}`}
            >
              <Icon
                className={`size-6 shrink-0 ${tier.icon}`}
                strokeWidth={1.75}
              />
              <div className="min-w-0 flex-1">
                <p className={`text-[14px] font-bold ${tier.text}`}>
                  {action.label}
                </p>
              </div>
              <div
                className={`flex size-10 shrink-0 items-center justify-center rounded-full transition-colors ${tier.chevronContainer}`}
              >
                <ArrowUpRight
                  className={`size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 ${tier.chevron}`}
                  strokeWidth={2}
                />
              </div>
            </Link>
          </motion.div>
        )
      })}
    </div>
  )
}
