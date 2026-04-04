"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

/**
 * Product creation now happens via the wizard dialog on /productos.
 * This page redirects there for backwards compatibility (bookmarks, links).
 */
export default function NuevoProductoPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/productos")
  }, [router])

  return null
}
