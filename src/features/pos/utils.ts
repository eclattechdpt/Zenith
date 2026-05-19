import { createClient } from "@/lib/supabase/client"

export { sortVariantsBySku } from "@/lib/utils"

/**
 * Resolves the price for a variant based on a customer's specific negotiated prices.
 *
 * Priority:
 * 1. Specific customer price (customer_prices table)
 * 2. Base variant price
 *
 * NOTA: El % de la lista de precios YA NO se aplica aquí. Ese descuento se maneja
 * a nivel del carrito (cartDiscount con source="customer") para que el usuario
 * pueda decidir si usarlo o reemplazarlo con otro descuento.
 */
export async function resolvePrice(
  variantId: string,
  basePrice: number,
  priceListId: string | null
): Promise<number> {
  if (!priceListId) return basePrice

  try {
    const supabase = createClient()
    const { data } = await supabase
      .from("customer_prices")
      .select("price")
      .eq("price_list_id", priceListId)
      .eq("product_variant_id", variantId)
      .single()

    if (data) return Number(data.price)
    return basePrice
  } catch {
    return basePrice
  }
}

/**
 * Resolves prices for multiple variants at once (batch).
 * Solo aplica precios específicos negociados — el descuento % de la lista lo
 * maneja el carrito.
 */
export async function resolvePrices(
  variants: { variantId: string; basePrice: number }[],
  priceListId: string | null
): Promise<Map<string, number>> {
  const result = new Map<string, number>()

  if (!priceListId) {
    for (const v of variants) {
      result.set(v.variantId, v.basePrice)
    }
    return result
  }

  try {
    const supabase = createClient()
    const variantIds = variants.map((v) => v.variantId)

    const { data: overrides } = await supabase
      .from("customer_prices")
      .select("product_variant_id, price")
      .eq("price_list_id", priceListId)
      .in("product_variant_id", variantIds)

    const overrideMap = new Map(
      (overrides ?? []).map((o) => [o.product_variant_id, Number(o.price)])
    )

    for (const v of variants) {
      const specific = overrideMap.get(v.variantId)
      result.set(v.variantId, specific !== undefined ? specific : v.basePrice)
    }

    return result
  } catch {
    for (const v of variants) {
      result.set(v.variantId, v.basePrice)
    }
    return result
  }
}
