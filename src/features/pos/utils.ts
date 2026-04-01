import { createClient } from "@/lib/supabase/client"

/**
 * Resolves the price for a variant based on a customer's price list.
 *
 * Priority:
 * 1. Specific customer price (customer_prices table)
 * 2. Price list discount % applied to base price
 * 3. Base variant price
 */
export async function resolvePrice(
  variantId: string,
  basePrice: number,
  priceListId: string | null,
  discountPercent: number
): Promise<number> {
  if (!priceListId) return basePrice

  // Check for a specific price override
  const supabase = createClient()
  const { data } = await supabase
    .from("customer_prices")
    .select("price")
    .eq("price_list_id", priceListId)
    .eq("product_variant_id", variantId)
    .single()

  if (data) return Number(data.price)

  // Apply list discount
  if (discountPercent > 0) {
    return Math.round(basePrice * (1 - discountPercent / 100) * 100) / 100
  }

  return basePrice
}

/**
 * Resolves prices for multiple variants at once (batch).
 * More efficient than calling resolvePrice one by one.
 */
export async function resolvePrices(
  variants: { variantId: string; basePrice: number }[],
  priceListId: string | null,
  discountPercent: number
): Promise<Map<string, number>> {
  const result = new Map<string, number>()

  if (!priceListId) {
    for (const v of variants) {
      result.set(v.variantId, v.basePrice)
    }
    return result
  }

  // Fetch all specific prices for this price list + these variants in one query
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
    if (specific !== undefined) {
      result.set(v.variantId, specific)
    } else if (discountPercent > 0) {
      result.set(
        v.variantId,
        Math.round(v.basePrice * (1 - discountPercent / 100) * 100) / 100
      )
    } else {
      result.set(v.variantId, v.basePrice)
    }
  }

  return result
}
