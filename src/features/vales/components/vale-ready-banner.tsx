"use client"

import { Ticket, X } from "lucide-react"
import { useCallback, useSyncExternalStore } from "react"
import { motion, AnimatePresence } from "motion/react"

import { useReadyVales } from "../queries"

const STORAGE_KEY = "dismissed-vales"

function getDismissed(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? new Set(JSON.parse(raw)) : new Set()
  } catch {
    return new Set()
  }
}

function addDismissed(id: string) {
  const set = getDismissed()
  set.add(id)
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]))
  window.dispatchEvent(new Event("storage"))
}

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback)
  return () => window.removeEventListener("storage", callback)
}

function getSnapshot() {
  return localStorage.getItem(STORAGE_KEY) ?? "[]"
}

function getServerSnapshot() {
  return "[]"
}

export function ValeReadyBanner() {
  const { data: readyVales = [] } = useReadyVales()

  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  const dismissed: Set<string> = (() => {
    try {
      return new Set(JSON.parse(raw))
    } catch {
      return new Set()
    }
  })()

  const handleDismiss = useCallback((id: string) => {
    addDismissed(id)
  }, [])

  const visible = readyVales.filter((v) => !dismissed.has(v.id))

  if (visible.length === 0) return null

  return (
    <div className="space-y-2">
      <AnimatePresence mode="popLayout">
        {visible.map((vale) => (
          <motion.div
            key={vale.id}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5"
          >
            <Ticket className="size-4 shrink-0 text-emerald-600" />
            <p className="flex-1 text-sm text-emerald-800">
              <span className="font-semibold">{vale.vale_number}</span>
              {" — "}
              {vale.customers?.name} — Producto disponible para entrega
            </p>
            <button
              type="button"
              onClick={() => handleDismiss(vale.id)}
              className="rounded-lg p-1 text-emerald-500 transition-colors hover:bg-emerald-100"
            >
              <X className="size-3.5" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
