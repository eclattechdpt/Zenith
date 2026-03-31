import type { Tables } from "@/types/database"

export type Customer = Tables<"customers">
export type PriceList = Tables<"price_lists">

export type CustomerWithPriceList = Customer & {
  price_lists: Pick<PriceList, "id" | "name" | "discount_percent"> | null
}
