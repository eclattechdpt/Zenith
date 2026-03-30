"use server"

import { revalidatePath } from "next/cache"

import { createServerClient } from "@/lib/supabase/server"

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

const TENANT_ID = process.env.NEXT_PUBLIC_TENANT_ID!

async function getUserId() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user?.id ?? null
}

// --- CATEGORIAS ---

export async function createCategory(input: CategoryInput) {
  const parsed = categorySchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  const supabase = await createServerClient()
  const userId = await getUserId()

  const { data, error } = await supabase
    .from("categories")
    .insert({
      ...parsed.data,
      tenant_id: TENANT_ID,
      created_by: userId,
    })
    .select()
    .single()

  if (error) return { error: { _form: [error.message] } }

  revalidatePath("/productos")
  revalidatePath("/configuracion")
  return { data }
}

export async function updateCategory(id: string, input: CategoryInput) {
  const parsed = categorySchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from("categories")
    .update(parsed.data)
    .eq("id", id)
    .is("deleted_at", null)
    .select()
    .single()

  if (error) return { error: { _form: [error.message] } }

  revalidatePath("/productos")
  revalidatePath("/configuracion")
  return { data }
}

export async function deleteCategory(id: string) {
  const supabase = await createServerClient()

  // Check for active products in this category
  const { count } = await supabase
    .from("products")
    .select("*", { count: "exact", head: true })
    .eq("category_id", id)
    .is("deleted_at", null)

  if (count && count > 0) {
    return {
      error: {
        _form: ["No se puede eliminar: tiene productos asociados"],
      },
    }
  }

  const { error } = await supabase
    .from("categories")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)

  if (error) return { error: { _form: [error.message] } }

  revalidatePath("/productos")
  revalidatePath("/configuracion")
  return { data: { success: true } }
}

// --- TIPOS Y OPCIONES DE VARIANTE ---

export async function createVariantType(input: VariantTypeInput) {
  const parsed = variantTypeSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  const supabase = await createServerClient()
  const userId = await getUserId()

  const { data, error } = await supabase
    .from("variant_types")
    .insert({
      ...parsed.data,
      tenant_id: TENANT_ID,
      created_by: userId,
    })
    .select()
    .single()

  if (error) return { error: { _form: [error.message] } }

  revalidatePath("/configuracion")
  return { data }
}

export async function createVariantOption(input: VariantOptionInput) {
  const parsed = variantOptionSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  const supabase = await createServerClient()
  const userId = await getUserId()

  const { data, error } = await supabase
    .from("variant_options")
    .insert({
      ...parsed.data,
      tenant_id: TENANT_ID,
      created_by: userId,
    })
    .select()
    .single()

  if (error) return { error: { _form: [error.message] } }

  revalidatePath("/configuracion")
  return { data }
}

export async function updateVariantOption(
  id: string,
  input: VariantOptionInput
) {
  const parsed = variantOptionSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from("variant_options")
    .update({
      value: parsed.data.value,
      color_hex: parsed.data.color_hex,
      sort_order: parsed.data.sort_order,
    })
    .eq("id", id)
    .select()
    .single()

  if (error) return { error: { _form: [error.message] } }

  revalidatePath("/configuracion")
  return { data }
}

export async function deleteVariantOption(id: string) {
  const supabase = await createServerClient()

  const { error } = await supabase
    .from("variant_options")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)

  if (error) return { error: { _form: [error.message] } }

  revalidatePath("/configuracion")
  return { data: { success: true } }
}

// --- PRODUCTOS ---

export async function createProduct(input: CreateProductInput) {
  const parsed = createProductSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  const supabase = await createServerClient()
  const userId = await getUserId()

  const isBundle = parsed.data.is_bundle

  // 1. Insert product
  const { data: product, error: productError } = await supabase
    .from("products")
    .insert({
      name: parsed.data.name,
      slug: parsed.data.slug,
      description: parsed.data.description ?? null,
      brand: parsed.data.brand ?? null,
      category_id: parsed.data.category_id ?? null,
      is_active: parsed.data.is_active,
      is_bundle: isBundle,
      tenant_id: TENANT_ID,
      created_by: userId,
    })
    .select()
    .single()

  if (productError) return { error: { _form: [productError.message] } }

  // 2a. If bundle, insert bundle items (component products)
  if (isBundle && parsed.data.bundle_items && parsed.data.bundle_items.length > 0) {
    const bundleRows = parsed.data.bundle_items.map((item) => ({
      bundle_id: product.id,
      product_variant_id: item.product_variant_id,
      quantity: item.quantity,
    }))

    const { error: bundleError } = await supabase
      .from("bundle_items")
      .insert(bundleRows)

    if (bundleError) return { error: { _form: [bundleError.message] } }
  }

  // 2b. Insert variants
  for (const variant of parsed.data.variants) {
    const { data: pv, error: pvError } = await supabase
      .from("product_variants")
      .insert({
        product_id: product.id,
        sku: variant.sku ?? null,
        price: variant.price,
        stock: variant.stock,
        tenant_id: TENANT_ID,
        created_by: userId,
      })
      .select()
      .single()

    if (pvError) return { error: { _form: [pvError.message] } }

    // 3. Create initial inventory movement if stock > 0
    if (variant.stock > 0) {
      await supabase.from("inventory_movements").insert({
        product_variant_id: pv.id,
        type: "initial",
        quantity: variant.stock,
        stock_before: 0,
        stock_after: variant.stock,
        reason: "Carga inicial",
        tenant_id: TENANT_ID,
        created_by: userId,
      })
    }
  }

  revalidatePath("/productos")
  return { data: product }
}

export async function updateProduct(id: string, input: CreateProductInput) {
  const parsed = createProductSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  const supabase = await createServerClient()

  // 1. Update product fields
  const { data, error } = await supabase
    .from("products")
    .update({
      name: parsed.data.name,
      slug: parsed.data.slug,
      description: parsed.data.description ?? null,
      brand: parsed.data.brand ?? null,
      category_id: parsed.data.category_id ?? null,
      is_active: parsed.data.is_active,
      is_bundle: parsed.data.is_bundle,
    })
    .eq("id", id)
    .is("deleted_at", null)
    .select()
    .single()

  if (error) return { error: { _form: [error.message] } }

  // 2. Get existing variants
  const { data: existingVariants } = await supabase
    .from("product_variants")
    .select("id")
    .eq("product_id", id)
    .is("deleted_at", null)

  const existingIds = (existingVariants ?? []).map((v) => v.id)

  // 3. Update or insert variants
  for (const variant of parsed.data.variants) {
    if (existingIds.length > 0) {
      // Update first existing variant, then handle extras
      const existingId = existingIds.shift()!
      await supabase
        .from("product_variants")
        .update({
          sku: variant.sku ?? null,
          price: variant.price,
          stock: variant.stock,
        })
        .eq("id", existingId)
    } else {
      // Insert new variant
      const userId = await getUserId()
      await supabase.from("product_variants").insert({
        product_id: id,
        sku: variant.sku ?? null,
        price: variant.price,
        stock: variant.stock,
        tenant_id: TENANT_ID,
        created_by: userId,
      })
    }
  }

  // 4. Soft delete any extra variants that were removed
  for (const leftoverId of existingIds) {
    await supabase
      .from("product_variants")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", leftoverId)
  }

  revalidatePath("/productos")
  revalidatePath(`/productos/${id}`)
  return { data }
}

export async function deleteProduct(id: string) {
  const supabase = await createServerClient()

  // Soft delete product
  const { error: productError } = await supabase
    .from("products")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)

  if (productError) return { error: { _form: [productError.message] } }

  // Soft delete its variants
  await supabase
    .from("product_variants")
    .update({ deleted_at: new Date().toISOString() })
    .eq("product_id", id)

  revalidatePath("/productos")
  return { data: { success: true } }
}
