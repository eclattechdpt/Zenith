"use server"

// TODO: Replace mock implementations with real Supabase calls
// Each action follows the pattern: validate with Zod → mutate → revalidatePath → return { data } | { error }

import { revalidatePath } from "next/cache"

import {
  categorySchema,
  variantTypeSchema,
  variantOptionSchema,
  createProductSchema,
  type CategoryInput,
  type VariantTypeInput,
  type VariantOptionInput,
  type CreateProductInput,
} from "./schemas"

// --- CATEGORIAS ---

export async function createCategory(input: CategoryInput) {
  const parsed = categorySchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  // Mock: simulate created category
  const category = {
    id: crypto.randomUUID(),
    ...parsed.data,
    tenant_id: "817036a8-d5d3-4301-986c-451b865fbca1",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    created_by: null,
    deleted_at: null,
  }

  revalidatePath("/productos")
  return { data: category }
}

export async function updateCategory(id: string, input: CategoryInput) {
  const parsed = categorySchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  // Mock: simulate updated category
  const category = { id, ...parsed.data }

  revalidatePath("/productos")
  return { data: category }
}

export async function deleteCategory(id: string) {
  // Mock: simulate soft delete
  // Real impl: verify no active products, then SET deleted_at = now()

  revalidatePath("/productos")
  return { data: { success: true } }
}

// --- TIPOS Y OPCIONES DE VARIANTE ---

export async function createVariantType(input: VariantTypeInput) {
  const parsed = variantTypeSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  const variantType = {
    id: crypto.randomUUID(),
    ...parsed.data,
    tenant_id: "817036a8-d5d3-4301-986c-451b865fbca1",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    created_by: null,
    deleted_at: null,
  }

  revalidatePath("/configuracion")
  return { data: variantType }
}

export async function createVariantOption(input: VariantOptionInput) {
  const parsed = variantOptionSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  const variantOption = {
    id: crypto.randomUUID(),
    ...parsed.data,
    tenant_id: "817036a8-d5d3-4301-986c-451b865fbca1",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    created_by: null,
    deleted_at: null,
  }

  revalidatePath("/configuracion")
  return { data: variantOption }
}

export async function updateVariantOption(
  id: string,
  input: VariantOptionInput
) {
  const parsed = variantOptionSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  const variantOption = { id, ...parsed.data }

  return { data: variantOption }
}

export async function deleteVariantOption(id: string) {
  // Mock: simulate soft delete
  // Real impl: verify not assigned to active variants, then SET deleted_at = now()

  return { data: { success: true } }
}

// --- PRODUCTOS ---

export async function createProduct(input: CreateProductInput) {
  const parsed = createProductSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  // Mock: simulate network delay so spinner and toast are visible
  await new Promise((r) => setTimeout(r, 1000))

  const productId = crypto.randomUUID()
  const product = {
    id: productId,
    name: parsed.data.name,
    slug: parsed.data.slug,
    description: parsed.data.description ?? null,
    brand: parsed.data.brand ?? null,
    category_id: parsed.data.category_id ?? null,
    is_active: parsed.data.is_active,
    tenant_id: "817036a8-d5d3-4301-986c-451b865fbca1",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    created_by: null,
    deleted_at: null,
  }

  revalidatePath("/productos")
  return { data: product }
}

export async function updateProduct(id: string, input: CreateProductInput) {
  const parsed = createProductSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  // Mock: simulate network delay so spinner and toast are visible
  await new Promise((r) => setTimeout(r, 1000))

  const product = { id, ...parsed.data }

  revalidatePath("/productos")
  revalidatePath(`/productos/${id}`)
  return { data: product }
}

export async function deleteProduct(id: string) {
  // Mock: simulate soft delete of product + all its variants
  // Real impl: UPDATE products SET deleted_at = now() WHERE id = $id
  //            UPDATE product_variants SET deleted_at = now() WHERE product_id = $id
  await new Promise((r) => setTimeout(r, 1000))

  revalidatePath("/productos")
  return { data: { success: true } }
}
