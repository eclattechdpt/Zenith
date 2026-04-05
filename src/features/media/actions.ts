"use server"

import { revalidatePath } from "next/cache"

import { createServerClient } from "@/lib/supabase/server"

const TENANT_ID = process.env.NEXT_PUBLIC_TENANT_ID!
const BUCKET = "product-images"

/**
 * Updates the image_url for a product (used after client-side optimize+upload).
 */
export async function updateProductImageUrl(
  productId: string,
  imageUrl: string
) {
  const supabase = await createServerClient()

  const { error } = await supabase
    .from("products")
    .update({ image_url: imageUrl })
    .eq("id", productId)
    .eq("tenant_id", TENANT_ID)

  if (error) return { error: error.message }

  revalidatePath("/configuracion")
  revalidatePath("/productos")
  return { data: true }
}

/**
 * Lists all files in the product-images bucket for this tenant.
 * Returns storage paths.
 */
export async function listStorageFiles() {
  const supabase = await createServerClient()

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .list(TENANT_ID, { limit: 1000 })

  if (error) return { error: error.message }

  return {
    data: (data ?? []).map((f) => ({
      name: f.name,
      path: `${TENANT_ID}/${f.name}`,
      size: f.metadata?.size as number | undefined,
      createdAt: f.created_at,
    })),
  }
}

/**
 * Finds orphaned files: storage files not linked to any active product.
 */
export async function findOrphanedFiles() {
  const supabase = await createServerClient()

  // Get all storage files
  const { data: files, error: filesError } = await supabase.storage
    .from(BUCKET)
    .list(TENANT_ID, { limit: 1000 })

  if (filesError) return { error: filesError.message }

  // Get all active product image URLs
  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("id, image_url")
    .is("deleted_at", null)
    .eq("tenant_id", TENANT_ID)

  if (productsError) return { error: productsError.message }

  // Build a set of storage paths that are actively used
  const usedPaths = new Set<string>()
  for (const p of products ?? []) {
    if (p.image_url?.includes(`/storage/v1/object/public/${BUCKET}/`)) {
      const marker = `/storage/v1/object/public/${BUCKET}/`
      const idx = p.image_url.indexOf(marker)
      if (idx !== -1) {
        usedPaths.add(p.image_url.slice(idx + marker.length))
      }
    }
  }

  // Find orphans
  const orphans = (files ?? [])
    .filter((f) => !usedPaths.has(`${TENANT_ID}/${f.name}`))
    .map((f) => ({
      name: f.name,
      path: `${TENANT_ID}/${f.name}`,
      size: f.metadata?.size as number | undefined,
    }))

  return { data: orphans }
}

/**
 * Deletes specific files from storage by their paths.
 */
export async function deleteStorageFiles(paths: string[]) {
  if (paths.length === 0) return { data: 0 }

  const supabase = await createServerClient()

  const { error } = await supabase.storage
    .from(BUCKET)
    .remove(paths)

  if (error) return { error: error.message }

  return { data: paths.length }
}
