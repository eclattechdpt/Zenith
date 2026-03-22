"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { createServerClient } from "@/lib/supabase/server"

import { loginSchema, type LoginInput } from "./schemas"

export async function login(input: LoginInput) {
  const parsed = loginSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const supabase = await createServerClient()

  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  })

  if (error) {
    return { error: { _form: [error.message] } }
  }

  revalidatePath("/", "layout")
  return { data: { success: true } }
}

export async function logout() {
  const supabase = await createServerClient()
  await supabase.auth.signOut()
  revalidatePath("/", "layout")
  redirect("/login")
}
