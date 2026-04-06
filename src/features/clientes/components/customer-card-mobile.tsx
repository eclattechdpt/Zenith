"use client"

import { MoreHorizontal, Pencil, Trash2, Eye } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import type { CustomerWithPriceList } from "../types"

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
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <button
            type="button"
            onClick={() => onView?.(customer)}
            className="text-left font-medium text-neutral-950 hover:text-teal-600 transition-colors"
          >
            {customer.name}
          </button>
          {customer.phone && (
            <p className="text-xs text-neutral-500">{customer.phone}</p>
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

      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-neutral-500">
        {customer.email && <span>{customer.email}</span>}
      </div>

      {list && (
        <div className="mt-3 flex items-center gap-2">
          <span className="text-xs text-neutral-600">{list.name}</span>
          {Number(list.discount_percent) > 0 && (
            <Badge variant="secondary" className="text-[10px]">
              -{Number(list.discount_percent)}%
            </Badge>
          )}
        </div>
      )}
    </div>
  )
}
