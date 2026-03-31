"use client"

import { MoreHorizontal, Pencil, Trash2 } from "lucide-react"
import Link from "next/link"

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
  onDelete?: (customer: CustomerWithPriceList) => void
}

export function CustomerCardMobile({ customer, onDelete }: CustomerCardMobileProps) {
  const list = customer.price_lists

  return (
    <div className="rounded-xl border border-neutral-100 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-medium text-neutral-950">{customer.name}</p>
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
            <DropdownMenuItem
              nativeButton={false}
              render={<Link href={`/clientes/${customer.id}`} />}
            >
              <Pencil className="mr-2 size-3.5" />
              Editar
            </DropdownMenuItem>
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
