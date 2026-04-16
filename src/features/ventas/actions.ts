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

async function requireUserId(): Promise<string> {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("NO_AUTH")
  return user.id
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

  let userId: string
  try {
    userId = await requireUserId()
  } catch {
    return { error: { _form: ["Tu sesion expiro. Vuelve a iniciar sesion."] } }
  }

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

  const { sale_id, reason, items, idempotency_key } = parsed.data

  const supabase = await createServerClient()

  // Idempotency pre-check: if the same key already created a return, return it
  if (idempotency_key) {
    const { data: existing } = await supabase
      .from("returns")
      .select("id, return_number, total_refund, sale_id, sales(status)")
      .eq("tenant_id", TENANT_ID)
      .eq("idempotency_key", idempotency_key)
      .maybeSingle()
    if (existing) {
      const saleStatus = (existing as { sales: { status: string } | null }).sales?.status ?? "completed"
      return {
        data: {
          return_id: existing.id,
          return_number: existing.return_number,
          total_refund: Number(existing.total_refund),
          sale_status: saleStatus,
        },
      }
    }
  }

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

  let userId: string
  try {
    userId = await requireUserId()
  } catch {
    return { error: { _form: ["Tu sesion expiro. Vuelve a iniciar sesion."] } }
  }

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

  const result = resultJson as {
    return_id: string
    return_number: string
    total_refund: number
    sale_status: string
    credit_note_number?: string
  }

  // Tag the return with the idempotency key so retries are deduped.
  // If a parallel request already claimed this key, the unique index will surface 23505;
  // we swallow it — our return is still valid, the parallel response simply "wins" future lookups.
  if (idempotency_key) {
    await supabase
      .from("returns")
      .update({ idempotency_key })
      .eq("id", result.return_id)
      .eq("tenant_id", TENANT_ID)
  }

  revalidatePath("/ventas")
  revalidatePath("/pos")
  revalidatePath("/")
  revalidatePath("/inventario")

  return { data: result }
}

export async function cancelSale(input: CancelSaleInput) {
  const parsed = cancelSaleSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  let userId: string
  try {
    userId = await requireUserId()
  } catch {
    return { error: { _form: ["Tu sesion expiro. Vuelve a iniciar sesion."] } }
  }

  const supabase = await createServerClient()

  // Atomic: validate sale, reverse stock (bundle-aware), mark cancelled
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: resultJson, error } = await (supabase.rpc as any)(
    "cancel_sale",
    {
      p_sale_id: parsed.data.sale_id,
      p_tenant_id: TENANT_ID,
      p_created_by: userId,
    }
  )

  if (error) {
    const msg = error.message ?? "Error al cancelar la venta"
    return { error: { _form: [msg] } }
  }

  revalidatePath("/ventas")
  revalidatePath("/pos")
  revalidatePath("/")
  revalidatePath("/inventario")

  return { data: { success: true, sale_number: (resultJson as { sale_number: string })?.sale_number } }
}

export async function cancelReturn(input: CancelReturnInput) {
  const parsed = cancelReturnSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  let userId: string
  try {
    userId = await requireUserId()
  } catch {
    return { error: { _form: ["Tu sesion expiro. Vuelve a iniciar sesion."] } }
  }

  const supabase = await createServerClient()

  // Atomic: validate return, reverse stock (restock + replacements), update sale status
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: resultJson, error } = await (supabase.rpc as any)(
    "cancel_return",
    {
      p_return_id: parsed.data.return_id,
      p_tenant_id: TENANT_ID,
      p_created_by: userId,
    }
  )

  if (error) {
    const msg = error.message ?? "Error al cancelar la devolucion"
    return { error: { _form: [msg] } }
  }

  revalidatePath("/ventas")
  revalidatePath("/pos")
  revalidatePath("/")
  revalidatePath("/inventario")

  const result = resultJson as { return_number: string; sale_status: string }
  return { data: { success: true, return_number: result?.return_number } }
}
