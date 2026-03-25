"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { createServerClient } from "@/lib/supabase/server"

import { loginSchema, type LoginInput } from "./schemas"

const supabaseErrorMessages: Record<string, string> = {
  "Invalid login credentials": "Correo o contrasena incorrectos",
  "Email not confirmed": "El correo no ha sido confirmado",
  "User not found": "Usuario no encontrado",
  "Too many requests": "Demasiados intentos, intenta mas tarde",
  "Email rate limit exceeded": "Demasiados intentos, intenta mas tarde",
}

function translateError(message: string): string {
  return supabaseErrorMessages[message] ?? "Ocurrio un error inesperado"
}

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
    return { error: { _form: [translateError(error.message)] } }
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
