"use client"

import { useState, useCallback } from "react"
import { Search, UserX, ArrowRight, Phone } from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { useDebounce } from "@/hooks/use-debounce"
import { useCustomers } from "@/features/clientes/queries"

import { usePOSStore } from "../store"
import { resolvePrices } from "../utils"
import type { CartCustomer } from "../types"

interface WizardCustomerStepProps {
  onNext: () => void
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

export function WizardCustomerStep({ onNext }: WizardCustomerStepProps) {
  const [search, setSearch] = useState("")
  const debouncedSearch = useDebounce(search, 250)

  const customer = usePOSStore((s) => s.customer)
  const setCustomer = usePOSStore((s) => s.setCustomer)
  const items = usePOSStore((s) => s.items)
  const updateItemPrice = usePOSStore((s) => s.updateItemPrice)

  const { data: customers = [], isLoading } = useCustomers(
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

      if (items.length > 0) {
        try {
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
        } catch {
          toast.warning("No se pudieron actualizar los precios", {
            description: "Los precios del carrito podrian no reflejar el descuento del cliente.",
          })
        }
      }

      setSearch("")
    },
    [setCustomer, items, updateItemPrice]
  )

  const handleClearCustomer = useCallback(() => {
    setCustomer(null)
  }, [setCustomer])

  return (
    <div className="flex h-full flex-col">
      {/* ── Step header ── */}
      <div className="flex-shrink-0 space-y-4 bg-white px-6 pt-8 pb-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] sm:px-8">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-neutral-900">
            Seleccionar cliente
          </h2>
          <p className="mt-1 text-base text-neutral-500">
            Elige un cliente para aplicar descuentos, o continua sin uno
          </p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, telefono o email..."
            className="h-11 w-full rounded-xl border border-neutral-200 bg-neutral-50/80 pl-11 pr-4 text-sm font-medium text-neutral-700 outline-none transition-colors placeholder:text-neutral-400 focus:border-rose-200 focus:bg-white"
            autoFocus
          />
        </div>
      </div>

      {/* ── Customer grid (scrollable) ── */}
      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5 sm:px-8 [scrollbar-width:thin] [scrollbar-color:rgba(0,0,0,0.08)_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-neutral-300/40">
        {isLoading ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-20 animate-pulse rounded-xl bg-neutral-100"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {/* "Sin cliente" card */}
            <button
              type="button"
              onClick={handleClearCustomer}
              className={cn(
                "flex items-center gap-4 rounded-xl border-2 border-dashed p-4 text-left transition-all",
                !customer
                  ? "border-rose-300 bg-rose-50/50"
                  : "border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50"
              )}
            >
              <div
                className={cn(
                  "flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full",
                  !customer
                    ? "bg-rose-100 text-rose-500"
                    : "bg-neutral-100 text-neutral-400"
                )}
              >
                <UserX className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-neutral-800">
                  Sin cliente
                </p>
                <p className="text-xs text-neutral-500">
                  Venta al publico general
                </p>
              </div>
            </button>

            {/* Customer cards */}
            {customers.map((c) => {
              const isSelected = customer?.id === c.id
              const discount = Number(c.price_lists?.discount_percent ?? 0)
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => handleSelect(c)}
                  className={cn(
                    "flex items-center gap-4 rounded-xl border-2 p-4 text-left transition-all",
                    isSelected
                      ? "border-rose-400 bg-rose-50/50 shadow-sm"
                      : "border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50"
                  )}
                >
                  <div
                    className={cn(
                      "flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold",
                      isSelected
                        ? "bg-rose-100 text-rose-600"
                        : "bg-neutral-100 text-neutral-500"
                    )}
                  >
                    {getInitials(c.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-neutral-800">
                      {c.name}
                    </p>
                    {c.phone && (
                      <p className="flex items-center gap-1 truncate text-xs text-neutral-500">
                        <Phone className="h-3 w-3" />
                        {c.phone}
                      </p>
                    )}
                  </div>
                  {discount > 0 && (
                    <span className="flex-shrink-0 rounded-full bg-teal-100 px-2.5 py-1 text-xs font-bold text-teal-700">
                      -{discount}%
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        )}

        {/* Empty search state */}
        {!isLoading && debouncedSearch.trim() && customers.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-16">
            <Search className="h-7 w-7 text-neutral-300" />
            <p className="text-base font-semibold text-neutral-400">
              No se encontraron clientes
            </p>
            <p className="text-sm text-neutral-400">
              Intenta con otro termino de busqueda
            </p>
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      <div className="flex-shrink-0 border-t border-neutral-200/60 bg-white px-6 py-4 shadow-[0_-1px_3px_rgba(0,0,0,0.04)] sm:px-8">
        <button
          type="button"
          onClick={onNext}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-accent-500 text-base font-bold text-white transition-colors hover:bg-accent-600 active:bg-accent-700"
        >
          {customer ? `Continuar con ${customer.name}` : "Continuar sin cliente"}
          <ArrowRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}
