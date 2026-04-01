"use client"

import { useState } from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { ArrowDown, ArrowUp, History } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { MOVEMENT_TYPES } from "@/lib/constants"
import { EmptyState } from "@/components/shared/empty-state"

import { useMovements } from "../queries"
import type { InventoryVariant, InventoryType, MovementWithDetails } from "../types"

const TYPE_COLORS: Record<string, string> = {
  sale: "bg-rose-50 text-rose-700 border-rose-200",
  purchase: "bg-emerald-50 text-emerald-700 border-emerald-200",
  adjustment: "bg-amber-50 text-amber-700 border-amber-200",
  return: "bg-blue-50 text-blue-700 border-blue-200",
  transfer: "bg-purple-50 text-purple-700 border-purple-200",
  initial: "bg-neutral-100 text-neutral-600 border-neutral-200",
}

interface MovementHistoryDialogProps {
  variant: InventoryVariant | null
  inventoryType?: InventoryType
  onOpenChange: (open: boolean) => void
}

export function MovementHistoryDialog({
  variant,
  inventoryType = "physical",
  onOpenChange,
}: MovementHistoryDialogProps) {
  const [typeFilter, setTypeFilter] = useState<string>("")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")

  const { data: movements = [], isLoading } = useMovements(
    variant?.id ?? null,
    inventoryType,
    {
      type: typeFilter || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo ? `${dateTo}T23:59:59` : undefined,
    }
  )

  const productLabel = variant
    ? `${variant.products.name}${variant.name ? ` — ${variant.name}` : ""}${variant.sku ? ` (${variant.sku})` : ""}`
    : ""

  return (
    <Dialog
      open={!!variant}
      onOpenChange={(open) => {
        if (!open) {
          setTypeFilter("")
          setDateFrom("")
          setDateTo("")
        }
        onOpenChange(open)
      }}
    >
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Historial de movimientos</DialogTitle>
          <DialogDescription>{productLabel}</DialogDescription>
        </DialogHeader>

        {/* Filters */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="space-y-1.5 sm:w-40">
            <Label className="text-xs">Tipo</Label>
            <Select value={typeFilter || null} onValueChange={(v) => setTypeFilter(v ?? "")}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(MOVEMENT_TYPES).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Desde</Label>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="h-9 w-36"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Hasta</Label>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="h-9 w-36"
            />
          </div>
          {(typeFilter || dateFrom || dateTo) && (
            <Button
              variant="ghost"
              size="sm"
              className="h-9 text-xs"
              onClick={() => {
                setTypeFilter("")
                setDateFrom("")
                setDateTo("")
              }}
            >
              Limpiar
            </Button>
          )}
        </div>

        {/* Movement list */}
        <div className="flex-1 overflow-y-auto -mx-6 px-6 space-y-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-sm text-neutral-400">
              Cargando...
            </div>
          ) : movements.length === 0 ? (
            <EmptyState
              icon={History}
              title="Sin movimientos"
              description="No se encontraron movimientos con estos filtros."
            />
          ) : (
            movements.map((m) => (
              <MovementRow key={m.id} movement={m} />
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function MovementRow({ movement: m }: { movement: MovementWithDetails }) {
  const isPositive = m.quantity > 0

  const reference =
    m.sales?.sale_number ?? m.returns?.return_number ?? null

  return (
    <div className="flex items-center gap-3 rounded-lg border border-neutral-100 bg-white px-4 py-3">
      {/* Direction icon */}
      <div
        className={`flex size-8 shrink-0 items-center justify-center rounded-full ${
          isPositive
            ? "bg-emerald-50 text-emerald-600"
            : "bg-rose-50 text-rose-600"
        }`}
      >
        {isPositive ? (
          <ArrowDown className="size-4" />
        ) : (
          <ArrowUp className="size-4" />
        )}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={`text-[10px] ${TYPE_COLORS[m.type] ?? ""}`}
          >
            {MOVEMENT_TYPES[m.type as keyof typeof MOVEMENT_TYPES] ?? m.type}
          </Badge>
          {reference && (
            <span className="text-xs text-neutral-400 tabular-nums">
              {reference}
            </span>
          )}
        </div>
        {m.reason && (
          <p className="mt-0.5 text-xs text-neutral-500 truncate">{m.reason}</p>
        )}
      </div>

      {/* Quantity & stock */}
      <div className="shrink-0 text-right">
        <span
          className={`font-semibold tabular-nums ${
            isPositive ? "text-emerald-700" : "text-rose-700"
          }`}
        >
          {isPositive ? "+" : ""}
          {m.quantity}
        </span>
        <p className="text-[10px] text-neutral-400 tabular-nums">
          {m.stock_before} → {m.stock_after}
        </p>
      </div>

      {/* Date */}
      <div className="shrink-0 text-right">
        <p className="text-xs text-neutral-500 tabular-nums">
          {format(new Date(m.created_at), "d MMM yyyy", { locale: es })}
        </p>
        <p className="text-[10px] text-neutral-400 tabular-nums">
          {format(new Date(m.created_at), "h:mm a", { locale: es })}
        </p>
      </div>
    </div>
  )
}
