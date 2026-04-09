"use server"

import { revalidatePath } from "next/cache"
import { createServerClient } from "@/lib/supabase/server"

const TENANT_ID = process.env.NEXT_PUBLIC_TENANT_ID!

// ---------------------------------------------------------------------------
// Audit logging helper
// ---------------------------------------------------------------------------

async function logDevAction(
  supabase: Awaited<ReturnType<typeof createServerClient>>,
  actionName: string,
  userId: string | null,
) {
  await supabase.from("export_logs").insert({
    tenant_id: TENANT_ID,
    report_name: `[DEV] ${actionName}`,
    format: "action",
    exported_by: userId,
  })
}

// ---------------------------------------------------------------------------
// Diagnostic queries
// ---------------------------------------------------------------------------

export async function getSupabaseHealth() {
  const supabase = await createServerClient()
  const start = Date.now()

  const { count, error } = await supabase
    .from("products")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", TENANT_ID)
    .is("deleted_at", null)

  const latencyMs = Date.now() - start

  if (error) {
    return {
      data: {
        status: "error" as const,
        latencyMs,
        projectUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? null,
        productCount: null,
        error: error.message,
      },
    }
  }

  return {
    data: {
      status: "ok" as const,
      latencyMs,
      projectUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? null,
      productCount: count ?? 0,
      error: null,
    },
  }
}

export async function getAuthInfo() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: "Not authenticated" }

  return {
    data: {
      id: user.id,
      email: user.email ?? null,
      fullName:
        (user.user_metadata?.full_name as string | undefined) ??
        (user.user_metadata?.name as string | undefined) ??
        null,
      lastSignIn: user.last_sign_in_at ?? null,
      createdAt: user.created_at,
      role: user.role ?? null,
    },
  }
}

export async function getStorageStats() {
  const supabase = await createServerClient()

  const { data: files, error } = await supabase.storage
    .from("product-images")
    .list(TENANT_ID, { limit: 1000 })

  if (error) return { error: error.message }

  const fileCount = files?.length ?? 0
  const totalBytes = files?.reduce((sum, f) => sum + (f.metadata?.size ?? 0), 0) ?? 0
  const totalMB = parseFloat((totalBytes / (1024 * 1024)).toFixed(2))

  return { data: { fileCount, totalMB } }
}

export async function getTableCounts() {
  const supabase = await createServerClient()

  async function count(table: string) {
    const { count: c, error } = await supabase
      .from(table as "products")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", TENANT_ID)
    return error ? null : (c ?? 0)
  }

  const [
    products,
    productVariants,
    customers,
    sales,
    saleItems,
    inventoryMovements,
    returns,
    creditNotes,
    transitWeeks,
  ] = await Promise.all([
    count("products"),
    count("product_variants"),
    count("customers"),
    count("sales"),
    // sale_items has no tenant_id — count via sales subquery is not straightforward,
    // so we use the raw count with a fallback approach
    supabase
      .from("sale_items")
      .select("id", { count: "exact", head: true })
      .then(({ count: c, error }) => (error ? null : (c ?? 0))),
    count("inventory_movements"),
    count("returns"),
    count("credit_notes"),
    count("transit_weeks"),
  ])

  return {
    data: {
      products,
      productVariants,
      customers,
      sales,
      saleItems,
      inventoryMovements,
      returns,
      creditNotes,
      transitWeeks,
    },
  }
}

// ---------------------------------------------------------------------------
// Destructive purge operations (development only)
// ---------------------------------------------------------------------------

function requireDevMode() {
  if (process.env.NODE_ENV === "production") {
    return { error: "Operaciones de purga deshabilitadas en produccion" }
  }
  return null
}

export async function purgeProducts() {
  const devCheck = requireDevMode()
  if (devCheck) return devCheck

  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  try {
    // FK order: initial_load_overrides → inventory_movements → product_categories
    //          → product_images → customer_prices → product_variants → products
    const steps: Array<{ table: string; hasTenantId: boolean }> = [
      { table: "initial_load_overrides", hasTenantId: true },
      { table: "inventory_movements", hasTenantId: true },
      { table: "product_categories", hasTenantId: true },
      { table: "product_images", hasTenantId: true },
      { table: "customer_prices", hasTenantId: true },
      { table: "product_variants", hasTenantId: true },
      { table: "products", hasTenantId: true },
    ]

    for (const step of steps) {
      const { error } = await supabase
        .from(step.table as "products")
        .delete()
        .eq("tenant_id", TENANT_ID)
      if (error) return { error: `Error deleting ${step.table}: ${error.message}` }
    }

    await logDevAction(supabase, "purgeProducts", user?.id ?? null)
    revalidatePath("/", "layout")
    return { data: true }
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Unknown error" }
  }
}

export async function purgeSales() {
  const devCheck = requireDevMode()
  if (devCheck) return devCheck

  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  try {
    // FK order: credit_notes → return_items → returns → sale_payments → sale_items → sales
    // return_items, sale_payments, sale_items have no tenant_id — delete via parent FK
    // We delete all rows in child tables first, scoped by parent tenant

    // 1. credit_notes (has tenant_id)
    const { error: e1 } = await supabase
      .from("credit_notes")
      .delete()
      .eq("tenant_id", TENANT_ID)
    if (e1) return { error: `Error deleting credit_notes: ${e1.message}` }

    // 2. return_items (no tenant_id — delete via return_id IN returns for this tenant)
    const { data: tenantReturns } = await supabase
      .from("returns")
      .select("id")
      .eq("tenant_id", TENANT_ID)
    if (tenantReturns && tenantReturns.length > 0) {
      const returnIds = tenantReturns.map((r) => r.id)
      const { error: e2 } = await supabase
        .from("return_items")
        .delete()
        .in("return_id", returnIds)
      if (e2) return { error: `Error deleting return_items: ${e2.message}` }
    }

    // 3. returns (has tenant_id)
    const { error: e3 } = await supabase
      .from("returns")
      .delete()
      .eq("tenant_id", TENANT_ID)
    if (e3) return { error: `Error deleting returns: ${e3.message}` }

    // 4. sale_payments + sale_items (no tenant_id — delete via sale_id IN sales for this tenant)
    const { data: tenantSales } = await supabase
      .from("sales")
      .select("id")
      .eq("tenant_id", TENANT_ID)
    if (tenantSales && tenantSales.length > 0) {
      const saleIds = tenantSales.map((s) => s.id)

      const { error: e4 } = await supabase
        .from("sale_payments")
        .delete()
        .in("sale_id", saleIds)
      if (e4) return { error: `Error deleting sale_payments: ${e4.message}` }

      const { error: e5 } = await supabase
        .from("sale_items")
        .delete()
        .in("sale_id", saleIds)
      if (e5) return { error: `Error deleting sale_items: ${e5.message}` }
    }

    // 5. sales (has tenant_id)
    const { error: e6 } = await supabase
      .from("sales")
      .delete()
      .eq("tenant_id", TENANT_ID)
    if (e6) return { error: `Error deleting sales: ${e6.message}` }

    await logDevAction(supabase, "purgeSales", user?.id ?? null)
    revalidatePath("/", "layout")
    return { data: true }
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Unknown error" }
  }
}

export async function purgeCustomers() {
  const devCheck = requireDevMode()
  if (devCheck) return devCheck

  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  try {
    // FK order: customer_prices → customers
    const { error: e1 } = await supabase
      .from("customer_prices")
      .delete()
      .eq("tenant_id", TENANT_ID)
    if (e1) return { error: `Error deleting customer_prices: ${e1.message}` }

    const { error: e2 } = await supabase
      .from("customers")
      .delete()
      .eq("tenant_id", TENANT_ID)
    if (e2) return { error: `Error deleting customers: ${e2.message}` }

    await logDevAction(supabase, "purgeCustomers", user?.id ?? null)
    revalidatePath("/", "layout")
    return { data: true }
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Unknown error" }
  }
}

export async function purgeInventory() {
  const devCheck = requireDevMode()
  if (devCheck) return devCheck

  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  try {
    // FK order: transit_week_items → transit_weeks → initial_load_overrides → inventory_movements
    // transit_week_items has no tenant_id — delete via transit_week_id IN transit_weeks for this tenant

    const { data: tenantWeeks } = await supabase
      .from("transit_weeks")
      .select("id")
      .eq("tenant_id", TENANT_ID)
    if (tenantWeeks && tenantWeeks.length > 0) {
      const weekIds = tenantWeeks.map((w) => w.id)
      const { error: e1 } = await supabase
        .from("transit_week_items")
        .delete()
        .in("transit_week_id", weekIds)
      if (e1) return { error: `Error deleting transit_week_items: ${e1.message}` }
    }

    const { error: e2 } = await supabase
      .from("transit_weeks")
      .delete()
      .eq("tenant_id", TENANT_ID)
    if (e2) return { error: `Error deleting transit_weeks: ${e2.message}` }

    const { error: e3 } = await supabase
      .from("initial_load_overrides")
      .delete()
      .eq("tenant_id", TENANT_ID)
    if (e3) return { error: `Error deleting initial_load_overrides: ${e3.message}` }

    const { error: e4 } = await supabase
      .from("inventory_movements")
      .delete()
      .eq("tenant_id", TENANT_ID)
    if (e4) return { error: `Error deleting inventory_movements: ${e4.message}` }

    await logDevAction(supabase, "purgeInventory", user?.id ?? null)
    revalidatePath("/", "layout")
    return { data: true }
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Unknown error" }
  }
}

export async function purgeAll() {
  const devCheck = requireDevMode()
  if (devCheck) return devCheck

  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  try {
    // Full reset in FK-safe order:
    // 1. credit_notes
    const { error: e1 } = await supabase
      .from("credit_notes")
      .delete()
      .eq("tenant_id", TENANT_ID)
    if (e1) return { error: `Error deleting credit_notes: ${e1.message}` }

    // 2. return_items (via returns)
    const { data: tenantReturns } = await supabase
      .from("returns")
      .select("id")
      .eq("tenant_id", TENANT_ID)
    if (tenantReturns && tenantReturns.length > 0) {
      const returnIds = tenantReturns.map((r) => r.id)
      const { error: e2 } = await supabase
        .from("return_items")
        .delete()
        .in("return_id", returnIds)
      if (e2) return { error: `Error deleting return_items: ${e2.message}` }
    }

    // 3. returns
    const { error: e3 } = await supabase
      .from("returns")
      .delete()
      .eq("tenant_id", TENANT_ID)
    if (e3) return { error: `Error deleting returns: ${e3.message}` }

    // 4. sale_payments + sale_items (via sales)
    const { data: tenantSales } = await supabase
      .from("sales")
      .select("id")
      .eq("tenant_id", TENANT_ID)
    if (tenantSales && tenantSales.length > 0) {
      const saleIds = tenantSales.map((s) => s.id)

      const { error: e4 } = await supabase
        .from("sale_payments")
        .delete()
        .in("sale_id", saleIds)
      if (e4) return { error: `Error deleting sale_payments: ${e4.message}` }

      const { error: e5 } = await supabase
        .from("sale_items")
        .delete()
        .in("sale_id", saleIds)
      if (e5) return { error: `Error deleting sale_items: ${e5.message}` }
    }

    // 5. sales
    const { error: e6 } = await supabase
      .from("sales")
      .delete()
      .eq("tenant_id", TENANT_ID)
    if (e6) return { error: `Error deleting sales: ${e6.message}` }

    // 6. transit_week_items (via transit_weeks)
    const { data: tenantWeeks } = await supabase
      .from("transit_weeks")
      .select("id")
      .eq("tenant_id", TENANT_ID)
    if (tenantWeeks && tenantWeeks.length > 0) {
      const weekIds = tenantWeeks.map((w) => w.id)
      const { error: e7 } = await supabase
        .from("transit_week_items")
        .delete()
        .in("transit_week_id", weekIds)
      if (e7) return { error: `Error deleting transit_week_items: ${e7.message}` }
    }

    // 7. transit_weeks
    const { error: e8 } = await supabase
      .from("transit_weeks")
      .delete()
      .eq("tenant_id", TENANT_ID)
    if (e8) return { error: `Error deleting transit_weeks: ${e8.message}` }

    // 8. initial_load_overrides
    const { error: e9 } = await supabase
      .from("initial_load_overrides")
      .delete()
      .eq("tenant_id", TENANT_ID)
    if (e9) return { error: `Error deleting initial_load_overrides: ${e9.message}` }

    // 9. inventory_movements
    const { error: e10 } = await supabase
      .from("inventory_movements")
      .delete()
      .eq("tenant_id", TENANT_ID)
    if (e10) return { error: `Error deleting inventory_movements: ${e10.message}` }

    // 10. customer_prices
    const { error: e11 } = await supabase
      .from("customer_prices")
      .delete()
      .eq("tenant_id", TENANT_ID)
    if (e11) return { error: `Error deleting customer_prices: ${e11.message}` }

    // 11. customers
    const { error: e12 } = await supabase
      .from("customers")
      .delete()
      .eq("tenant_id", TENANT_ID)
    if (e12) return { error: `Error deleting customers: ${e12.message}` }

    // 12. product_categories
    const { error: e13 } = await supabase
      .from("product_categories")
      .delete()
      .eq("tenant_id", TENANT_ID)
    if (e13) return { error: `Error deleting product_categories: ${e13.message}` }

    // 13. product_images
    const { error: e14 } = await supabase
      .from("product_images")
      .delete()
      .eq("tenant_id", TENANT_ID)
    if (e14) return { error: `Error deleting product_images: ${e14.message}` }

    // 14. product_variants
    const { error: e15 } = await supabase
      .from("product_variants")
      .delete()
      .eq("tenant_id", TENANT_ID)
    if (e15) return { error: `Error deleting product_variants: ${e15.message}` }

    // 15. products
    const { error: e16 } = await supabase
      .from("products")
      .delete()
      .eq("tenant_id", TENANT_ID)
    if (e16) return { error: `Error deleting products: ${e16.message}` }

    // 16. Clear export_logs for this tenant before logging
    await supabase.from("export_logs").delete().eq("tenant_id", TENANT_ID)

    // 17. Log the purgeAll action itself
    await logDevAction(supabase, "purgeAll", user?.id ?? null)
    revalidatePath("/", "layout")
    return { data: true }
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Unknown error" }
  }
}
