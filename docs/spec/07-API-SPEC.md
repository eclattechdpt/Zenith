# API Spec — Server Actions, Zod Schemas & Supabase Queries

## Convenciones

- Todas las Server Actions retornan `{ data } | { error }`.
- El campo `error` es un objeto con keys por campo (`{ name: ["requerido"] }`) o `_form` para errores generales (`{ _form: ["Error de servidor"] }`).
- Todas las mutaciones usan `createServerClient` (server-side Supabase).
- Todas las queries client-side usan TanStack Query + `createBrowserClient`.
- Los tipos se infieren de `database.ts` (auto-generado por Supabase CLI).
- `tenant_id` se obtiene del JWT del usuario autenticado o de una variable de entorno en MVP.

---

## 1. PRODUCTOS

### Zod Schemas

```typescript
// src/features/productos/schemas.ts
import { z } from "zod"

export const productSchema = z.object({
  name: z.string().min(1, "El nombre es requerido").max(200),
  slug: z.string().min(1, "El slug es requerido").max(200)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Solo letras minúsculas, números y guiones"),
  description: z.string().max(2000).optional().nullable(),
  brand: z.string().max(100).optional().nullable(),
  category_id: z.string().uuid("Categoría inválida").optional().nullable(),
  is_active: z.boolean().default(true),
})

export const variantSchema = z.object({
  sku: z.string().max(50).optional().nullable(),
  barcode: z.string().max(50).optional().nullable(),
  price: z.coerce.number().min(0, "El precio debe ser positivo"),
  cost: z.coerce.number().min(0, "El costo debe ser positivo"),
  stock: z.coerce.number().int().default(0),
  stock_min: z.coerce.number().int().min(0).default(0),
  is_active: z.boolean().default(true),
  expires_at: z.string().datetime().optional().nullable(),
  option_ids: z.array(z.string().uuid()).min(1, "Selecciona al menos una opción de variante"),
})

export const createProductSchema = productSchema.extend({
  variants: z.array(variantSchema).min(1, "Agrega al menos una variante"),
})

export const categorySchema = z.object({
  name: z.string().min(1, "El nombre es requerido").max(100),
  slug: z.string().min(1).max(100)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Solo letras minúsculas, números y guiones"),
  description: z.string().max(500).optional().nullable(),
  parent_id: z.string().uuid().optional().nullable(),
  sort_order: z.coerce.number().int().default(0),
})

export const variantTypeSchema = z.object({
  name: z.string().min(1, "El nombre es requerido").max(50),
  sort_order: z.coerce.number().int().default(0),
})

export const variantOptionSchema = z.object({
  variant_type_id: z.string().uuid("Tipo de variante requerido"),
  value: z.string().min(1, "El valor es requerido").max(100),
  color_hex: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Color hex inválido").optional().nullable(),
  sort_order: z.coerce.number().int().default(0),
})

export type ProductInput = z.infer<typeof productSchema>
export type VariantInput = z.infer<typeof variantSchema>
export type CreateProductInput = z.infer<typeof createProductSchema>
export type CategoryInput = z.infer<typeof categorySchema>
export type VariantTypeInput = z.infer<typeof variantTypeSchema>
export type VariantOptionInput = z.infer<typeof variantOptionSchema>
```

### Server Actions

```typescript
// src/features/productos/actions.ts
"use server"

// --- CATEGORÍAS ---

createCategory(data: CategoryInput)
  → Validar con categorySchema
  → INSERT INTO categories
  → revalidatePath("/productos")
  → return { data: category }

updateCategory(id: string, data: CategoryInput)
  → Validar con categorySchema
  → UPDATE categories SET ... WHERE id = $id AND deleted_at IS NULL
  → revalidatePath("/productos")
  → return { data: category }

deleteCategory(id: string)
  → Verificar que no tenga productos activos asociados
  → UPDATE categories SET deleted_at = now() WHERE id = $id
  → revalidatePath("/productos")
  → return { data: { success: true } }

// --- TIPOS Y OPCIONES DE VARIANTE ---

createVariantType(data: VariantTypeInput)
  → INSERT INTO variant_types
  → revalidatePath("/configuracion")
  → return { data: variantType }

createVariantOption(data: VariantOptionInput)
  → INSERT INTO variant_options
  → revalidatePath("/configuracion")
  → return { data: variantOption }

updateVariantOption(id: string, data: VariantOptionInput)
  → UPDATE variant_options SET ...
  → return { data: variantOption }

deleteVariantOption(id: string)
  → Verificar que no esté asignada a variantes activas
  → UPDATE variant_options SET deleted_at = now()
  → return { data: { success: true } }

// --- PRODUCTOS ---

createProduct(data: CreateProductInput)
  → Validar con createProductSchema
  → BEGIN TRANSACTION:
    1. INSERT INTO products → obtener product_id
    2. Por cada variante en data.variants:
       a. INSERT INTO product_variants (product_id, sku, barcode, price, cost, stock, stock_min, expires_at)
       b. Por cada option_id en variant.option_ids:
          INSERT INTO variant_option_assignments (product_variant_id, variant_option_id)
       c. Si stock > 0:
          INSERT INTO inventory_movements (product_variant_id, type='initial', quantity=stock, stock_before=0, stock_after=stock)
  → COMMIT
  → revalidatePath("/productos")
  → return { data: product }

updateProduct(id: string, data: ProductInput)
  → Validar con productSchema
  → UPDATE products SET ... WHERE id = $id
  → revalidatePath("/productos")
  → revalidatePath(`/productos/${id}`)
  → return { data: product }

addVariant(productId: string, data: VariantInput)
  → Validar con variantSchema
  → INSERT INTO product_variants
  → INSERT INTO variant_option_assignments
  → Si stock > 0: INSERT INTO inventory_movements (type='initial')
  → revalidatePath(`/productos/${productId}`)
  → return { data: variant }

updateVariant(variantId: string, data: Partial<VariantInput>)
  → UPDATE product_variants SET ...
  → Si cambió stock: NO crear movement (los ajustes van por el módulo de inventario)
  → return { data: variant }

deleteProduct(id: string)
  → UPDATE products SET deleted_at = now()
  → UPDATE product_variants SET deleted_at = now() WHERE product_id = $id
  → revalidatePath("/productos")
  → return { data: { success: true } }

// --- IMÁGENES ---

uploadProductImage(productId: string, file: File)
  → Upload a Supabase Storage: product-images/{tenant_id}/{product_id}/{filename}
  → INSERT INTO product_images (product_id, storage_path, sort_order)
  → return { data: image }

deleteProductImage(imageId: string)
  → SELECT storage_path FROM product_images WHERE id = $id
  → DELETE from Supabase Storage
  → DELETE FROM product_images WHERE id = $id
  → return { data: { success: true } }
```

### Supabase Queries

```typescript
// src/features/productos/queries.ts

// Lista de productos (Server Component o TanStack Query)
getProducts(filters?: { search?, categoryId?, brand?, isActive? })
  → SELECT products.*, 
      categories(id, name),
      product_variants(id, sku, price, cost, stock, stock_min, is_active,
        variant_option_assignments(
          variant_options(id, value, color_hex, variant_types(id, name))
        )
      ),
      product_images(id, storage_path, sort_order)
    FROM products
    WHERE deleted_at IS NULL
    [AND to_tsvector('spanish', name || brand) @@ to_tsquery(search)]
    [AND category_id = categoryId]
    [AND brand = brand]
    ORDER BY name ASC

// Producto individual con todo el detalle
getProduct(id: string)
  → Mismo query que arriba pero WHERE id = $id, .single()

// Búsqueda rápida para POS (optimizada, menos datos)
searchProductsForPOS(query: string)
  → SELECT products.id, products.name, products.brand,
      product_variants(id, sku, barcode, price, cost, stock, is_active,
        variant_option_assignments(
          variant_options(id, value, color_hex, variant_types(name))
        )
      ),
      product_images(storage_path, sort_order).limit(1)
    FROM products
    WHERE deleted_at IS NULL AND is_active = true
    AND (to_tsvector('spanish', name || brand) @@ to_tsquery(query)
         OR product_variants.sku ILIKE '%query%')
    LIMIT 20

// Búsqueda por barcode exacto (POS scanner)
getVariantByBarcode(barcode: string)
  → SELECT product_variants.*,
      products(id, name, brand),
      variant_option_assignments(variant_options(value, color_hex, variant_types(name)))
    FROM product_variants
    WHERE barcode = $barcode AND deleted_at IS NULL
    .single()

// Categorías con conteo de productos
getCategories()
  → SELECT categories.*, 
      products(count)
    FROM categories
    WHERE deleted_at IS NULL
    ORDER BY sort_order, name

// Tipos y opciones de variante
getVariantTypes()
  → SELECT variant_types.*,
      variant_options(id, value, color_hex, sort_order)
    FROM variant_types
    WHERE deleted_at IS NULL
    ORDER BY sort_order
```

---

## 2. CLIENTES

### Zod Schemas

```typescript
// src/features/clientes/schemas.ts
import { z } from "zod"

export const customerSchema = z.object({
  name: z.string().min(1, "El nombre es requerido").max(200),
  phone: z.string().max(20).optional().nullable(),
  email: z.string().email("Email inválido").max(200).optional().nullable().or(z.literal("")),
  address: z.string().max(500).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
  price_list_id: z.string().uuid().optional().nullable(),
})

export const priceListSchema = z.object({
  name: z.string().min(1, "El nombre es requerido").max(100),
  description: z.string().max(500).optional().nullable(),
  discount_percent: z.coerce.number().min(0).max(100),
})

export const customerPriceSchema = z.object({
  price_list_id: z.string().uuid(),
  product_variant_id: z.string().uuid(),
  price: z.coerce.number().min(0, "El precio debe ser positivo"),
})

export type CustomerInput = z.infer<typeof customerSchema>
export type PriceListInput = z.infer<typeof priceListSchema>
export type CustomerPriceInput = z.infer<typeof customerPriceSchema>
```

### Server Actions

```typescript
// src/features/clientes/actions.ts

createCustomer(data: CustomerInput)
  → Validar con customerSchema
  → INSERT INTO customers
  → revalidatePath("/clientes")
  → return { data: customer }

updateCustomer(id: string, data: CustomerInput)
  → UPDATE customers SET ... WHERE id = $id
  → revalidatePath("/clientes")
  → return { data: customer }

deleteCustomer(id: string)
  → Verificar que no tenga ventas activas
  → UPDATE customers SET deleted_at = now()
  → revalidatePath("/clientes")
  → return { data: { success: true } }

createPriceList(data: PriceListInput)
  → INSERT INTO price_lists
  → revalidatePath("/configuracion")
  → return { data: priceList }

updatePriceList(id: string, data: PriceListInput)
  → UPDATE price_lists SET ...
  → return { data: priceList }

setCustomerPrice(data: CustomerPriceInput)
  → UPSERT INTO customer_prices (ON CONFLICT price_list_id, product_variant_id)
  → return { data: customerPrice }

removeCustomerPrice(id: string)
  → DELETE FROM customer_prices WHERE id = $id
  → return { data: { success: true } }
```

### Supabase Queries

```typescript
// src/features/clientes/queries.ts

getCustomers(search?: string)
  → SELECT customers.*, price_lists(id, name, discount_percent)
    FROM customers
    WHERE deleted_at IS NULL
    [AND to_tsvector('spanish', name || phone || email) @@ to_tsquery(search)]
    ORDER BY name

getCustomer(id: string)
  → SELECT customers.*,
      price_lists(id, name, discount_percent),
      credit_notes(id, credit_number, remaining_amount, status, expires_at)
        .filter('status', 'eq', 'active')
    FROM customers WHERE id = $id .single()

getCustomerPrices(priceListId: string)
  → SELECT customer_prices.*,
      product_variants(id, sku, price,
        products(name, brand))
    FROM customer_prices
    WHERE price_list_id = $priceListId

getPriceLists()
  → SELECT price_lists.*, customers(count)
    FROM price_lists WHERE deleted_at IS NULL
    ORDER BY name

// Resolver precio para POS (llamada desde el cliente)
getResolvedPrice(variantId: string, priceListId?: string)
  → Si priceListId:
      1. SELECT price FROM customer_prices WHERE price_list_id AND product_variant_id
      2. Si no existe: SELECT discount_percent FROM price_lists WHERE id = priceListId
         → calcular variant.price * (1 - discount_percent/100)
  → Si no: SELECT price FROM product_variants WHERE id = variantId
```

---

## 3. POS (PUNTO DE VENTA)

### Zod Schemas

```typescript
// src/features/pos/schemas.ts
import { z } from "zod"

export const cartItemSchema = z.object({
  product_variant_id: z.string().uuid(),
  product_name: z.string(),
  variant_label: z.string(),
  quantity: z.number().int().positive("La cantidad debe ser positiva"),
  unit_price: z.number().min(0),
  unit_cost: z.number().min(0),
  discount: z.number().min(0).default(0),
})

export const paymentSchema = z.object({
  method: z.enum(["cash", "card", "transfer", "credit_note", "other"]),
  amount: z.coerce.number().positive("El monto debe ser positivo"),
  reference: z.string().max(100).optional().nullable(),
})

export const createSaleSchema = z.object({
  customer_id: z.string().uuid().optional().nullable(),
  items: z.array(cartItemSchema).min(1, "Agrega al menos un producto"),
  payments: z.array(paymentSchema).min(1, "Registra al menos un pago"),
  discount_amount: z.number().min(0).default(0),
  notes: z.string().max(2000).optional().nullable(),
})

export const createQuoteSchema = z.object({
  customer_id: z.string().uuid().optional().nullable(),
  items: z.array(cartItemSchema).min(1, "Agrega al menos un producto"),
  discount_amount: z.number().min(0).default(0),
  notes: z.string().max(2000).optional().nullable(),
  expires_days: z.number().int().min(1).max(90).default(15),
})

export type CartItemInput = z.infer<typeof cartItemSchema>
export type PaymentInput = z.infer<typeof paymentSchema>
export type CreateSaleInput = z.infer<typeof createSaleSchema>
export type CreateQuoteInput = z.infer<typeof createQuoteSchema>
```

### Server Actions

```typescript
// src/features/pos/actions.ts

createSale(data: CreateSaleInput)
  → Validar con createSaleSchema
  → Validar que SUM(payments.amount) >= total calculado
  → BEGIN TRANSACTION:
    1. Generar sale_number: generate_sequential_number(tenant_id, 'V', 'sale_number', 'sales')
    2. Calcular subtotal = SUM(item.unit_price * item.quantity)
    3. Calcular total = subtotal - discount_amount
    4. INSERT INTO sales (sale_number, customer_id, subtotal, discount_amount, total, status='completed')
    5. Por cada item:
       a. line_total = (item.unit_price * item.quantity) - item.discount
       b. INSERT INTO sale_items
       c. SELECT stock FROM product_variants WHERE id = item.product_variant_id FOR UPDATE
       d. UPDATE product_variants SET stock = stock - item.quantity
       e. INSERT INTO inventory_movements (type='sale', quantity=-item.quantity, stock_before, stock_after, sale_id)
    6. Por cada payment:
       a. INSERT INTO sale_payments
       b. Si method = 'credit_note':
          UPDATE credit_notes SET remaining_amount = remaining_amount - payment.amount
          Si remaining_amount <= 0: UPDATE status = 'redeemed'
  → COMMIT
  → revalidatePath("/ventas")
  → revalidatePath("/") (dashboard)
  → return { data: sale (con items y payments) }

createQuote(data: CreateQuoteInput)
  → Validar con createQuoteSchema
  → Generar sale_number con prefijo 'C'
  → INSERT INTO sales (status='quote', expires_at = now() + expires_days)
  → INSERT INTO sale_items (NO descontar stock, NO crear movements)
  → NO insertar payments
  → revalidatePath("/ventas")
  → return { data: quote }

convertQuoteToSale(quoteId: string, payments: PaymentInput[])
  → SELECT sale FROM sales WHERE id = quoteId AND status = 'quote'
  → Validar que no esté expirada (expires_at > now())
  → BEGIN TRANSACTION:
    1. UPDATE sales SET status = 'completed', sale_number = nuevo con prefijo 'V'
    2. Por cada sale_item: descontar stock + crear inventory_movement (misma lógica que createSale)
    3. INSERT sale_payments
    4. Si hay credit_note: actualizar remaining_amount
  → COMMIT
  → return { data: sale }

cancelSale(saleId: string)
  → SELECT sale + return count
  → Validar que no tenga returns (status = 'completed', no hay returns asociados)
  → BEGIN TRANSACTION:
    1. Por cada sale_item:
       a. SELECT stock FROM product_variants FOR UPDATE
       b. UPDATE stock = stock + quantity (reversar)
       c. INSERT inventory_movement (type='adjustment', reason='Cancelación de venta {sale_number}')
    2. UPDATE sales SET status = 'cancelled'
  → COMMIT
  → revalidatePath("/ventas")
  → return { data: { success: true } }

cancelQuote(quoteId: string)
  → UPDATE sales SET status = 'cancelled' WHERE id AND status = 'quote'
  → revalidatePath("/ventas")
  → return { data: { success: true } }
```

### Supabase Queries

```typescript
// src/features/pos/queries.ts

// Búsqueda de productos para POS — ver productos/queries.ts: searchProductsForPOS()
// Búsqueda por barcode — ver productos/queries.ts: getVariantByBarcode()

// Notas de crédito activas de un cliente (para pagar con crédito)
getActiveCreditsForCustomer(customerId: string)
  → SELECT credit_notes.*
    FROM credit_notes
    WHERE customer_id = $customerId
      AND status = 'active'
      AND remaining_amount > 0
      AND (expires_at IS NULL OR expires_at > now())
      AND deleted_at IS NULL
    ORDER BY created_at ASC
```

---

## 4. VENTAS E HISTORIAL

### Zod Schemas

```typescript
// src/features/ventas/schemas.ts
import { z } from "zod"

export const returnItemSchema = z.object({
  sale_item_id: z.string().uuid(),
  product_variant_id: z.string().uuid(),
  quantity: z.number().int().positive("La cantidad debe ser positiva"),
  unit_price: z.number().min(0),
  restock: z.boolean().default(true),
})

export const createReturnSchema = z.object({
  sale_id: z.string().uuid(),
  reason: z.string().max(500).optional().nullable(),
  items: z.array(returnItemSchema).min(1, "Selecciona al menos un item para devolver"),
  generate_credit_note: z.boolean().default(true),
  credit_note_expires_days: z.number().int().min(1).max(365).optional().nullable(),
})

export type ReturnItemInput = z.infer<typeof returnItemSchema>
export type CreateReturnInput = z.infer<typeof createReturnSchema>
```

### Server Actions

```typescript
// src/features/ventas/actions.ts

createReturn(data: CreateReturnInput)
  → Validar con createReturnSchema
  → Por cada item: validar que quantity <= (cantidad original - cantidad ya devuelta)
  → BEGIN TRANSACTION:
    1. Generar return_number: 'D-XXXX'
    2. total_refund = SUM(item.unit_price * item.quantity)
    3. INSERT INTO returns (return_number, sale_id, customer_id, reason, total_refund)
    4. Por cada item:
       a. line_total = item.unit_price * item.quantity
       b. INSERT INTO return_items
       c. Si restock = true:
          SELECT stock FROM product_variants FOR UPDATE
          UPDATE stock = stock + item.quantity
          INSERT inventory_movement (type='return', quantity=+item.quantity, return_id)
    5. Si generate_credit_note = true:
       a. Generar credit_number: 'NC-XXXX'
       b. INSERT INTO credit_notes (original_amount=total_refund, remaining_amount=total_refund, status='active')
    6. Actualizar sales.status:
       a. Calcular total items originales vs total items devueltos
       b. Si todos devueltos completamente → 'fully_returned'
       c. Si parcial → 'partially_returned'
  → COMMIT
  → revalidatePath("/ventas")
  → return { data: { return, credit_note? } }
```

### Supabase Queries

```typescript
// src/features/ventas/queries.ts

getSales(filters?: { status?, dateFrom?, dateTo?, customerId?, search? })
  → SELECT sales.*,
      customers(id, name),
      sale_items(count),
      sale_payments(method, amount)
    FROM sales
    WHERE deleted_at IS NULL
    [AND status = status]
    [AND created_at >= dateFrom]
    [AND created_at <= dateTo]
    [AND customer_id = customerId]
    [AND sale_number ILIKE '%search%']
    ORDER BY created_at DESC

getSale(id: string)
  → SELECT sales.*,
      customers(id, name, phone, email),
      sale_items(
        id, product_name, variant_label, quantity, unit_price, unit_cost, discount, line_total,
        product_variant_id
      ),
      sale_payments(id, method, amount, reference),
      returns(
        id, return_number, reason, status, total_refund, created_at,
        return_items(id, quantity, unit_price, line_total, restock, sale_item_id),
        credit_notes(id, credit_number, original_amount, remaining_amount, status)
      )
    FROM sales WHERE id = $id .single()

// Para validar devoluciones: cantidad ya devuelta por sale_item
getReturnedQuantities(saleId: string)
  → SELECT ri.sale_item_id, SUM(ri.quantity) as returned_qty
    FROM return_items ri
    JOIN returns r ON r.id = ri.return_id
    WHERE r.sale_id = $saleId AND r.status = 'completed'
    GROUP BY ri.sale_item_id
```

---

## 5. INVENTARIO

### Zod Schemas

```typescript
// src/features/inventario/schemas.ts
import { z } from "zod"

export const stockAdjustmentSchema = z.object({
  product_variant_id: z.string().uuid(),
  new_stock: z.coerce.number().int().min(0, "El stock no puede ser negativo"),
  reason: z.string().min(1, "El motivo es requerido").max(500),
})

export const stockEntrySchema = z.object({
  product_variant_id: z.string().uuid(),
  quantity: z.coerce.number().int().positive("La cantidad debe ser positiva"),
  reason: z.string().max(500).optional().nullable(),
})

export type StockAdjustmentInput = z.infer<typeof stockAdjustmentSchema>
export type StockEntryInput = z.infer<typeof stockEntrySchema>
```

### Server Actions

```typescript
// src/features/inventario/actions.ts

adjustStock(data: StockAdjustmentInput)
  → Validar con stockAdjustmentSchema
  → SELECT stock FROM product_variants WHERE id = data.product_variant_id FOR UPDATE
  → difference = data.new_stock - current_stock
  → UPDATE product_variants SET stock = data.new_stock
  → INSERT INTO inventory_movements (
      type='adjustment',
      quantity=difference,
      stock_before=current_stock,
      stock_after=data.new_stock,
      reason=data.reason
    )
  → revalidatePath("/inventario")
  → return { data: { movement, new_stock } }

addStock(data: StockEntryInput)
  → Validar con stockEntrySchema
  → SELECT stock FROM product_variants WHERE id FOR UPDATE
  → UPDATE product_variants SET stock = stock + data.quantity
  → INSERT INTO inventory_movements (
      type='purchase',
      quantity=+data.quantity,
      stock_before=current_stock,
      stock_after=current_stock + data.quantity,
      reason=data.reason
    )
  → revalidatePath("/inventario")
  → return { data: { movement, new_stock } }
```

### Supabase Queries

```typescript
// src/features/inventario/queries.ts

getInventory(filters?: { search?, categoryId?, lowStockOnly?, isActive? })
  → SELECT product_variants.*,
      products(id, name, brand, category_id,
        categories(id, name)
      ),
      variant_option_assignments(
        variant_options(value, color_hex, variant_types(name))
      )
    FROM product_variants
    WHERE deleted_at IS NULL
    [AND products.name/brand ILIKE search]
    [AND products.category_id = categoryId]
    [AND stock <= stock_min (si lowStockOnly)]
    [AND is_active = isActive]
    ORDER BY products.name, variant_label

getMovements(variantId: string, filters?: { dateFrom?, dateTo?, type? })
  → SELECT inventory_movements.*,
      sales(sale_number),
      returns(return_number)
    FROM inventory_movements
    WHERE product_variant_id = $variantId
    [AND created_at >= dateFrom]
    [AND created_at <= dateTo]
    [AND type = type]
    ORDER BY created_at DESC

getLowStockAlerts()
  → SELECT product_variants.id, product_variants.sku, product_variants.stock, product_variants.stock_min,
      products(name, brand),
      variant_option_assignments(variant_options(value, variant_types(name)))
    FROM product_variants
    WHERE deleted_at IS NULL
      AND is_active = true
      AND stock <= stock_min
    ORDER BY (stock - stock_min) ASC
```

---

## 6. DASHBOARD

### Supabase Queries

```typescript
// src/features/dashboard/queries.ts

// KPIs principales — ejecutar como Server Component query
getDashboardKPIs(dateFrom: Date, dateTo: Date)
  → Query 1: Ventas totales + ticket promedio
    SELECT
      COUNT(*) as total_sales,
      SUM(total) as total_revenue,
      AVG(total) as avg_ticket
    FROM sales
    WHERE status = 'completed'
      AND deleted_at IS NULL
      AND created_at >= dateFrom
      AND created_at <= dateTo

  → Query 2: Margen bruto
    SELECT SUM(
      (si.unit_price * si.quantity - si.discount) - (si.unit_cost * si.quantity)
    ) as gross_margin
    FROM sale_items si
    JOIN sales s ON s.id = si.sale_id
    WHERE s.status = 'completed'
      AND s.deleted_at IS NULL
      AND s.created_at >= dateFrom
      AND s.created_at <= dateTo

  → Query 3: Stock bajo (count)
    SELECT COUNT(*) as low_stock_count
    FROM product_variants
    WHERE stock <= stock_min
      AND is_active = true
      AND deleted_at IS NULL

// Ventas por día (para gráfica)
getSalesByDay(dateFrom: Date, dateTo: Date)
  → SELECT
      DATE(created_at) as date,
      COUNT(*) as count,
      SUM(total) as revenue
    FROM sales
    WHERE status = 'completed' AND deleted_at IS NULL
      AND created_at >= dateFrom AND created_at <= dateTo
    GROUP BY DATE(created_at)
    ORDER BY date

// Top productos
getTopProducts(dateFrom: Date, dateTo: Date, limit: number = 10, orderBy: 'volume' | 'revenue' = 'revenue')
  → SELECT
      si.product_name,
      SUM(si.quantity) as total_quantity,
      SUM(si.line_total) as total_revenue,
      SUM(si.line_total - (si.unit_cost * si.quantity)) as total_margin
    FROM sale_items si
    JOIN sales s ON s.id = si.sale_id
    WHERE s.status = 'completed' AND s.deleted_at IS NULL
      AND s.created_at >= dateFrom AND s.created_at <= dateTo
    GROUP BY si.product_name
    ORDER BY [total_quantity DESC | total_revenue DESC]
    LIMIT $limit

// Ventas por método de pago
getSalesByPaymentMethod(dateFrom: Date, dateTo: Date)
  → SELECT
      sp.method,
      COUNT(DISTINCT sp.sale_id) as sale_count,
      SUM(sp.amount) as total_amount
    FROM sale_payments sp
    JOIN sales s ON s.id = sp.sale_id
    WHERE s.status = 'completed' AND s.deleted_at IS NULL
      AND s.created_at >= dateFrom AND s.created_at <= dateTo
    GROUP BY sp.method
```

---

## 7. CONSTANTES DEL SISTEMA

```typescript
// src/lib/constants.ts

export const SALE_STATUSES = {
  quote: "Cotización",
  completed: "Completada",
  partially_returned: "Devolución parcial",
  fully_returned: "Devuelta",
  cancelled: "Cancelada",
} as const

export const PAYMENT_METHODS = {
  cash: "Efectivo",
  card: "Tarjeta",
  transfer: "Transferencia",
  credit_note: "Nota de crédito",
  other: "Otro",
} as const

export const MOVEMENT_TYPES = {
  sale: "Venta",
  purchase: "Compra/Entrada",
  adjustment: "Ajuste manual",
  return: "Devolución",
  transfer: "Traspaso",
  initial: "Carga inicial",
} as const

export const CREDIT_NOTE_STATUSES = {
  active: "Activa",
  redeemed: "Aplicada",
  expired: "Expirada",
  cancelled: "Cancelada",
} as const

export const RETURN_STATUSES = {
  completed: "Completada",
  cancelled: "Cancelada",
} as const

export const DEFAULT_QUOTE_EXPIRY_DAYS = 15
export const DEFAULT_CREDIT_NOTE_EXPIRY_DAYS = 90
export const SALE_NUMBER_PREFIX = "V"
export const QUOTE_NUMBER_PREFIX = "C"
export const RETURN_NUMBER_PREFIX = "D"
export const CREDIT_NOTE_PREFIX = "NC"
```
