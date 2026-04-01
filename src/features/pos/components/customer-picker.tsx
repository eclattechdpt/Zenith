"use client"

import { useState, useRef, useEffect } from "react"
import { Search, UserRound, X } from "lucide-react"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useDebounce } from "@/hooks/use-debounce"
import { useCustomers } from "@/features/clientes/queries"

import { usePOSStore } from "../store"
import { resolvePrices } from "../utils"
import type { CartCustomer } from "../types"

export function CustomerPicker() {
  const customer = usePOSStore((s) => s.customer)
  const setCustomer = usePOSStore((s) => s.setCustomer)
  const items = usePOSStore((s) => s.items)
  const updateItemPrice = usePOSStore((s) => s.updateItemPrice)

  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const containerRef = useRef<HTMLDivElement>(null)

  // Close dropdown on click outside
  useEffect(() => {
    if (!open) return
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [open])
  const debouncedSearch = useDebounce(search, 250)
  const { data: customers = [] } = useCustomers({ search: debouncedSearch })

  async function handleSelect(c: CartCustomer) {
    setCustomer(c)
    setOpen(false)
    setSearch("")

    // Recalculate all cart prices with the new customer's price list
    if (items.length > 0) {
      const basePrices = items.map((i) => ({
        variantId: i.variantId,
        basePrice: i.basePrice,
      }))

      const resolved = await resolvePrices(
        basePrices,
        c.priceListId,
        c.discountPercent
      )

      for (const [variantId, price] of resolved) {
        updateItemPrice(variantId, price)
      }
    }
  }

  function handleClear() {
    setCustomer(null)

    // Reset all prices to base (stored in each cart item)
    for (const item of items) {
      updateItemPrice(item.variantId, item.basePrice)
    }
  }

  if (customer && !open) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-teal-200 bg-teal-50/50 px-3 py-2">
        <UserRound className="size-4 text-teal-600" />
        <span className="flex-1 text-sm font-medium text-teal-800 truncate">
          {customer.name}
        </span>
        {customer.discountPercent > 0 && (
          <Badge variant="secondary" className="text-[10px]">
            -{customer.discountPercent}%
          </Badge>
        )}
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={handleClear}
          className="text-teal-600 hover:text-destructive"
        >
          <X className="size-3.5" />
        </Button>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="flex flex-col gap-1.5">
      <div className="relative">
        <UserRound className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-neutral-400" />
        <Input
          placeholder="Buscar cliente (opcional)..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            if (!open) setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          className="pl-10 h-9"
        />
      </div>

      {open && search.trim() && (
        <div className="max-h-48 overflow-y-auto rounded-lg border border-neutral-200 bg-white shadow-sm">
          {customers.length === 0 ? (
            <p className="px-4 py-3 text-sm text-neutral-500">
              No se encontraron clientes
            </p>
          ) : (
            <div className="divide-y divide-neutral-100">
              {customers.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() =>
                    handleSelect({
                      id: c.id,
                      name: c.name,
                      priceListId: c.price_lists?.id ?? null,
                      discountPercent: Number(
                        c.price_lists?.discount_percent ?? 0
                      ),
                    })
                  }
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-neutral-50"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-neutral-950 truncate">
                      {c.name}
                    </p>
                    {c.phone && (
                      <p className="text-xs text-neutral-400">{c.phone}</p>
                    )}
                  </div>
                  {c.price_lists &&
                    Number(c.price_lists.discount_percent) > 0 && (
                      <Badge variant="secondary" className="text-[10px]">
                        -{Number(c.price_lists.discount_percent)}%
                      </Badge>
                    )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
