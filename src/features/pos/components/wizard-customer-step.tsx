"use client"

import { useState, useCallback } from "react"
import { Search, User, X, ArrowRight } from "lucide-react"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useDebounce } from "@/hooks/use-debounce"
import { useCustomers } from "@/features/clientes/queries"

import { usePOSStore } from "../store"
import { resolvePrices } from "../utils"
import type { CartCustomer } from "../types"

interface WizardCustomerStepProps {
  onNext: () => void
}

export function WizardCustomerStep({ onNext }: WizardCustomerStepProps) {
  const [search, setSearch] = useState("")
  const debouncedSearch = useDebounce(search, 250)

  const customer = usePOSStore((s) => s.customer)
  const setCustomer = usePOSStore((s) => s.setCustomer)
  const items = usePOSStore((s) => s.items)
  const updateItemPrice = usePOSStore((s) => s.updateItemPrice)

  const { data: customers = [] } = useCustomers(
    debouncedSearch.trim() ? { search: debouncedSearch } : undefined
  )

  const handleSelect = useCallback(
    async (raw: {
      id: string
      name: string
      phone: string | null
      price_lists: { id: string; discount_percent: number | string } | null
    }) => {
      const cartCustomer: CartCustomer = {
        id: raw.id,
        name: raw.name,
        priceListId: raw.price_lists?.id ?? null,
        discountPercent: Number(raw.price_lists?.discount_percent ?? 0),
      }
      setCustomer(cartCustomer)

      // Recalculate prices using original base prices from DB (not current cart prices
      // which may already be discounted)
      if (items.length > 0) {
        const { createClient } = await import("@/lib/supabase/client")
        const supabase = createClient()
        const { data: variantData } = await supabase
          .from("product_variants")
          .select("id, price")
          .in(
            "id",
            items.map((i) => i.variantId)
          )

        if (variantData) {
          const basePrices = items.map((i) => {
            const dbVariant = variantData.find((d) => d.id === i.variantId)
            return {
              variantId: i.variantId,
              basePrice: dbVariant ? Number(dbVariant.price) : i.unitPrice,
            }
          })

          const priceMap = await resolvePrices(
            basePrices,
            cartCustomer.priceListId,
            cartCustomer.discountPercent
          )

          for (const [variantId, price] of priceMap) {
            updateItemPrice(variantId, price)
          }
        }
      }

      setSearch("")
    },
    [setCustomer, items, updateItemPrice]
  )

  const handleClear = useCallback(() => {
    setCustomer(null)
  }, [setCustomer])

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className="mb-1 text-lg font-bold text-stone-800">
          Seleccionar cliente
        </h3>
        <p className="text-sm text-stone-500">
          Busca un cliente o continúa sin uno
        </p>
      </div>

      {customer ? (
        <div className="flex items-center justify-between rounded-xl border border-teal-200 bg-teal-50 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-200 text-teal-700">
              <User className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-stone-800">{customer.name}</p>
              {customer.discountPercent > 0 && (
                <p className="text-xs text-teal-600">
                  Descuento: {customer.discountPercent}%
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={handleClear}
            className="rounded-md p-1 text-stone-400 transition-colors hover:text-stone-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre, teléfono o email..."
              className="pl-9"
              autoFocus
            />
          </div>

          {debouncedSearch.trim() && customers.length > 0 && (
            <div className="max-h-60 space-y-1 overflow-y-auto rounded-xl border border-stone-200 p-2">
              {customers.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => handleSelect(c)}
                  className="flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-stone-50"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-stone-100 text-stone-500">
                    <User className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-stone-800">
                      {c.name}
                    </p>
                    <p className="text-xs text-stone-500">{c.phone ?? ""}</p>
                  </div>
                  {c.price_lists && Number(c.price_lists.discount_percent) > 0 ? (
                    <span className="rounded-full bg-teal-100 px-2 py-0.5 text-xs font-medium text-teal-700">
                      -{Number(c.price_lists.discount_percent)}%
                    </span>
                  ) : null}
                </button>
              ))}
            </div>
          )}

          {debouncedSearch.trim() && customers.length === 0 && (
            <p className="text-center text-sm text-stone-400">
              No se encontraron clientes
            </p>
          )}
        </>
      )}

      <div className="flex gap-3 pt-4">
        <Button
          onClick={onNext}
          className="flex-1 bg-rose-600 text-white hover:bg-rose-700"
        >
          {customer ? "Continuar" : "Continuar sin cliente"}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
