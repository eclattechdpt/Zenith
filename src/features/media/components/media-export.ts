import * as XLSX from "xlsx"
import { format } from "date-fns"

import type { MediaItem, ImageHostingType } from "../types"

const hostingLabels: Record<ImageHostingType, string> = {
  supabase: "Supabase Storage",
  url: "URL externa",
  data: "Data URL",
  none: "Sin imagen",
}

export function exportMediaAudit(items: MediaItem[]) {
  const rows = items.map((item) => {
    let domain = "—"
    if (item.imageUrl && item.hostingType === "url") {
      try {
        domain = new URL(item.imageUrl).hostname.replace(/^www\./, "")
      } catch {
        domain = "URL invalida"
      }
    }

    return {
      Producto: item.productName,
      Marca: item.brand ?? "—",
      Categoria: item.categoryName ?? "—",
      "Tipo imagen": hostingLabels[item.hostingType],
      Dominio: domain,
      URL: item.imageUrl ?? "—",
      Activo: item.isActive ? "Si" : "No",
    }
  })

  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.json_to_sheet(rows)

  // Column widths
  ws["!cols"] = [
    { wch: 30 }, // Producto
    { wch: 15 }, // Marca
    { wch: 20 }, // Categoria
    { wch: 18 }, // Tipo imagen
    { wch: 25 }, // Dominio
    { wch: 60 }, // URL
    { wch: 8 },  // Activo
  ]

  XLSX.utils.book_append_sheet(wb, ws, "Auditoria de Imagenes")

  // Summary sheet
  const summary = [
    { Metrica: "Total productos", Valor: items.length },
    { Metrica: "Con imagen", Valor: items.filter((i) => i.hostingType !== "none").length },
    { Metrica: "Sin imagen", Valor: items.filter((i) => i.hostingType === "none").length },
    { Metrica: "En Supabase", Valor: items.filter((i) => i.hostingType === "supabase").length },
    { Metrica: "URL externa", Valor: items.filter((i) => i.hostingType === "url").length },
    { Metrica: "Data URL", Valor: items.filter((i) => i.hostingType === "data").length },
  ]
  const wsSummary = XLSX.utils.json_to_sheet(summary)
  wsSummary["!cols"] = [{ wch: 20 }, { wch: 10 }]
  XLSX.utils.book_append_sheet(wb, wsSummary, "Resumen")

  const date = format(new Date(), "yyyy-MM-dd")
  XLSX.writeFile(wb, `auditoria-imagenes-${date}.xlsx`)
}
