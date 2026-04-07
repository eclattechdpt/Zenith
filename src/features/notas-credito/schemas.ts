import { z } from "zod"

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export const creditNoteItemSchema = z.object({
  product_variant_id: z.string().regex(uuidPattern, "UUID invalido"),
  product_name: z.string(),
  variant_label: z.string(),
  quantity: z.number().int().positive("La cantidad debe ser positiva"),
  direction: z.enum(["out", "in"]),
})

export const createLendingSchema = z.object({
  customer_id: z.string().regex(uuidPattern, "Se requiere un distribuidor"),
  items: z.array(creditNoteItemSchema).min(1, "Agrega al menos un producto"),
  notes: z.string().max(2000).optional().nullable(),
})

export const createExchangeSchema = z.object({
  customer_id: z.string().regex(uuidPattern, "Se requiere un distribuidor"),
  items: z.array(creditNoteItemSchema).min(1, "Agrega al menos un producto"),
  notes: z.string().max(2000).optional().nullable(),
})

export const settleCreditNoteSchema = z.object({
  credit_note_id: z.string().regex(uuidPattern),
})

export type CreditNoteItemInput = z.infer<typeof creditNoteItemSchema>
export type CreateLendingInput = z.infer<typeof createLendingSchema>
export type CreateExchangeInput = z.infer<typeof createExchangeSchema>
export type SettleCreditNoteInput = z.infer<typeof settleCreditNoteSchema>
