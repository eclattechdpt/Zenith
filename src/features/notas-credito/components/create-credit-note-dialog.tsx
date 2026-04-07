"use client"

import { useState, useMemo } from "react"
import {
  Plus,
  Loader2,
  Search,
  Package,
  ArrowDownLeft,
  ArrowUpRight,
  Trash2,
  X,
  User,
  FileText,
  Check,
} from "lucide-react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { sileo } from "sileo"
import { motion, AnimatePresence } from "motion/react"

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"

import { useCustomers } from "@/features/clientes/queries"
import { createLending, createExchange } from "../actions"

type CreditNoteMode = "lending" | "exchange"

interface ItemEntry {
  product_variant_id: string
  product_name: string
  variant_label: string
  quantity: number
  direction: "out" | "in"
}

interface SimpleProduct {
  id: string
  name: string
  brand: string | null
  product_variants: {
    id: string
    name: string | null
    sku: string | null
    price: number
    stock: number
    is_active: boolean
  }[]
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const THIN_SCROLL =
  "[scrollbar-width:thin] [scrollbar-color:rgba(0,0,0,0.08)_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-neutral-300/40"

function useAllProducts() {
  return useQuery({
    queryKey: ["all-products-simple"],
    queryFn: async (): Promise<SimpleProduct[]> => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("products")
        .select(
          `id, name, brand,
          product_variants:product_variants!product_variants_product_id_fkey(
            id, name, sku, price, stock, is_active
          )`
        )
        .is("deleted_at", null)
        .eq("is_active", true)
        .is("product_variants.deleted_at", null)
        .order("name")

      if (error) throw error
      return (data ?? []) as unknown as SimpleProduct[]
    },
    staleTime: 30_000,
  })
}

export function CreateCreditNoteDialog({ open, onOpenChange }: Props) {
  const [mode, setMode] = useState<CreditNoteMode>("lending")
  const [customerId, setCustomerId] = useState<string>("")
  const [customerSearch, setCustomerSearch] = useState("")
  const [productSearch, setProductSearch] = useState("")
  const [items, setItems] = useState<ItemEntry[]>([])
  const [notes, setNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [addDirection, setAddDirection] = useState<"out" | "in">("out")

  const queryClient = useQueryClient()

  // Load all customers and products immediately
  const { data: allCustomers = [] } = useCustomers()
  const { data: allProducts = [] } = useAllProducts()

  // Client-side filtering
  const filteredCustomers = useMemo(() => {
    if (!customerSearch.trim()) return allCustomers
    const q = customerSearch.toLowerCase()
    return allCustomers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q)
    )
  }, [allCustomers, customerSearch])

  const filteredProducts = useMemo(() => {
    if (!productSearch.trim()) return allProducts
    const q = productSearch.toLowerCase()
    return allProducts.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.brand?.toLowerCase().includes(q) ||
        p.product_variants.some((v) => v.sku?.toLowerCase().includes(q))
    )
  }, [allProducts, productSearch])

  const selectedCustomer = allCustomers.find((c) => c.id === customerId)

  function addItem(
    variantId: string,
    productName: string,
    variantLabel: string
  ) {
    const dir = mode === "lending" ? "out" : addDirection
    const existing = items.find(
      (i) => i.product_variant_id === variantId && i.direction === dir
    )
    if (existing) {
      setItems((prev) =>
        prev.map((i) =>
          i.product_variant_id === variantId && i.direction === dir
            ? { ...i, quantity: i.quantity + 1 }
            : i
        )
      )
    } else {
      setItems((prev) => [
        ...prev,
        {
          product_variant_id: variantId,
          product_name: productName,
          variant_label: variantLabel,
          quantity: 1,
          direction: dir,
        },
      ])
    }
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index))
  }

  function updateQuantity(index: number, qty: number) {
    if (qty < 1) return
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, quantity: qty } : item))
    )
  }

  async function handleSubmit() {
    if (!customerId || items.length === 0 || isSubmitting) return
    setIsSubmitting(true)

    const action = mode === "lending" ? createLending : createExchange
    const result = await action({
      customer_id: customerId,
      items,
      notes: notes.trim() || null,
    })

    setIsSubmitting(false)

    if ("error" in result) {
      const msg =
        (result.error as Record<string, string[]>)._form?.[0] ??
        "Error al crear la nota"
      sileo.error({ title: msg })
      return
    }

    sileo.success({
      title: `${mode === "lending" ? "Prestamo" : "Intercambio"} ${result.data.credit_number} creado`,
    })

    queryClient.invalidateQueries({ queryKey: ["credit-notes"] })
    queryClient.invalidateQueries({ queryKey: ["inventory"] })
    queryClient.invalidateQueries({ queryKey: ["products"] })
    queryClient.invalidateQueries({ queryKey: ["pos-products"] })
    queryClient.invalidateQueries({ queryKey: ["all-products-simple"] })

    resetAndClose()
  }

  function resetAndClose() {
    setCustomerId("")
    setCustomerSearch("")
    setProductSearch("")
    setItems([])
    setNotes("")
    setAddDirection("out")
    onOpenChange(false)
  }

  const outItems = items.filter((i) => i.direction === "out")
  const inItems = items.filter((i) => i.direction === "in")
  const canSubmit = !!customerId && items.length > 0 && !isSubmitting

  return (
    <Dialog open={open} onOpenChange={(v) => !v && resetAndClose()}>
      <DialogContent
        showCloseButton={false}
        className="flex h-[85vh] w-[95vw] flex-col gap-0 overflow-hidden bg-neutral-50 p-0 sm:max-w-5xl sm:rounded-2xl"
      >
        <DialogTitle className="sr-only">Nueva nota de credito</DialogTitle>

        {/* ── Header ── */}
        <div className="flex flex-shrink-0 items-center justify-between border-b border-neutral-200/60 bg-white px-6 py-4 sm:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-100">
              <FileText className="h-4 w-4 text-teal-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-neutral-900">
                Nueva nota de credito
              </h2>
              <p className="text-xs text-neutral-400">
                {mode === "lending" ? "Prestamo de productos" : "Intercambio de productos"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex rounded-xl border border-neutral-200 bg-neutral-50 p-1">
              <button
                type="button"
                onClick={() => {
                  setMode("lending")
                  setItems([])
                  setAddDirection("out")
                }}
                className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors ${mode === "lending" ? "bg-white text-violet-700 shadow-sm" : "text-neutral-500 hover:text-neutral-700"}`}
              >
                Prestamo
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("exchange")
                  setItems([])
                }}
                className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors ${mode === "exchange" ? "bg-white text-amber-700 shadow-sm" : "text-neutral-500 hover:text-neutral-700"}`}
              >
                Intercambio
              </button>
            </div>

            <button
              type="button"
              onClick={resetAndClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* ── Body: split panels ── */}
        <div className="flex min-h-0 flex-1">
          {/* ── Left panel: customers + products ── */}
          <div className="flex w-full flex-col border-r border-neutral-200/60 bg-white sm:w-[45%]">
            {/* Customer section */}
            <div className="border-b border-neutral-100 px-5 py-3">
              <label className="mb-2 block text-[11px] font-bold uppercase tracking-[1.5px] text-neutral-400">
                Distribuidor
              </label>
              {customerId && selectedCustomer ? (
                <div className="flex items-center gap-3 rounded-xl bg-teal-50 p-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-200 text-teal-700">
                    <User className="h-4 w-4" />
                  </div>
                  <span className="flex-1 font-semibold text-teal-800">
                    {selectedCustomer.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => setCustomerId("")}
                    className="rounded-lg p-1 text-teal-500 hover:bg-teal-100"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              ) : (
                <>
                  <div className="relative mb-2">
                    <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-neutral-400" />
                    <Input
                      placeholder="Filtrar distribuidor..."
                      value={customerSearch}
                      onChange={(e) => setCustomerSearch(e.target.value)}
                      className="pl-9 h-9"
                    />
                  </div>
                  <div className={cn("max-h-28 overflow-y-auto rounded-lg border border-neutral-100", THIN_SCROLL)}>
                    {filteredCustomers.length > 0 ? (
                      filteredCustomers.slice(0, 20).map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => {
                            setCustomerId(c.id)
                            setCustomerSearch("")
                          }}
                          className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors hover:bg-neutral-50"
                        >
                          <User className="size-3.5 shrink-0 text-neutral-400" />
                          <span className="truncate">{c.name}</span>
                        </button>
                      ))
                    ) : (
                      <p className="px-3 py-2 text-xs text-neutral-400">Sin resultados</p>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Direction toggle (exchange only) */}
            {mode === "exchange" && (
              <div className="flex items-center gap-2 border-b border-neutral-100 px-5 py-2.5">
                <span className="text-xs font-medium text-neutral-400">Agregar como:</span>
                <div className="flex rounded-lg border border-neutral-200 bg-neutral-50 p-0.5">
                  <button
                    type="button"
                    onClick={() => setAddDirection("out")}
                    className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${addDirection === "out" ? "bg-white text-rose-600 shadow-sm" : "text-neutral-500"}`}
                  >
                    <ArrowUpRight className="size-3.5" /> Salida
                  </button>
                  <button
                    type="button"
                    onClick={() => setAddDirection("in")}
                    className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${addDirection === "in" ? "bg-white text-emerald-600 shadow-sm" : "text-neutral-500"}`}
                  >
                    <ArrowDownLeft className="size-3.5" /> Entrada
                  </button>
                </div>
              </div>
            )}

            {/* Product section */}
            <div className="px-5 pt-3 pb-2">
              <label className="mb-2 block text-[11px] font-bold uppercase tracking-[1.5px] text-neutral-400">
                Productos
              </label>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-neutral-400" />
                <Input
                  placeholder="Filtrar por nombre, marca o codigo..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="pl-9 h-9"
                />
              </div>
            </div>

            {/* Product list */}
            <div className={cn("flex-1 overflow-y-auto px-5 pb-4", THIN_SCROLL)}>
              {filteredProducts.length > 0 ? (
                <div className="space-y-1.5 pt-1">
                  {filteredProducts.map((p) =>
                    (p.product_variants ?? [])
                      .filter((v) => v.is_active)
                      .map((v) => {
                        const dir = mode === "lending" ? "out" : addDirection
                        const alreadyAdded = items.some(
                          (i) => i.product_variant_id === v.id && i.direction === dir
                        )
                        return (
                          <button
                            key={v.id}
                            type="button"
                            onClick={() => addItem(v.id, p.name, v.name || p.name)}
                            className="flex w-full items-center gap-3 rounded-xl border border-neutral-100 bg-white p-2.5 text-left transition-all hover:border-neutral-200 hover:shadow-sm active:scale-[0.99]"
                          >
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-neutral-100">
                              <Package className="size-4 text-neutral-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="truncate text-sm font-semibold text-neutral-800">
                                {p.name}
                              </p>
                              <p className="text-xs text-neutral-400">
                                {v.name && v.name !== p.name ? `${v.name} · ` : ""}
                                {v.sku ? `${v.sku} · ` : ""}
                                Stock: {v.stock}
                              </p>
                            </div>
                            {alreadyAdded ? (
                              <span className="shrink-0 rounded-full bg-teal-100 px-2 py-0.5 text-[10px] font-bold text-teal-700">
                                Agregado
                              </span>
                            ) : (
                              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent-50 text-accent-500">
                                <Plus className="size-3.5" />
                              </div>
                            )}
                          </button>
                        )
                      })
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-neutral-400">
                  <Package className="size-8 mb-2 opacity-20" />
                  <p className="text-sm">Sin productos</p>
                </div>
              )}
            </div>
          </div>

          {/* ── Right panel: selected items ── */}
          <div className={cn("hidden flex-1 flex-col bg-neutral-100/40 sm:flex", THIN_SCROLL)}>
            <div className="flex-1 overflow-y-auto px-6 py-5">
              {items.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-neutral-400">
                  <Package className="size-12 mb-3 opacity-20" />
                  <p className="text-sm font-medium">Sin productos</p>
                  <p className="mt-1 text-xs">
                    Busca y agrega productos desde el panel izquierdo
                  </p>
                </div>
              ) : (
                <div className="space-y-5">
                  {outItems.length > 0 && (
                    <div>
                      <div className="mb-2 flex items-center gap-2">
                        <ArrowUpRight className="size-3.5 text-rose-500" />
                        <p className="text-[11px] font-bold uppercase tracking-[1.5px] text-rose-500">
                          Salida ({outItems.reduce((s, i) => s + i.quantity, 0)} uds.)
                        </p>
                      </div>
                      <div className="space-y-2">
                        <AnimatePresence mode="popLayout">
                          {outItems.map((item) => {
                            const realIdx = items.indexOf(item)
                            return (
                              <SelectedItemCard
                                key={`out-${item.product_variant_id}`}
                                item={item}
                                onRemove={() => removeItem(realIdx)}
                                onQtyChange={(qty) => updateQuantity(realIdx, qty)}
                              />
                            )
                          })}
                        </AnimatePresence>
                      </div>
                    </div>
                  )}

                  {inItems.length > 0 && (
                    <div>
                      <div className="mb-2 flex items-center gap-2">
                        <ArrowDownLeft className="size-3.5 text-emerald-500" />
                        <p className="text-[11px] font-bold uppercase tracking-[1.5px] text-emerald-500">
                          Entrada ({inItems.reduce((s, i) => s + i.quantity, 0)} uds.)
                        </p>
                      </div>
                      <div className="space-y-2">
                        <AnimatePresence mode="popLayout">
                          {inItems.map((item) => {
                            const realIdx = items.indexOf(item)
                            return (
                              <SelectedItemCard
                                key={`in-${item.product_variant_id}`}
                                item={item}
                                onRemove={() => removeItem(realIdx)}
                                onQtyChange={(qty) => updateQuantity(realIdx, qty)}
                              />
                            )
                          })}
                        </AnimatePresence>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Notes */}
            <div className="border-t border-neutral-200/60 bg-white px-6 py-3">
              <Input
                placeholder="Notas u observaciones (opcional)..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="border-neutral-200 bg-neutral-50"
              />
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="flex flex-shrink-0 items-center justify-between border-t border-neutral-200/60 bg-white px-6 py-4 sm:px-8">
          <button
            type="button"
            onClick={resetAndClose}
            disabled={isSubmitting}
            className="flex h-11 items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50 px-5 text-sm font-semibold text-neutral-600 transition-colors hover:bg-neutral-100 disabled:opacity-40"
          >
            Cancelar
          </button>

          <div className="flex items-center gap-3">
            {items.length > 0 && (
              <span className="text-sm text-neutral-500">
                {items.length} producto{items.length !== 1 ? "s" : ""} ·{" "}
                {items.reduce((s, i) => s + i.quantity, 0)} uds.
              </span>
            )}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit}
              className={cn(
                "flex h-11 items-center justify-center gap-2 rounded-xl px-8 text-sm font-bold text-white shadow-sm transition-all active:scale-[0.98] disabled:opacity-40 disabled:shadow-none",
                mode === "lending"
                  ? "bg-violet-500 hover:bg-violet-600 shadow-violet-500/20"
                  : "bg-amber-500 hover:bg-amber-600 shadow-amber-500/20"
              )}
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              {mode === "lending" ? "Crear prestamo" : "Crear intercambio"}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function SelectedItemCard({
  item,
  onRemove,
  onQtyChange,
}: {
  item: ItemEntry
  onRemove: () => void
  onQtyChange: (qty: number) => void
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="flex items-center gap-3 rounded-xl border border-neutral-200/80 bg-white p-3 shadow-sm shadow-neutral-900/[0.02]"
    >
      <div
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
          item.direction === "out" ? "bg-rose-50" : "bg-emerald-50"
        )}
      >
        <Package
          className={cn(
            "size-5",
            item.direction === "out" ? "text-rose-500" : "text-emerald-500"
          )}
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="truncate text-sm font-semibold text-neutral-800">
          {item.product_name}
        </p>
        <p className="text-xs text-neutral-400">{item.variant_label}</p>
      </div>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onQtyChange(item.quantity - 1)}
          disabled={item.quantity <= 1}
          className="flex size-7 items-center justify-center rounded-lg border border-neutral-200 text-sm font-bold text-neutral-600 hover:bg-neutral-50 disabled:opacity-30"
        >
          -
        </button>
        <span className="w-7 text-center text-sm font-bold tabular-nums">
          {item.quantity}
        </span>
        <button
          type="button"
          onClick={() => onQtyChange(item.quantity + 1)}
          className="flex size-7 items-center justify-center rounded-lg border border-neutral-200 text-sm font-bold text-neutral-600 hover:bg-neutral-50"
        >
          +
        </button>
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="rounded-lg p-2 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-rose-500"
      >
        <Trash2 className="size-4" />
      </button>
    </motion.div>
  )
}
