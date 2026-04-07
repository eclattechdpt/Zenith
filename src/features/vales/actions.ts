"use server"

import { revalidatePath } from "next/cache"

import { createServerClient } from "@/lib/supabase/server"

import {
  createValeSchema,
  completeValeSchema,
  cancelValeSchema,
  type CreateValeInput,
  type CompleteValeInput,
  type CancelValeInput,
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
    if (msg.includes("check_stock_positive")) {
      return { error: { _form: ["Stock insuficiente para uno o mas productos."] } }
    }
    return { error: { _form: [msg] } }
  }
  return { error: { _form: [fallback] } }
}

export async function createVale(input: CreateValeInput) {
  const parsed = createValeSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  const { items, customer_id, payment_status, discount_amount, notes } = parsed.data

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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.rpc as any)("create_vale", {
    p_tenant_id: TENANT_ID,
    p_customer_id: customer_id,
    p_subtotal: subtotal,
    p_discount_amount: itemsDiscount + discount_amount,
    p_total: total,
    p_payment_status: payment_status,
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
  })

  if (error) return extractError(error, "Error al crear el vale")

  revalidatePath("/vales")
  revalidatePath("/pos")

  return { data: data as { id: string; vale_number: string; created_at: string } }
}

export async function completeVale(input: CompleteValeInput) {
  const parsed = completeValeSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  let userId: string
  try {
    userId = await requireUserId()
  } catch {
    return { error: { _form: ["Tu sesion expiro. Vuelve a iniciar sesion."] } }
  }

  const supabase = await createServerClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.rpc as any)("complete_vale", {
    p_vale_id: parsed.data.vale_id,
    p_tenant_id: TENANT_ID,
    p_created_by: userId,
  })

  if (error) return extractError(error, "Error al completar el vale")

  revalidatePath("/vales")
  revalidatePath("/inventario")
  revalidatePath("/pos")
  revalidatePath("/")

  return { data: data as { id: string; vale_number: string; completed_at: string } }
}

export async function cancelVale(input: CancelValeInput) {
  const parsed = cancelValeSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from("vales")
    .update({ status: "cancelled" })
    .eq("id", parsed.data.vale_id)
    .eq("tenant_id", TENANT_ID)
    .in("status", ["pending", "ready"])
    .is("deleted_at", null)
    .select("id, vale_number")
    .single()

  if (error || !data) {
    return { error: { _form: ["Vale no encontrado o ya fue completado"] } }
  }

  revalidatePath("/vales")

  return { data }
}
