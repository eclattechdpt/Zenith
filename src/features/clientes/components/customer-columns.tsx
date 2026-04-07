"use client"

import { useRef, useCallback } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, MoreHorizontal, Pencil, Trash2, Eye, Hash } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import type { CustomerWithPriceList } from "../types"

/* ── Initials avatar ── */
function getInitials(name: string) {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

/* ── Name cell with hover preview ── */
interface NameCellProps {
  customer: CustomerWithPriceList
  onView?: (customer: CustomerWithPriceList) => void
  onPreview?: (customerId: string, anchor: { top: number; left: number }) => void
  onPreviewDismiss?: () => void
}

function NameCell({ customer, onView, onPreview, onPreviewDismiss }: NameCellProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleMouseEnter = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!onPreview) return
      const rect = e.currentTarget.getBoundingClientRect()
      timerRef.current = setTimeout(() => {
        onPreview(customer.id, {
          top: rect.bottom + 8,
          left: rect.left,
        })
      }, 1000)
    },
    [customer.id, onPreview]
  )

  const handleMouseLeave = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    onPreviewDismiss?.()
  }, [onPreviewDismiss])

  const handleClick = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    onPreviewDismiss?.()
    onView?.(customer)
  }, [customer, onView, onPreviewDismiss])

  return (
    <button
      type="button"
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="flex items-center gap-3 text-left transition-colors group cursor-pointer"
    >
      <div className="flex size-8 flex-shrink-0 items-center justify-center rounded-lg bg-teal-50 text-[11px] font-bold text-teal-600">
        {getInitials(customer.name)}
      </div>
      <div className="min-w-0">
        <p className="font-medium text-neutral-950 group-hover:text-teal-600 transition-colors truncate">
          {customer.name}
        </p>
        {customer.client_number && (
          <p className="flex items-center gap-0.5 text-[11px] text-neutral-400 mt-0.5">
            <Hash className="size-2.5" />
            {customer.client_number}
          </p>
        )}
      </div>
    </button>
  )
}

interface CustomerColumnsOptions {
  onEdit?: (customer: CustomerWithPriceList) => void
  onDelete?: (customer: CustomerWithPriceList) => void
  onView?: (customer: CustomerWithPriceList) => void
  onPreview?: (customerId: string, anchor: { top: number; left: number }) => void
  onPreviewDismiss?: () => void
}

export function getCustomerColumns({
  onEdit,
  onDelete,
  onView,
  onPreview,
  onPreviewDismiss,
}: CustomerColumnsOptions = {}): ColumnDef<CustomerWithPriceList>[] {
  return [
    {
      accessorKey: "name",
      size: 240,
      minSize: 180,
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-3 h-8"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Nombre
          <ArrowUpDown className="ml-1 size-3.5" />
        </Button>
      ),
      cell: ({ row }) => (
        <NameCell
          customer={row.original}
          onView={onView}
          onPreview={onPreview}
          onPreviewDismiss={onPreviewDismiss}
        />
      ),
    },
    {
      accessorKey: "phone",
      size: 140,
      minSize: 100,
      header: "Telefono",
      cell: ({ row }) => {
        const phone = row.original.phone
        if (!phone) return <span className="text-neutral-400">—</span>
        return <span className="text-sm text-neutral-600">{phone}</span>
      },
    },
    {
      accessorKey: "email",
      size: 200,
      minSize: 140,
      header: "Email",
      cell: ({ row }) => {
        const email = row.original.email
        if (!email) return <span className="text-neutral-400">—</span>
        return <span className="text-sm text-neutral-600">{email}</span>
      },
    },
    {
      id: "price_list",
      size: 160,
      minSize: 120,
      header: "Descuento",
      cell: ({ row }) => {
        const list = row.original.price_lists
        if (!list) return <span className="text-neutral-400">—</span>
        return (
          <div className="flex items-center gap-2">
            <span className="text-sm text-neutral-600">{list.name}</span>
            {Number(list.discount_percent) > 0 && (
              <Badge variant="secondary" className="text-[10px]">
                -{Number(list.discount_percent)}%
              </Badge>
            )}
          </div>
        )
      },
    },
    {
      id: "actions",
      size: 50,
      minSize: 50,
      header: "",
      cell: ({ row }) => {
        const customer = row.original
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
              {onView && (
                <DropdownMenuItem onClick={() => onView(customer)}>
                  <Eye className="mr-2 size-3.5" />
                  Ver detalle
                </DropdownMenuItem>
              )}
              {onEdit && (
                <DropdownMenuItem onClick={() => onEdit(customer)}>
                  <Pencil className="mr-2 size-3.5" />
                  Editar
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => onDelete(customer)}
                >
                  <Trash2 className="mr-2 size-3.5" />
                  Eliminar
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]
}
