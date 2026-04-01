"use client"

import {
  MoreHorizontal,
  ShoppingCart,
  XCircle,
} from "lucide-react"
import { isPast } from "date-fns"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { formatCurrency, formatDate } from "@/lib/utils"
import { SALE_STATUSES } from "@/lib/constants"

import type { SaleWithSummary } from "../types"

const STATUS_COLORS: Record<string, string> = {
  quote: "bg-blue-50 text-blue-700 border-blue-200",
  completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  cancelled: "bg-neutral-100 text-neutral-500 border-neutral-200",
}

interface SalesCardMobileProps {
  sale: SaleWithSummary
  onConvert?: (sale: SaleWithSummary) => void
  onCancel?: (sale: SaleWithSummary) => void
}

export function SalesCardMobile({
  sale,
  onConvert,
  onCancel,
}: SalesCardMobileProps) {
  const isQuote = sale.status === "quote"
  const isExpired =
    isQuote && sale.expires_at && isPast(new Date(sale.expires_at))

  const statusLabel = isExpired
    ? "Expirada"
    : (SALE_STATUSES[sale.status as keyof typeof SALE_STATUSES] ?? sale.status)

  const statusColor = isExpired
    ? "bg-amber-50 text-amber-700 border-amber-200"
    : (STATUS_COLORS[sale.status] ?? "")

  return (
    <div className="rounded-xl border border-neutral-100 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-neutral-950 tabular-nums">
              {sale.sale_number}
            </span>
            <Badge
              variant="outline"
              className={`text-[10px] ${statusColor}`}
            >
              {statusLabel}
            </Badge>
          </div>
          {sale.customers && (
            <p className="text-xs text-neutral-500 mt-0.5">
              {sale.customers.name}
            </p>
          )}
        </div>

        {isQuote && (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="sm"
                  className="size-7 p-0 shrink-0"
                />
              }
            >
              <MoreHorizontal className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {!isExpired && onConvert && (
                <DropdownMenuItem onClick={() => onConvert(sale)}>
                  <ShoppingCart className="mr-2 size-3.5" />
                  Convertir a venta
                </DropdownMenuItem>
              )}
              {onCancel && (
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => onCancel(sale)}
                >
                  <XCircle className="mr-2 size-3.5" />
                  Cancelar
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs text-neutral-500 tabular-nums">
          {formatDate(sale.created_at)}
        </span>
        <span className="font-semibold text-neutral-950 tabular-nums">
          {formatCurrency(Number(sale.total))}
        </span>
      </div>
    </div>
  )
}
