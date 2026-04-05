"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"

import { resolveModuleAccent } from "@/lib/module-accent"

/**
 * Keeps `<html data-module="...">` in sync with the current route
 * on client-side navigations.
 *
 * The initial value is set synchronously by an inline blocking script
 * in the root layout (see `moduleAccentInlineScript`), so there is no
 * first-paint flash. This effect only handles SPA route transitions.
 */
export function ModuleAccentScope() {
  const pathname = usePathname()

  useEffect(() => {
    const html = document.documentElement
    const mod = resolveModuleAccent(pathname)
    if (mod) {
      html.setAttribute("data-module", mod)
    } else {
      html.removeAttribute("data-module")
    }
  }, [pathname])

  return null
}
