"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"

/**
 * Intercepts navigation when there are unsaved changes.
 * Covers: beforeunload (tab close/refresh), link clicks (sidebar, any <a>),
 * and explicit guardedNavigate calls (Volver/Cancelar buttons).
 */
export function useUnsavedGuard(isDirty: boolean) {
  const router = useRouter()
  const submittedRef = useRef(false)
  const [pendingHref, setPendingHref] = useState<string | null>(null)
  const [pendingCallback, setPendingCallback] = useState<(() => void) | null>(null)

  const shouldBlock = isDirty && !submittedRef.current
  const shouldBlockRef = useRef(shouldBlock)
  shouldBlockRef.current = shouldBlock

  // Mark as submitted so guards stop blocking
  const markSubmitted = useCallback(() => {
    submittedRef.current = true
  }, [])

  // beforeunload — browser close/refresh
  useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      if (shouldBlockRef.current) {
        e.preventDefault()
      }
    }
    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [])

  // Intercept link clicks (capture phase) — catches sidebar, any <a> tag
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (!shouldBlockRef.current) return

      // Walk up from the click target to find an <a> tag
      const anchor = (e.target as HTMLElement).closest("a")
      if (!anchor) return

      const href = anchor.getAttribute("href")
      if (!href) return

      // Allow same-page links (anchors, query params)
      try {
        const target = new URL(href, location.origin)
        if (target.pathname === location.pathname) return
      } catch {
        return
      }

      // Block the navigation
      e.preventDefault()
      e.stopPropagation()
      setPendingHref(href)
    }

    document.addEventListener("click", handleClick, true)
    return () => document.removeEventListener("click", handleClick, true)
  }, [])

  // For Volver/Cancelar buttons
  const guardedNavigate = useCallback(
    (navigate: () => void) => {
      if (shouldBlockRef.current) {
        setPendingCallback(() => navigate)
      } else {
        navigate()
      }
    },
    []
  )

  const hasPending = !!pendingHref || !!pendingCallback

  // Execute pending navigation and clear state
  const confirmNav = useCallback(() => {
    submittedRef.current = true
    if (pendingHref) {
      const href = pendingHref
      setPendingHref(null)
      router.push(href)
    } else if (pendingCallback) {
      const cb = pendingCallback
      setPendingCallback(null)
      cb()
    }
  }, [pendingHref, pendingCallback, router])

  const cancelNav = useCallback(() => {
    setPendingHref(null)
    setPendingCallback(null)
  }, [])

  return {
    guardedNavigate,
    markSubmitted,
    pendingNav: hasPending,
    confirmNav,
    cancelNav,
  }
}
