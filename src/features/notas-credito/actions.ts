"use server"

import { revalidatePath } from "next/cache"

import { createServerClient } from "@/lib/supabase/server"

import {
  createLendingSchema,
  createExchangeSchema,
  settleCreditNoteSchema,
  type CreateLendingInput,
  type CreateExchangeInput,
  type SettleCreditNoteInput,
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
    return { error: { _form: [(error as { message: string }).message] } }
  }
  return { error: { _form: [fallback] } }
}

export async function createLending(input: CreateLendingInput) {
  const parsed = createLendingSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  let userId: string
  try {
    userId = await requireUserId()
  } catch {
    return { error: { _form: ["Tu sesion expiro. Vuelve a iniciar sesion."] } }
  }

  const supabase = await createServerClient()

  // All items in a lending are 'out' (we lend our products)
  const items = parsed.data.items.map((item) => ({
    ...item,
    direction: "out" as const,
  }))

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.rpc as any)("create_distributor_credit_note", {
    p_tenant_id: TENANT_ID,
    p_customer_id: parsed.data.customer_id,
    p_credit_type: "lending",
    p_notes: parsed.data.notes ?? null,
    p_created_by: userId,
    p_items: items,
  })

  if (error) return extractError(error, "Error al crear el prestamo")

  revalidatePath("/notas-credito")
  revalidatePath("/inventario")

  return { data: data as { id: string; credit_number: string; created_at: string } }
}

export async function createExchange(input: CreateExchangeInput) {
  const parsed = createExchangeSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  let userId: string
  try {
    userId = await requireUserId()
  } catch {
    return { error: { _form: ["Tu sesion expiro. Vuelve a iniciar sesion."] } }
  }

  const supabase = await createServerClient()

  // Items already have direction ('out' for what we give, 'in' for what we receive)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.rpc as any)("create_distributor_credit_note", {
    p_tenant_id: TENANT_ID,
    p_customer_id: parsed.data.customer_id,
    p_credit_type: "exchange",
    p_notes: parsed.data.notes ?? null,
    p_created_by: userId,
    p_items: parsed.data.items,
  })

  if (error) return extractError(error, "Error al crear el intercambio")

  revalidatePath("/notas-credito")
  revalidatePath("/inventario")

  return { data: data as { id: string; credit_number: string; created_at: string } }
}

export async function settleCreditNote(input: SettleCreditNoteInput) {
  const parsed = settleCreditNoteSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  let userId: string
  try {
    userId = await requireUserId()
  } catch {
    return { error: { _form: ["Tu sesion expiro. Vuelve a iniciar sesion."] } }
  }

  const supabase = await createServerClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.rpc as any)("settle_credit_note", {
    p_credit_note_id: parsed.data.credit_note_id,
    p_tenant_id: TENANT_ID,
    p_created_by: userId,
  })

  if (error) return extractError(error, "Error al liquidar la nota de credito")

  revalidatePath("/notas-credito")
  revalidatePath("/inventario")

  return { data: data as { id: string; credit_number: string; settled_at: string } }
}
