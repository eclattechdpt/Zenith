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

  // Dedup window: same user + report + format within the last 5 seconds is
  // treated as one export. A double-click on a report button should not write
  // two audit rows.
  const fiveSecondsAgo = new Date(Date.now() - 5000).toISOString()
  const { data: recent } = await supabase
    .from("export_logs")
    .select("id")
    .eq("tenant_id", TENANT_ID)
    .eq("exported_by", user.id)
    .eq("report_name", parsed.data.reportName)
    .eq("format", parsed.data.format)
    .gte("created_at", fiveSecondsAgo)
    .limit(1)
    .maybeSingle()

  if (recent) return { data: true }

  const { error } = await supabase.from("export_logs").insert({
    tenant_id: TENANT_ID,
    report_name: parsed.data.reportName,
    format: parsed.data.format,
    exported_by: user.id,
  })

  if (error) return { error: error.message }
  return { data: true }
}
