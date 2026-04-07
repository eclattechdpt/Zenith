import { z } from "zod"

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export const valeItemSchema = z.object({
  product_variant_id: z.string().regex(uuidPattern, "UUID invalido"),
  product_name: z.string(),
  variant_label: z.string(),
  quantity: z.number().int().positive("La cantidad debe ser positiva"),
  unit_price: z.number().min(0),
  unit_cost: z.number().min(0),
  discount: z.number().min(0).default(0),
})

export const createValeSchema = z.object({
  customer_id: z.string().regex(uuidPattern, "Se requiere un cliente para crear un vale"),
  items: z.array(valeItemSchema).min(1, "Agrega al menos un producto"),
  payment_status: z.enum(["paid", "pending"]),
  discount_amount: z.number().min(0).default(0),
  notes: z.string().max(2000).optional().nullable(),
})

export const completeValeSchema = z.object({
  vale_id: z.string().regex(uuidPattern),
})

export const cancelValeSchema = z.object({
  vale_id: z.string().regex(uuidPattern),
})

export type ValeItemInput = z.infer<typeof valeItemSchema>
export type CreateValeInput = z.infer<typeof createValeSchema>
export type CompleteValeInput = z.infer<typeof completeValeSchema>
export type CancelValeInput = z.infer<typeof cancelValeSchema>
