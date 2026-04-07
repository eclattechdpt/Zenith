"use client"

import { useState, useCallback, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Users, Percent, UserX } from "lucide-react"
import { AnimatePresence } from "motion/react"

import { PageHero } from "@/components/shared/page-hero"
import { KpiCard } from "@/components/shared/kpi-card"
import { CustomerTable } from "@/features/clientes/components/customer-table"
import { CustomerDialog } from "@/features/clientes/components/customer-dialog"
import { CustomerProfileDialog } from "@/features/clientes/components/customer-profile-dialog"
import { CustomerPreviewCard } from "@/features/clientes/components/customer-preview-card"
import { useCustomerStats } from "@/features/clientes/queries"

export default function ClientesPage() {
  const searchParams = useSearchParams()
  const stats = useCustomerStats()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editCustomerId, setEditCustomerId] = useState<string | null>(null)
  const [detailCustomerId, setDetailCustomerId] = useState<string | null>(null)

  // Preview hover state
  const [previewCustomerId, setPreviewCustomerId] = useState<string | null>(null)
  const [previewAnchor, setPreviewAnchor] = useState<{ top: number; left: number } | null>(null)

  const openCreate = useCallback(() => {
    setEditCustomerId(null)
    setDialogOpen(true)
  }, [])

  // Auto-open dialog when navigating with ?action=new
  useEffect(() => {
    if (searchParams.get("action") === "new") {
      openCreate()
      window.history.replaceState(null, "", "/clientes")
    }
  }, [searchParams, openCreate])

  const openEdit = useCallback((customer: { id: string }) => {
    setEditCustomerId(customer.id)
    setDialogOpen(true)
  }, [])

  const openDetail = useCallback((customer: { id: string }) => {
    setPreviewCustomerId(null)
    setPreviewAnchor(null)
    setDetailCustomerId(customer.id)
  }, [])

  const closeDetail = useCallback(() => {
    setDetailCustomerId(null)
  }, [])

  const closeDialog = useCallback(() => {
    setDialogOpen(false)
    setEditCustomerId(null)
  }, [])

  const showPreview = useCallback((customerId: string, anchor: { top: number; left: number }) => {
    setPreviewCustomerId(customerId)
    setPreviewAnchor(anchor)
  }, [])

  const dismissPreview = useCallback(() => {
    setPreviewCustomerId(null)
    setPreviewAnchor(null)
  }, [])

  return (
    <>
      <div className="min-w-0 flex-1 space-y-8 p-5 sm:p-8">
        <PageHero
          title="Clientes"
          ctaLabel="Nuevo cliente"
          onCta={openCreate}
        />

        {/* KPI row */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-5">
          <KpiCard
            title="Total clientes"
            value={stats.total}
            subtitle="clientes registrados"
            icon={Users}
            variant="hero"
          />
          <KpiCard
            title="Con descuento"
            value={stats.withDiscount}
            subtitle="clientes con descuento"
            icon={Percent}
            iconBg="bg-teal-50"
            iconColor="text-teal-500"
            delay={0.06}
          />
          <KpiCard
            title="Sin descuento"
            value={stats.withoutDiscount}
            subtitle="precio regular"
            icon={UserX}
            iconBg="bg-neutral-100"
            iconColor="text-neutral-400"
            delay={0.12}
          />
        </div>

        {/* Customer table */}
        <CustomerTable
          onEdit={openEdit}
          onCreate={openCreate}
          onView={openDetail}
          onPreview={showPreview}
          onPreviewDismiss={dismissPreview}
        />
      </div>

      {/* Customer create/edit dialog */}
      <CustomerDialog
        open={dialogOpen}
        customerId={editCustomerId}
        onClose={closeDialog}
      />

      {/* Customer detail modal */}
      <CustomerProfileDialog
        customerId={detailCustomerId}
        open={!!detailCustomerId}
        onClose={closeDetail}
        onEdit={(c) => {
          closeDetail()
          openEdit(c)
        }}
      />

      {/* Hover preview card */}
      <AnimatePresence>
        {previewCustomerId && previewAnchor && (
          <CustomerPreviewCard
            customerId={previewCustomerId}
            anchor={previewAnchor}
            onDismiss={dismissPreview}
          />
        )}
      </AnimatePresence>
    </>
  )
}
