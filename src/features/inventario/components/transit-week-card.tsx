"use client"

import { Calendar, Package, MoreHorizontal, Pencil, Trash2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { formatCurrency } from "@/lib/utils"

import type { TransitWeekWithItems } from "../types"

interface TransitWeekCardProps {
  week: TransitWeekWithItems
  isSelected?: boolean
  onSelect?: () => void
  onEdit?: () => void
  onDelete?: () => void
}

export function TransitWeekCard({
  week,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
}: TransitWeekCardProps) {
  const itemCount = week.transit_week_items?.length ?? 0

  return (
    <div
      className={`group cursor-pointer rounded-xl border bg-white p-4 transition-all duration-200 ${
        isSelected
          ? "border-blue-300 ring-1 ring-blue-200 shadow-sm"
          : "border-neutral-100 hover:border-blue-200 hover:shadow-sm"
      }`}
      onClick={onSelect}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-neutral-950">
              Semana {week.week_number}
            </span>
            <Badge
              variant="outline"
              className="bg-blue-50 text-blue-700 border-blue-200 text-[10px]"
            >
              {week.year}
            </Badge>
          </div>
          {week.label && (
            <p className="mt-0.5 text-xs text-neutral-500 truncate">
              {week.label}
            </p>
          )}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="sm"
                className="size-7 p-0 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => e.stopPropagation()}
              />
            }
          >
            <MoreHorizontal className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {onEdit && (
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation()
                  onEdit()
                }}
              >
                <Pencil className="mr-2 size-3.5" />
                Editar semana
              </DropdownMenuItem>
            )}
            {onDelete && (
              <DropdownMenuItem
                variant="destructive"
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete()
                }}
              >
                <Trash2 className="mr-2 size-3.5" />
                Eliminar semana
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs text-neutral-500">
          <span className="flex items-center gap-1">
            <Package className="size-3" />
            {itemCount} {itemCount === 1 ? "producto" : "productos"}
          </span>
          {week.notes && (
            <span className="flex items-center gap-1 truncate max-w-32">
              <Calendar className="size-3 shrink-0" />
              {week.notes}
            </span>
          )}
        </div>
        <span className="font-bold text-neutral-950 tabular-nums">
          {formatCurrency(Number(week.total_value))}
        </span>
      </div>
    </div>
  )
}
