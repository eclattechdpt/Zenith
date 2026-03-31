"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, MoreHorizontal, Pencil, Trash2 } from "lucide-react"
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

interface CustomerColumnsOptions {
  onDelete?: (customer: CustomerWithPriceList) => void
}

export function getCustomerColumns({
  onDelete,
}: CustomerColumnsOptions = {}): ColumnDef<CustomerWithPriceList>[] {
  return [
    {
      accessorKey: "name",
      size: 200,
      minSize: 150,
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
        <span className="font-medium text-neutral-950">
          {row.original.name}
        </span>
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
      header: "Lista de precios",
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
        )
      },
    },
  ]
}
