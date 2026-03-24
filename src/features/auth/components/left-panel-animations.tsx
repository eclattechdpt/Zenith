"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import { ChevronDown, AlertTriangle, XCircle, CheckCircle2 } from "lucide-react"

const ease = [0.22, 1, 0.36, 1] as const

type SystemStatus = "online" | "warning" | "error"

const statusConfig: Record<
  SystemStatus,
  {
    label: string
    color: string
    ping: string
    glow: string
    icon: typeof CheckCircle2
    message?: string
  }
> = {
  online: {
    label: "Online",
    color: "bg-emerald-400",
    ping: "bg-emerald-400",
    glow: "shadow-[0_0_6px_rgba(52,211,153,0.6)]",
    icon: CheckCircle2,
  },
  warning: {
    label: "Degradado",
    color: "bg-amber-400",
    ping: "bg-amber-400",
    glow: "shadow-[0_0_6px_rgba(251,191,36,0.6)]",
    icon: AlertTriangle,
    message:
      "Rendimiento reducido en algunos servicios. El equipo esta investigando.",
  },
  error: {
    label: "Interrupcion",
    color: "bg-red-400",
    ping: "bg-red-400",
    glow: "shadow-[0_0_6px_rgba(248,113,113,0.6)]",
    icon: XCircle,
    message:
      "Se detecto un problema critico con el sistema. Algunas funciones podrian no estar disponibles.",
  },
}

const debugStates: SystemStatus[] = ["online", "warning", "error"]

function StatusPill() {
  const isDebug = process.env.NODE_ENV === "development"
  const [status, setStatus] = useState<SystemStatus>("online")
  const [expanded, setExpanded] = useState(false)

  const config = statusConfig[status]
  const hasDetails = status !== "online"

  function cycleStatus() {
    if (!isDebug) return
    const nextIndex =
      (debugStates.indexOf(status) + 1) % debugStates.length
    const next = debugStates[nextIndex]
    setStatus(next)
    setExpanded(next !== "online")
  }

  const StatusIcon = config.icon

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.8, y: -10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2, ease }}
      className="flex flex-col items-start"
    >
      {/* Pill */}
      <motion.button
        layout="position"
        type="button"
        onClick={hasDetails ? () => setExpanded((v) => !v) : undefined}
        onDoubleClick={isDebug ? cycleStatus : undefined}
        className={`flex items-center gap-2.5 rounded-full bg-white/10 px-4 py-2 ring-1 ring-white/15 backdrop-blur-md transition-colors ${
          hasDetails ? "cursor-pointer hover:bg-white/15" : ""
        } ${isDebug ? "active:scale-95" : ""}`}
      >
        <span className="relative flex size-2">
          <span
            className={`absolute inline-flex size-full animate-ping rounded-full ${config.ping} opacity-75`}
          />
          <span
            className={`relative inline-flex size-2 rounded-full ${config.color} ${config.glow}`}
          />
        </span>
        <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/80">
          {config.label}
        </span>
        <AnimatePresence mode="popLayout">
          {hasDetails && (
            <motion.span
              key="chevron"
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto", rotate: expanded ? 180 : 0 }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.2 }}
              className="flex items-center overflow-hidden"
            >
              <ChevronDown className="size-3 text-white/50" />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Expandable error/warning panel */}
      <AnimatePresence initial={false}>
        {expanded && hasDetails && (
          <motion.div
            key="panel"
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            transition={{ duration: 0.3, ease: [0.25, 1, 0.5, 1] }}
            className="w-full overflow-hidden"
          >
            <div className="pt-2">
              <div className="rounded-xl bg-white/10 px-4 py-3 ring-1 ring-white/10 backdrop-blur-md">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="flex items-start gap-2.5"
                >
                  <StatusIcon
                    className={`mt-0.5 size-4 shrink-0 ${
                      status === "error" ? "text-red-300" : "text-amber-300"
                    }`}
                    strokeWidth={1.75}
                  />
                  <div className="space-y-2">
                    <p className="text-[13px] leading-relaxed text-white/70">
                      {config.message}
                    </p>
                    <p className="text-[11px] leading-relaxed text-white/40">
                      Si el problema persiste, contacta a{" "}
                      <span className="font-semibold text-white/60">
                        abbrix soporte tecnico
                      </span>
                      .
                    </p>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Debug hint */}
      {isDebug && (
        <span className="mt-2 text-[9px] uppercase tracking-widest text-white/20">
          Debug: doble clic para cambiar estado
        </span>
      )}
    </motion.div>
  )
}

export function LeftPanelAnimations() {
  return (
    <>
      <StatusPill />

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
