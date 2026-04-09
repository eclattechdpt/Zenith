import * as XLSX from "xlsx"
import { format } from "date-fns"
import { es } from "date-fns/locale"

import { createClient } from "@/lib/supabase/client"
import { SALE_STATUSES, PAYMENT_METHODS } from "@/lib/constants"

function downloadWorkbook(wb: XLSX.WorkBook, filename: string) {
  XLSX.writeFile(wb, filename)
}

function today() {
  return format(new Date(), "yyyy-MM-dd")
}

const CURRENCY_FMT = "$#,##0.00"
const PERCENT_FMT = "0%"

/**
 * Auto-fit column widths based on header + cell content, and apply
 * currency number format to specified columns.
 */
function formatSheet(
  ws: XLSX.WorkSheet,
  opts: {
    currencyCols?: number[]
    percentCols?: number[]
    minWidth?: number
    padding?: number
  } = {}
) {
  const { currencyCols = [], percentCols = [], minWidth = 10, padding = 3 } = opts
  const ref = ws["!ref"]
  if (!ref) return

  const range = XLSX.utils.decode_range(ref)
  const colWidths: number[] = []

  // Calculate max width per column
  for (let c = range.s.c; c <= range.e.c; c++) {
    let maxLen = minWidth
    for (let r = range.s.r; r <= range.e.r; r++) {
      const cell = ws[XLSX.utils.encode_cell({ r, c })]
      if (!cell) continue
      const val = cell.v != null ? String(cell.v) : ""
      maxLen = Math.max(maxLen, val.length)
    }
    colWidths.push(Math.min(maxLen + padding, 40))
  }

  ws["!cols"] = colWidths.map((w) => ({ wch: w }))

  // Apply number formats to data rows (skip header row 0)
  for (let r = range.s.r + 1; r <= range.e.r; r++) {
    for (const c of currencyCols) {
      const addr = XLSX.utils.encode_cell({ r, c })
      if (ws[addr] && typeof ws[addr].v === "number") {
        ws[addr].z = CURRENCY_FMT
      }
    }
    for (const c of percentCols) {
      const addr = XLSX.utils.encode_cell({ r, c })
      if (ws[addr] && typeof ws[addr].v === "number") {
        ws[addr].z = PERCENT_FMT
      }
    }
  }
}

// ── Sales Export ──

export async function exportSalesExcel() {
  const supabase = createClient()

  const { data: sales, error } = await supabase
    .from("sales")
    .select(
      `sale_number, status, subtotal, discount_amount, total, notes, created_at,
      customers:customers(name),
      sale_payments(method, amount)`
    )
    .is("deleted_at", null)
    .order("created_at", { ascending: false })

  if (error) throw error

  const rows = (sales ?? []).map((s) => {
    const payments = (
      s.sale_payments as { method: string; amount: number }[]
    ).map(
      (p) =>
        `${PAYMENT_METHODS[p.method as keyof typeof PAYMENT_METHODS] ?? p.method}: $${Number(p.amount).toFixed(2)}`
    )

    const subtotal = Number(s.subtotal)
    const discountAmt = Number(s.discount_amount)
    const discountPct = subtotal > 0 ? discountAmt / subtotal : 0

    return {
      Numero: s.sale_number,
      Estado:
        SALE_STATUSES[s.status as keyof typeof SALE_STATUSES] ?? s.status,
      Cliente:
        (s.customers as unknown as { name: string } | null)?.name ?? "—",
      Subtotal: subtotal,
      Descuento: discountAmt,
      "Descuento %": discountPct,
      Total: Number(s.total),
      Pagos: payments.join(", "),
      Notas: s.notes ?? "",
      Fecha: format(new Date(s.created_at), "dd/MM/yyyy HH:mm"),
    }
  })

  const ws = XLSX.utils.json_to_sheet(rows)
  formatSheet(ws, { currencyCols: [3, 4, 6], percentCols: [5] })
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, "Ventas")
  downloadWorkbook(wb, `ventas-${today()}.xlsx`)
}

// ── Sales Export (date range) ──

export async function exportSalesRangeExcel(from: Date, to: Date) {
  const supabase = createClient()

  const { data: sales, error } = await supabase
    .from("sales")
    .select(
      `sale_number, status, subtotal, discount_amount, total, notes, created_at,
      customers:customers(name),
      sale_payments(method, amount)`
    )
    .is("deleted_at", null)
    .gte("created_at", from.toISOString())
    .lte("created_at", to.toISOString())
    .order("created_at", { ascending: false })

  if (error) throw error

  const rows = (sales ?? []).map((s) => {
    const payments = (
      s.sale_payments as { method: string; amount: number }[]
    ).map(
      (p) =>
        `${PAYMENT_METHODS[p.method as keyof typeof PAYMENT_METHODS] ?? p.method}: $${Number(p.amount).toFixed(2)}`
    )

    const subtotal = Number(s.subtotal)
    const discountAmt = Number(s.discount_amount)
    const discountPct = subtotal > 0 ? discountAmt / subtotal : 0

    return {
      Numero: s.sale_number,
      Estado:
        SALE_STATUSES[s.status as keyof typeof SALE_STATUSES] ?? s.status,
      Cliente:
        (s.customers as unknown as { name: string } | null)?.name ?? "—",
      Subtotal: subtotal,
      Descuento: discountAmt,
      "Descuento %": discountPct,
      Total: Number(s.total),
      Pagos: payments.join(", "),
      Notas: s.notes ?? "",
      Fecha: format(new Date(s.created_at), "dd/MM/yyyy HH:mm"),
    }
  })

  const ws = XLSX.utils.json_to_sheet(rows)
  formatSheet(ws, { currencyCols: [3, 4, 6], percentCols: [5] })
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, "Ventas")
  const label = `${format(from, "yyyy-MM-dd")}_${format(to, "yyyy-MM-dd")}`
  downloadWorkbook(wb, `ventas-${label}.xlsx`)
}

// ── Inventory Fisico Export ──

export async function exportInventoryExcel() {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("product_variants")
    .select(
      `id, sku, name, price, stock, stock_min, is_active,
      products!inner(name, brand, is_bundle, deleted_at,
        bundle_items(product_variant_id, product_variants:product_variant_id(stock, products(name)))
      )`
    )
    .is("deleted_at", null)
    .is("products.deleted_at", null)
    .order("products(name)")

  if (error) throw error

  // Separate regular products and bundles
  const regularRows: Record<string, unknown>[] = []
  const bundleRows: Record<string, unknown>[] = []

  for (const v of data ?? []) {
    const prod = v.products as unknown as
      | { name: string; brand: string | null; is_bundle: boolean; bundle_items: { product_variant_id: string; product_variants: { stock: number; products: { name: string } } }[] }
      | { name: string; brand: string | null; is_bundle: boolean; bundle_items: { product_variant_id: string; product_variants: { stock: number; products: { name: string } } }[] }[]
    const prodObj = Array.isArray(prod) ? prod[0] : prod
    const prodName = prodObj?.name ?? "—"
    const isBundle = prodObj?.is_bundle ?? false

    const LOW_STOCK_THRESHOLD = 5

    if (isBundle) {
      const components = prodObj?.bundle_items ?? []
      const derivedStock = components.length > 0
        ? Math.min(...components.map((bi) => bi.product_variants.stock))
        : 0
      const componentNames = components.map((bi) => bi.product_variants.products.name).join(", ")
      const estado = derivedStock === 0 ? "Sin stock" : derivedStock <= LOW_STOCK_THRESHOLD ? "Bajo" : "OK"

      bundleRows.push({
        Producto: `${prodName} (Cofre)`,
        Variante: v.name ?? "—",
        Codigo: v.sku ?? "—",
        Precio: Number(v.price),
        Stock: derivedStock,
        "Stock Minimo": v.stock_min,
        Estado: estado,
        Activo: v.is_active ? "Si" : "No",
        Componentes: componentNames,
      })
    } else {
      const estado = v.stock === 0 ? "Sin stock" : v.stock <= LOW_STOCK_THRESHOLD ? "Bajo" : "OK"
      regularRows.push({
        Producto: prodName,
        Variante: v.name ?? "—",
        Codigo: v.sku ?? "—",
        Precio: Number(v.price),
        Stock: v.stock,
        "Stock Minimo": v.stock_min,
        Estado: estado,
        Activo: v.is_active ? "Si" : "No",
      })
    }
  }

  // Combine: regular first, then bundles at the end
  const allRows = [...regularRows, ...bundleRows]

  const ws = XLSX.utils.json_to_sheet(allRows)
  formatSheet(ws, { currencyCols: [3] })
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, "Inventario Fisico")
  downloadWorkbook(wb, `inventario-fisico-${today()}.xlsx`)
}

// ── Customers Export ──

export async function exportCustomersExcel() {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("customers")
    .select(
      `name, phone, email, address, notes, created_at,
      price_lists:price_lists(name, discount_percent)`
    )
    .is("deleted_at", null)
    .order("name")

  if (error) throw error

  const rows = (data ?? []).map(
    (c: {
      name: string
      phone: string | null
      email: string | null
      address: string | null
      notes: string | null
      created_at: string
      price_lists: { name: string; discount_percent: number } | null
    }) => ({
      Nombre: c.name,
      Telefono: c.phone ?? "—",
      Email: c.email ?? "—",
      Direccion: c.address ?? "—",
      Descuento: c.price_lists
        ? `${c.price_lists.name} (-${c.price_lists.discount_percent}%)`
        : "Precio base",
      Notas: c.notes ?? "",
      "Fecha registro": format(new Date(c.created_at), "dd/MM/yyyy"),
    })
  )

  const ws = XLSX.utils.json_to_sheet(rows)
  formatSheet(ws)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, "Clientes")
  downloadWorkbook(wb, `clientes-${today()}.xlsx`)
}

// ── Products Export ──

export async function exportProductsExcel() {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("products")
    .select(
      `name, brand, is_active, has_variants,
      product_categories(categories(name)),
      product_variants(name, sku, price, stock, is_active)`
    )
    .is("deleted_at", null)
    .is("product_variants.deleted_at", null)
    .order("name")

  if (error) throw error

  const rows: Record<string, unknown>[] = []

  for (const p of data ?? []) {
    const variants = (
      p.product_variants as {
        name: string | null
        sku: string | null
        price: number
        stock: number
        is_active: boolean
      }[]
    ).filter((v) => v.is_active)

    const category = (
      (p.product_categories as unknown as { categories: { name: string } | null }[]) ?? []
    ).map((pc) => pc.categories?.name).filter(Boolean).join(", ")

    if (variants.length <= 1) {
      const v = variants[0]
      rows.push({
        Producto: p.name,
        Marca: p.brand ?? "—",
        Categoria: category ?? "—",
        Variante: v?.name ?? "—",
        Codigo: v?.sku ?? "—",
        Precio: v ? Number(v.price) : 0,
        Stock: v?.stock ?? 0,
        Activo: p.is_active ? "Si" : "No",
      })
    } else {
      for (const v of variants) {
        rows.push({
          Producto: p.name,
          Marca: p.brand ?? "—",
          Categoria: category ?? "—",
          Variante: v.name ?? "—",
          Codigo: v.sku ?? "—",
          Precio: Number(v.price),
          Stock: v.stock,
          Activo: p.is_active ? "Si" : "No",
        })
      }
    }
  }

  const ws = XLSX.utils.json_to_sheet(rows)
  formatSheet(ws, { currencyCols: [5] })
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, "Productos")
  downloadWorkbook(wb, `productos-${today()}.xlsx`)
}

// ── Inventory Transito Export ──

export async function exportTransitExcel() {
  const supabase = createClient()

  const { data: weeks, error } = await supabase
    .from("transit_weeks")
    .select(
      `id, year, month, week_number, label, total_value, created_at,
      transit_week_items(
        quantity, unit_price, line_total,
        product_variants!inner(
          name, sku,
          products!inner(name, brand)
        )
      )`
    )
    .is("deleted_at", null)
    .order("year", { ascending: false })
    .order("month", { ascending: false })
    .order("week_number", { ascending: false })

  if (error) throw error

  const MONTH_NAMES = [
    "",
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ]

  const rows: Record<string, unknown>[] = []

  for (const week of weeks ?? []) {
    const items = (week.transit_week_items ?? []) as unknown as {
      quantity: number
      unit_price: number
      line_total: number
      product_variants: {
        name: string | null
        sku: string | null
        products: { name: string; brand: string | null }
      }
    }[]

    if (items.length === 0) {
      rows.push({
        Año: week.year,
        Mes: MONTH_NAMES[week.month] ?? week.month,
        Semana: week.week_number,
        Etiqueta: week.label ?? "",
        Producto: "—",
        Marca: "—",
        Variante: "—",
        Cantidad: 0,
        "Precio unitario": 0,
        "Total linea": 0,
        "Total semana": Number(week.total_value),
      })
    } else {
      for (const item of items) {
        const pv = item.product_variants
        rows.push({
          Año: week.year,
          Mes: MONTH_NAMES[week.month] ?? week.month,
          Semana: week.week_number,
          Etiqueta: week.label ?? "",
          Producto: pv?.products?.name ?? "—",
          Marca: pv?.products?.brand ?? "—",
          Variante: pv?.name ?? pv?.sku ?? "—",
          Cantidad: item.quantity,
          "Precio unitario": Number(item.unit_price),
          "Total linea": Number(item.line_total),
          "Total semana": Number(week.total_value),
        })
      }
    }
  }

  const ws = XLSX.utils.json_to_sheet(rows)
  formatSheet(ws, { currencyCols: [8, 9, 10] })
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, "Inventario Transito")
  downloadWorkbook(wb, `inventario-transito-${today()}.xlsx`)
}

// ── Inventory Carga Inicial Export ──

export async function exportInitialLoadExcel() {
  const supabase = createClient()

  // Fetch variants with initial_stock and their overrides
  const { data: variants, error: varError } = await supabase
    .from("product_variants")
    .select(
      `id, sku, name, price, initial_stock, is_active,
      products!inner(name, brand, deleted_at)`
    )
    .is("deleted_at", null)
    .is("products.deleted_at", null)

  if (varError) throw varError

  // Fetch overrides
  const { data: overrides } = await supabase
    .from("initial_load_overrides")
    .select("product_variant_id, override_name, override_price")

  const overrideMap = new Map(
    (overrides ?? []).map((o) => [o.product_variant_id, o])
  )

  const rows = (variants ?? [])
    .filter(
      (v: { initial_stock: number | null }) =>
        v.initial_stock !== null && v.initial_stock > 0
    )
    .map(
      (v: {
        id: string
        sku: string | null
        name: string | null
        price: number
        initial_stock: number
        products: { name: string; brand: string | null }
      }) => {
        const prod = v.products as unknown as
          | { name: string }
          | { name: string }[]
        const prodName = Array.isArray(prod) ? prod[0]?.name : prod?.name
        const override = overrideMap.get(v.id)

        return {
          Producto: override?.override_name ?? prodName ?? "—",
          Variante: v.name ?? v.sku ?? "—",
          "Stock inicial": v.initial_stock,
          Precio: override?.override_price
            ? Number(override.override_price)
            : Number(v.price),
          "Valor total": (override?.override_price
            ? Number(override.override_price)
            : Number(v.price)) * v.initial_stock,
          Editado: override ? "Si" : "No",
        }
      }
    )

  const ws = XLSX.utils.json_to_sheet(rows)
  formatSheet(ws, { currencyCols: [3, 4] })
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, "Carga Inicial")
  downloadWorkbook(wb, `inventario-carga-inicial-${today()}.xlsx`)
}

// ── Transit Export (date range) ──

export async function exportTransitRangeExcel(from: Date, to: Date) {
  const supabase = createClient()

  const fromYear = from.getFullYear()
  const fromMonth = from.getMonth() + 1
  const toYear = to.getFullYear()
  const toMonth = to.getMonth() + 1

  const { data: weeks, error } = await supabase
    .from("transit_weeks")
    .select(
      `id, year, month, week_number, label, total_value, created_at,
      transit_week_items(
        quantity, unit_price, line_total,
        product_variants!inner(
          name, sku,
          products!inner(name, brand)
        )
      )`
    )
    .is("deleted_at", null)
    .gte("year", fromYear)
    .lte("year", toYear)
    .order("year", { ascending: false })
    .order("month", { ascending: false })
    .order("week_number", { ascending: false })

  if (error) throw error

  // Client-side month filter for exact range
  const filtered = (weeks ?? []).filter((w) => {
    if (w.year === fromYear && w.year === toYear)
      return w.month >= fromMonth && w.month <= toMonth
    if (w.year === fromYear) return w.month >= fromMonth
    if (w.year === toYear) return w.month <= toMonth
    return true
  })

  const MONTH_NAMES = [
    "",
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
  ]

  const rows: Record<string, unknown>[] = []

  for (const week of filtered) {
    const items = (week.transit_week_items ?? []) as unknown as {
      quantity: number
      unit_price: number
      line_total: number
      product_variants: {
        name: string | null
        sku: string | null
        products: { name: string; brand: string | null }
      }
    }[]

    if (items.length === 0) {
      rows.push({
        Año: week.year,
        Mes: MONTH_NAMES[week.month] ?? week.month,
        Semana: week.week_number,
        Etiqueta: week.label ?? "",
        Producto: "—",
        Marca: "—",
        Variante: "—",
        Cantidad: 0,
        "Precio unitario": 0,
        "Total linea": 0,
        "Total semana": Number(week.total_value),
      })
    } else {
      for (const item of items) {
        const pv = item.product_variants
        rows.push({
          Año: week.year,
          Mes: MONTH_NAMES[week.month] ?? week.month,
          Semana: week.week_number,
          Etiqueta: week.label ?? "",
          Producto: pv?.products?.name ?? "—",
          Marca: pv?.products?.brand ?? "—",
          Variante: pv?.name ?? pv?.sku ?? "—",
          Cantidad: item.quantity,
          "Precio unitario": Number(item.unit_price),
          "Total linea": Number(item.line_total),
          "Total semana": Number(week.total_value),
        })
      }
    }
  }

  const ws = XLSX.utils.json_to_sheet(rows)
  formatSheet(ws, { currencyCols: [8, 9, 10] })
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, "Inventario Transito")
  const label = `${format(from, "yyyy-MM-dd")}_${format(to, "yyyy-MM-dd")}`
  downloadWorkbook(wb, `inventario-transito-${label}.xlsx`)
}
