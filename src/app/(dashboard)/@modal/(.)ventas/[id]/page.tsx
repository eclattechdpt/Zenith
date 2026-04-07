"use client"

import { use } from "react"
import { useRouter } from "next/navigation"

import { SaleDetailModal } from "@/features/ventas/components/sale-detail-modal"

export default function SaleDetailInterceptedPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()

  return (
    <SaleDetailModal
      saleId={id}
      open
      onClose={() => router.back()}
    />
  )
}
