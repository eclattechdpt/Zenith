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
  image_url: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? null : v),
    z.string().max(2000).nullable().optional()
  ),
  category_ids: z.array(zUuid("Categoria invalida")).optional().default([]),
  is_active: z.boolean().default(true),
})

export const variantSchema = z.object({
  name: z.string().max(100).optional().nullable(),
  sku: z.string().max(50).optional().nullable(),
  price: z.coerce.number().gt(0, "El precio debe ser mayor a $0"),
  stock: z.coerce.number().int().default(0),
  is_active: z.boolean().default(true),
})

// --- BUNDLES (COFRES) ---

export const bundleItemSchema = z.object({
  product_variant_id: zUuid("Selecciona una variante"),
  quantity: z.coerce.number().int().min(1, "Minimo 1 unidad"),
})

export const createProductSchema = productSchema.extend({
  has_variants: z.boolean().default(false),
  is_bundle: z.boolean().default(false),
  variants: z.array(variantSchema),
  bundle_items: z.array(bundleItemSchema).optional(),
}).refine(
  (data) => {
    if (data.is_bundle) {
      return (data.bundle_items?.length ?? 0) >= 1 && data.variants.length >= 1
    }
    return data.variants.length >= 1
  },
  {
    message: "Agrega al menos una variante o un producto al cofre",
    path: ["variants"],
  }
)

// --- INFERRED TYPES ---

export type CategoryInput = z.infer<typeof categorySchema>
export type VariantTypeInput = z.infer<typeof variantTypeSchema>
export type VariantOptionInput = z.infer<typeof variantOptionSchema>
export type ProductInput = z.infer<typeof productSchema>
export type VariantInput = z.infer<typeof variantSchema>
export type BundleItemInput = z.infer<typeof bundleItemSchema>
export type CreateProductInput = z.infer<typeof createProductSchema>
