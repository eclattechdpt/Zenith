# Data Model — Esquema completo de base de datos

## Convenciones

- Todas las tablas usan UUID como primary key
- Todas las tablas incluyen: `id`, `tenant_id`, `created_at`, `updated_at`, `created_by`, `deleted_at`
- Soft delete: `deleted_at IS NULL` en todas las queries por defecto
- Nombres de tablas en inglés, snake_case, plural
- Nombres de columnas en snake_case
- Todas las columnas `numeric` para dinero usan `numeric(12,2)`
- Timestamps siempre `timestamptz` (con timezone)
- Los tipos `text` se prefieren sobre `varchar` en PostgreSQL (no hay diferencia de performance)

---

## Tablas

### 1. categories

Categorías de productos con soporte de subcategorías (hasta 4 niveles via `parent_id`).

```sql
CREATE TABLE categories (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid NOT NULL,
  parent_id   uuid REFERENCES categories(id),
  name        text NOT NULL,
  slug        text NOT NULL,
  description text,
  sort_order  int NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  created_by  uuid REFERENCES auth.users(id),
  deleted_at  timestamptz,

  UNIQUE(tenant_id, slug, parent_id)
);

CREATE INDEX idx_categories_tenant ON categories(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_categories_parent ON categories(parent_id) WHERE deleted_at IS NULL;
```

### 2. products

Producto base. No contiene precio ni stock — esos viven en las variantes.

```sql
CREATE TABLE products (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid NOT NULL,
  category_id uuid REFERENCES categories(id),
  name        text NOT NULL,
  slug        text NOT NULL,
  description text,
  brand       text,
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  created_by  uuid REFERENCES auth.users(id),
  deleted_at  timestamptz,

  UNIQUE(tenant_id, slug)
);

CREATE INDEX idx_products_tenant ON products(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_products_category ON products(category_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_products_brand ON products(tenant_id, brand) WHERE deleted_at IS NULL;
CREATE INDEX idx_products_name_search ON products USING gin(to_tsvector('spanish', name || ' ' || COALESCE(brand, ''))) WHERE deleted_at IS NULL;
```

### 3. variant_types

Tipos de variante reutilizables. Ejemplos: "Tono", "Tamaño", "Línea", "Fórmula". Se crean una vez y se reusan en todos los productos.

```sql
CREATE TABLE variant_types (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid NOT NULL,
  name        text NOT NULL,
  sort_order  int NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  created_by  uuid REFERENCES auth.users(id),
  deleted_at  timestamptz,

  UNIQUE(tenant_id, name)
);

CREATE INDEX idx_variant_types_tenant ON variant_types(tenant_id) WHERE deleted_at IS NULL;
```

### 4. variant_options

Valores posibles de cada tipo de variante. Ejemplo: para el tipo "Tono", las opciones son "Red Lacquer", "Pink in the Afternoon", etc.

```sql
CREATE TABLE variant_options (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid NOT NULL,
  variant_type_id uuid NOT NULL REFERENCES variant_types(id),
  value           text NOT NULL,
  color_hex       text,  -- Para tonos: permite mostrar un circulito del color en el UI
  sort_order      int NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  created_by      uuid REFERENCES auth.users(id),
  deleted_at      timestamptz,

  UNIQUE(tenant_id, variant_type_id, value)
);

CREATE INDEX idx_variant_options_type ON variant_options(variant_type_id) WHERE deleted_at IS NULL;
```

### 5. product_variants

Cada combinación específica de un producto. AQUÍ vive el precio, costo, stock, SKU y código de barras. Es la unidad mínima de venta e inventario.

```sql
CREATE TABLE product_variants (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid NOT NULL,
  product_id      uuid NOT NULL REFERENCES products(id),
  sku             text,
  barcode         text,
  price           numeric(12,2) NOT NULL DEFAULT 0,
  cost            numeric(12,2) NOT NULL DEFAULT 0,
  stock           int NOT NULL DEFAULT 0,
  stock_min       int NOT NULL DEFAULT 0,
  is_active       boolean NOT NULL DEFAULT true,
  expires_at      timestamptz,  -- Fecha de caducidad (Fase 2 activa el módulo, pero el campo existe desde MVP)
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  created_by      uuid REFERENCES auth.users(id),
  deleted_at      timestamptz,

  UNIQUE(tenant_id, sku)
);

CREATE INDEX idx_product_variants_product ON product_variants(product_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_product_variants_barcode ON product_variants(tenant_id, barcode) WHERE deleted_at IS NULL AND barcode IS NOT NULL;
CREATE INDEX idx_product_variants_low_stock ON product_variants(tenant_id) WHERE deleted_at IS NULL AND stock <= stock_min AND is_active = true;
```

### 6. variant_option_assignments

Tabla pivote que conecta cada variante de producto con sus opciones. Una variante "Red Lacquer 3.7g" tiene 2 assignments: uno al option "Red Lacquer" y otro al option "3.7g".

```sql
CREATE TABLE variant_option_assignments (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_variant_id  uuid NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
  variant_option_id   uuid NOT NULL REFERENCES variant_options(id),

  UNIQUE(product_variant_id, variant_option_id)
);

CREATE INDEX idx_voa_variant ON variant_option_assignments(product_variant_id);
CREATE INDEX idx_voa_option ON variant_option_assignments(variant_option_id);
```

### 7. product_images

Imágenes de productos almacenadas en Supabase Storage.

```sql
CREATE TABLE product_images (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     uuid NOT NULL,
  product_id    uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  storage_path  text NOT NULL,  -- Ruta en Supabase Storage
  sort_order    int NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_product_images_product ON product_images(product_id);
```

### 8. customers

Clientes del negocio. Cada cliente puede tener una lista de precios asignada.

```sql
CREATE TABLE customers (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     uuid NOT NULL,
  price_list_id uuid REFERENCES price_lists(id),
  name          text NOT NULL,
  phone         text,
  email         text,
  address       text,
  notes         text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  created_by    uuid REFERENCES auth.users(id),
  deleted_at    timestamptz
);

CREATE INDEX idx_customers_tenant ON customers(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_customers_search ON customers USING gin(to_tsvector('spanish', name || ' ' || COALESCE(phone, '') || ' ' || COALESCE(email, ''))) WHERE deleted_at IS NULL;
```

### 9. price_lists

Listas de precios con descuento general. Ejemplo: "Menudeo" (0%), "Mayoreo" (15%), "Revendedoras" (25%).

```sql
CREATE TABLE price_lists (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         uuid NOT NULL,
  name              text NOT NULL,
  description       text,
  discount_percent  numeric(5,2) NOT NULL DEFAULT 0,  -- 0 a 100
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  created_by        uuid REFERENCES auth.users(id),
  deleted_at        timestamptz,

  UNIQUE(tenant_id, name)
);

CREATE INDEX idx_price_lists_tenant ON price_lists(tenant_id) WHERE deleted_at IS NULL;
```

### 10. customer_prices

Precios específicos por producto para una lista de precios. Sobreescribe el descuento general.

```sql
CREATE TABLE customer_prices (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           uuid NOT NULL,
  price_list_id       uuid NOT NULL REFERENCES price_lists(id),
  product_variant_id  uuid NOT NULL REFERENCES product_variants(id),
  price               numeric(12,2) NOT NULL,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  created_by          uuid REFERENCES auth.users(id),

  UNIQUE(price_list_id, product_variant_id)
);

CREATE INDEX idx_customer_prices_list ON customer_prices(price_list_id);
CREATE INDEX idx_customer_prices_variant ON customer_prices(product_variant_id);
```

### 11. sales

Registro de ventas, cotizaciones, y su ciclo de vida.

```sql
CREATE TABLE sales (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid NOT NULL,
  sale_number     text NOT NULL,  -- Número secuencial legible: V-0001, C-0001 (cotización)
  customer_id     uuid REFERENCES customers(id),
  subtotal        numeric(12,2) NOT NULL DEFAULT 0,
  discount_amount numeric(12,2) NOT NULL DEFAULT 0,
  total           numeric(12,2) NOT NULL DEFAULT 0,
  status          text NOT NULL DEFAULT 'completed',
  -- Valores: 'quote', 'completed', 'partially_returned', 'fully_returned', 'cancelled'
  notes           text,
  expires_at      timestamptz,  -- Solo para cotizaciones: fecha de vigencia
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  created_by      uuid REFERENCES auth.users(id),
  deleted_at      timestamptz
);

CREATE INDEX idx_sales_tenant ON sales(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_sales_customer ON sales(customer_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_sales_status ON sales(tenant_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_sales_created ON sales(tenant_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_sales_number ON sales(tenant_id, sale_number) WHERE deleted_at IS NULL;
```

### 12. sale_items

Items individuales de cada venta. DESNORMALIZACIÓN INTENCIONAL: guarda nombre, label, precio y costo como snapshot del momento de la venta. No se deben recalcular desde las tablas de productos.

```sql
CREATE TABLE sale_items (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id             uuid NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_variant_id  uuid NOT NULL REFERENCES product_variants(id),
  product_name        text NOT NULL,      -- Snapshot: nombre del producto al momento de la venta
  variant_label       text NOT NULL,      -- Snapshot: "Red Lacquer / 3.7g"
  quantity            int NOT NULL,
  unit_price          numeric(12,2) NOT NULL,  -- Snapshot: precio al que se vendió
  unit_cost           numeric(12,2) NOT NULL,  -- Snapshot: costo al momento de la venta
  discount            numeric(12,2) NOT NULL DEFAULT 0,
  line_total          numeric(12,2) NOT NULL,  -- (unit_price * quantity) - discount

  CONSTRAINT positive_quantity CHECK (quantity > 0)
);

CREATE INDEX idx_sale_items_sale ON sale_items(sale_id);
CREATE INDEX idx_sale_items_variant ON sale_items(product_variant_id);
```

### 13. sale_payments

Pagos de una venta. Soporta pago dividido (parte efectivo, parte transferencia, etc.).

```sql
CREATE TABLE sale_payments (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id     uuid NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  method      text NOT NULL,  -- 'cash', 'card', 'transfer', 'credit_note', 'other'
  amount      numeric(12,2) NOT NULL,
  reference   text,  -- Número de transferencia, referencia de tarjeta, ID de nota de crédito
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_sale_payments_sale ON sale_payments(sale_id);
```

### 14. inventory_movements

Bitácora de TODOS los movimientos de stock. Cada movimiento registra el estado antes y después.

```sql
CREATE TABLE inventory_movements (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           uuid NOT NULL,
  product_variant_id  uuid NOT NULL REFERENCES product_variants(id),
  sale_id             uuid REFERENCES sales(id),
  return_id           uuid REFERENCES returns(id),
  type                text NOT NULL,
  -- Valores: 'sale', 'purchase', 'adjustment', 'return', 'transfer', 'initial'
  quantity            int NOT NULL,  -- Positivo = entrada, Negativo = salida
  stock_before        int NOT NULL,
  stock_after         int NOT NULL,
  reason              text,  -- Motivo del ajuste manual
  created_at          timestamptz NOT NULL DEFAULT now(),
  created_by          uuid REFERENCES auth.users(id)
);

CREATE INDEX idx_inv_movements_variant ON inventory_movements(product_variant_id);
CREATE INDEX idx_inv_movements_sale ON inventory_movements(sale_id) WHERE sale_id IS NOT NULL;
CREATE INDEX idx_inv_movements_type ON inventory_movements(tenant_id, type, created_at DESC);
CREATE INDEX idx_inv_movements_date ON inventory_movements(tenant_id, created_at DESC);
```

### 15. returns

Devoluciones de ventas. Pueden ser parciales (solo algunos items).

```sql
CREATE TABLE returns (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     uuid NOT NULL,
  return_number text NOT NULL,  -- Secuencial: D-0001
  sale_id       uuid NOT NULL REFERENCES sales(id),
  customer_id   uuid REFERENCES customers(id),
  reason        text,
  status        text NOT NULL DEFAULT 'completed',  -- 'completed', 'cancelled'
  total_refund  numeric(12,2) NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  created_by    uuid REFERENCES auth.users(id),
  deleted_at    timestamptz
);

CREATE INDEX idx_returns_tenant ON returns(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_returns_sale ON returns(sale_id) WHERE deleted_at IS NULL;
```

### 16. return_items

Items individuales de una devolución.

```sql
CREATE TABLE return_items (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  return_id           uuid NOT NULL REFERENCES returns(id) ON DELETE CASCADE,
  sale_item_id        uuid NOT NULL REFERENCES sale_items(id),
  product_variant_id  uuid NOT NULL REFERENCES product_variants(id),
  quantity            int NOT NULL,
  unit_price          numeric(12,2) NOT NULL,  -- Precio al que se vendió originalmente
  line_total          numeric(12,2) NOT NULL,
  restock             boolean NOT NULL DEFAULT true,  -- Si el producto regresa al inventario

  CONSTRAINT positive_return_qty CHECK (quantity > 0)
);

CREATE INDEX idx_return_items_return ON return_items(return_id);
```

### 17. credit_notes

Notas de crédito generadas a partir de devoluciones. Se pueden usar como método de pago.

```sql
CREATE TABLE credit_notes (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         uuid NOT NULL,
  credit_number     text NOT NULL,  -- Secuencial: NC-0001
  return_id         uuid REFERENCES returns(id),
  customer_id       uuid NOT NULL REFERENCES customers(id),
  original_amount   numeric(12,2) NOT NULL,
  remaining_amount  numeric(12,2) NOT NULL,
  status            text NOT NULL DEFAULT 'active',  -- 'active', 'redeemed', 'expired', 'cancelled'
  expires_at        timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  created_by        uuid REFERENCES auth.users(id),
  deleted_at        timestamptz
);

CREATE INDEX idx_credit_notes_tenant ON credit_notes(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_credit_notes_customer ON credit_notes(customer_id) WHERE deleted_at IS NULL AND status = 'active';
```

---

## Triggers de PostgreSQL

### 1. Auto-update `updated_at`

Aplicar a TODAS las tablas que tengan `updated_at`:

```sql
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar a cada tabla (ejemplo):
CREATE TRIGGER set_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON product_variants FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON sales FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON returns FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON credit_notes FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON price_lists FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON variant_types FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON variant_options FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

### 2. Generador de números secuenciales

```sql
CREATE OR REPLACE FUNCTION generate_sequential_number(
  p_tenant_id uuid,
  p_prefix text,
  p_table text
)
RETURNS text AS $$
DECLARE
  next_num int;
  result text;
BEGIN
  EXECUTE format(
    'SELECT COALESCE(MAX(CAST(SUBSTRING(%I FROM %L) AS int)), 0) + 1 FROM %I WHERE tenant_id = $1 AND %I LIKE $2',
    CASE p_table
      WHEN 'sales' THEN 'sale_number'
      WHEN 'returns' THEN 'return_number'
      WHEN 'credit_notes' THEN 'credit_number'
    END,
    p_prefix || '-(\d+)',
    p_table,
    CASE p_table
      WHEN 'sales' THEN 'sale_number'
      WHEN 'returns' THEN 'return_number'
      WHEN 'credit_notes' THEN 'credit_number'
    END
  ) INTO next_num USING p_tenant_id, p_prefix || '-%';

  result := p_prefix || '-' || LPAD(next_num::text, 4, '0');
  RETURN result;
END;
$$ LANGUAGE plpgsql;
```

---

## Supabase Realtime

Habilitar Realtime en las siguientes tablas para sincronización entre dispositivos (POS en tablet + admin en compu):

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE sales;
ALTER PUBLICATION supabase_realtime ADD TABLE sale_items;
ALTER PUBLICATION supabase_realtime ADD TABLE inventory_movements;
ALTER PUBLICATION supabase_realtime ADD TABLE product_variants;
```

---

## RLS Policies

Aplicar a TODAS las tablas. Patrón MVP (operador único, usuario autenticado):

```sql
-- Ejemplo para products (replicar para todas las tablas)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read" ON products
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert" ON products
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update" ON products
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete" ON products
  FOR DELETE USING (auth.uid() IS NOT NULL);
```

Tablas que necesitan RLS: `categories`, `products`, `variant_types`, `variant_options`, `product_variants`, `variant_option_assignments`, `product_images`, `customers`, `price_lists`, `customer_prices`, `sales`, `sale_items`, `sale_payments`, `inventory_movements`, `returns`, `return_items`, `credit_notes`.

---

## Supabase Storage

Bucket: `product-images`

```sql
-- Crear bucket público para imágenes de productos
INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true);

-- RLS para storage
CREATE POLICY "Authenticated users can upload" ON storage.objects
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND bucket_id = 'product-images');

CREATE POLICY "Anyone can read product images" ON storage.objects
  FOR SELECT USING (bucket_id = 'product-images');

CREATE POLICY "Authenticated users can delete" ON storage.objects
  FOR DELETE USING (auth.uid() IS NOT NULL AND bucket_id = 'product-images');
```

Convención de rutas: `{tenant_id}/{product_id}/{filename}`

---

## Orden de creación de tablas

Debido a foreign keys, las tablas deben crearse en este orden:

1. `variant_types`
2. `variant_options`
3. `categories`
4. `products`
5. `product_variants`
6. `variant_option_assignments`
7. `product_images`
8. `price_lists`
9. `customers` (depende de `price_lists`)
10. `customer_prices`
11. `sales`
12. `sale_items`
13. `sale_payments`
14. `returns`
15. `return_items`
16. `credit_notes`
17. `inventory_movements` (depende de `sales` y `returns`)
