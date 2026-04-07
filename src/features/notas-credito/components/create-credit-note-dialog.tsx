"use client"

import { useState } from "react"
import {
  Plus,
  Loader2,
  Search,
  Package,
  ArrowDownLeft,
  ArrowUpRight,
  Trash2,
  X,
} from "lucide-react"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

import { useCustomers } from "@/features/clientes/queries"
import { usePOSProducts } from "@/features/pos/queries"
import { useDebounce } from "@/hooks/use-debounce"
import { createLending, createExchange } from "../actions"

type CreditNoteMode = "lending" | "exchange"

interface ItemEntry {
  product_variant_id: string
  product_name: string
  variant_label: string
  quantity: number
  direction: "out" | "in"
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
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
  const debouncedCustomerSearch = useDebounce(customerSearch, 250)
  const debouncedProductSearch = useDebounce(productSearch, 250)

  const { data: customers = [] } = useCustomers({
    search: debouncedCustomerSearch || undefined,
  })
  const { data: products = [] } = usePOSProducts(debouncedProductSearch)

  const selectedCustomer = customers.find((c) => c.id === customerId)

  function addItem(
    variantId: string,
    productName: string,
    variantLabel: string
  ) {
    const existing = items.find(
      (i) => i.product_variant_id === variantId && i.direction === addDirection
    )
    if (existing) {
      setItems((prev) =>
        prev.map((i) =>
          i.product_variant_id === variantId && i.direction === addDirection
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
          direction: addDirection,
        },
      ])
    }
    setProductSearch("")
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
      toast.error(msg)
      return
    }

    toast.success(
      `${mode === "lending" ? "Prestamo" : "Intercambio"} ${result.data.credit_number} creado`
    )

    queryClient.invalidateQueries({ queryKey: ["credit-notes"] })
    queryClient.invalidateQueries({ queryKey: ["inventory"] })
    queryClient.invalidateQueries({ queryKey: ["products"] })
    queryClient.invalidateQueries({ queryKey: ["pos-products"] })

    // Reset
    setCustomerId("")
    setItems([])
    setNotes("")
    onOpenChange(false)
  }

  function handleClose() {
    setCustomerId("")
    setCustomerSearch("")
    setProductSearch("")
    setItems([])
    setNotes("")
    onOpenChange(false)
  }

  const outItems = items.filter((i) => i.direction === "out")
  const inItems = items.filter((i) => i.direction === "in")

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="size-4 text-teal-500" />
            Nueva nota de credito
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Mode tabs */}
          <div className="flex rounded-xl border border-neutral-200 bg-neutral-50 p-1">
            <button
              type="button"
              onClick={() => {
                setMode("lending")
                setItems([])
              }}
              className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${mode === "lending" ? "bg-white text-violet-700 shadow-sm" : "text-neutral-500 hover:text-neutral-700"}`}
            >
              Prestamo
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("exchange")
                setItems([])
              }}
              className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${mode === "exchange" ? "bg-white text-amber-700 shadow-sm" : "text-neutral-500 hover:text-neutral-700"}`}
            >
              Intercambio
            </button>
          </div>

          {/* Customer picker */}
          <div className="space-y-2">
            <label className="text-xs font-medium uppercase tracking-wider text-neutral-400">
              Distribuidor
            </label>
            {customerId && selectedCustomer ? (
              <div className="flex items-center justify-between rounded-xl border border-teal-200 bg-teal-50 p-3">
                <span className="font-semibold text-teal-800">
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
              <div className="space-y-1">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-neutral-400" />
                  <Input
                    placeholder="Buscar distribuidor..."
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
                {customerSearch.trim() && customers.length > 0 && (
                  <div className="max-h-32 overflow-y-auto rounded-lg border border-neutral-200 bg-white">
                    {customers.slice(0, 5).map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          setCustomerId(c.id)
                          setCustomerSearch("")
                        }}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-neutral-50"
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Product search + direction */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium uppercase tracking-wider text-neutral-400">
                Agregar productos
              </label>
              {mode === "exchange" && (
                <div className="flex rounded-lg border border-neutral-200 bg-neutral-50 p-0.5">
                  <button
                    type="button"
                    onClick={() => setAddDirection("out")}
                    className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${addDirection === "out" ? "bg-white text-rose-600 shadow-sm" : "text-neutral-500"}`}
                  >
                    <ArrowUpRight className="size-3" /> Salida
                  </button>
                  <button
                    type="button"
                    onClick={() => setAddDirection("in")}
                    className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${addDirection === "in" ? "bg-white text-emerald-600 shadow-sm" : "text-neutral-500"}`}
                  >
                    <ArrowDownLeft className="size-3" /> Entrada
                  </button>
                </div>
              )}
            </div>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-neutral-400" />
              <Input
                placeholder="Buscar producto..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            {productSearch.trim() && products.length > 0 && (
              <div className="max-h-40 overflow-y-auto rounded-lg border border-neutral-200 bg-white">
                {products.map((p) =>
                  (p.product_variants ?? [])
                    .filter((v) => v.is_active)
                    .map((v) => (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() =>
                          addItem(
                            v.id,
                            p.name,
                            v.name || p.name
                          )
                        }
                        className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-neutral-50"
                      >
                        <div>
                          <span className="font-medium">{p.name}</span>
                          {v.name && (
                            <span className="ml-1 text-neutral-400">
                              — {v.name}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-neutral-400">
                          Stock: {v.stock}
                        </span>
                      </button>
                    ))
                )}
              </div>
            )}
          </div>

          {/* Items list */}
          {items.length > 0 && (
            <div className="space-y-2">
              {outItems.length > 0 && (
                <>
                  <p className="text-xs font-medium text-rose-500">
                    Salida (prestamos / entregamos)
                  </p>
                  {outItems.map((item, idx) => {
                    const realIdx = items.indexOf(item)
                    return (
                      <ItemRow
                        key={`out-${item.product_variant_id}`}
                        item={item}
                        onRemove={() => removeItem(realIdx)}
                        onQtyChange={(qty) => updateQuantity(realIdx, qty)}
                      />
                    )
                  })}
                </>
              )}
              {inItems.length > 0 && (
                <>
                  <p className="text-xs font-medium text-emerald-500">
                    Entrada (recibimos)
                  </p>
                  {inItems.map((item) => {
                    const realIdx = items.indexOf(item)
                    return (
                      <ItemRow
                        key={`in-${item.product_variant_id}`}
                        item={item}
                        onRemove={() => removeItem(realIdx)}
                        onQtyChange={(qty) => updateQuantity(realIdx, qty)}
                      />
                    )
                  })}
                </>
              )}
            </div>
          )}

          {/* Notes */}
          <div className="space-y-1">
            <label className="text-xs font-medium uppercase tracking-wider text-neutral-400">
              Notas (opcional)
            </label>
            <Input
              placeholder="Observaciones..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              className={`flex-1 text-white ${mode === "lending" ? "bg-violet-500 hover:bg-violet-600" : "bg-amber-500 hover:bg-amber-600"}`}
              onClick={handleSubmit}
              disabled={isSubmitting || !customerId || items.length === 0}
            >
              {isSubmitting ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <Plus className="mr-2 size-4" />
              )}
              {mode === "lending" ? "Crear prestamo" : "Crear intercambio"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function ItemRow({
  item,
  onRemove,
  onQtyChange,
}: {
  item: ItemEntry
  onRemove: () => void
  onQtyChange: (qty: number) => void
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-neutral-100 bg-white p-2.5">
      <div className={`flex size-7 items-center justify-center rounded-lg ${item.direction === "out" ? "bg-rose-50" : "bg-emerald-50"}`}>
        <Package className={`size-3.5 ${item.direction === "out" ? "text-rose-500" : "text-emerald-500"}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="truncate text-sm font-medium">{item.product_name}</p>
        <p className="text-xs text-neutral-400">{item.variant_label}</p>
      </div>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onQtyChange(item.quantity - 1)}
          disabled={item.quantity <= 1}
          className="flex size-6 items-center justify-center rounded-md border border-neutral-200 text-sm font-bold text-neutral-600 hover:bg-neutral-50 disabled:opacity-30"
        >
          -
        </button>
        <span className="w-6 text-center text-sm font-semibold tabular-nums">
          {item.quantity}
        </span>
        <button
          type="button"
          onClick={() => onQtyChange(item.quantity + 1)}
          className="flex size-6 items-center justify-center rounded-md border border-neutral-200 text-sm font-bold text-neutral-600 hover:bg-neutral-50"
        >
          +
        </button>
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
      >
        <Trash2 className="size-3.5" />
      </button>
    </div>
  )
}
