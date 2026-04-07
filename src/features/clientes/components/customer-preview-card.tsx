"use client"

import { useEffect } from "react"
import { Phone, Hash, ShoppingBag } from "lucide-react"
import { motion } from "motion/react"

import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/utils"

import { useCustomer, useCustomerPreview } from "../queries"

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

interface CustomerPreviewCardProps {
  customerId: string
  anchor: { top: number; left: number }
  onDismiss: () => void
}

export function CustomerPreviewCard({
  customerId,
  anchor,
  onDismiss,
}: CustomerPreviewCardProps) {
  const { data: customer } = useCustomer(customerId)
  const { data: preview } = useCustomerPreview(customerId)

  // Dismiss on scroll
  useEffect(() => {
    const handler = () => onDismiss()
    window.addEventListener("scroll", handler, { capture: true, passive: true })
    return () => window.removeEventListener("scroll", handler, { capture: true })
  }, [onDismiss])

  if (!customer) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 6, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 4, scale: 0.97 }}
      transition={{ type: "spring", stiffness: 500, damping: 32 }}
      className="fixed z-50 w-72 rounded-xl border border-neutral-200/80 bg-white p-4 shadow-lg shadow-neutral-900/[0.08]"
      style={{ top: anchor.top, left: anchor.left }}
      onMouseEnter={(e) => e.stopPropagation()}
      onMouseLeave={onDismiss}
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="flex size-10 flex-shrink-0 items-center justify-center rounded-xl bg-teal-50 text-[12px] font-bold text-teal-600">
          {getInitials(customer.name)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-neutral-900 truncate text-sm">
            {customer.name}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            {customer.client_number && (
              <span className="flex items-center gap-0.5 text-[11px] text-neutral-400">
                <Hash className="size-2.5" />
                {customer.client_number}
              </span>
            )}
            {customer.phone && (
              <span className="flex items-center gap-0.5 text-[11px] text-neutral-400">
                <Phone className="size-2.5" />
                {customer.phone}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Discount badge */}
      {customer.price_lists && Number(customer.price_lists.discount_percent) > 0 && (
        <div className="mt-2.5">
          <Badge className="text-[10px] bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-50">
            {customer.price_lists.name} &middot; -{customer.price_lists.discount_percent}%
          </Badge>
        </div>
      )}

      {/* Summary stat */}
      {preview && preview.totalPurchases > 0 && (
        <div className="mt-3 flex items-center gap-2 rounded-lg bg-neutral-50 px-3 py-2">
          <ShoppingBag className="size-3.5 text-teal-400 flex-shrink-0" />
          <p className="text-[12px] font-medium text-neutral-600">
            {preview.totalPurchases} {preview.totalPurchases === 1 ? "compra" : "compras"}
            <span className="mx-1.5 text-neutral-300">&middot;</span>
            <span className="font-semibold text-neutral-800">{formatCurrency(preview.totalSpent)}</span>
          </p>
        </div>
      )}

      {preview && preview.totalPurchases === 0 && (
        <div className="mt-3 flex items-center gap-2 rounded-lg bg-neutral-50 px-3 py-2">
          <ShoppingBag className="size-3.5 text-neutral-300 flex-shrink-0" />
          <p className="text-[12px] text-neutral-400">Sin compras registradas</p>
        </div>
      )}
    </motion.div>
  )
}
