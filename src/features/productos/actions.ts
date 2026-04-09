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

async function requireUserId(): Promise<
  { userId: string; error?: never } | { userId?: never; error: { _form: string[] } }
> {
  const id = await getUserId()
  if (!id) return { error: { _form: ["Tu sesion expiro. Vuelve a iniciar sesion."] } }
  return { userId: id }
}

// --- CATEGORIAS ---

export async function createCategory(input: CategoryInput) {
  const parsed = categorySchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  const auth = await requireUserId()
  if (auth.error) return { error: auth.error }

  const supabase = await createServerClient()
  const userId = auth.userId

  const { data, error } = await supabase
    .from("categories")
    .insert({
      ...parsed.data,
      tenant_id: TENANT_ID,
      created_by: userId,
    })
    .select()
    .single()

  if (error) {
    const msg = error.message.includes("categories_tenant_id_slug_parent_id_key")
      ? `Ya existe una categoria con el nombre "${parsed.data.name}" en este nivel`
      : error.message
    return { error: { _form: [msg] } }
  }

  revalidatePath("/productos")
  revalidatePath("/configuracion")
  return { data }
}

export async function updateCategory(id: string, input: CategoryInput) {
  const parsed = categorySchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  const auth = await requireUserId()
  if (auth.error) return { error: auth.error }

  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from("categories")
    .update(parsed.data)
    .eq("id", id)
    .is("deleted_at", null)
    .select()
    .single()

  if (error) {
    const msg = error.message.includes("categories_tenant_id_slug_parent_id_key")
      ? `Ya existe una categoria con el nombre "${parsed.data.name}" en este nivel`
      : error.message
    return { error: { _form: [msg] } }
  }

  revalidatePath("/productos")
  revalidatePath("/configuracion")
  return { data }
}

export async function deleteCategory(id: string) {
  const auth = await requireUserId()
  if (auth.error) return { error: auth.error }

  const supabase = await createServerClient()

  // Check for active subcategories
  const { count: childCount } = await supabase
    .from("categories")
    .select("*", { count: "exact", head: true })
    .eq("parent_id", id)
    .is("deleted_at", null)

  if (childCount && childCount > 0) {
    return {
      error: {
        _form: ["No se puede eliminar: tiene subcategorias activas"],
      },
    }
  }

  // Check for active products in this category (via junction table)
  const { count } = await supabase
    .from("product_categories")
    .select("*, products!inner(id)", { count: "exact", head: true })
    .eq("category_id", id)
    .is("products.deleted_at", null)

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

// --- PRODUCT ↔ CATEGORY ASSIGNMENTS ---

export async function assignProductToCategory(productId: string, categoryId: string) {
  const auth = await requireUserId()
  if (auth.error) return { error: auth.error }

  const supabase = await createServerClient()

  // Validate: only leaf categories (no children) can have products
  const { count: childCount } = await supabase
    .from("categories")
    .select("*", { count: "exact", head: true })
    .eq("parent_id", categoryId)
    .is("deleted_at", null)

  if (childCount && childCount > 0) {
    return { error: { _form: ["Solo se pueden asignar productos a subcategorias (categorias sin hijos)"] } }
  }

  // Check if already assigned
  const { count } = await supabase
    .from("product_categories")
    .select("*", { count: "exact", head: true })
    .eq("product_id", productId)
    .eq("category_id", categoryId)

  if (count && count > 0) {
    return { error: { _form: ["El producto ya pertenece a esta categoria"] } }
  }

  const { error } = await supabase
    .from("product_categories")
    .insert({ product_id: productId, category_id: categoryId, tenant_id: TENANT_ID })

  if (error) return { error: { _form: [error.message] } }

  revalidatePath("/productos")
  revalidatePath("/configuracion")
  return { data: { success: true } }
}

export async function removeProductFromCategory(productId: string, categoryId: string) {
  const auth = await requireUserId()
  if (auth.error) return { error: auth.error }

  const supabase = await createServerClient()

  const { error } = await supabase
    .from("product_categories")
    .delete()
    .eq("product_id", productId)
    .eq("category_id", categoryId)

  if (error) return { error: { _form: [error.message] } }

  revalidatePath("/productos")
  revalidatePath("/configuracion")
  return { data: { success: true } }
}

export async function reorderCategories(
  items: { id: string; sort_order: number }[]
) {
  const auth = await requireUserId()
  if (auth.error) return { error: auth.error }

  const supabase = await createServerClient()

  for (const item of items) {
    const { error } = await supabase
      .from("categories")
      .update({ sort_order: item.sort_order })
      .eq("id", item.id)

    if (error) return { error: { _form: [error.message] } }
  }

  revalidatePath("/productos")
  revalidatePath("/configuracion")
  return { data: { success: true } }
}

// --- TIPOS Y OPCIONES DE VARIANTE ---

export async function createVariantType(input: VariantTypeInput) {
  const parsed = variantTypeSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  const auth = await requireUserId()
  if (auth.error) return { error: auth.error }

  const supabase = await createServerClient()
  const userId = auth.userId

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

  const auth = await requireUserId()
  if (auth.error) return { error: auth.error }

  const supabase = await createServerClient()
  const userId = auth.userId

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

  const auth = await requireUserId()
  if (auth.error) return { error: auth.error }

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
  const auth = await requireUserId()
  if (auth.error) return { error: auth.error }

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

  const auth = await requireUserId()
  if (auth.error) return { error: auth.error }

  const supabase = await createServerClient()
  const userId = auth.userId

  const isBundle = parsed.data.is_bundle

  // 1. Validate duplicate SKUs within the form itself
  const skus = parsed.data.variants
    .map((v) => v.sku)
    .filter((s): s is string => !!s)
  const uniqueSkus = new Set(skus)
  if (uniqueSkus.size < skus.length) {
    const dupes = skus.filter((s, i) => skus.indexOf(s) !== i)
    return { error: { _form: [`Codigo duplicado en las variantes: "${dupes[0]}"`] } }
  }

  // 2. Validate SKUs don't already exist in the database
  if (uniqueSkus.size > 0) {
    const { data: existing } = await supabase
      .from("product_variants")
      .select("sku")
      .eq("tenant_id", TENANT_ID)
      .is("deleted_at", null)
      .in("sku", [...uniqueSkus])

    if (existing && existing.length > 0) {
      return { error: { _form: [`El codigo "${existing[0].sku}" ya esta en uso por otra variante`] } }
    }
  }

  // 3. Insert product
  const { data: product, error: productError } = await supabase
    .from("products")
    .insert({
      name: parsed.data.name,
      slug: parsed.data.slug,
      description: parsed.data.description ?? null,
      brand: parsed.data.brand ?? null,
      image_url: parsed.data.image_url ?? null,
      is_active: parsed.data.is_active,
      has_variants: parsed.data.has_variants,
      is_bundle: isBundle,
      tenant_id: TENANT_ID,
      created_by: userId,
    })
    .select()
    .single()

  if (productError) {
    const msg = productError.message.includes("products_tenant_id_slug_key")
      ? `Ya existe un producto con el slug "${parsed.data.slug}"`
      : productError.message
    return { error: { _form: [msg] } }
  }

  // 4. Insert category associations (junction table)
  const categoryIds = parsed.data.category_ids ?? []
  if (categoryIds.length > 0) {
    const catRows = categoryIds.map((catId) => ({
      product_id: product.id,
      category_id: catId,
      tenant_id: TENANT_ID,
    }))
    const { error: catError } = await supabase
      .from("product_categories")
      .insert(catRows)

    if (catError) {
      await supabase.from("products").delete().eq("id", product.id)
      return { error: { _form: [catError.message] } }
    }
  }

  // 5. If bundle, insert bundle items
  if (isBundle && parsed.data.bundle_items && parsed.data.bundle_items.length > 0) {
    const bundleRows = parsed.data.bundle_items.map((item) => ({
      bundle_id: product.id,
      product_variant_id: item.product_variant_id,
      quantity: 1,
    }))

    const { error: bundleError } = await supabase
      .from("bundle_items")
      .insert(bundleRows)

    if (bundleError) {
      // Rollback: delete the product
      await supabase.from("products").delete().eq("id", product.id)
      return { error: { _form: [bundleError.message] } }
    }
  }

  // 5. Insert all variants (bundles get stock=0 since stock is derived from components)
  const variantRows = parsed.data.variants.map((v) => ({
    product_id: product.id,
    name: v.name ?? null,
    sku: v.sku ?? null,
    price: v.price,
    stock: isBundle ? 0 : v.stock,
    is_active: v.is_active ?? true,
    tenant_id: TENANT_ID,
    created_by: userId,
  }))

  const { data: insertedVariants, error: variantsError } = await supabase
    .from("product_variants")
    .insert(variantRows)
    .select()

  if (variantsError) {
    // Rollback: delete the product
    await supabase.from("products").delete().eq("id", product.id)
    const msg = variantsError.message.includes("product_variants_tenant_id_sku_key")
      ? `El codigo ya esta en uso por otra variante`
      : variantsError.message
    return { error: { _form: [msg] } }
  }

  // 6. Create initial inventory movements for variants with stock > 0
  const movements = (insertedVariants ?? [])
    .map((pv, i) => {
      const stock = parsed.data.variants[i].stock
      if (stock <= 0) return null
      return {
        product_variant_id: pv.id,
        type: "initial" as const,
        quantity: stock,
        stock_before: 0,
        stock_after: stock,
        reason: "Carga inicial",
        tenant_id: TENANT_ID,
        created_by: userId,
      }
    })
    .filter((m): m is NonNullable<typeof m> => m !== null)

  if (movements.length > 0) {
    await supabase.from("inventory_movements").insert(movements)
  }

  revalidatePath("/productos")
  return { data: product }
}

export async function updateProduct(id: string, input: CreateProductInput) {
  const parsed = createProductSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  const auth = await requireUserId()
  if (auth.error) return { error: auth.error }

  const supabase = await createServerClient()

  // 1. Validate duplicate SKUs within the form
  const skus = parsed.data.variants
    .map((v) => v.sku)
    .filter((s): s is string => !!s)
  const uniqueSkus = new Set(skus)
  if (uniqueSkus.size < skus.length) {
    const dupes = skus.filter((s, i) => skus.indexOf(s) !== i)
    return { error: { _form: [`Codigo duplicado en las variantes: "${dupes[0]}"`] } }
  }

  // 2. Validate SKUs don't exist on OTHER products
  if (uniqueSkus.size > 0) {
    const { data: existing } = await supabase
      .from("product_variants")
      .select("sku")
      .eq("tenant_id", TENANT_ID)
      .is("deleted_at", null)
      .neq("product_id", id)
      .in("sku", [...uniqueSkus])

    if (existing && existing.length > 0) {
      return { error: { _form: [`El codigo "${existing[0].sku}" ya esta en uso por otro producto`] } }
    }
  }

  // 3. Update product fields
  const { data, error } = await supabase
    .from("products")
    .update({
      name: parsed.data.name,
      slug: parsed.data.slug,
      description: parsed.data.description ?? null,
      brand: parsed.data.brand ?? null,
      image_url: parsed.data.image_url ?? null,
      is_active: parsed.data.is_active,
      has_variants: parsed.data.has_variants,
      is_bundle: parsed.data.is_bundle,
    })
    .eq("id", id)
    .is("deleted_at", null)
    .select()
    .single()

  if (error) return { error: { _form: [error.message] } }

  // 4. Sync category associations (delete + re-insert)
  await supabase.from("product_categories").delete().eq("product_id", id)
  const categoryIds = parsed.data.category_ids ?? []
  if (categoryIds.length > 0) {
    await supabase.from("product_categories").insert(
      categoryIds.map((catId) => ({
        product_id: id,
        category_id: catId,
        tenant_id: TENANT_ID,
      }))
    )
  }

  // 4b. Sync bundle items (delete + re-insert)
  if (parsed.data.is_bundle) {
    await supabase.from("bundle_items").delete().eq("bundle_id", id)
    const bundleItems = parsed.data.bundle_items ?? []
    if (bundleItems.length > 0) {
      await supabase.from("bundle_items").insert(
        bundleItems.map((item) => ({
          bundle_id: id,
          product_variant_id: item.product_variant_id,
          quantity: 1,
        }))
      )
    }
  }

  // 5. Get existing variants
  const { data: existingVariants } = await supabase
    .from("product_variants")
    .select("id")
    .eq("product_id", id)
    .is("deleted_at", null)

  const existingIds = (existingVariants ?? []).map((v) => v.id)

  // 5. Update or insert variants (bundles always have stock=0, derived from components)
  const isBundleProduct = parsed.data.is_bundle
  for (const variant of parsed.data.variants) {
    if (existingIds.length > 0) {
      const existingId = existingIds.shift()!
      const { error: updateErr } = await supabase
        .from("product_variants")
        .update({
          name: variant.name ?? null,
          sku: variant.sku ?? null,
          price: variant.price,
          stock: isBundleProduct ? 0 : variant.stock,
          is_active: variant.is_active ?? true,
        })
        .eq("id", existingId)

      if (updateErr) return { error: { _form: [updateErr.message] } }
    } else {
      const { error: insertErr } = await supabase.from("product_variants").insert({
        product_id: id,
        name: variant.name ?? null,
        sku: variant.sku ?? null,
        price: variant.price,
        stock: isBundleProduct ? 0 : variant.stock,
        is_active: variant.is_active ?? true,
        tenant_id: TENANT_ID,
        created_by: auth.userId,
      })

      if (insertErr) return { error: { _form: [insertErr.message] } }
    }
  }

  // 6. Soft delete any extra variants that were removed
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
  const auth = await requireUserId()
  if (auth.error) return { error: auth.error }

  const supabase = await createServerClient()

  // Check if any variant of this product is used as a bundle component
  const { data: variantIds } = await supabase
    .from("product_variants")
    .select("id")
    .eq("product_id", id)
    .is("deleted_at", null)

  if (variantIds && variantIds.length > 0) {
    const ids = variantIds.map((v) => v.id)
    const { count: bundleCount } = await supabase
      .from("bundle_items")
      .select("*", { count: "exact", head: true })
      .in("product_variant_id", ids)

    if (bundleCount && bundleCount > 0) {
      return {
        error: {
          _form: ["No se puede eliminar: este producto es componente de un cofre"],
        },
      }
    }
  }

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

  // Clean up category assignments so counts stay accurate
  await supabase
    .from("product_categories")
    .delete()
    .eq("product_id", id)

  revalidatePath("/productos")
  revalidatePath("/configuracion")
  return { data: { success: true } }
}
