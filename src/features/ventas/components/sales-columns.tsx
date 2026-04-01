"use client"

import type { ColumnDef } from "@tanstack/react-table"
import {
  ArrowUpDown,
  MoreHorizontal,
  ShoppingCart,
  XCircle,
} from "lucide-react"
import { formatDistanceToNow, isPast } from "date-fns"
import { es } from "date-fns/locale"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { formatCurrency, formatDate } from "@/lib/utils"
import { SALE_STATUSES, PAYMENT_METHODS } from "@/lib/constants"

import type { SaleWithSummary } from "../types"

const STATUS_COLORS: Record<string, string> = {
  quote: "bg-blue-50 text-blue-700 border-blue-200",
  completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  cancelled: "bg-neutral-100 text-neutral-500 border-neutral-200",
  partially_returned: "bg-amber-50 text-amber-700 border-amber-200",
  fully_returned: "bg-rose-50 text-rose-700 border-rose-200",
}

interface SalesColumnsOptions {
  onConvert?: (sale: SaleWithSummary) => void
  onCancel?: (sale: SaleWithSummary) => void
}

export function getSalesColumns({
  onConvert,
  onCancel,
}: SalesColumnsOptions = {}): ColumnDef<SaleWithSummary>[] {
  return [
    {
      accessorKey: "sale_number",
      size: 120,
      minSize: 100,
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-3 h-8"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Numero
          <ArrowUpDown className="ml-1 size-3.5" />
        </Button>
      ),
      cell: ({ row }) => (
        <span className="font-semibold text-neutral-950 tabular-nums">
          {row.original.sale_number}
        </span>
      ),
    },
    {
      accessorKey: "status",
      size: 130,
      minSize: 100,
      header: "Estado",
      cell: ({ row }) => {
        const status = row.original.status as string
        const isQuote = status === "quote"
        const isExpired =
          isQuote &&
          row.original.expires_at &&
          isPast(new Date(row.original.expires_at))

        if (isExpired) {
          return (
            <Badge
              variant="outline"
              className="bg-amber-50 text-amber-700 border-amber-200 text-[10px]"
            >
              Expirada
            </Badge>
          )
        }

        return (
          <Badge
            variant="outline"
            className={`text-[10px] ${STATUS_COLORS[status] ?? ""}`}
          >
            {SALE_STATUSES[status as keyof typeof SALE_STATUSES] ?? status}
          </Badge>
        )
      },
    },
    {
      id: "customer",
      size: 160,
      minSize: 120,
      header: "Cliente",
      cell: ({ row }) => {
        const name = row.original.customers?.name
        if (!name) return <span className="text-neutral-400">—</span>
        return <span className="text-sm text-neutral-600">{name}</span>
      },
    },
    {
      accessorKey: "total",
      size: 110,
      minSize: 90,
      header: () => <span className="block text-right">Total</span>,
      cell: ({ row }) => (
        <span className="block text-right font-semibold text-neutral-950 tabular-nums">
          {formatCurrency(Number(row.original.total))}
        </span>
      ),
    },
    {
      id: "payments",
      size: 120,
      minSize: 100,
      header: "Pago",
      cell: ({ row }) => {
        const payments = row.original.sale_payments
        if (!payments || payments.length === 0) {
          return <span className="text-neutral-400">—</span>
        }
        return (
          <div className="flex flex-wrap gap-1">
            {payments.map((p, i) => (
              <span key={i} className="text-xs text-neutral-500">
                {PAYMENT_METHODS[p.method as keyof typeof PAYMENT_METHODS] ?? p.method}
              </span>
            ))}
          </div>
        )
      },
    },
    {
      accessorKey: "created_at",
      size: 120,
      minSize: 100,
      header: "Fecha",
      cell: ({ row }) => (
        <span className="text-sm text-neutral-500 tabular-nums">
          {formatDate(row.original.created_at)}
        </span>
      ),
    },
    {
      id: "expires",
      size: 120,
      minSize: 100,
      header: "Vencimiento",
      cell: ({ row }) => {
        const expiresAt = row.original.expires_at
        if (!expiresAt) return <span className="text-neutral-400">—</span>

        const expired = isPast(new Date(expiresAt))
        if (expired) {
          return <span className="text-xs text-amber-600 font-medium">Expirada</span>
        }

        return (
          <span className="text-xs text-neutral-500">
            {formatDistanceToNow(new Date(expiresAt), {
              addSuffix: true,
              locale: es,
            })}
          </span>
        )
      },
    },
    {
      id: "actions",
      size: 50,
      minSize: 50,
      header: "",
      cell: ({ row }) => {
        const sale = row.original
        const isQuote = sale.status === "quote"
        const isExpired =
          isQuote && sale.expires_at && isPast(new Date(sale.expires_at))

        if (!isQuote) return null

        return (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="ghost" size="sm" className="size-8 p-0" />
              }
            >
              <MoreHorizontal className="size-4" />
              <span className="sr-only">Acciones</span>
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
                  Cancelar cotizacion
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]
}
