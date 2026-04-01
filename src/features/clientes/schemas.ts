import { z } from "zod"

export const customerSchema = z.object({
  name: z.string().min(1, "El nombre es requerido").max(200),
  phone: z.string().max(20).optional().nullable(),
  email: z
    .string()
    .email("Email invalido")
    .max(200)
    .optional()
    .nullable()
    .or(z.literal("")),
  address: z.string().max(500).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
  price_list_id: z.string().uuid().optional().nullable(),
})

export const priceListSchema = z.object({
  name: z.string().min(1, "El nombre es requerido").max(100),
  description: z.string().max(500).optional().nullable(),
  discount_percent: z.coerce.number().min(0, "Minimo 0%").max(100, "Maximo 100%"),
})

export const customerPriceSchema = z.object({
  price_list_id: z.string().uuid(),
  product_variant_id: z.string().uuid(),
  price: z.coerce.number().gt(0, "El precio debe ser mayor a $0"),
})

export type CustomerInput = z.infer<typeof customerSchema>
export type PriceListInput = z.infer<typeof priceListSchema>
export type CustomerPriceInput = z.infer<typeof customerPriceSchema>
