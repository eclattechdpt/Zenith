"use client"

import { motion } from "motion/react"

const ease = [0.22, 1, 0.36, 1] as const

export function LeftPanelAnimations() {
  return (
    <>
      {/* Status pill */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2, ease }}
        className="flex w-fit items-center gap-2.5 rounded-full bg-white/10 px-4 py-2 ring-1 ring-white/15 backdrop-blur-md"
      >
        <span className="relative flex size-2">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex size-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]" />
        </span>
        <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/80">
          Online
        </span>
      </motion.div>

      {/* Bottom headline */}
      <div>
        <motion.h1
          initial={{ opacity: 0, y: 40, filter: "blur(10px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.9, delay: 0.4, ease }}
          className="font-display text-[clamp(3rem,5.5vw,5.5rem)] font-medium leading-[0.92] tracking-tight text-white"
        >
          Vende
          <br />
          con estilo,
          <br />
          sin esfuerzo.
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8, ease: "easeOut" }}
          className="mt-6 max-w-sm text-base leading-relaxed text-white/60"
        >
          Todo tu negocio de belleza en un solo lugar.
          Rapido, simple y hecho para ti.
        </motion.p>
      </div>
    </>
  )
}
