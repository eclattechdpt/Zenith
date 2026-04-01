import { z } from "zod"

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export const cartItemSchema = z.object({
  product_variant_id: z.string().regex(uuidPattern, "UUID invalido"),
  product_name: z.string(),
  variant_label: z.string(),
  quantity: z.number().int().positive("La cantidad debe ser positiva"),
  unit_price: z.number().min(0),
  unit_cost: z.number().min(0),
  discount: z.number().min(0).default(0),
})

export const paymentSchema = z.object({
  method: z.enum(["cash", "card", "transfer", "credit_note", "other"]),
  amount: z.coerce.number().positive("El monto debe ser positivo"),
  reference: z.string().max(100).optional().nullable(),
})

export const createSaleSchema = z.object({
  customer_id: z.string().regex(uuidPattern, "UUID invalido").optional().nullable(),
  items: z.array(cartItemSchema).min(1, "Agrega al menos un producto"),
  payments: z.array(paymentSchema).min(1, "Registra al menos un pago"),
  discount_amount: z.number().min(0).default(0),
  notes: z.string().max(2000).optional().nullable(),
})

export const createQuoteSchema = z.object({
  customer_id: z.string().regex(uuidPattern, "UUID invalido").optional().nullable(),
  items: z.array(cartItemSchema).min(1, "Agrega al menos un producto"),
  discount_amount: z.number().min(0).default(0),
  notes: z.string().max(2000).optional().nullable(),
  expires_days: z.number().int().min(1).max(90).default(15),
})

export type CartItemInput = z.infer<typeof cartItemSchema>
export type PaymentInput = z.infer<typeof paymentSchema>
export type CreateSaleInput = z.infer<typeof createSaleSchema>
export type CreateQuoteInput = z.infer<typeof createQuoteSchema>

export const createPendingSaleSchema = z.object({
  customer_id: z.string().regex(uuidPattern).optional().nullable(),
  items: z.array(cartItemSchema).min(1),
  discount_amount: z.number().min(0).default(0),
  notes: z.string().max(2000).optional().nullable(),
})

export const completePendingSaleSchema = z.object({
  sale_id: z.string().regex(uuidPattern),
  payments: z.array(paymentSchema).min(1),
})

export type CreatePendingSaleInput = z.infer<typeof createPendingSaleSchema>
export type CompletePendingSaleInput = z.infer<typeof completePendingSaleSchema>
