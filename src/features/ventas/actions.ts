"use server"

import { revalidatePath } from "next/cache"

import { createServerClient } from "@/lib/supabase/server"

import { convertQuoteSchema, cancelQuoteSchema } from "./schemas"
import type { ConvertQuoteInput, CancelQuoteInput } from "./schemas"

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
