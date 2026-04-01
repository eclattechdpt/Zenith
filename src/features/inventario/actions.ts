"use server"

import { revalidatePath } from "next/cache"

import { createServerClient } from "@/lib/supabase/server"

import {
  stockAdjustmentSchema,
  stockEntrySchema,
  type StockAdjustmentInput,
  type StockEntryInput,
} from "./schemas"

const TENANT_ID = process.env.NEXT_PUBLIC_TENANT_ID!

async function getUserId() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user?.id ?? null
}

export async function adjustStock(input: StockAdjustmentInput) {
  const parsed = stockAdjustmentSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  const { product_variant_id, new_stock, reason } = parsed.data

  const supabase = await createServerClient()
  const userId = await getUserId()

  // Read current stock
  const { data: variant, error: readError } = await supabase
    .from("product_variants")
    .select("stock")
    .eq("id", product_variant_id)
    .single()

  if (readError || !variant) {
    return { error: { _form: ["No se encontró la variante"] } }
  }

  const currentStock = variant.stock
  const difference = new_stock - currentStock

  if (difference === 0) {
    return { error: { _form: ["El stock nuevo es igual al actual"] } }
  }

  // Update stock
  const { error: updateError } = await supabase
    .from("product_variants")
    .update({ stock: new_stock })
    .eq("id", product_variant_id)

  if (updateError) {
    return { error: { _form: [updateError.message] } }
  }

  // Create movement record
  const { data: movement, error: movementError } = await supabase
    .from("inventory_movements")
    .insert({
      tenant_id: TENANT_ID,
      product_variant_id,
      type: "adjustment",
      quantity: difference,
      stock_before: currentStock,
      stock_after: new_stock,
      reason,
      created_by: userId,
    })
    .select()
    .single()

  if (movementError) {
    return { error: { _form: [movementError.message] } }
  }

  revalidatePath("/inventario")
  revalidatePath("/")
  return { data: { movement, new_stock } }
}

export async function addStock(input: StockEntryInput) {
  const parsed = stockEntrySchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  const { product_variant_id, quantity, reason } = parsed.data

  const supabase = await createServerClient()
  const userId = await getUserId()

  // Read current stock
  const { data: variant, error: readError } = await supabase
    .from("product_variants")
    .select("stock")
    .eq("id", product_variant_id)
    .single()

  if (readError || !variant) {
    return { error: { _form: ["No se encontró la variante"] } }
  }

  const currentStock = variant.stock
  const newStock = currentStock + quantity

  // Update stock
  const { error: updateError } = await supabase
    .from("product_variants")
    .update({ stock: newStock })
    .eq("id", product_variant_id)

  if (updateError) {
    return { error: { _form: [updateError.message] } }
  }

  // Create movement record
  const { data: movement, error: movementError } = await supabase
    .from("inventory_movements")
    .insert({
      tenant_id: TENANT_ID,
      product_variant_id,
      type: "purchase",
      quantity,
      stock_before: currentStock,
      stock_after: newStock,
      reason: reason ?? null,
      created_by: userId,
    })
    .select()
    .single()

  if (movementError) {
    return { error: { _form: [movementError.message] } }
  }

  revalidatePath("/inventario")
  revalidatePath("/")
  return { data: { movement, new_stock: newStock } }
}
