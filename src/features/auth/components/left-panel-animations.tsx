"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "motion/react"
import { ChevronDown, AlertTriangle, XCircle, CheckCircle2, Loader2 } from "lucide-react"

import type { HealthStatus, HealthResponse } from "@/app/api/health/route"

const ease = [0.22, 1, 0.36, 1] as const

const POLL_INTERVAL_MS = 30_000

const statusConfig: Record<
  HealthStatus,
  {
    label: string
    color: string
    ping: string
    glow: string
    icon: typeof CheckCircle2
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
  },
  error: {
    label: "Interrupcion",
    color: "bg-red-400",
    ping: "bg-red-400",
    glow: "shadow-[0_0_6px_rgba(248,113,113,0.6)]",
    icon: XCircle,
  },
}

const debugStates: HealthStatus[] = ["online", "warning", "error"]

function StatusPill() {
  const isDebug = process.env.NODE_ENV === "development"
  const [status, setStatus] = useState<HealthStatus>("online")
  const [message, setMessage] = useState<string | undefined>()
  const [expanded, setExpanded] = useState(false)
  const [loading, setLoading] = useState(true)
  const [debugOverride, setDebugOverride] = useState(false)

  const checkHealth = useCallback(async () => {
    if (debugOverride) return

    try {
      const res = await fetch("/api/health")
      if (!res.ok) {
        setStatus("error")
        setMessage("El servidor devolvio un error inesperado.")
        setExpanded(true)
        return
      }

      const data: HealthResponse = await res.json()
      setStatus(data.status)
      setMessage(data.message)

      if (data.status !== "online") {
        setExpanded(true)
      } else {
        setExpanded(false)
      }
    } catch {
      setStatus("error")
      setMessage("Sin conexion al servidor. Verifica tu conexion a internet.")
      setExpanded(true)
    } finally {
      setLoading(false)
    }
  }, [debugOverride])

  useEffect(() => {
    checkHealth()
    const interval = setInterval(checkHealth, POLL_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [checkHealth])

  const config = statusConfig[status]
  const hasDetails = status !== "online"

  function cycleStatus() {
    if (!isDebug) return
    setDebugOverride(true)
    const nextIndex =
      (debugStates.indexOf(status) + 1) % debugStates.length
    const next = debugStates[nextIndex]
    setStatus(next)
    setMessage(
      next === "online"
        ? undefined
        : next === "warning"
          ? "Debug: estado de warning simulado."
          : "Debug: estado de error simulado."
    )
    setExpanded(next !== "online")
  }

  function resetDebug() {
    if (!isDebug || !debugOverride) return
    setDebugOverride(false)
    setLoading(true)
    checkHealth()
  }

  const StatusIcon = config.icon

  return (
    <div className="flex flex-col items-start">
      {/* Pill */}
      <motion.button
        type="button"
        onClick={hasDetails ? () => setExpanded((v) => !v) : undefined}
        onDoubleClick={isDebug ? cycleStatus : undefined}
        className={`flex items-center gap-2.5 rounded-full bg-white/10 px-4 py-2 ring-1 ring-white/15 backdrop-blur-md transition-colors ${
          hasDetails ? "cursor-pointer hover:bg-white/15" : ""
        } ${isDebug ? "active:scale-95" : ""}`}
      >
        {loading ? (
          <Loader2 className="size-3 animate-spin text-white/50" />
        ) : (
          <span className="relative flex size-2">
            <span
              className={`absolute inline-flex size-full animate-ping rounded-full ${config.ping} opacity-75`}
            />
            <span
              className={`relative inline-flex size-2 rounded-full ${config.color} ${config.glow}`}
            />
          </span>
        )}
        <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/80">
          {loading ? "Verificando" : config.label}
        </span>
        <AnimatePresence mode="popLayout">
          {hasDetails && !loading && (
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
        {expanded && hasDetails && !loading && (
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
                      {message}
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
        <div className="mt-2 flex flex-col gap-1">
          <span className="text-[9px] uppercase tracking-widest text-white/20">
            Debug: doble clic para cambiar estado
          </span>
          {debugOverride && (
            <button
              type="button"
              onClick={resetDebug}
              className="text-[9px] uppercase tracking-widest text-white/30 underline hover:text-white/50"
            >
              Volver a check real
            </button>
          )}
        </div>
      )}
    </div>
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
