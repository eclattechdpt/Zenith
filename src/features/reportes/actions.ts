"use server"

import { z } from "zod"

import { createServerClient } from "@/lib/supabase/server"

const TENANT_ID = process.env.NEXT_PUBLIC_TENANT_ID!

const logExportSchema = z.object({
  reportName: z.string().min(1, "Nombre de reporte requerido").max(255),
  format: z.enum(["excel", "pdf"]),
})

export async function logExport(reportName: string, format: "excel" | "pdf") {
  const parsed = logExportSchema.safeParse({ reportName, format })
  if (!parsed.success) return { error: "Parametros invalidos" }

  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: "Tu sesion expiro. Vuelve a iniciar sesion." }

  const { error } = await supabase.from("export_logs").insert({
    tenant_id: TENANT_ID,
    report_name: parsed.data.reportName,
    format: parsed.data.format,
    exported_by: user.id,
  })

  if (error) return { error: error.message }
  return { data: true }
}
