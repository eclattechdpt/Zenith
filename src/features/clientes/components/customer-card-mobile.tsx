"use client"

import { MoreHorizontal, Pencil, Trash2, Eye, Phone, Hash } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import type { CustomerWithPriceList } from "../types"

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

interface CustomerCardMobileProps {
  customer: CustomerWithPriceList
  onEdit?: (customer: CustomerWithPriceList) => void
  onDelete?: (customer: CustomerWithPriceList) => void
  onView?: (customer: CustomerWithPriceList) => void
}

export function CustomerCardMobile({ customer, onEdit, onDelete, onView }: CustomerCardMobileProps) {
  const list = customer.price_lists

  return (
    <div className="rounded-xl border border-neutral-100 bg-white p-4">
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <button
          type="button"
          onClick={() => onView?.(customer)}
          className="flex size-10 flex-shrink-0 items-center justify-center rounded-xl bg-teal-50 text-[12px] font-bold text-teal-600"
        >
          {getInitials(customer.name)}
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <button
                type="button"
                onClick={() => onView?.(customer)}
                className="text-left font-medium text-neutral-950 hover:text-teal-600 transition-colors truncate block"
              >
                {customer.name}
              </button>
              {customer.client_number && (
                <p className="flex items-center gap-0.5 text-[11px] text-neutral-400 mt-0.5">
                  <Hash className="size-2.5" />
                  {customer.client_number}
                </p>
              )}
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button variant="ghost" size="sm" className="size-7 p-0 shrink-0" />
                }
              >
                <MoreHorizontal className="size-4" />
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
          </div>

          {/* Contact info */}
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-neutral-500">
            {customer.phone && (
              <span className="flex items-center gap-1">
                <Phone className="size-3 text-neutral-400" />
                {customer.phone}
              </span>
            )}
            {customer.email && <span>{customer.email}</span>}
          </div>

          {/* Discount badge */}
          <div className="mt-2.5">
            {list ? (
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-neutral-600">{list.name}</span>
                {Number(list.discount_percent) > 0 && (
                  <Badge className="text-[10px] bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-50">
                    -{Number(list.discount_percent)}%
                  </Badge>
                )}
              </div>
            ) : (
              <span className="inline-flex items-center rounded-md bg-neutral-50 px-2 py-0.5 text-[11px] font-medium text-neutral-400">
                Precio base
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
