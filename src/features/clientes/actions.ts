"use server"

import { revalidatePath } from "next/cache"

import { createServerClient } from "@/lib/supabase/server"

import {
  customerSchema,
  priceListSchema,
  type CustomerInput,
  type PriceListInput,
} from "./schemas"

const TENANT_ID = process.env.NEXT_PUBLIC_TENANT_ID!

async function getUserId() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user?.id ?? null
}

// --- CUSTOMERS ---

export async function createCustomer(input: CustomerInput) {
  const parsed = customerSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  const supabase = await createServerClient()
  const userId = await getUserId()

  // Normalize empty strings to null
  const data = {
    ...parsed.data,
    email: parsed.data.email || null,
    phone: parsed.data.phone || null,
    address: parsed.data.address || null,
    notes: parsed.data.notes || null,
    price_list_id: parsed.data.price_list_id || null,
    tenant_id: TENANT_ID,
    created_by: userId,
  }

  const { data: customer, error } = await supabase
    .from("customers")
    .insert(data)
    .select()
    .single()

  if (error) return { error: { _form: [error.message] } }

  revalidatePath("/clientes")
  return { data: customer }
}

export async function updateCustomer(id: string, input: CustomerInput) {
  const parsed = customerSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from("customers")
    .update({
      name: parsed.data.name,
      phone: parsed.data.phone || null,
      email: parsed.data.email || null,
      address: parsed.data.address || null,
      notes: parsed.data.notes || null,
      price_list_id: parsed.data.price_list_id || null,
    })
    .eq("id", id)
    .is("deleted_at", null)
    .select()
    .single()

  if (error) return { error: { _form: [error.message] } }

  revalidatePath("/clientes")
  revalidatePath(`/clientes/${id}`)
  return { data }
}

export async function deleteCustomer(id: string) {
  const supabase = await createServerClient()

  // Check for active sales
  const { count } = await supabase
    .from("sales")
    .select("*", { count: "exact", head: true })
    .eq("customer_id", id)
    .is("deleted_at", null)

  if (count && count > 0) {
    return {
      error: {
        _form: ["No se puede eliminar: el cliente tiene ventas registradas"],
      },
    }
  }

  const { error } = await supabase
    .from("customers")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)

  if (error) return { error: { _form: [error.message] } }

  revalidatePath("/clientes")
  return { data: { success: true } }
}

// --- PRICE LISTS ---

export async function createPriceList(input: PriceListInput) {
  const parsed = priceListSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  const supabase = await createServerClient()
  const userId = await getUserId()

  const { data, error } = await supabase
    .from("price_lists")
    .insert({
      ...parsed.data,
      tenant_id: TENANT_ID,
      created_by: userId,
    })
    .select()
    .single()

  if (error) return { error: { _form: [error.message] } }

  revalidatePath("/configuracion")
  return { data }
}

export async function updatePriceList(id: string, input: PriceListInput) {
  const parsed = priceListSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from("price_lists")
    .update({
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      discount_percent: parsed.data.discount_percent,
    })
    .eq("id", id)
    .is("deleted_at", null)
    .select()
    .single()

  if (error) return { error: { _form: [error.message] } }

  revalidatePath("/configuracion")
  return { data }
}

export async function deletePriceList(id: string) {
  const supabase = await createServerClient()

  // Check for customers using this price list
  const { count } = await supabase
    .from("customers")
    .select("*", { count: "exact", head: true })
    .eq("price_list_id", id)
    .is("deleted_at", null)

  if (count && count > 0) {
    return {
      error: {
        _form: ["No se puede eliminar: hay clientes usando esta lista de precios"],
      },
    }
  }

  const { error } = await supabase
    .from("price_lists")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)

  if (error) return { error: { _form: [error.message] } }

  revalidatePath("/configuracion")
  return { data: { success: true } }
}
