"use server"

import { createServerClient } from "@/lib/supabase/server"

const TENANT_ID = process.env.NEXT_PUBLIC_TENANT_ID!

export async function logExport(reportName: string, format: "excel" | "pdf") {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: "Tu sesion expiro. Vuelve a iniciar sesion." }

  const { error } = await supabase.from("export_logs").insert({
    tenant_id: TENANT_ID,
    report_name: reportName,
    format,
    exported_by: user.id,
  })

  if (error) return { error: error.message }
  return { data: true }
}
