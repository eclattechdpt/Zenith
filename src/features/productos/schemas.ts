import { z } from "zod"

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const zUuid = (msg = "UUID invalido") => z.string().regex(uuidPattern, msg)

// --- CATEGORIAS ---

export const categorySchema = z.object({
  name: z.string().min(1, "El nombre es requerido").max(100),
  slug: z
    .string()
    .min(1, "El slug es requerido")
    .max(100)
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Solo letras minusculas, numeros y guiones"
    ),
  description: z.string().max(500).optional().nullable(),
  parent_id: zUuid().optional().nullable(),
  sort_order: z.coerce.number().int().default(0),
})

// --- TIPOS Y OPCIONES DE VARIANTE ---

export const variantTypeSchema = z.object({
  name: z.string().min(1, "El nombre es requerido").max(50),
  sort_order: z.coerce.number().int().default(0),
})

export const variantOptionSchema = z.object({
  variant_type_id: zUuid("Tipo de variante requerido"),
  value: z.string().min(1, "El valor es requerido").max(100),
  color_hex: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Color hex invalido")
    .optional()
    .nullable(),
  sort_order: z.coerce.number().int().default(0),
})

// --- PRODUCTOS ---

export const productSchema = z.object({
  name: z.string().min(1, "El nombre es requerido").max(200),
  slug: z
    .string()
    .min(1, "El slug es requerido")
    .max(200)
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Solo letras minusculas, numeros y guiones"
    ),
  description: z.string().max(2000).optional().nullable(),
  brand: z.string().max(100).optional().nullable(),
  category_id: zUuid("Categoria invalida").optional().nullable(),
  is_active: z.boolean().default(true),
})

export const variantSchema = z.object({
  sku: z.string().max(50).optional().nullable(),
  barcode: z.string().max(50).optional().nullable(),
  price: z.coerce.number().min(0, "El precio debe ser positivo"),
  cost: z.coerce.number().min(0, "El costo debe ser positivo"),
  stock: z.coerce.number().int().default(0),
  stock_min: z.coerce.number().int().min(0).default(0),
  is_active: z.boolean().default(true),
  expires_at: z.string().datetime().optional().nullable(),
  option_ids: z
    .array(zUuid())
    .min(1, "Selecciona al menos una opcion de variante"),
})

export const createProductSchema = productSchema.extend({
  variants: z.array(variantSchema).min(1, "Agrega al menos una variante"),
})

// --- INFERRED TYPES ---

export type CategoryInput = z.infer<typeof categorySchema>
export type VariantTypeInput = z.infer<typeof variantTypeSchema>
export type VariantOptionInput = z.infer<typeof variantOptionSchema>
export type ProductInput = z.infer<typeof productSchema>
export type VariantInput = z.infer<typeof variantSchema>
export type CreateProductInput = z.infer<typeof createProductSchema>
