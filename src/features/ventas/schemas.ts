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

export type ConvertQuoteInput = z.infer<typeof convertQuoteSchema>
export type CancelQuoteInput = z.infer<typeof cancelQuoteSchema>
