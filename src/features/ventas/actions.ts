"use server"

import { revalidatePath } from "next/cache"

import { createServerClient } from "@/lib/supabase/server"

import {
  convertQuoteSchema,
  cancelQuoteSchema,
  createReturnSchema,
  cancelSaleSchema,
  cancelReturnSchema,
} from "./schemas"
import type {
  ConvertQuoteInput,
  CancelQuoteInput,
  CreateReturnInput,
  CancelSaleInput,
  CancelReturnInput,
} from "./schemas"

const TENANT_ID = process.env.NEXT_PUBLIC_TENANT_ID!

async function getUserId() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user?.id ?? null
}

export async function convertQuoteToSale(input: ConvertQuoteInput) {
  const parsed = convertQuoteSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  const { quote_id, payments } = parsed.data

  const supabase = await createServerClient()

  // Fetch the quote
  const { data: quote, error: quoteError } = await supabase
    .from("sales")
    .select("*")
    .eq("id", quote_id)
    .eq("status", "quote")
    .is("deleted_at", null)
    .single()

  if (quoteError || !quote) {
    return { error: { _form: ["Cotizacion no encontrada o ya fue procesada"] } }
  }

  // Check expiry
  if (quote.expires_at && new Date(quote.expires_at) < new Date()) {
    return { error: { _form: ["La cotizacion ha expirado"] } }
  }

  // Fetch quote items
  const { data: items, error: itemsError } = await supabase
    .from("sale_items")
    .select(
      "product_variant_id, product_name, variant_label, quantity, unit_price, unit_cost, discount"
    )
    .eq("sale_id", quote_id)

  if (itemsError || !items || items.length === 0) {
    return { error: { _form: ["La cotizacion no tiene productos"] } }
  }

  // Validate payments cover the total
  const paymentTotal = payments.reduce((sum, p) => sum + p.amount, 0)
  if (Number(quote.total) > 0 && payments.length === 0) {
    return { error: { _form: ["Registra al menos un pago"] } }
  }
  if (Number(quote.total) > 0 && paymentTotal < Number(quote.total)) {
    return {
      error: {
        _form: [
          `El pago ($${paymentTotal.toFixed(2)}) no cubre el total ($${Number(quote.total).toFixed(2)})`,
        ],
      },
    }
  }

  const userId = await getUserId()

  // Create the sale using the same atomic RPC
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: saleJson, error: rpcError } = await (supabase.rpc as any)(
    "create_sale_transaction",
    {
      p_tenant_id: TENANT_ID,
      p_customer_id: quote.customer_id ?? null,
      p_subtotal: Number(quote.subtotal),
      p_discount_amount: Number(quote.discount_amount),
      p_total: Number(quote.total),
      p_notes: `Convertida de cotizacion ${quote.sale_number}`,
      p_created_by: userId,
      p_items: items.map((item) => ({
        product_variant_id: item.product_variant_id,
        product_name: item.product_name,
        variant_label: item.variant_label,
        quantity: item.quantity,
        unit_price: item.unit_price,
        unit_cost: item.unit_cost,
        discount: item.discount,
      })),
      p_payments: payments.map((p) => ({
        method: p.method,
        amount: p.amount,
        reference: p.reference ?? null,
      })),
    }
  )

  if (rpcError) {
    return { error: { _form: [(rpcError as { message: string }).message] } }
  }

  // Mark original quote as cancelled (converted)
  await supabase
    .from("sales")
    .update({ status: "cancelled" })
    .eq("id", quote_id)

  const sale = saleJson as unknown as {
    id: string
    sale_number: string
    created_at: string
    [key: string]: unknown
  }

  revalidatePath("/ventas")
  revalidatePath("/pos")
  revalidatePath("/")
  revalidatePath("/inventario")

  return { data: sale }
}

export async function cancelQuote(input: CancelQuoteInput) {
  const parsed = cancelQuoteSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from("sales")
    .update({ status: "cancelled" })
    .eq("id", parsed.data.quote_id)
    .eq("status", "quote")
    .is("deleted_at", null)
    .select()
    .single()

  if (error || !data) {
    return { error: { _form: ["Cotizacion no encontrada o ya fue procesada"] } }
  }

  revalidatePath("/ventas")

  return { data }
}

export async function createReturn(input: CreateReturnInput) {
  const parsed = createReturnSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  const { sale_id, reason, items } = parsed.data

  const supabase = await createServerClient()

  // Verify the sale is returnable
  const { data: sale, error: saleError } = await supabase
    .from("sales")
    .select("id, customer_id, status")
    .eq("id", sale_id)
    .is("deleted_at", null)
    .single()

  if (saleError || !sale) {
    return { error: { _form: ["Venta no encontrada"] } }
  }

  if (sale.status !== "completed" && sale.status !== "partially_returned") {
    return {
      error: { _form: ["Solo se pueden devolver ventas completadas"] },
    }
  }

  const userId = await getUserId()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: resultJson, error: rpcError } = await (supabase.rpc as any)(
    "create_return_transaction",
    {
      p_tenant_id: TENANT_ID,
      p_sale_id: sale_id,
      p_customer_id: sale.customer_id ?? null,
      p_reason: reason ?? null,
      p_created_by: userId,
      p_items: items.map((item) => ({
        sale_item_id: item.sale_item_id,
        product_variant_id: item.product_variant_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        restock: item.restock,
        replacement_variant_id: item.replacement_variant_id ?? null,
        replacement_product_name: item.replacement_product_name ?? null,
        replacement_variant_label: item.replacement_variant_label ?? null,
      })),
    }
  )

  if (rpcError) {
    return { error: { _form: [(rpcError as { message: string }).message] } }
  }

  revalidatePath("/ventas")
  revalidatePath("/pos")
  revalidatePath("/")
  revalidatePath("/inventario")

  return {
    data: resultJson as {
      return_id: string
      return_number: string
      total_refund: number
      sale_status: string
      credit_note_number?: string
    },
  }
}

export async function cancelSale(input: CancelSaleInput) {
  const parsed = cancelSaleSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  const supabase = await createServerClient()

  // Verify sale exists and is completed
  const { data: sale, error: saleError } = await supabase
    .from("sales")
    .select("id, sale_number, status")
    .eq("id", parsed.data.sale_id)
    .is("deleted_at", null)
    .single()

  if (saleError || !sale) {
    return { error: { _form: ["Venta no encontrada"] } }
  }

  if (sale.status !== "completed") {
    return { error: { _form: ["Solo se pueden cancelar ventas completadas"] } }
  }

  // Check no returns exist
  const { count } = await supabase
    .from("returns")
    .select("id", { count: "exact", head: true })
    .eq("sale_id", parsed.data.sale_id)
    .eq("status", "completed")
    .is("deleted_at", null)

  if (count && count > 0) {
    return {
      error: {
        _form: ["No se puede cancelar una venta que tiene devoluciones"],
      },
    }
  }

  // Fetch sale items to reverse stock
  const { data: items, error: itemsError } = await supabase
    .from("sale_items")
    .select("product_variant_id, quantity, product_name")
    .eq("sale_id", parsed.data.sale_id)

  if (itemsError || !items || items.length === 0) {
    return {
      error: { _form: ["No se pudieron obtener los productos de la venta"] },
    }
  }

  const userId = await getUserId()

  // Reverse stock for each item
  for (const item of items) {
      const { data: variant } = await supabase
        .from("product_variants")
        .select("stock")
        .eq("id", item.product_variant_id)
        .single()

      if (variant) {
        const stockBefore = variant.stock
        const stockAfter = stockBefore + item.quantity

        await supabase
          .from("product_variants")
          .update({ stock: stockAfter })
          .eq("id", item.product_variant_id)

        await supabase.from("inventory_movements").insert({
          tenant_id: TENANT_ID,
          product_variant_id: item.product_variant_id,
          type: "adjustment",
          quantity: item.quantity,
          stock_before: stockBefore,
          stock_after: stockAfter,
          reason: `Cancelacion de venta ${sale.sale_number}`,
          created_by: userId,
          inventory_source: "physical",
        })
      }
    }

  // Mark sale as cancelled
  // Note: stock reversal + status update are not atomic (no RPC).
  // For MVP single-user, this is acceptable. If status update fails
  // after stock reversal, manual correction is needed.
  const { error: updateError } = await supabase
    .from("sales")
    .update({ status: "cancelled" })
    .eq("id", parsed.data.sale_id)

  if (updateError) {
    return { error: { _form: [updateError.message] } }
  }

  revalidatePath("/ventas")
  revalidatePath("/pos")
  revalidatePath("/")
  revalidatePath("/inventario")

  return { data: { success: true } }
}

export async function cancelReturn(input: CancelReturnInput) {
  const parsed = cancelReturnSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  const supabase = await createServerClient()

  // Fetch return with items
  const { data: ret, error: retError } = await supabase
    .from("returns")
    .select("id, return_number, sale_id, status, return_items(*)")
    .eq("id", parsed.data.return_id)
    .is("deleted_at", null)
    .single()

  if (retError || !ret) {
    return { error: { _form: ["Devolucion no encontrada"] } }
  }

  if (ret.status !== "completed") {
    return { error: { _form: ["Solo se pueden cancelar devoluciones completadas"] } }
  }

  const userId = await getUserId()
  const items = (ret.return_items ?? []) as Array<{
    product_variant_id: string
    quantity: number
    restock: boolean
    replacement_variant_id: string | null
  }>

  // Reverse stock movements for each return item
  for (const item of items) {
    // If it was restocked, subtract the quantity back out
    if (item.restock) {
      const { data: variant } = await supabase
        .from("product_variants")
        .select("stock")
        .eq("id", item.product_variant_id)
        .single()

      if (variant) {
        const stockBefore = variant.stock
        const stockAfter = stockBefore - item.quantity

        await supabase
          .from("product_variants")
          .update({ stock: stockAfter })
          .eq("id", item.product_variant_id)

        await supabase.from("inventory_movements").insert({
          tenant_id: TENANT_ID,
          product_variant_id: item.product_variant_id,
          type: "adjustment",
          quantity: -item.quantity,
          stock_before: stockBefore,
          stock_after: stockAfter,
          reason: `Cancelacion de devolucion ${ret.return_number}`,
          created_by: userId,
          inventory_source: "physical",
        })
      }
    }

    // If a replacement was given, add its stock back
    if (item.replacement_variant_id) {
      const { data: repVariant } = await supabase
        .from("product_variants")
        .select("stock")
        .eq("id", item.replacement_variant_id)
        .single()

      if (repVariant) {
        const stockBefore = repVariant.stock
        const stockAfter = stockBefore + item.quantity

        await supabase
          .from("product_variants")
          .update({ stock: stockAfter })
          .eq("id", item.replacement_variant_id)

        await supabase.from("inventory_movements").insert({
          tenant_id: TENANT_ID,
          product_variant_id: item.replacement_variant_id,
          type: "adjustment",
          quantity: item.quantity,
          stock_before: stockBefore,
          stock_after: stockAfter,
          reason: `Cancelacion de devolucion ${ret.return_number} (cambio revertido)`,
          created_by: userId,
          inventory_source: "physical",
        })
      }
    }
  }

  // Mark return as cancelled
  const { error: updateError } = await supabase
    .from("returns")
    .update({ status: "cancelled" })
    .eq("id", ret.id)

  if (updateError) {
    return { error: { _form: [updateError.message] } }
  }

  // Recalculate sale status based on remaining non-cancelled returns
  const { data: remainingReturns } = await supabase
    .from("returns")
    .select("return_items(quantity)")
    .eq("sale_id", ret.sale_id)
    .eq("status", "completed")
    .is("deleted_at", null)

  const { data: saleItems } = await supabase
    .from("sale_items")
    .select("quantity")
    .eq("sale_id", ret.sale_id)

  const totalSold = (saleItems ?? []).reduce((s, i) => s + i.quantity, 0)
  const totalReturned = (remainingReturns ?? []).reduce(
    (s, r) =>
      s +
      ((r.return_items as Array<{ quantity: number }>) ?? []).reduce(
        (s2, ri) => s2 + ri.quantity,
        0
      ),
    0
  )

  let newSaleStatus = "completed"
  if (totalReturned > 0 && totalReturned >= totalSold) {
    newSaleStatus = "fully_returned"
  } else if (totalReturned > 0) {
    newSaleStatus = "partially_returned"
  }

  await supabase
    .from("sales")
    .update({ status: newSaleStatus })
    .eq("id", ret.sale_id)

  revalidatePath("/ventas")
  revalidatePath("/pos")
  revalidatePath("/")
  revalidatePath("/inventario")

  return { data: { success: true, return_number: ret.return_number } }
}
