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

    return {
      Numero: s.sale_number,
      Estado:
        SALE_STATUSES[s.status as keyof typeof SALE_STATUSES] ?? s.status,
      Cliente:
        (s.customers as unknown as { name: string } | null)?.name ?? "—",
      Subtotal: Number(s.subtotal),
      Descuento: Number(s.discount_amount),
      Total: Number(s.total),
      Pagos: payments.join(", "),
      Notas: s.notes ?? "",
      Fecha: format(new Date(s.created_at), "dd/MM/yyyy HH:mm"),
    }
  })

  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, "Ventas")
  downloadWorkbook(wb, `ventas-${today()}.xlsx`)
}

// ── Inventory Export ──

export async function exportInventoryExcel() {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("product_variants")
    .select(
      `id, sku, name, price, stock, stock_min, is_active,
      products!inner(name, brand, deleted_at)`
    )
    .is("deleted_at", null)
    .is("products.deleted_at", null)
    .order("products(name)")

  if (error) throw error

  const rows = (data ?? []).map(
    (v: {
      sku: string | null
      name: string | null
      price: number
      stock: number
      stock_min: number
      is_active: boolean
      products: { name: string; brand: string | null }
    }) => {
      const prod = v.products as unknown as
        | { name: string }
        | { name: string }[]
      const prodName = Array.isArray(prod) ? prod[0]?.name : prod?.name

      const estado =
        v.stock_min > 0 && v.stock <= v.stock_min * 0.3
          ? "Critico"
          : v.stock_min > 0 && v.stock <= v.stock_min
            ? "Bajo"
            : "OK"

      return {
        Producto: prodName ?? "—",
        Variante: v.name ?? "—",
        Codigo: v.sku ?? "—",
        Precio: Number(v.price),
        Stock: v.stock,
        "Stock Minimo": v.stock_min,
        Estado: estado,
        Activo: v.is_active ? "Si" : "No",
      }
    }
  )

  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, "Inventario")
  downloadWorkbook(wb, `inventario-${today()}.xlsx`)
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
      categories:categories(name),
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
      p.categories as unknown as { name: string } | null
    )?.name

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
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, "Productos")
  downloadWorkbook(wb, `productos-${today()}.xlsx`)
}
