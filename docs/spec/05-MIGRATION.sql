-- ============================================================
-- POS Beauty — Migración completa
-- Ejecutar en Supabase SQL Editor en una sola operación
-- ============================================================

-- ============================================================
-- 0. FUNCIONES UTILITARIAS
-- ============================================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Generador de números secuenciales
CREATE OR REPLACE FUNCTION generate_sequential_number(
  p_tenant_id uuid,
  p_prefix text,
  p_column text,
  p_table text
)
RETURNS text AS $$
DECLARE
  next_num int;
  query text;
BEGIN
  query := format(
    'SELECT COALESCE(MAX(CAST(SUBSTRING(%I FROM ''%s-(\d+)'') AS int)), 0) + 1 FROM %I WHERE tenant_id = $1',
    p_column, p_prefix, p_table
  );
  EXECUTE query INTO next_num USING p_tenant_id;
  RETURN p_prefix || '-' || LPAD(next_num::text, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 1. CATEGORÍAS
-- ============================================================

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
CREATE TRIGGER set_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 2. PRODUCTOS
-- ============================================================

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
CREATE INDEX idx_products_name_search ON products
  USING gin(to_tsvector('spanish', name || ' ' || COALESCE(brand, '')))
  WHERE deleted_at IS NULL;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 3. TIPOS DE VARIANTE
-- ============================================================

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
CREATE TRIGGER set_updated_at BEFORE UPDATE ON variant_types FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 4. OPCIONES DE VARIANTE
-- ============================================================

CREATE TABLE variant_options (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid NOT NULL,
  variant_type_id uuid NOT NULL REFERENCES variant_types(id),
  value           text NOT NULL,
  color_hex       text,
  sort_order      int NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  created_by      uuid REFERENCES auth.users(id),
  deleted_at      timestamptz,
  UNIQUE(tenant_id, variant_type_id, value)
);

CREATE INDEX idx_variant_options_type ON variant_options(variant_type_id) WHERE deleted_at IS NULL;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON variant_options FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 5. VARIANTES DE PRODUCTO
-- ============================================================

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
  expires_at      timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  created_by      uuid REFERENCES auth.users(id),
  deleted_at      timestamptz,
  UNIQUE(tenant_id, sku)
);

CREATE INDEX idx_pv_product ON product_variants(product_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_pv_barcode ON product_variants(tenant_id, barcode) WHERE deleted_at IS NULL AND barcode IS NOT NULL;
CREATE INDEX idx_pv_low_stock ON product_variants(tenant_id)
  WHERE deleted_at IS NULL AND stock <= stock_min AND is_active = true;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON product_variants FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 6. ASIGNACIÓN VARIANTE ↔ OPCIÓN
-- ============================================================

CREATE TABLE variant_option_assignments (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_variant_id  uuid NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
  variant_option_id   uuid NOT NULL REFERENCES variant_options(id),
  UNIQUE(product_variant_id, variant_option_id)
);

CREATE INDEX idx_voa_variant ON variant_option_assignments(product_variant_id);
CREATE INDEX idx_voa_option ON variant_option_assignments(variant_option_id);

-- ============================================================
-- 7. IMÁGENES DE PRODUCTO
-- ============================================================

CREATE TABLE product_images (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     uuid NOT NULL,
  product_id    uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  storage_path  text NOT NULL,
  sort_order    int NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_product_images_product ON product_images(product_id);

-- ============================================================
-- 8. LISTAS DE PRECIOS
-- ============================================================

CREATE TABLE price_lists (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         uuid NOT NULL,
  name              text NOT NULL,
  description       text,
  discount_percent  numeric(5,2) NOT NULL DEFAULT 0,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  created_by        uuid REFERENCES auth.users(id),
  deleted_at        timestamptz,
  UNIQUE(tenant_id, name)
);

CREATE INDEX idx_price_lists_tenant ON price_lists(tenant_id) WHERE deleted_at IS NULL;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON price_lists FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 9. CLIENTES
-- ============================================================

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
CREATE INDEX idx_customers_search ON customers
  USING gin(to_tsvector('spanish', name || ' ' || COALESCE(phone, '') || ' ' || COALESCE(email, '')))
  WHERE deleted_at IS NULL;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 10. PRECIOS POR CLIENTE
-- ============================================================

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

CREATE INDEX idx_cp_list ON customer_prices(price_list_id);
CREATE INDEX idx_cp_variant ON customer_prices(product_variant_id);
CREATE TRIGGER set_updated_at BEFORE UPDATE ON customer_prices FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 11. VENTAS
-- ============================================================

CREATE TABLE sales (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid NOT NULL,
  sale_number     text NOT NULL,
  customer_id     uuid REFERENCES customers(id),
  subtotal        numeric(12,2) NOT NULL DEFAULT 0,
  discount_amount numeric(12,2) NOT NULL DEFAULT 0,
  total           numeric(12,2) NOT NULL DEFAULT 0,
  status          text NOT NULL DEFAULT 'completed'
    CHECK (status IN ('quote', 'completed', 'partially_returned', 'fully_returned', 'cancelled')),
  notes           text,
  expires_at      timestamptz,
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
CREATE TRIGGER set_updated_at BEFORE UPDATE ON sales FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 12. ITEMS DE VENTA
-- ============================================================

CREATE TABLE sale_items (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id             uuid NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_variant_id  uuid NOT NULL REFERENCES product_variants(id),
  product_name        text NOT NULL,
  variant_label       text NOT NULL,
  quantity            int NOT NULL,
  unit_price          numeric(12,2) NOT NULL,
  unit_cost           numeric(12,2) NOT NULL,
  discount            numeric(12,2) NOT NULL DEFAULT 0,
  line_total          numeric(12,2) NOT NULL,
  CONSTRAINT positive_quantity CHECK (quantity > 0)
);

CREATE INDEX idx_si_sale ON sale_items(sale_id);
CREATE INDEX idx_si_variant ON sale_items(product_variant_id);

-- ============================================================
-- 13. PAGOS DE VENTA
-- ============================================================

CREATE TABLE sale_payments (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id     uuid NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  method      text NOT NULL
    CHECK (method IN ('cash', 'card', 'transfer', 'credit_note', 'other')),
  amount      numeric(12,2) NOT NULL,
  reference   text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_sp_sale ON sale_payments(sale_id);

-- ============================================================
-- 14. DEVOLUCIONES
-- ============================================================

CREATE TABLE returns (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     uuid NOT NULL,
  return_number text NOT NULL,
  sale_id       uuid NOT NULL REFERENCES sales(id),
  customer_id   uuid REFERENCES customers(id),
  reason        text,
  status        text NOT NULL DEFAULT 'completed'
    CHECK (status IN ('completed', 'cancelled')),
  total_refund  numeric(12,2) NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  created_by    uuid REFERENCES auth.users(id),
  deleted_at    timestamptz
);

CREATE INDEX idx_returns_tenant ON returns(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_returns_sale ON returns(sale_id) WHERE deleted_at IS NULL;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON returns FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 15. ITEMS DE DEVOLUCIÓN
-- ============================================================

CREATE TABLE return_items (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  return_id           uuid NOT NULL REFERENCES returns(id) ON DELETE CASCADE,
  sale_item_id        uuid NOT NULL REFERENCES sale_items(id),
  product_variant_id  uuid NOT NULL REFERENCES product_variants(id),
  quantity            int NOT NULL,
  unit_price          numeric(12,2) NOT NULL,
  line_total          numeric(12,2) NOT NULL,
  restock             boolean NOT NULL DEFAULT true,
  CONSTRAINT positive_return_qty CHECK (quantity > 0)
);

CREATE INDEX idx_ri_return ON return_items(return_id);

-- ============================================================
-- 16. NOTAS DE CRÉDITO
-- ============================================================

CREATE TABLE credit_notes (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         uuid NOT NULL,
  credit_number     text NOT NULL,
  return_id         uuid REFERENCES returns(id),
  customer_id       uuid NOT NULL REFERENCES customers(id),
  original_amount   numeric(12,2) NOT NULL,
  remaining_amount  numeric(12,2) NOT NULL,
  status            text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'redeemed', 'expired', 'cancelled')),
  expires_at        timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  created_by        uuid REFERENCES auth.users(id),
  deleted_at        timestamptz
);

CREATE INDEX idx_cn_tenant ON credit_notes(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_cn_customer ON credit_notes(customer_id) WHERE deleted_at IS NULL AND status = 'active';
CREATE TRIGGER set_updated_at BEFORE UPDATE ON credit_notes FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 17. MOVIMIENTOS DE INVENTARIO
-- ============================================================

CREATE TABLE inventory_movements (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           uuid NOT NULL,
  product_variant_id  uuid NOT NULL REFERENCES product_variants(id),
  sale_id             uuid REFERENCES sales(id),
  return_id           uuid REFERENCES returns(id),
  type                text NOT NULL
    CHECK (type IN ('sale', 'purchase', 'adjustment', 'return', 'transfer', 'initial')),
  quantity            int NOT NULL,
  stock_before        int NOT NULL,
  stock_after         int NOT NULL,
  reason              text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  created_by          uuid REFERENCES auth.users(id)
);

CREATE INDEX idx_im_variant ON inventory_movements(product_variant_id);
CREATE INDEX idx_im_sale ON inventory_movements(sale_id) WHERE sale_id IS NOT NULL;
CREATE INDEX idx_im_return ON inventory_movements(return_id) WHERE return_id IS NOT NULL;
CREATE INDEX idx_im_type ON inventory_movements(tenant_id, type, created_at DESC);
CREATE INDEX idx_im_date ON inventory_movements(tenant_id, created_at DESC);

-- ============================================================
-- 18. RLS — HABILITAR EN TODAS LAS TABLAS
-- ============================================================

DO $$
DECLARE
  t text;
BEGIN
  FOR t IN
    SELECT unnest(ARRAY[
      'categories', 'products', 'variant_types', 'variant_options',
      'product_variants', 'variant_option_assignments', 'product_images',
      'price_lists', 'customers', 'customer_prices',
      'sales', 'sale_items', 'sale_payments',
      'returns', 'return_items', 'credit_notes',
      'inventory_movements'
    ])
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);

    EXECUTE format(
      'CREATE POLICY "auth_select_%s" ON %I FOR SELECT USING (auth.uid() IS NOT NULL)', t, t
    );
    EXECUTE format(
      'CREATE POLICY "auth_insert_%s" ON %I FOR INSERT WITH CHECK (auth.uid() IS NOT NULL)', t, t
    );
    EXECUTE format(
      'CREATE POLICY "auth_update_%s" ON %I FOR UPDATE USING (auth.uid() IS NOT NULL)', t, t
    );
    EXECUTE format(
      'CREATE POLICY "auth_delete_%s" ON %I FOR DELETE USING (auth.uid() IS NOT NULL)', t, t
    );
  END LOOP;
END;
$$;

-- ============================================================
-- 19. SUPABASE REALTIME
-- ============================================================

ALTER PUBLICATION supabase_realtime ADD TABLE sales;
ALTER PUBLICATION supabase_realtime ADD TABLE sale_items;
ALTER PUBLICATION supabase_realtime ADD TABLE inventory_movements;
ALTER PUBLICATION supabase_realtime ADD TABLE product_variants;

-- ============================================================
-- 20. SUPABASE STORAGE — BUCKET DE IMÁGENES
-- ============================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "auth_upload_images" ON storage.objects
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND bucket_id = 'product-images');

CREATE POLICY "public_read_images" ON storage.objects
  FOR SELECT USING (bucket_id = 'product-images');

CREATE POLICY "auth_delete_images" ON storage.objects
  FOR DELETE USING (auth.uid() IS NOT NULL AND bucket_id = 'product-images');
