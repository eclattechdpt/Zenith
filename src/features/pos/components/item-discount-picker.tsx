"use client"

import { useState } from "react"
import { Gift, Percent, X } from "lucide-react"

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { usePriceLists } from "@/features/clientes/queries"

import { usePOSStore } from "../store"
import type { CartItem } from "../types"

interface ItemDiscountPickerProps {
  item: CartItem
}

export function ItemDiscountPicker({ item }: ItemDiscountPickerProps) {
  const setItemDiscount = usePOSStore((s) => s.setItemDiscount)
  const { data: priceLists = [] } = usePriceLists()
  const activeDiscounts = priceLists.filter(
    (pl) => Number(pl.discount_percent) > 0
  )

  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<"presets" | "custom">("presets")
  const [customType, setCustomType] = useState<"percent" | "fixed">("percent")
  const [customInput, setCustomInput] = useState("")

  const hasOverride = item.itemDiscountSource !== null
  const isGift = item.itemDiscountSource === "gift"

  function applyPreset(pct: number, listId: string) {
    setItemDiscount(item.variantId, pct, "list", listId)
    closePicker()
  }

  function applyGift() {
    setItemDiscount(item.variantId, 100, "gift", null)
    closePicker()
  }

  function applyCustom() {
    const val = parseFloat(customInput)
    if (isNaN(val) || val <= 0) return
    if (customType === "percent") {
      setItemDiscount(item.variantId, Math.min(100, val), "custom_pct", null)
    } else {
      // custom $: convertir a % equivalente (item.basePrice * qty)
      const gross = item.basePrice * item.quantity
      if (gross <= 0) return
      const pct = Math.min(100, Math.max(0, (val / gross) * 100))
      setItemDiscount(item.variantId, pct, "custom_amount", null)
    }
    closePicker()
  }

  function clearOverride() {
    setItemDiscount(item.variantId, 0, null)
    closePicker()
  }

  function closePicker() {
    setOpen(false)
    setMode("presets")
    setCustomType("percent")
    setCustomInput("")
  }

  // Chip label
  let chipLabel = "+ Desc."
  if (isGift) {
    chipLabel = "🎁 Regalo"
  } else if (hasOverride && item.itemDiscountPercent != null) {
    const pct = Number(item.itemDiscountPercent)
    chipLabel = `-${pct % 1 === 0 ? pct.toFixed(0) : pct.toFixed(2).replace(/\.?0+$/, "")}%`
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <button
            type="button"
            className={cn(
              "inline-flex h-5 items-center gap-1 rounded-md px-1.5 text-[10px] font-semibold transition-colors",
              isGift
                ? "bg-violet-100 text-violet-700 hover:bg-violet-200"
                : hasOverride
                  ? "bg-rose-100 text-rose-700 hover:bg-rose-200"
                  : "bg-neutral-100 text-neutral-500 hover:bg-rose-50 hover:text-rose-600"
            )}
          />
        }
      >
        {chipLabel}
      </PopoverTrigger>
      <PopoverContent className="w-56 p-2" side="bottom" align="end">
        {mode === "presets" && (
          <div className="space-y-1">
            <p className="px-2 pt-1 pb-2 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
              Descuento del producto
            </p>

            {/* Regalo — destacado */}
            <button
              type="button"
              onClick={applyGift}
              className="flex w-full items-center gap-2 rounded-md bg-violet-50 px-2 py-2 text-xs font-semibold text-violet-700 transition-colors hover:bg-violet-100"
            >
              <Gift className="size-3.5" />
              Regalo
              <span className="ml-auto text-[10px] font-bold tabular-nums">
                100%
              </span>
            </button>

            {/* Listas activas */}
            {activeDiscounts.map((pl) => (
              <button
                key={pl.id}
                type="button"
                onClick={() => applyPreset(Number(pl.discount_percent), pl.id)}
                className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-xs text-neutral-700 transition-colors hover:bg-rose-50"
              >
                <span className="truncate font-medium">{pl.name}</span>
                <span className="text-[10px] font-bold text-rose-500 tabular-nums">
                  -{Number(pl.discount_percent)}%
                </span>
              </button>
            ))}

            <button
              type="button"
              onClick={() => setMode("custom")}
              className="flex w-full items-center justify-center gap-1 rounded-md border border-dashed border-neutral-200 py-1.5 text-[11px] font-semibold text-neutral-400 transition-colors hover:border-rose-200 hover:text-rose-500"
            >
              <Percent className="size-3" />
              Personalizado
            </button>

            {hasOverride && (
              <button
                type="button"
                onClick={clearOverride}
                className="flex w-full items-center justify-center gap-1 rounded-md py-1.5 text-[11px] font-semibold text-neutral-500 transition-colors hover:bg-neutral-50"
              >
                <X className="size-3" />
                Quitar override · usar carrito
              </button>
            )}
          </div>
        )}

        {mode === "custom" && (
          <div className="space-y-2">
            <div className="flex items-center gap-1 rounded-lg bg-neutral-50 border border-neutral-200 p-0.5">
              <button
                type="button"
                onClick={() => {
                  setCustomType("percent")
                  setCustomInput("")
                }}
                className={cn(
                  "flex-1 rounded-md px-2 py-1 text-[11px] font-semibold transition-all",
                  customType === "percent"
                    ? "bg-rose-500 text-white shadow-sm"
                    : "text-neutral-500 hover:text-rose-600"
                )}
              >
                %
              </button>
              <button
                type="button"
                onClick={() => {
                  setCustomType("fixed")
                  setCustomInput("")
                }}
                className={cn(
                  "flex-1 rounded-md px-2 py-1 text-[11px] font-semibold transition-all",
                  customType === "fixed"
                    ? "bg-rose-500 text-white shadow-sm"
                    : "text-neutral-500 hover:text-rose-600"
                )}
              >
                $
              </button>
            </div>
            <input
              type="number"
              min={0}
              max={customType === "percent" ? 100 : item.basePrice * item.quantity}
              step="any"
              autoFocus
              placeholder={customType === "percent" ? "Ej: 10" : "Ej: 50"}
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") applyCustom()
              }}
              className="h-8 w-full rounded-md border border-neutral-200 bg-white px-2.5 text-sm tabular-nums outline-none focus:border-rose-200 focus:ring-2 focus:ring-rose-500/10"
            />
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={applyCustom}
                className="flex-1 h-8 rounded-md bg-rose-500 px-3 text-[11px] font-semibold text-white hover:bg-rose-600 transition-colors"
              >
                Aplicar
              </button>
              <button
                type="button"
                onClick={() => setMode("presets")}
                className="h-8 px-3 rounded-md text-[11px] font-semibold text-neutral-500 hover:bg-neutral-50 transition-colors"
              >
                Atrás
              </button>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
