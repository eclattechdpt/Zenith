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

// ── Transit week schemas ──

export const createTransitWeekSchema = z.object({
  year: z.coerce.number().int().min(2020).max(2099),
  week_number: z.coerce.number().int().min(1).max(53),
  label: z.string().max(100).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
})

export const updateTransitWeekSchema = z.object({
  id: z.string().regex(uuidPattern, "UUID inválido"),
  label: z.string().max(100).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
})

export const transitWeekItemSchema = z.object({
  transit_week_id: z.string().regex(uuidPattern, "UUID inválido"),
  product_variant_id: z.string().regex(uuidPattern, "UUID inválido"),
  quantity: z.coerce.number().int().positive("La cantidad debe ser positiva"),
  unit_price: z.coerce.number().min(0, "El precio no puede ser negativo"),
})

export const updateTransitWeekItemSchema = z.object({
  id: z.string().regex(uuidPattern, "UUID inválido"),
  quantity: z.coerce.number().int().positive("La cantidad debe ser positiva"),
  unit_price: z.coerce.number().min(0, "El precio no puede ser negativo"),
})

export type CreateTransitWeekInput = z.infer<typeof createTransitWeekSchema>
export type UpdateTransitWeekInput = z.infer<typeof updateTransitWeekSchema>
export type TransitWeekItemInput = z.infer<typeof transitWeekItemSchema>
export type UpdateTransitWeekItemInput = z.infer<typeof updateTransitWeekItemSchema>
