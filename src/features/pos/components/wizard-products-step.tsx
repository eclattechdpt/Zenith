"use client"

import { useCallback } from "react"
import { ArrowLeft, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/utils"
import { usePOSStore } from "../store"
import { resolvePrice } from "../utils"
import { POSProductGrid } from "./pos-product-grid"
import type { POSProductWithImage } from "../queries"

interface WizardProductsStepProps {
  onNext: () => void
  onBack: () => void
}

export function WizardProductsStep({ onNext, onBack }: WizardProductsStepProps) {
  const items = usePOSStore((s) => s.items)
  const addItem = usePOSStore((s) => s.addItem)
  const customer = usePOSStore((s) => s.customer)
  const getTotal = usePOSStore((s) => s.getTotal)
  const getItemCount = usePOSStore((s) => s.getItemCount)

  const handleAddProduct = useCallback(
    async (product: POSProductWithImage) => {
      const availableVariants = product.product_variants.filter(
        (v) => v.is_active && v.stock - v.reserved_stock > 0
      )
      if (availableVariants.length === 0) return

      const variant = availableVariants[0]
      const existingItem = items.find((i) => i.variantId === variant.id)
      const availableStock = variant.stock - variant.reserved_stock
      if (existingItem && existingItem.quantity >= availableStock) return

      let price = variant.price
      if (customer) {
        price = await resolvePrice(variant.id, variant.price, customer.priceListId, customer.discountPercent)
      }

      addItem({
        variantId: variant.id,
        productId: product.id,
        productName: product.name,
        variantLabel: variant.name ?? product.name,
        sku: variant.sku,
        unitPrice: price,
        unitCost: variant.cost,
        stock: availableStock,
      })
    },
    [addItem, customer, items]
  )

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h3 className="mb-1 text-lg font-bold text-stone-800">Agregar productos</h3>
        <p className="text-sm text-stone-500">Busca y agrega productos al carrito</p>
      </div>

      <div className="max-h-[50vh] overflow-y-auto">
        <POSProductGrid onAdd={handleAddProduct} />
      </div>

      {items.length > 0 && (
        <div className="sticky bottom-0 flex items-center justify-between rounded-xl border border-stone-200 bg-white p-3 shadow-md">
          <p className="text-sm text-stone-600">
            <span className="font-bold text-stone-800">{getItemCount()}</span> productos •{" "}
            <span className="font-bold text-rose-600">{formatCurrency(getTotal())}</span>
          </p>
          <Button onClick={onNext} className="bg-rose-600 text-white hover:bg-rose-700">
            Continuar al pago <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )}

      <Button variant="outline" onClick={onBack} className="gap-2 self-start">
        <ArrowLeft className="h-4 w-4" /> Atrás
      </Button>
    </div>
  )
}
