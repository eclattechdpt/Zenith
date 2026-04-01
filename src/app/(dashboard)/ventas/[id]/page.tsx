"use client"

import { use } from "react"

import { SaleDetail } from "@/features/ventas/components/sale-detail"

export default function SaleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  return <SaleDetail saleId={id} />
}
