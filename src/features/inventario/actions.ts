"use server"

import { revalidatePath } from "next/cache"

import { createServerClient } from "@/lib/supabase/server"

import {
  stockAdjustmentSchema,
  stockEntrySchema,
  initialLoadOverrideSchema,
  createTransitWeekSchema,
  updateTransitWeekSchema,
  transitWeekItemSchema,
  updateTransitWeekItemSchema,
  type StockAdjustmentInput,
  type StockEntryInput,
  type InitialLoadOverrideInput,
  type CreateTransitWeekInput,
  type UpdateTransitWeekInput,
  type TransitWeekItemInput,
  type UpdateTransitWeekItemInput,
} from "./schemas"

const TENANT_ID = process.env.NEXT_PUBLIC_TENANT_ID!

async function getUserId() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user?.id ?? null
}

function revalidateInventory() {
  revalidatePath("/inventario")
  revalidatePath("/inventario/fisico")
  revalidatePath("/inventario/carga-inicial")
  revalidatePath("/")
}

// ── Physical Inventory ──

export async function adjustStock(input: StockAdjustmentInput) {
  const parsed = stockAdjustmentSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  const { product_variant_id, new_stock, reason } = parsed.data

  const supabase = await createServerClient()
  const userId = await getUserId()

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

  const { error: updateError } = await supabase
    .from("product_variants")
    .update({ stock: new_stock })
    .eq("id", product_variant_id)

  if (updateError) {
    return { error: { _form: [updateError.message] } }
  }

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
      inventory_source: "physical",
    })
    .select()
    .single()

  if (movementError) {
    return { error: { _form: [movementError.message] } }
  }

  revalidateInventory()
  return { data: { movement, new_stock } }
}

export async function addStock(input: StockEntryInput) {
  const parsed = stockEntrySchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  const { product_variant_id, quantity, reason } = parsed.data

  const supabase = await createServerClient()
  const userId = await getUserId()

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

  const { error: updateError } = await supabase
    .from("product_variants")
    .update({ stock: newStock })
    .eq("id", product_variant_id)

  if (updateError) {
    return { error: { _form: [updateError.message] } }
  }

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
      inventory_source: "physical",
    })
    .select()
    .single()

  if (movementError) {
    return { error: { _form: [movementError.message] } }
  }

  revalidateInventory()
  return { data: { movement, new_stock: newStock } }
}

// ── Initial Load Inventory ──

export async function adjustInitialStock(input: StockAdjustmentInput) {
  const parsed = stockAdjustmentSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  const { product_variant_id, new_stock, reason } = parsed.data

  const supabase = await createServerClient()
  const userId = await getUserId()

  const { data: variant, error: readError } = await supabase
    .from("product_variants")
    .select("initial_stock")
    .eq("id", product_variant_id)
    .single()

  if (readError || !variant) {
    return { error: { _form: ["No se encontró la variante"] } }
  }

  const currentStock = variant.initial_stock
  const difference = new_stock - currentStock

  if (difference === 0) {
    return { error: { _form: ["El stock nuevo es igual al actual"] } }
  }

  const { error: updateError } = await supabase
    .from("product_variants")
    .update({ initial_stock: new_stock })
    .eq("id", product_variant_id)

  if (updateError) {
    return { error: { _form: [updateError.message] } }
  }

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
      inventory_source: "initial_load",
    })
    .select()
    .single()

  if (movementError) {
    return { error: { _form: [movementError.message] } }
  }

  revalidateInventory()
  return { data: { movement, new_stock } }
}

export async function addInitialStock(input: StockEntryInput) {
  const parsed = stockEntrySchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  const { product_variant_id, quantity, reason } = parsed.data

  const supabase = await createServerClient()
  const userId = await getUserId()

  const { data: variant, error: readError } = await supabase
    .from("product_variants")
    .select("initial_stock")
    .eq("id", product_variant_id)
    .single()

  if (readError || !variant) {
    return { error: { _form: ["No se encontró la variante"] } }
  }

  const currentStock = variant.initial_stock
  const newStock = currentStock + quantity

  const { error: updateError } = await supabase
    .from("product_variants")
    .update({ initial_stock: newStock })
    .eq("id", product_variant_id)

  if (updateError) {
    return { error: { _form: [updateError.message] } }
  }

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
      inventory_source: "initial_load",
    })
    .select()
    .single()

  if (movementError) {
    return { error: { _form: [movementError.message] } }
  }

  revalidateInventory()
  return { data: { movement, new_stock: newStock } }
}

// ── Initial Load Override (name/price + stock in one action) ──

export async function upsertInitialLoadOverride(input: InitialLoadOverrideInput) {
  const parsed = initialLoadOverrideSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  const { product_variant_id, override_name, override_price, new_stock } = parsed.data

  const supabase = await createServerClient()
  const userId = await getUserId()

  // Upsert override row
  const { error: overrideError } = await supabase
    .from("initial_load_overrides")
    .upsert(
      {
        tenant_id: TENANT_ID,
        product_variant_id,
        override_name: override_name ?? null,
        override_price: override_price ?? null,
      },
      { onConflict: "tenant_id,product_variant_id" }
    )

  if (overrideError) {
    return { error: { _form: [overrideError.message] } }
  }

  // Update stock if provided
  if (new_stock !== undefined && new_stock !== null) {
    const { data: variant, error: readError } = await supabase
      .from("product_variants")
      .select("initial_stock")
      .eq("id", product_variant_id)
      .single()

    if (readError || !variant) {
      return { error: { _form: ["No se encontró la variante"] } }
    }

    if (variant.initial_stock !== new_stock) {
      const difference = new_stock - variant.initial_stock

      const { error: updateError } = await supabase
        .from("product_variants")
        .update({ initial_stock: new_stock })
        .eq("id", product_variant_id)

      if (updateError) {
        return { error: { _form: [updateError.message] } }
      }

      const { error: movementError } = await supabase
        .from("inventory_movements")
        .insert({
          tenant_id: TENANT_ID,
          product_variant_id,
          type: "adjustment",
          quantity: difference,
          stock_before: variant.initial_stock,
          stock_after: new_stock,
          reason: "Edicion de carga inicial",
          created_by: userId,
          inventory_source: "initial_load",
        })

      if (movementError) {
        return { error: { _form: [movementError.message] } }
      }
    }
  }

  revalidateInventory()
  return { data: { success: true } }
}

// ── In Transit Inventory ──

async function recalcWeekTotal(supabase: Awaited<ReturnType<typeof createServerClient>>, weekId: string) {
  const { data: items } = await supabase
    .from("transit_week_items")
    .select("line_total")
    .eq("transit_week_id", weekId)

  const total = (items ?? []).reduce((sum, i) => sum + Number(i.line_total), 0)

  await supabase
    .from("transit_weeks")
    .update({ total_value: total })
    .eq("id", weekId)
}

export async function createTransitWeek(input: CreateTransitWeekInput) {
  const parsed = createTransitWeekSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  const { year, month, week_number, label, notes } = parsed.data

  const supabase = await createServerClient()
  const userId = await getUserId()

  const { data, error } = await supabase
    .from("transit_weeks")
    .insert({
      tenant_id: TENANT_ID,
      year,
      month,
      week_number,
      label: label ?? null,
      notes: notes ?? null,
      created_by: userId,
    })
    .select()
    .single()

  if (error) {
    if (error.code === "23505") {
      return { error: { _form: [`Ya existe la semana ${week_number} del mes ${month}, año ${year}`] } }
    }
    return { error: { _form: [error.message] } }
  }

  revalidatePath("/inventario")
  revalidatePath("/inventario/transito")
  return { data }
}

export async function updateTransitWeek(input: UpdateTransitWeekInput) {
  const parsed = updateTransitWeekSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  const { id, label, notes } = parsed.data

  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from("transit_weeks")
    .update({ label: label ?? null, notes: notes ?? null })
    .eq("id", id)
    .select()
    .single()

  if (error) return { error: { _form: [error.message] } }

  revalidatePath("/inventario/transito")
  return { data }
}

export async function deleteTransitWeek(weekId: string) {
  const supabase = await createServerClient()

  const { error } = await supabase
    .from("transit_weeks")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", weekId)

  if (error) return { error: { _form: [error.message] } }

  revalidatePath("/inventario")
  revalidatePath("/inventario/transito")
  return { data: { success: true } }
}

export async function addTransitWeekItem(input: TransitWeekItemInput) {
  const parsed = transitWeekItemSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  const { transit_week_id, product_variant_id, quantity, unit_price } = parsed.data
  const line_total = quantity * unit_price

  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from("transit_week_items")
    .insert({
      transit_week_id,
      product_variant_id,
      quantity,
      unit_price,
      line_total,
    })
    .select()
    .single()

  if (error) return { error: { _form: [error.message] } }

  await recalcWeekTotal(supabase, transit_week_id)

  revalidatePath("/inventario/transito")
  return { data }
}

export async function updateTransitWeekItem(input: UpdateTransitWeekItemInput) {
  const parsed = updateTransitWeekItemSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  const { id, quantity, unit_price } = parsed.data
  const line_total = quantity * unit_price

  const supabase = await createServerClient()

  const { data: item, error: readError } = await supabase
    .from("transit_week_items")
    .select("transit_week_id")
    .eq("id", id)
    .single()

  if (readError || !item) return { error: { _form: ["No se encontró el item"] } }

  const { data, error } = await supabase
    .from("transit_week_items")
    .update({ quantity, unit_price, line_total })
    .eq("id", id)
    .select()
    .single()

  if (error) return { error: { _form: [error.message] } }

  await recalcWeekTotal(supabase, item.transit_week_id)

  revalidatePath("/inventario/transito")
  return { data }
}

export async function deleteTransitWeekItem(itemId: string) {
  const supabase = await createServerClient()

  const { data: item, error: readError } = await supabase
    .from("transit_week_items")
    .select("transit_week_id")
    .eq("id", itemId)
    .single()

  if (readError || !item) return { error: { _form: ["No se encontró el item"] } }

  const { error } = await supabase
    .from("transit_week_items")
    .delete()
    .eq("id", itemId)

  if (error) return { error: { _form: [error.message] } }

  await recalcWeekTotal(supabase, item.transit_week_id)

  revalidatePath("/inventario/transito")
  return { data: { success: true } }
}
