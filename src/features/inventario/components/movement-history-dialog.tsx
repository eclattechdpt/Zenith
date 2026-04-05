"use client"

import { useState, useRef } from "react"
import { format, startOfDay, startOfWeek, startOfMonth, endOfDay } from "date-fns"
import { es } from "date-fns/locale"
import { ArrowDown, ArrowUp, History, X } from "lucide-react"
import { motion, AnimatePresence } from "motion/react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { MOVEMENT_TYPES } from "@/lib/constants"

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

const DATE_PRESETS = [
  { value: "", label: "Todo" },
  { value: "today", label: "Hoy" },
  { value: "week", label: "Esta semana" },
  { value: "month", label: "Este mes" },
] as const

// ── Stagger variants ──

const movementListContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.04, delayChildren: 0.06 } },
}
const movementListItem = {
  hidden: { opacity: 0, y: 8, filter: "blur(3px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] as const },
  },
}

function getDateRange(preset: string, customDate?: string): { from: string; to: string } | null {
  if (!preset) return null
  const now = new Date()
  const todayEnd = `${format(now, "yyyy-MM-dd")}T23:59:59`
  if (preset === "today") {
    return { from: startOfDay(now).toISOString(), to: todayEnd }
  }
  if (preset === "week") {
    return { from: startOfWeek(now, { weekStartsOn: 1 }).toISOString(), to: todayEnd }
  }
  if (preset === "month") {
    return { from: startOfMonth(now).toISOString(), to: todayEnd }
  }
  if (preset === "custom" && customDate) {
    const date = new Date(customDate)
    return { from: startOfDay(date).toISOString(), to: endOfDay(date).toISOString() }
  }
  return null
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
  const [datePreset, setDatePreset] = useState<string>("")
  const [customDate, setCustomDate] = useState<string>("")
  const [datePickerOpen, setDatePickerOpen] = useState(false)
  const dateInputRef = useRef<HTMLInputElement>(null)

  const dateRange = getDateRange(datePreset, customDate)

  const { data: movements = [], isLoading } = useMovements(
    variant?.id ?? null,
    inventoryType,
    {
      type: typeFilter || undefined,
      dateFrom: dateRange?.from || undefined,
      dateTo: dateRange?.to || undefined,
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
          setDatePreset("")
          setCustomDate("")
          setDatePickerOpen(false)
        }
        onOpenChange(open)
      }}
    >
      <DialogContent className="sm:max-w-2xl max-h-[80vh] flex flex-col p-6">
        <DialogHeader>
          <DialogTitle>Historial de movimientos</DialogTitle>
          <DialogDescription>{productLabel}</DialogDescription>
        </DialogHeader>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Type select */}
          <Select value={typeFilter || "all"} onValueChange={(v) => setTypeFilter(v === "all" ? "" : (v ?? ""))}>
            <SelectTrigger className="h-8 w-auto gap-1 rounded-full border-neutral-200 px-3 text-xs">
              <SelectValue>
                {typeFilter
                  ? MOVEMENT_TYPES[typeFilter as keyof typeof MOVEMENT_TYPES] ?? typeFilter
                  : "Todos los tipos"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent side="bottom">
              <SelectItem value="all">Todos los tipos</SelectItem>
              {Object.entries(MOVEMENT_TYPES).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Date preset pills */}
          <div className="flex gap-1">
            {DATE_PRESETS.map((preset) => {
              const isActive = datePreset === preset.value
              return (
                <Button
                  key={preset.value}
                  variant={isActive ? "default" : "ghost"}
                  size="sm"
                  className={`h-7 rounded-full px-3 text-[11px] ${isActive ? "bg-accent-500 text-white hover:bg-accent-600" : ""}`}
                  onClick={() => {
                    setDatePreset(preset.value)
                    setCustomDate("")
                    setDatePickerOpen(false)
                  }}
                >
                  {preset.label}
                </Button>
              )
            })}

            {/* Custom date pill */}
            {datePreset === "custom" && customDate ? (
              <Button
                variant="default"
                size="sm"
                className="h-7 rounded-full px-3 text-[11px] gap-1 bg-accent-500 text-white hover:bg-accent-600"
                onClick={() => {
                  setDatePreset("")
                  setCustomDate("")
                }}
              >
                {format(new Date(customDate), "d MMM yyyy", { locale: es })}
                <X className="size-3" />
              </Button>
            ) : (
              <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                <PopoverTrigger
                  render={
                    <Button
                      variant={datePreset === "custom" ? "default" : "ghost"}
                      size="sm"
                      className={`h-7 rounded-full px-3 text-[11px] ${datePreset === "custom" ? "bg-accent-500 text-white hover:bg-accent-600" : ""}`}
                    />
                  }
                >
                  Fecha
                </PopoverTrigger>
                <PopoverContent
                  className="w-auto p-3"
                  side="bottom"
                  align="start"
                >
                  <Input
                    ref={dateInputRef}
                    type="date"
                    value={customDate}
                    onChange={(e) => {
                      const val = e.target.value
                      if (val) {
                        setCustomDate(val)
                        setDatePreset("custom")
                        setDatePickerOpen(false)
                      }
                    }}
                    className="h-9"
                    autoFocus
                  />
                </PopoverContent>
              </Popover>
            )}
          </div>
        </div>

        {/* Movement list */}
        <div className="flex-1 overflow-y-auto -mx-6 px-6">
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-16 animate-pulse rounded-xl bg-neutral-100/80"
                  style={{ animationDelay: `${i * 80}ms` }}
                />
              ))}
            </div>
          ) : movements.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex h-36 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-neutral-200 bg-white/50"
            >
              <motion.div
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
              >
                <History className="h-6 w-6 text-neutral-300" />
              </motion.div>
              <p className="text-sm font-semibold text-neutral-400">Sin movimientos</p>
              <p className="text-xs text-neutral-400/70">
                No se encontraron movimientos con estos filtros.
              </p>
            </motion.div>
          ) : (
            <motion.div
              className="space-y-2"
              variants={movementListContainer}
              initial="hidden"
              animate="visible"
            >
              {movements.map((m) => (
                <motion.div key={m.id} variants={movementListItem}>
                  <MovementRow movement={m} />
                </motion.div>
              ))}
            </motion.div>
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
    <div className="flex items-center gap-3 rounded-xl border border-neutral-100 bg-white px-4 py-3 transition-[border-color] duration-150 hover:border-neutral-200">
      {/* Direction icon */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 20 }}
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
      </motion.div>

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
            <span className="text-[11px] text-neutral-400 tabular-nums">
              {reference}
            </span>
          )}
        </div>
        {m.reason && (
          <p className="mt-0.5 text-[11px] text-neutral-500 truncate">{m.reason}</p>
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
        <p className="text-[11px] text-neutral-500 tabular-nums">
          {format(new Date(m.created_at), "d MMM yyyy", { locale: es })}
        </p>
        <p className="text-[10px] text-neutral-400 tabular-nums">
          {format(new Date(m.created_at), "h:mm a", { locale: es })}
        </p>
      </div>
    </div>
  )
}
