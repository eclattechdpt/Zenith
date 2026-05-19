import type { Tables } from "@/types/database"

export type Customer = Tables<"customers">
export type PriceList = Tables<"price_lists">
export type CustomerPrice = Tables<"customer_prices">
export type CustomerNetwork = Tables<"customer_networks">

export type CustomerWithPriceList = Customer & {
  price_lists: Pick<PriceList, "id" | "name" | "discount_percent"> | null
  customer_networks: Pick<CustomerNetwork, "id" | "name" | "color"> | null
}

export type CustomerPriceWithDetails = CustomerPrice & {
  product_variants: {
    id: string
    sku: string | null
    name: string | null
    price: number
    products: { name: string; brand: string | null } | null
  } | null
}
