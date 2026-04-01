import { z } from "zod"

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export const stockAdjustmentSchema = z.object({
  product_variant_id: z.string().regex(uuidPattern, "UUID inválido"),
  new_stock: z.coerce.number().int().min(0, "El stock no puede ser negativo"),
  reason: z.string().min(1, "El motivo es requerido").max(500),
})

export const stockEntrySchema = z.object({
  product_variant_id: z.string().regex(uuidPattern, "UUID inválido"),
  quantity: z.coerce.number().int().positive("La cantidad debe ser positiva"),
  reason: z.string().max(500).optional().nullable(),
})

export type StockAdjustmentInput = z.infer<typeof stockAdjustmentSchema>
export type StockEntryInput = z.infer<typeof stockEntrySchema>
