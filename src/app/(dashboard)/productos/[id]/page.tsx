"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

/**
 * Product editing now happens via the edit dialog on /productos.
 * This page redirects there for backwards compatibility (bookmarks, links).
 */
export default function EditProductoPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/productos")
  }, [router])

  return null
}
