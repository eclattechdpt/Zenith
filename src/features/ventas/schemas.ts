import { z } from "zod"
import { paymentSchema } from "@/features/pos/schemas"

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export const convertQuoteSchema = z.object({
  quote_id: z.string().regex(uuidPattern, "UUID invalido"),
  payments: z.array(paymentSchema),
})

export const cancelQuoteSchema = z.object({
  quote_id: z.string().regex(uuidPattern, "UUID invalido"),
})

export const returnItemSchema = z.object({
  sale_item_id: z.string().regex(uuidPattern, "UUID invalido"),
  product_variant_id: z.string().regex(uuidPattern, "UUID invalido"),
  quantity: z.number().int().positive("La cantidad debe ser positiva"),
  unit_price: z.number().positive("El precio debe ser mayor a 0"),
  restock: z.boolean().default(true),
  replacement_variant_id: z.string().regex(uuidPattern).optional().nullable(),
  replacement_product_name: z.string().optional().nullable(),
  replacement_variant_label: z.string().optional().nullable(),
})

export const createReturnSchema = z.object({
  sale_id: z.string().regex(uuidPattern, "UUID invalido"),
  reason: z.string().max(500).optional().nullable(),
  items: z
    .array(returnItemSchema)
    .min(1, "Selecciona al menos un producto a devolver"),
})

export const cancelSaleSchema = z.object({
  sale_id: z.string().regex(uuidPattern, "UUID invalido"),
})

export type ConvertQuoteInput = z.infer<typeof convertQuoteSchema>
export type CancelQuoteInput = z.infer<typeof cancelQuoteSchema>
export type ReturnItemInput = z.infer<typeof returnItemSchema>
export type CreateReturnInput = z.infer<typeof createReturnSchema>
export type CancelSaleInput = z.infer<typeof cancelSaleSchema>
