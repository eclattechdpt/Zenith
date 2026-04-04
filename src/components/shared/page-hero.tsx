"use client"

import { useMemo } from "react"
import { motion } from "motion/react"
import { CalendarDays, Plus } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import Link from "next/link"

import { Button } from "@/components/ui/button"

interface PageHeroProps {
  title: string
  ctaLabel?: string
  onCta?: () => void
  ctaHref?: string
}

export function PageHero({ title, ctaLabel, onCta, ctaHref }: PageHeroProps) {
  const todayLabel = useMemo(
    () =>
      format(new Date(), "EEEE, d 'de' MMMM", { locale: es }).replace(
        /^\w/,
        (c) => c.toUpperCase()
      ),
    []
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 120, damping: 20 }}
      className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
    >
      <div>
        <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[2px] text-neutral-400">
          <CalendarDays className="h-3.5 w-3.5" />
          {todayLabel}
        </p>
        <h1 className="mt-1 font-display text-[38px] font-semibold leading-none tracking-[-1.5px] text-neutral-950 sm:text-[48px]">
          {title}
        </h1>
      </div>

      {ctaLabel && (onCta || ctaHref) && (
        <motion.div
          whileHover={{ scale: 1.03, y: -1 }}
          whileTap={{ scale: 0.97 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
        >
          {ctaHref ? (
            <Link href={ctaHref}>
              <Button className="group h-11 gap-2 rounded-xl bg-rose-500 px-6 text-sm font-bold text-white transition-colors hover:bg-rose-600 sm:h-12 sm:px-7">
                <Plus className="h-4 w-4 transition-transform duration-200 group-hover:rotate-90" />
                {ctaLabel}
              </Button>
            </Link>
          ) : (
            <Button
              onClick={onCta}
              className="group h-11 gap-2 rounded-xl bg-rose-500 px-6 text-sm font-bold text-white transition-colors hover:bg-rose-600 sm:h-12 sm:px-7"
            >
              <Plus className="h-4 w-4 transition-transform duration-200 group-hover:rotate-90" />
              {ctaLabel}
            </Button>
          )}
        </motion.div>
      )}
    </motion.div>
  )
}
