"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useState } from "react"
import { BONEYARD_INITIALIZED } from "@/lib/boneyard-init"

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())

  return (
    <QueryClientProvider client={queryClient}>
      {BONEYARD_INITIALIZED && children}
    </QueryClientProvider>
  )
}
