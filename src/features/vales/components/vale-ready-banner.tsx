"use client"

import { useEffect, useRef } from "react"
import { sileo } from "sileo"

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
}

export function ValeReadyBanner() {
  const { data: readyVales = [] } = useReadyVales()
  const notifiedRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    const dismissed = getDismissed()

    for (const vale of readyVales) {
      if (dismissed.has(vale.id) || notifiedRef.current.has(vale.id)) continue

      notifiedRef.current.add(vale.id)
      addDismissed(vale.id)

      sileo.success({
        title: `${vale.vale_number} — ${vale.customers?.name ?? "Cliente"}`,
        description: "Producto disponible para entrega",
      })
    }
  }, [readyVales])

  return null
}
