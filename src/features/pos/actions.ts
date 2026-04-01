"use server"

import { revalidatePath } from "next/cache"

import { createServerClient } from "@/lib/supabase/server"

import {
  createSaleSchema,
  createQuoteSchema,
  createPendingSaleSchema,
  completePendingSaleSchema,
  type CreateSaleInput,
  type CreateQuoteInput,
  type CreatePendingSaleInput,
  type CompletePendingSaleInput,
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

function extractError(error: unknown, fallback: string): { error: { _form: string[] } } {
  if (error && typeof error === "object" && "message" in error) {
    const msg = (error as { message: string }).message
    if (msg.includes("sales_status_check")) {
      return { error: { _form: ["El estado de la venta no permite esta operacion."] } }
    }
    if (msg.includes("check_stock_positive")) {
      return { error: { _form: ["Stock insuficiente para uno o mas productos."] } }
    }
    if (msg.includes("duplicate key")) {
      return { error: { _form: ["Operacion duplicada. Intenta de nuevo."] } }
    }
    return { error: { _form: [msg] } }
  }
  return { error: { _form: [fallback] } }
}

export async function createSale(input: CreateSaleInput) {
  const parsed = createSaleSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  const { items, payments, customer_id, discount_amount, notes } = parsed.data

  // Calculate totals
  const subtotal = items.reduce(
    (sum, item) => sum + item.unit_price * item.quantity,
    0
  )
  const itemsDiscount = items.reduce((sum, item) => sum + item.discount, 0)
  const total = Math.max(0, subtotal - itemsDiscount - discount_amount)

  // Validate payments cover the total
  const paymentTotal = payments.reduce((sum, p) => sum + p.amount, 0)
  if (total > 0 && payments.length === 0) {
    return { error: { _form: ["Registra al menos un pago"] } }
  }
  if (total > 0 && paymentTotal < total) {
    return {
      error: {
        _form: [
          `El pago ($${paymentTotal.toFixed(2)}) no cubre el total ($${total.toFixed(2)})`,
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

  const supabase = await createServerClient()

  // Execute entire sale as a single atomic transaction
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: saleJson, error } = await (supabase.rpc as any)(
    "create_sale_transaction",
    {
      p_tenant_id: TENANT_ID,
      p_customer_id: customer_id ?? null,
      p_subtotal: subtotal,
      p_discount_amount: itemsDiscount + discount_amount,
      p_total: total,
      p_notes: notes ?? null,
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

  if (error) return extractError(error, "Error al crear la venta")

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

export async function createQuote(input: CreateQuoteInput) {
  const parsed = createQuoteSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  const { items, customer_id, discount_amount, notes, expires_days } =
    parsed.data

  const subtotal = items.reduce(
    (sum, item) => sum + item.unit_price * item.quantity,
    0
  )
  const itemsDiscount = items.reduce((sum, item) => sum + item.discount, 0)
  const total = Math.max(0, subtotal - itemsDiscount - discount_amount)

  let userId: string
  try {
    userId = await requireUserId()
  } catch {
    return { error: { _form: ["Tu sesion expiro. Vuelve a iniciar sesion."] } }
  }

  const supabase = await createServerClient()

  // Generate quote number with "C" prefix
  const { data: quoteNumber } = await supabase.rpc(
    "generate_sequential_number",
    {
      p_tenant_id: TENANT_ID,
      p_prefix: "C",
      p_column: "sale_number",
      p_table: "sales",
    }
  )

  if (!quoteNumber) {
    return { error: { _form: ["Error al generar numero de cotizacion"] } }
  }

  // Calculate expiry date
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + expires_days)

  // Create quote record (no stock deduction, no payments)
  const { data: quote, error: quoteError } = await supabase
    .from("sales")
    .insert({
      sale_number: quoteNumber,
      tenant_id: TENANT_ID,
      customer_id: customer_id ?? null,
      subtotal,
      discount_amount: itemsDiscount + discount_amount,
      total,
      status: "quote",
      notes: notes ?? null,
      expires_at: expiresAt.toISOString(),
      created_by: userId,
    })
    .select()
    .single()

  if (quoteError) return extractError(quoteError, "Error al crear la cotizacion")

  // Create sale items (snapshot only, no stock changes)
  for (const item of items) {
    const lineTotal = Math.max(0, item.unit_price * item.quantity - item.discount)

    const { error: itemError } = await supabase.from("sale_items").insert({
      sale_id: quote.id,
      product_variant_id: item.product_variant_id,
      product_name: item.product_name,
      variant_label: item.variant_label,
      quantity: item.quantity,
      unit_price: item.unit_price,
      unit_cost: item.unit_cost,
      discount: item.discount,
      line_total: lineTotal,
    })

    if (itemError) {
      return { error: { _form: [`Error en item: ${itemError.message}`] } }
    }
  }

  revalidatePath("/ventas")
  revalidatePath("/pos")

  return { data: quote }
}

export async function createPendingSale(input: CreatePendingSaleInput) {
  const parsed = createPendingSaleSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  let userId: string
  try {
    userId = await requireUserId()
  } catch {
    return { error: { _form: ["Tu sesion expiro. Vuelve a iniciar sesion."] } }
  }

  const supabase = await createServerClient()

  const items = parsed.data.items
  const subtotal = items.reduce(
    (sum, i) => sum + i.unit_price * i.quantity,
    0
  )
  const itemsDiscount = items.reduce((sum, i) => sum + i.discount, 0)
  const total = Math.max(
    subtotal - itemsDiscount - parsed.data.discount_amount,
    0
  )

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.rpc as any)("create_pending_sale", {
    p_tenant_id: TENANT_ID,
    p_customer_id: parsed.data.customer_id ?? null,
    p_subtotal: subtotal,
    p_discount_amount: parsed.data.discount_amount + itemsDiscount,
    p_total: total,
    p_notes: parsed.data.notes ?? null,
    p_created_by: userId,
    p_items: items.map((i) => ({
      product_variant_id: i.product_variant_id,
      product_name: i.product_name,
      variant_label: i.variant_label,
      quantity: i.quantity,
      unit_price: i.unit_price,
      unit_cost: i.unit_cost,
      discount: i.discount,
    })),
  })

  if (error) return extractError(error, "Error al guardar venta pendiente")

  revalidatePath("/pos")
  revalidatePath("/ventas")
  return { data: data as { id: string; sale_number: string; created_at: string } }
}

export async function completePendingSale(input: CompletePendingSaleInput) {
  const parsed = completePendingSaleSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  let userId: string
  try {
    userId = await requireUserId()
  } catch {
    return { error: { _form: ["Tu sesion expiro. Vuelve a iniciar sesion."] } }
  }

  const supabase = await createServerClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.rpc as any)("complete_pending_sale", {
    p_sale_id: parsed.data.sale_id,
    p_tenant_id: TENANT_ID,
    p_payments: parsed.data.payments.map((p) => ({
      method: p.method,
      amount: p.amount,
      reference: p.reference ?? null,
    })),
    p_created_by: userId,
  })

  if (error) return extractError(error, "Error al completar venta pendiente")

  revalidatePath("/pos")
  revalidatePath("/ventas")
  revalidatePath("/")
  revalidatePath("/inventario")
  return { data: data as { id: string; sale_number: string; completed_at: string } }
}

export async function cancelPendingSale(saleId: string) {
  let userId: string
  try {
    userId = await requireUserId()
  } catch {
    return { error: { _form: ["Tu sesion expiro. Vuelve a iniciar sesion."] } }
  }

  // userId available for future audit logging
  void userId

  const supabase = await createServerClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.rpc as any)("cancel_pending_sale", {
    p_sale_id: saleId,
    p_tenant_id: TENANT_ID,
  })

  if (error) return extractError(error, "Error al cancelar venta pendiente")

  revalidatePath("/pos")
  revalidatePath("/ventas")
  return { data: data as { id: string; sale_number: string; cancelled_at: string } }
}
