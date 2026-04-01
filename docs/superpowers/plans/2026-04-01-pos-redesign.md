# POS Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the POS page from a split-panel terminal into a dashboard-first product catalog with sliding cart sidebar, sale wizard modal, and pending sale support.

**Architecture:** The POS landing page becomes a dashboard with KPI widgets, product carousels (top-selling, recently-sold), and a full product grid. Products can be quick-added to a Zustand cart, which triggers a sliding sidebar. A multi-step wizard modal handles customer selection, payment, and confirmation. Pending sales reserve stock without deducting it, allowing later completion or cancellation.

**Tech Stack:** Next.js App Router, Supabase (PostgreSQL + Storage), TypeScript, Tailwind, shadcn/ui, Motion (framer-motion), Zustand, TanStack Query, React Hook Form + Zod, react-to-print

---

## File Map

### New Files
- `src/features/pos/components/pos-landing.tsx` — Main landing page layout (replaces pos-terminal as page root)
- `src/features/pos/components/pos-kpi-widgets.tsx` — KPI cards row (ventas hoy, productos vendidos, ticket promedio)
- `src/features/pos/components/pos-pending-sales.tsx` — Pending sales amber widget
- `src/features/pos/components/pos-product-carousel.tsx` — Reusable horizontal carousel
- `src/features/pos/components/pos-product-card.tsx` — Minimal product card (image, name, price, add, edit)
- `src/features/pos/components/pos-product-grid.tsx` — Filterable full product grid
- `src/features/pos/components/pos-sliding-cart.tsx` — Animated sidebar cart
- `src/features/pos/components/pos-sale-wizard.tsx` — Multi-step wizard modal (orchestrator)
- `src/features/pos/components/wizard-customer-step.tsx` — Step 1: customer selection
- `src/features/pos/components/wizard-payment-step.tsx` — Step 2: payment method/amounts
- `src/features/pos/components/wizard-confirmation-step.tsx` — Step 3: confirmation + receipt
- `src/features/pos/components/wizard-products-step.tsx` — Step 2 alt: products+cart for empty cart flow

### Modified Files
- `src/app/(dashboard)/pos/page.tsx` — Switch from POSTerminal to POSLanding
- `src/features/pos/queries.ts` — Add dashboard queries (top-selling, recent, stats, pending, all products)
- `src/features/pos/actions.ts` — Add createPendingSale, completePendingSale, cancelPendingSale
- `src/features/pos/schemas.ts` — Add createPendingSaleSchema, completePendingSaleSchema
- `src/features/pos/types.ts` — Add PendingSaleWithSummary, POSDashboardStats types
- `src/lib/constants.ts` — Add "pending" to SALE_STATUSES
- `src/types/database.ts` — Regenerated after DB migration (reserved_stock, image_url columns)

### Database Changes (Supabase)
- Add `reserved_stock` (integer, default 0) to `product_variants`
- Add `image_url` (text, nullable) to `products`
- New RPC: `create_pending_sale` (creates sale + items, increments reserved_stock)
- New RPC: `complete_pending_sale` (adds payments, decrements both stock and reserved_stock, creates inventory_movements)
- New RPC: `cancel_pending_sale` (decrements reserved_stock, sets status cancelled)

---

## Task 1: Database Schema Changes

**Files:**
- Modify: Supabase database (via MCP or SQL)
- Modify: `src/types/database.ts` (regenerate)
- Modify: `src/lib/constants.ts`

- [ ] **Step 1: Add reserved_stock column to product_variants**

Run this SQL in Supabase:

```sql
ALTER TABLE product_variants
ADD COLUMN reserved_stock integer NOT NULL DEFAULT 0;
```

- [ ] **Step 2: Add image_url column to products**

```sql
ALTER TABLE products
ADD COLUMN image_url text;
```

- [ ] **Step 3: Add "pending" sale status**

Edit `src/lib/constants.ts` — add `pending` to `SALE_STATUSES`:

```typescript
export const SALE_STATUSES = {
  pending: "Pendiente",
  quote: "Cotización",
  completed: "Completada",
  partially_returned: "Devolución parcial",
  fully_returned: "Devuelta",
  cancelled: "Cancelada",
} as const
```

- [ ] **Step 4: Regenerate database types**

```bash
npx supabase gen types typescript --project-id lccclwtwkegbvlpdwisu > src/types/database.ts
```

- [ ] **Step 5: Verify types include new columns**

Open `src/types/database.ts` and confirm:
- `product_variants` Row has `reserved_stock: number`
- `products` Row has `image_url: string | null`

- [ ] **Step 6: Commit**

```bash
git add src/types/database.ts src/lib/constants.ts
git commit -m "feat(pos): add reserved_stock, image_url columns and pending sale status"
```

---

## Task 2: Pending Sale RPCs

**Files:**
- Modify: Supabase database (3 new RPCs)

- [ ] **Step 1: Create create_pending_sale RPC**

```sql
CREATE OR REPLACE FUNCTION create_pending_sale(
  p_tenant_id uuid,
  p_customer_id uuid DEFAULT NULL,
  p_subtotal numeric DEFAULT 0,
  p_discount_amount numeric DEFAULT 0,
  p_total numeric DEFAULT 0,
  p_notes text DEFAULT NULL,
  p_created_by uuid DEFAULT NULL,
  p_items jsonb DEFAULT '[]'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_sale_id uuid;
  v_sale_number text;
  v_item jsonb;
  v_variant_stock integer;
  v_variant_reserved integer;
  v_requested integer;
BEGIN
  -- Generate sale number
  SELECT generate_sequential_number(p_tenant_id, 'V', 'sale_number', 'sales') INTO v_sale_number;

  -- Create sale with status 'pending'
  INSERT INTO sales (tenant_id, customer_id, sale_number, status, subtotal, discount_amount, total, notes, created_by)
  VALUES (p_tenant_id, p_customer_id, v_sale_number, 'pending', p_subtotal, p_discount_amount, p_total, p_notes, p_created_by)
  RETURNING id INTO v_sale_id;

  -- Create sale items and reserve stock
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_requested := (v_item->>'quantity')::integer;

    -- Check available stock (stock - reserved_stock)
    SELECT stock, reserved_stock INTO v_variant_stock, v_variant_reserved
    FROM product_variants
    WHERE id = (v_item->>'product_variant_id')::uuid
    FOR UPDATE;

    IF (v_variant_stock - v_variant_reserved) < v_requested THEN
      RAISE EXCEPTION 'Stock insuficiente para variante %', v_item->>'product_variant_id';
    END IF;

    -- Insert sale item
    INSERT INTO sale_items (sale_id, product_variant_id, product_name, variant_label, quantity, unit_price, unit_cost, discount, line_total)
    VALUES (
      v_sale_id,
      (v_item->>'product_variant_id')::uuid,
      v_item->>'product_name',
      v_item->>'variant_label',
      v_requested,
      (v_item->>'unit_price')::numeric,
      (v_item->>'unit_cost')::numeric,
      GREATEST((v_item->>'discount')::numeric, 0),
      GREATEST((v_item->>'unit_price')::numeric * v_requested - COALESCE((v_item->>'discount')::numeric, 0), 0)
    );

    -- Reserve stock (increment reserved_stock, do NOT decrement stock)
    UPDATE product_variants
    SET reserved_stock = reserved_stock + v_requested
    WHERE id = (v_item->>'product_variant_id')::uuid;
  END LOOP;

  RETURN jsonb_build_object('id', v_sale_id, 'sale_number', v_sale_number, 'created_at', now());
END;
$$;
```

- [ ] **Step 2: Create complete_pending_sale RPC**

```sql
CREATE OR REPLACE FUNCTION complete_pending_sale(
  p_sale_id uuid,
  p_tenant_id uuid,
  p_payments jsonb DEFAULT '[]'::jsonb,
  p_created_by uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_sale record;
  v_item record;
  v_payment jsonb;
  v_payment_total numeric := 0;
BEGIN
  -- Fetch and lock sale
  SELECT * INTO v_sale FROM sales WHERE id = p_sale_id AND tenant_id = p_tenant_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Venta no encontrada';
  END IF;

  IF v_sale.status != 'pending' THEN
    RAISE EXCEPTION 'La venta no está pendiente (status: %)', v_sale.status;
  END IF;

  -- Validate payment total
  FOR v_payment IN SELECT * FROM jsonb_array_elements(p_payments)
  LOOP
    v_payment_total := v_payment_total + (v_payment->>'amount')::numeric;
  END LOOP;

  IF v_payment_total < v_sale.total THEN
    RAISE EXCEPTION 'El pago total (%) es menor al total de la venta (%)', v_payment_total, v_sale.total;
  END IF;

  -- Process each item: decrement stock and reserved_stock, create inventory movements
  FOR v_item IN SELECT * FROM sale_items WHERE sale_id = p_sale_id
  LOOP
    UPDATE product_variants
    SET stock = stock - v_item.quantity,
        reserved_stock = reserved_stock - v_item.quantity
    WHERE id = v_item.product_variant_id;

    -- Verify stock didn't go negative
    IF (SELECT stock FROM product_variants WHERE id = v_item.product_variant_id) < 0 THEN
      RAISE EXCEPTION 'Stock insuficiente para variante %', v_item.product_variant_id;
    END IF;

    -- Create inventory movement
    INSERT INTO inventory_movements (tenant_id, product_variant_id, quantity, type, reference_id, notes, created_by)
    VALUES (p_tenant_id, v_item.product_variant_id, -v_item.quantity, 'sale', p_sale_id, 'Venta ' || v_sale.sale_number, p_created_by);
  END LOOP;

  -- Create payments
  FOR v_payment IN SELECT * FROM jsonb_array_elements(p_payments)
  LOOP
    INSERT INTO sale_payments (sale_id, method, amount, reference)
    VALUES (p_sale_id, v_payment->>'method', (v_payment->>'amount')::numeric, v_payment->>'reference');
  END LOOP;

  -- Update sale status
  UPDATE sales SET status = 'completed', updated_at = now() WHERE id = p_sale_id;

  RETURN jsonb_build_object('id', p_sale_id, 'sale_number', v_sale.sale_number, 'completed_at', now());
END;
$$;
```

- [ ] **Step 3: Create cancel_pending_sale RPC**

```sql
CREATE OR REPLACE FUNCTION cancel_pending_sale(
  p_sale_id uuid,
  p_tenant_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_sale record;
  v_item record;
BEGIN
  -- Fetch and lock sale
  SELECT * INTO v_sale FROM sales WHERE id = p_sale_id AND tenant_id = p_tenant_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Venta no encontrada';
  END IF;

  IF v_sale.status != 'pending' THEN
    RAISE EXCEPTION 'La venta no está pendiente (status: %)', v_sale.status;
  END IF;

  -- Release reserved stock
  FOR v_item IN SELECT * FROM sale_items WHERE sale_id = p_sale_id
  LOOP
    UPDATE product_variants
    SET reserved_stock = GREATEST(reserved_stock - v_item.quantity, 0)
    WHERE id = v_item.product_variant_id;
  END LOOP;

  -- Update sale status
  UPDATE sales SET status = 'cancelled', updated_at = now() WHERE id = p_sale_id;

  RETURN jsonb_build_object('id', p_sale_id, 'sale_number', v_sale.sale_number, 'cancelled_at', now());
END;
$$;
```

- [ ] **Step 4: Commit (note only — no files changed, SQL run in Supabase)**

Document the RPCs were created in Supabase.

---

## Task 3: Schemas & Types for Pending Sales

**Files:**
- Modify: `src/features/pos/schemas.ts`
- Modify: `src/features/pos/types.ts`

- [ ] **Step 1: Add pending sale schemas**

Add to `src/features/pos/schemas.ts`:

```typescript
export const createPendingSaleSchema = z.object({
  customer_id: z.string().regex(uuidPattern).optional().nullable(),
  items: z.array(cartItemSchema).min(1),
  discount_amount: z.number().min(0).default(0),
  notes: z.string().max(2000).optional().nullable(),
})

export const completePendingSaleSchema = z.object({
  sale_id: z.string().regex(uuidPattern),
  payments: z.array(paymentSchema).min(1),
})

export type CreatePendingSaleInput = z.infer<typeof createPendingSaleSchema>
export type CompletePendingSaleInput = z.infer<typeof completePendingSaleSchema>
```

- [ ] **Step 2: Add pending sale types**

Add to `src/features/pos/types.ts`:

```typescript
export interface PendingSaleWithSummary {
  id: string
  sale_number: string
  status: string
  subtotal: number
  discount_amount: number
  total: number
  notes: string | null
  created_at: string
  customer: { id: string; name: string } | null
  items: { id: string; product_name: string; variant_label: string; quantity: number; unit_price: number; discount: number; line_total: number; product_variant_id: string }[]
}

export interface POSDashboardStats {
  todayRevenue: number
  todayTransactions: number
  todayUnitsSold: number
  avgTicket: number
  revenueVsYesterday: number // percentage change
}
```

- [ ] **Step 3: Commit**

```bash
git add src/features/pos/schemas.ts src/features/pos/types.ts
git commit -m "feat(pos): add pending sale schemas and types"
```

---

## Task 4: Server Actions for Pending Sales

**Files:**
- Modify: `src/features/pos/actions.ts`

- [ ] **Step 1: Add createPendingSale action**

Add to `src/features/pos/actions.ts`:

```typescript
export async function createPendingSale(input: CreatePendingSaleInput) {
  const parsed = createPendingSaleSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  const items = parsed.data.items
  const subtotal = items.reduce((sum, i) => sum + i.unit_price * i.quantity, 0)
  const itemsDiscount = items.reduce((sum, i) => sum + i.discount, 0)
  const total = Math.max(subtotal - itemsDiscount - parsed.data.discount_amount, 0)

  const { data, error } = await supabase.rpc("create_pending_sale", {
    p_tenant_id: TENANT_ID,
    p_customer_id: parsed.data.customer_id ?? null,
    p_subtotal: subtotal,
    p_discount_amount: parsed.data.discount_amount + itemsDiscount,
    p_total: total,
    p_notes: parsed.data.notes ?? null,
    p_created_by: user?.id ?? null,
    p_items: JSON.stringify(items),
  })

  if (error) return { error: { _form: [error.message] } }

  revalidatePath("/pos")
  revalidatePath("/ventas")
  return { data: data as { id: string; sale_number: string; created_at: string } }
}
```

- [ ] **Step 2: Add completePendingSale action**

```typescript
export async function completePendingSale(input: CompletePendingSaleInput) {
  const parsed = completePendingSaleSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data, error } = await supabase.rpc("complete_pending_sale", {
    p_sale_id: parsed.data.sale_id,
    p_tenant_id: TENANT_ID,
    p_payments: JSON.stringify(parsed.data.payments),
    p_created_by: user?.id ?? null,
  })

  if (error) return { error: { _form: [error.message] } }

  revalidatePath("/pos")
  revalidatePath("/ventas")
  revalidatePath("/")
  revalidatePath("/inventario")
  return { data: data as { id: string; sale_number: string; completed_at: string } }
}
```

- [ ] **Step 3: Add cancelPendingSale action**

```typescript
export async function cancelPendingSale(saleId: string) {
  const supabase = await createServerClient()

  const { data, error } = await supabase.rpc("cancel_pending_sale", {
    p_sale_id: saleId,
    p_tenant_id: TENANT_ID,
  })

  if (error) return { error: { _form: [error.message] } }

  revalidatePath("/pos")
  revalidatePath("/ventas")
  return { data: data as { id: string; sale_number: string; cancelled_at: string } }
}
```

- [ ] **Step 4: Add necessary imports at top of actions.ts**

Ensure these imports and type imports are present:

```typescript
import { createPendingSaleSchema, completePendingSaleSchema } from "./schemas"
import type { CreatePendingSaleInput, CompletePendingSaleInput } from "./schemas"
```

- [ ] **Step 5: Commit**

```bash
git add src/features/pos/actions.ts
git commit -m "feat(pos): add pending sale server actions (create, complete, cancel)"
```

---

## Task 5: Dashboard Queries

**Files:**
- Modify: `src/features/pos/queries.ts`

- [ ] **Step 1: Add usePOSDashboardStats query**

Add to `src/features/pos/queries.ts`:

```typescript
export function usePOSDashboardStats() {
  const supabase = createBrowserClient()

  return useQuery<POSDashboardStats>({
    queryKey: ["pos-dashboard-stats"],
    queryFn: async () => {
      const today = new Date()
      const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString()
      const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1)
      const startOfYesterday = yesterday.toISOString()
      const endOfYesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString()

      // Today's completed sales
      const { data: todaySales } = await supabase
        .from("sales")
        .select("total")
        .eq("tenant_id", TENANT_ID)
        .eq("status", "completed")
        .gte("created_at", startOfToday)
        .is("deleted_at", null)

      // Today's units sold
      const { data: todayItems } = await supabase
        .from("sale_items")
        .select("quantity, sale_id")
        .in("sale_id", (todaySales ?? []).map(s => s.total).length > 0
          ? await supabase
              .from("sales")
              .select("id")
              .eq("tenant_id", TENANT_ID)
              .eq("status", "completed")
              .gte("created_at", startOfToday)
              .is("deleted_at", null)
              .then(r => (r.data ?? []).map(s => s.id))
          : ["__none__"]
        )

      // Simpler approach: use RPC or compute client-side
      const todayRevenue = (todaySales ?? []).reduce((sum, s) => sum + s.total, 0)
      const todayTransactions = (todaySales ?? []).length
      const avgTicket = todayTransactions > 0 ? todayRevenue / todayTransactions : 0

      // Yesterday's sales for comparison
      const { data: yesterdaySales } = await supabase
        .from("sales")
        .select("total")
        .eq("tenant_id", TENANT_ID)
        .eq("status", "completed")
        .gte("created_at", startOfYesterday)
        .lt("created_at", endOfYesterday)
        .is("deleted_at", null)

      const yesterdayRevenue = (yesterdaySales ?? []).reduce((sum, s) => sum + s.total, 0)
      const revenueVsYesterday = yesterdayRevenue > 0
        ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100
        : 0

      // Units sold today
      const todaySaleIds = await supabase
        .from("sales")
        .select("id")
        .eq("tenant_id", TENANT_ID)
        .eq("status", "completed")
        .gte("created_at", startOfToday)
        .is("deleted_at", null)

      let todayUnitsSold = 0
      if ((todaySaleIds.data ?? []).length > 0) {
        const { data: items } = await supabase
          .from("sale_items")
          .select("quantity")
          .in("sale_id", (todaySaleIds.data ?? []).map(s => s.id))

        todayUnitsSold = (items ?? []).reduce((sum, i) => sum + i.quantity, 0)
      }

      return { todayRevenue, todayTransactions, todayUnitsSold, avgTicket, revenueVsYesterday }
    },
    refetchInterval: 60_000, // refresh every minute
  })
}
```

- [ ] **Step 2: Add useTopSellingProducts query**

```typescript
export interface POSProductWithImage {
  id: string
  name: string
  brand: string | null
  has_variants: boolean
  image_url: string | null
  product_variants: {
    id: string
    sku: string | null
    name: string | null
    price: number
    cost: number
    stock: number
    reserved_stock: number
    is_active: boolean
  }[]
}

export function useTopSellingProducts(limit = 10) {
  const supabase = createBrowserClient()

  return useQuery<POSProductWithImage[]>({
    queryKey: ["pos-top-selling", limit],
    queryFn: async () => {
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      // Get top product_variant_ids by quantity sold
      const { data: topItems } = await supabase
        .from("sale_items")
        .select("product_variant_id, quantity, sales!inner(status, created_at, tenant_id)")
        .eq("sales.tenant_id", TENANT_ID)
        .eq("sales.status", "completed")
        .gte("sales.created_at", thirtyDaysAgo.toISOString())

      // Aggregate by product_variant_id
      const variantTotals = new Map<string, number>()
      for (const item of topItems ?? []) {
        const current = variantTotals.get(item.product_variant_id) ?? 0
        variantTotals.set(item.product_variant_id, current + item.quantity)
      }

      // Sort and take top N variant IDs
      const topVariantIds = [...variantTotals.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([id]) => id)

      if (topVariantIds.length === 0) return []

      // Get the product IDs for these variants
      const { data: variants } = await supabase
        .from("product_variants")
        .select("product_id")
        .in("id", topVariantIds)
        .is("deleted_at", null)

      const productIds = [...new Set((variants ?? []).map(v => v.product_id))]

      // Fetch full products
      const { data: products } = await supabase
        .from("products")
        .select("id, name, brand, has_variants, image_url, product_variants(id, sku, name, price, cost, stock, reserved_stock, is_active)")
        .in("id", productIds)
        .eq("is_active", true)
        .is("deleted_at", null)
        .is("product_variants.deleted_at", null)
        .eq("product_variants.is_active", true)

      return (products ?? []) as POSProductWithImage[]
    },
    staleTime: 5 * 60_000, // 5 minutes
  })
}
```

- [ ] **Step 3: Add useRecentlySoldProducts query**

```typescript
export function useRecentlySoldProducts(limit = 10) {
  const supabase = createBrowserClient()

  return useQuery<POSProductWithImage[]>({
    queryKey: ["pos-recently-sold", limit],
    queryFn: async () => {
      // Get recent sale items with their product_variant_id
      const { data: recentItems } = await supabase
        .from("sale_items")
        .select("product_variant_id, sales!inner(status, created_at, tenant_id)")
        .eq("sales.tenant_id", TENANT_ID)
        .eq("sales.status", "completed")
        .order("sales(created_at)", { ascending: false })
        .limit(50)

      // Deduplicate by product_variant_id, keep order
      const seenVariants = new Set<string>()
      const uniqueVariantIds: string[] = []
      for (const item of recentItems ?? []) {
        if (!seenVariants.has(item.product_variant_id)) {
          seenVariants.add(item.product_variant_id)
          uniqueVariantIds.push(item.product_variant_id)
          if (uniqueVariantIds.length >= limit) break
        }
      }

      if (uniqueVariantIds.length === 0) return []

      const { data: variants } = await supabase
        .from("product_variants")
        .select("product_id")
        .in("id", uniqueVariantIds)
        .is("deleted_at", null)

      const productIds = [...new Set((variants ?? []).map(v => v.product_id))]

      const { data: products } = await supabase
        .from("products")
        .select("id, name, brand, has_variants, image_url, product_variants(id, sku, name, price, cost, stock, reserved_stock, is_active)")
        .in("id", productIds)
        .eq("is_active", true)
        .is("deleted_at", null)
        .is("product_variants.deleted_at", null)
        .eq("product_variants.is_active", true)

      return (products ?? []) as POSProductWithImage[]
    },
    staleTime: 2 * 60_000,
  })
}
```

- [ ] **Step 4: Add usePendingSales query**

```typescript
export function usePendingSales() {
  const supabase = createBrowserClient()

  return useQuery<PendingSaleWithSummary[]>({
    queryKey: ["pos-pending-sales"],
    queryFn: async () => {
      const { data } = await supabase
        .from("sales")
        .select(`
          id, sale_number, status, subtotal, discount_amount, total, notes, created_at,
          customers:customer_id(id, name),
          sale_items(id, product_name, variant_label, quantity, unit_price, discount, line_total, product_variant_id)
        `)
        .eq("tenant_id", TENANT_ID)
        .eq("status", "pending")
        .is("deleted_at", null)
        .order("created_at", { ascending: false })

      return (data ?? []).map(sale => ({
        ...sale,
        customer: sale.customers,
      })) as PendingSaleWithSummary[]
    },
    refetchInterval: 30_000,
  })
}
```

- [ ] **Step 5: Add useAllPOSProducts query**

```typescript
export function useAllPOSProducts(search: string, categoryId: string | null) {
  const supabase = createBrowserClient()

  return useQuery<POSProductWithImage[]>({
    queryKey: ["pos-all-products", search, categoryId],
    queryFn: async () => {
      let query = supabase
        .from("products")
        .select("id, name, brand, has_variants, image_url, product_variants!inner(id, sku, name, price, cost, stock, reserved_stock, is_active)")
        .eq("tenant_id", TENANT_ID)
        .eq("is_active", true)
        .is("deleted_at", null)
        .is("product_variants.deleted_at", null)
        .eq("product_variants.is_active", true)
        .order("name")

      if (categoryId) {
        query = query.eq("category_id", categoryId)
      }

      if (search.trim()) {
        const escaped = search.replace(/%/g, "\\%").replace(/_/g, "\\_").replace(/\*/g, "\\*")
        query = query.or(`name.ilike.%${escaped}%,brand.ilike.%${escaped}%,product_variants.sku.ilike.%${escaped}%`)
      }

      const { data } = await query

      return (data ?? []) as POSProductWithImage[]
    },
    placeholderData: (prev) => prev,
  })
}
```

- [ ] **Step 6: Add necessary imports**

Ensure top of `queries.ts` has:

```typescript
import type { PendingSaleWithSummary, POSDashboardStats } from "./types"
const TENANT_ID = process.env.NEXT_PUBLIC_TENANT_ID!
```

- [ ] **Step 7: Commit**

```bash
git add src/features/pos/queries.ts
git commit -m "feat(pos): add dashboard queries (stats, top-selling, recent, pending, all products)"
```

---

## Task 6: Product Card Component

**Files:**
- Create: `src/features/pos/components/pos-product-card.tsx`

- [ ] **Step 1: Create the product card component**

```typescript
"use client"

import { memo } from "react"
import Image from "next/image"
import Link from "next/link"
import { Plus, Pencil } from "lucide-react"
import { motion } from "motion/react"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/utils"
import type { POSProductWithImage } from "../queries"

interface POSProductCardProps {
  product: POSProductWithImage
  onAdd: (product: POSProductWithImage) => void
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

function getAvailableStock(product: POSProductWithImage) {
  return product.product_variants.reduce(
    (sum, v) => sum + (v.stock - v.reserved_stock),
    0
  )
}

function getDisplayPrice(product: POSProductWithImage) {
  const prices = product.product_variants.map((v) => v.price)
  const min = Math.min(...prices)
  const max = Math.max(...prices)
  if (min === max) return formatCurrency(min)
  return `${formatCurrency(min)} - ${formatCurrency(max)}`
}

export const POSProductCard = memo(function POSProductCard({
  product,
  onAdd,
}: POSProductCardProps) {
  const available = getAvailableStock(product)
  const outOfStock = available <= 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`group relative rounded-xl border border-stone-200 bg-white p-3 transition-shadow hover:shadow-md ${
        outOfStock ? "opacity-50" : ""
      }`}
    >
      {/* Edit icon */}
      <Link
        href={`/productos/${product.id}`}
        className="absolute right-2 top-2 z-10 rounded-md p-1 text-stone-400 opacity-0 transition-opacity hover:text-stone-600 group-hover:opacity-100"
      >
        <Pencil className="h-3.5 w-3.5" />
      </Link>

      {/* Product image */}
      <div className="mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-lg bg-gradient-to-br from-rose-100 to-rose-200 sm:h-20 sm:w-20">
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.name}
            width={80}
            height={80}
            className="h-full w-full rounded-lg object-cover"
          />
        ) : (
          <span className="text-lg font-bold text-rose-300 sm:text-xl">
            {getInitials(product.name)}
          </span>
        )}
      </div>

      {/* Info */}
      <p className="truncate text-center text-xs font-semibold text-stone-800">
        {product.name}
      </p>
      <p className="text-center text-sm font-extrabold text-rose-600">
        {getDisplayPrice(product)}
      </p>

      {/* Add button */}
      <Button
        size="sm"
        disabled={outOfStock}
        onClick={() => onAdd(product)}
        className="mt-2 h-7 w-full bg-rose-600 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-40"
      >
        <Plus className="mr-1 h-3 w-3" />
        {outOfStock ? "Agotado" : "Agregar"}
      </Button>
    </motion.div>
  )
})
```

- [ ] **Step 2: Commit**

```bash
git add src/features/pos/components/pos-product-card.tsx
git commit -m "feat(pos): add minimal product card component"
```

---

## Task 7: Product Carousel Component

**Files:**
- Create: `src/features/pos/components/pos-product-carousel.tsx`

- [ ] **Step 1: Create the carousel component**

```typescript
"use client"

import { useRef } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { POSProductCard } from "./pos-product-card"
import type { POSProductWithImage } from "../queries"

interface POSProductCarouselProps {
  title: string
  icon: string
  products: POSProductWithImage[]
  onAdd: (product: POSProductWithImage) => void
}

export function POSProductCarousel({
  title,
  icon,
  products,
  onAdd,
}: POSProductCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  function scroll(direction: "left" | "right") {
    if (!scrollRef.current) return
    const amount = 300
    scrollRef.current.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    })
  }

  if (products.length === 0) return null

  return (
    <div className="mb-4">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-bold text-stone-800">
          {icon} {title}
        </h2>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-stone-400 hover:text-stone-600"
            onClick={() => scroll("left")}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-stone-400 hover:text-stone-600"
            onClick={() => scroll("right")}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto scroll-smooth pb-2 scrollbar-none"
      >
        {products.map((product) => (
          <div key={product.id} className="w-[140px] flex-shrink-0 sm:w-[160px]">
            <POSProductCard product={product} onAdd={onAdd} />
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/features/pos/components/pos-product-carousel.tsx
git commit -m "feat(pos): add horizontal product carousel component"
```

---

## Task 8: KPI Widgets Component

**Files:**
- Create: `src/features/pos/components/pos-kpi-widgets.tsx`

- [ ] **Step 1: Create KPI widgets**

```typescript
"use client"

import { motion } from "motion/react"
import { formatCurrency } from "@/lib/utils"
import { usePOSDashboardStats } from "../queries"

export function POSKpiWidgets() {
  const { data: stats } = usePOSDashboardStats()

  const kpis = [
    {
      label: "Ventas hoy",
      value: formatCurrency(stats?.todayRevenue ?? 0),
      sub: `${stats?.todayTransactions ?? 0} transacciones`,
      change: stats?.revenueVsYesterday ?? 0,
      gradient: "from-rose-50 to-rose-100",
      textColor: "text-rose-900",
      labelColor: "text-rose-700",
      subColor: "text-rose-500",
    },
    {
      label: "Productos vendidos",
      value: String(stats?.todayUnitsSold ?? 0),
      sub: "unidades hoy",
      change: null,
      gradient: "from-teal-50 to-teal-100",
      textColor: "text-teal-900",
      labelColor: "text-teal-700",
      subColor: "text-teal-600",
    },
    {
      label: "Ticket promedio",
      value: formatCurrency(stats?.avgTicket ?? 0),
      sub: stats?.revenueVsYesterday
        ? `${stats.revenueVsYesterday > 0 ? "+" : ""}${Math.round(stats.revenueVsYesterday)}% vs ayer`
        : "—",
      change: null,
      gradient: "from-amber-50 to-amber-100",
      textColor: "text-amber-900",
      labelColor: "text-amber-700",
      subColor: "text-amber-600",
    },
  ]

  return (
    <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
      {kpis.map((kpi, i) => (
        <motion.div
          key={kpi.label}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className={`rounded-xl bg-gradient-to-br ${kpi.gradient} p-4`}
        >
          <p
            className={`text-[10px] font-semibold uppercase tracking-wider ${kpi.labelColor}`}
          >
            {kpi.label}
          </p>
          <p className={`text-2xl font-extrabold ${kpi.textColor}`}>
            {kpi.value}
          </p>
          <p className={`text-xs ${kpi.subColor}`}>{kpi.sub}</p>
        </motion.div>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/features/pos/components/pos-kpi-widgets.tsx
git commit -m "feat(pos): add KPI widgets component"
```

---

## Task 9: Pending Sales Widget

**Files:**
- Create: `src/features/pos/components/pos-pending-sales.tsx`

- [ ] **Step 1: Create pending sales widget**

```typescript
"use client"

import Link from "next/link"
import { Clock } from "lucide-react"
import { motion } from "motion/react"
import { formatCurrency } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import { usePendingSales } from "../queries"
import type { PendingSaleWithSummary } from "../types"

interface POSPendingSalesProps {
  onComplete: (sale: PendingSaleWithSummary) => void
}

export function POSPendingSales({ onComplete }: POSPendingSalesProps) {
  const { data: pendingSales } = usePendingSales()

  if (!pendingSales || pendingSales.length === 0) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-4 rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100 p-3"
    >
      <div className="mb-2 flex items-center justify-between">
        <h2 className="flex items-center gap-1.5 text-sm font-bold text-amber-800">
          <Clock className="h-4 w-4" />
          Ventas pendientes ({pendingSales.length})
        </h2>
        <Link
          href="/ventas?status=pending"
          className="text-xs text-amber-700 underline hover:text-amber-900"
        >
          Ver todas →
        </Link>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none">
        {pendingSales.map((sale) => (
          <div
            key={sale.id}
            className="min-w-[220px] flex-shrink-0 rounded-lg border border-amber-200 bg-white p-3"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-stone-800">
                  {sale.sale_number}
                  {sale.customer ? ` • ${sale.customer.name}` : ""}
                </p>
                <p className="text-[10px] text-stone-500">
                  {sale.items.length} producto{sale.items.length !== 1 ? "s" : ""} •{" "}
                  {formatDistanceToNow(new Date(sale.created_at), {
                    addSuffix: true,
                    locale: es,
                  })}
                </p>
              </div>
              <p className="text-sm font-extrabold text-rose-600">
                {formatCurrency(sale.total)}
              </p>
            </div>
            <button
              onClick={() => onComplete(sale)}
              className="mt-2 w-full rounded-md bg-rose-600 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-rose-700"
            >
              Completar pago
            </button>
          </div>
        ))}
      </div>
    </motion.div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/features/pos/components/pos-pending-sales.tsx
git commit -m "feat(pos): add pending sales widget"
```

---

## Task 10: Product Grid Component

**Files:**
- Create: `src/features/pos/components/pos-product-grid.tsx`

- [ ] **Step 1: Create product grid**

```typescript
"use client"

import { useState } from "react"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useDebounce } from "@/hooks/use-debounce"
import { useCategories } from "@/features/productos/queries"
import { useAllPOSProducts, type POSProductWithImage } from "../queries"
import { POSProductCard } from "./pos-product-card"

interface POSProductGridProps {
  onAdd: (product: POSProductWithImage) => void
}

export function POSProductGrid({ onAdd }: POSProductGridProps) {
  const [search, setSearch] = useState("")
  const [categoryId, setCategoryId] = useState<string | null>(null)
  const debouncedSearch = useDebounce(search, 250)

  const { data: categories } = useCategories()
  const { data: products, isLoading } = useAllPOSProducts(
    debouncedSearch,
    categoryId
  )

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-sm font-bold text-stone-800">📦 Todos los productos</h2>
        <div className="flex gap-2">
          <select
            value={categoryId ?? ""}
            onChange={(e) => setCategoryId(e.target.value || null)}
            className="h-8 rounded-lg border border-stone-200 bg-white px-2 text-xs text-stone-600"
          >
            <option value="">Todas las categorías</option>
            {(categories ?? []).map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
          <div className="relative">
            <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-stone-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar producto..."
              className="h-8 w-48 pl-7 text-xs"
            />
          </div>
        </div>
      </div>
      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="h-40 animate-pulse rounded-xl bg-stone-100"
            />
          ))}
        </div>
      ) : (products ?? []).length === 0 ? (
        <div className="flex h-32 items-center justify-center text-sm text-stone-400">
          No se encontraron productos
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {(products ?? []).map((product) => (
            <POSProductCard
              key={product.id}
              product={product}
              onAdd={onAdd}
            />
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/features/pos/components/pos-product-grid.tsx
git commit -m "feat(pos): add filterable product grid"
```

---

## Task 11: Sliding Cart Sidebar

**Files:**
- Create: `src/features/pos/components/pos-sliding-cart.tsx`

- [ ] **Step 1: Create sliding cart component**

```typescript
"use client"

import { ShoppingCart, Minus, Plus, Trash2 } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/utils"
import { usePOSStore } from "../store"

interface POSSlidingCartProps {
  onCheckout: () => void
}

export function POSSlidingCart({ onCheckout }: POSSlidingCartProps) {
  const items = usePOSStore((s) => s.items)
  const updateQuantity = usePOSStore((s) => s.updateQuantity)
  const removeItem = usePOSStore((s) => s.removeItem)
  const getSubtotal = usePOSStore((s) => s.getSubtotal)
  const getTotal = usePOSStore((s) => s.getTotal)
  const getItemCount = usePOSStore((s) => s.getItemCount)
  const clear = usePOSStore((s) => s.clear)

  if (items.length === 0) return null

  return (
    <motion.aside
      initial={{ width: 0, opacity: 0 }}
      animate={{ width: 320, opacity: 1 }}
      exit={{ width: 0, opacity: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="flex-shrink-0 overflow-hidden"
    >
      <div className="flex h-full w-[320px] flex-col rounded-2xl border border-stone-200 bg-white p-4 shadow-lg">
        {/* Header */}
        <div className="mb-3 flex items-center justify-between border-b border-stone-100 pb-3">
          <h2 className="flex items-center gap-2 text-sm font-bold text-stone-800">
            <ShoppingCart className="h-4 w-4" />
            Carrito
          </h2>
          <span className="rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-bold text-rose-600">
            {getItemCount()} items
          </span>
        </div>

        {/* Items */}
        <div className="flex-1 space-y-2 overflow-y-auto">
          <AnimatePresence mode="popLayout">
            {items.map((item) => (
              <motion.div
                key={item.variantId}
                layout
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex items-center gap-2 rounded-lg bg-stone-50 p-2"
              >
                {/* Thumbnail placeholder */}
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-rose-100 to-rose-200 text-xs font-bold text-rose-300">
                  {item.productName.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-stone-800">
                    {item.productName}
                  </p>
                  <p className="text-[10px] text-stone-500">
                    {formatCurrency(item.unitPrice)} × {item.quantity}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() =>
                      item.quantity <= 1
                        ? removeItem(item.variantId)
                        : updateQuantity(item.variantId, item.quantity - 1)
                    }
                    className="flex h-5 w-5 items-center justify-center rounded bg-stone-200 text-stone-600 hover:bg-stone-300"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="w-5 text-center text-xs font-semibold">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => {
                      if (item.quantity < item.stock) {
                        updateQuantity(item.variantId, item.quantity + 1)
                      }
                    }}
                    disabled={item.quantity >= item.stock}
                    className="flex h-5 w-5 items-center justify-center rounded bg-stone-200 text-stone-600 hover:bg-stone-300 disabled:opacity-40"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
                <p className="w-14 text-right text-xs font-bold text-stone-800">
                  {formatCurrency(item.unitPrice * item.quantity)}
                </p>
                <button
                  onClick={() => removeItem(item.variantId)}
                  className="text-stone-400 hover:text-rose-500"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="mt-3 border-t border-stone-100 pt-3">
          <div className="mb-1 flex justify-between text-xs text-stone-500">
            <span>Subtotal</span>
            <span>{formatCurrency(getSubtotal())}</span>
          </div>
          <div className="mb-3 flex justify-between text-sm font-extrabold">
            <span className="text-stone-800">Total</span>
            <span className="text-rose-600">{formatCurrency(getTotal())}</span>
          </div>
          <Button
            onClick={onCheckout}
            className="mb-2 h-10 w-full bg-rose-600 text-sm font-bold text-white hover:bg-rose-700"
          >
            Confirmar venta →
          </Button>
          <Button
            variant="outline"
            onClick={clear}
            className="h-8 w-full text-xs text-stone-500"
          >
            Vaciar carrito
          </Button>
        </div>
      </div>
    </motion.aside>
  )
}
```

- [ ] **Step 2: Create mobile cart FAB**

Add to the same file, below the `POSSlidingCart` export:

```typescript
export function POSCartFAB({ onClick }: { onClick: () => void }) {
  const itemCount = usePOSStore((s) => s.getItemCount)
  const total = usePOSStore((s) => s.getTotal)

  if (itemCount() === 0) return null

  return (
    <motion.button
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      exit={{ scale: 0 }}
      onClick={onClick}
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-rose-600 px-4 py-3 text-white shadow-lg shadow-rose-600/30 sm:hidden"
    >
      <ShoppingCart className="h-5 w-5" />
      <span className="text-sm font-bold">{formatCurrency(total())}</span>
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-400 text-xs font-bold text-amber-900">
        {itemCount()}
      </span>
    </motion.button>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/features/pos/components/pos-sliding-cart.tsx
git commit -m "feat(pos): add sliding cart sidebar with mobile FAB"
```

---

## Task 12: Sale Wizard — Customer Step

**Files:**
- Create: `src/features/pos/components/wizard-customer-step.tsx`

- [ ] **Step 1: Create customer step**

```typescript
"use client"

import { useState, useCallback } from "react"
import { Search, User, X, ArrowRight } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useDebounce } from "@/hooks/use-debounce"
import { useCustomers } from "@/features/clientes/queries"
import { usePOSStore } from "../store"
import { resolvePrices } from "../utils"
import type { CartCustomer } from "../types"

interface WizardCustomerStepProps {
  onNext: () => void
}

export function WizardCustomerStep({ onNext }: WizardCustomerStepProps) {
  const [search, setSearch] = useState("")
  const debouncedSearch = useDebounce(search, 250)
  const customer = usePOSStore((s) => s.customer)
  const setCustomer = usePOSStore((s) => s.setCustomer)
  const items = usePOSStore((s) => s.items)
  const updateItemPrice = usePOSStore((s) => s.updateItemPrice)

  const { data: customers } = useCustomers(debouncedSearch)

  const handleSelect = useCallback(
    async (c: { id: string; name: string; phone: string | null; price_lists: { id: string; discount_percent: number } | null }) => {
      const cartCustomer: CartCustomer = {
        id: c.id,
        name: c.name,
        priceListId: c.price_lists?.id ?? null,
        discountPercent: c.price_lists?.discount_percent ?? 0,
      }
      setCustomer(cartCustomer)

      // Recalculate prices if there are items in cart
      if (items.length > 0) {
        const variants = items.map((i) => ({
          variantId: i.variantId,
          basePrice: i.unitPrice,
        }))
        const priceMap = await resolvePrices(
          variants,
          cartCustomer.priceListId,
          cartCustomer.discountPercent
        )
        for (const [variantId, price] of priceMap) {
          updateItemPrice(variantId, price)
        }
      }

      setSearch("")
    },
    [setCustomer, items, updateItemPrice]
  )

  const handleClear = useCallback(() => {
    setCustomer(null)
  }, [setCustomer])

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className="mb-1 text-lg font-bold text-stone-800">
          Seleccionar cliente
        </h3>
        <p className="text-sm text-stone-500">
          Busca un cliente o continúa sin uno
        </p>
      </div>

      {customer ? (
        <div className="flex items-center justify-between rounded-xl border border-teal-200 bg-teal-50 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-200 text-teal-700">
              <User className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-stone-800">{customer.name}</p>
              {customer.discountPercent > 0 && (
                <p className="text-xs text-teal-600">
                  Descuento: {customer.discountPercent}%
                </p>
              )}
            </div>
          </div>
          <button
            onClick={handleClear}
            className="rounded-md p-1 text-stone-400 hover:text-stone-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre, teléfono o email..."
              className="pl-9"
              autoFocus
            />
          </div>

          {debouncedSearch.trim() && (customers ?? []).length > 0 && (
            <div className="max-h-60 space-y-1 overflow-y-auto rounded-xl border border-stone-200 p-2">
              {(customers ?? []).map((c) => (
                <button
                  key={c.id}
                  onClick={() => handleSelect(c)}
                  className="flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-stone-50"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-stone-100 text-stone-500">
                    <User className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-stone-800">
                      {c.name}
                    </p>
                    <p className="text-xs text-stone-500">{c.phone ?? ""}</p>
                  </div>
                  {c.price_lists?.discount_percent ? (
                    <span className="rounded-full bg-teal-100 px-2 py-0.5 text-xs font-medium text-teal-700">
                      -{c.price_lists.discount_percent}%
                    </span>
                  ) : null}
                </button>
              ))}
            </div>
          )}
        </>
      )}

      <div className="flex gap-3 pt-4">
        <Button
          onClick={onNext}
          className="flex-1 bg-rose-600 text-white hover:bg-rose-700"
        >
          {customer ? "Continuar" : "Continuar sin cliente"}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/features/pos/components/wizard-customer-step.tsx
git commit -m "feat(pos): add wizard customer selection step"
```

---

## Task 13: Sale Wizard — Payment Step

**Files:**
- Create: `src/features/pos/components/wizard-payment-step.tsx`

- [ ] **Step 1: Create payment step**

This component extracts the payment logic from the existing `payment-dialog.tsx`. It renders payment method selection, amount inputs, split payments, and change calculation.

```typescript
"use client"

import { useState, useCallback } from "react"
import { Plus, Trash2, ArrowRight, ArrowLeft, Banknote, CreditCard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { formatCurrency } from "@/lib/utils"
import { PAYMENT_METHODS } from "@/lib/constants"
import type { CartPayment } from "../types"

interface WizardPaymentStepProps {
  total: number
  onNext: (payments: CartPayment[]) => void
  onBack: () => void
}

export function WizardPaymentStep({
  total,
  onNext,
  onBack,
}: WizardPaymentStepProps) {
  const [payments, setPayments] = useState<CartPayment[]>([
    { method: "cash", amount: total, reference: null },
  ])

  const paymentTotal = payments.reduce((sum, p) => sum + p.amount, 0)
  const remaining = total - paymentTotal
  const change = paymentTotal > total ? paymentTotal - total : 0
  const isValid = total === 0 || (paymentTotal >= total && payments.every((p) => p.amount > 0))

  const updatePayment = useCallback(
    (index: number, updates: Partial<CartPayment>) => {
      setPayments((prev) =>
        prev.map((p, i) => (i === index ? { ...p, ...updates } : p))
      )
    },
    []
  )

  const addPayment = useCallback(
    (method: CartPayment["method"]) => {
      setPayments((prev) => [
        ...prev,
        { method, amount: Math.max(remaining, 0), reference: null },
      ])
    },
    [remaining]
  )

  const removePayment = useCallback((index: number) => {
    setPayments((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const setFullCash = useCallback(() => {
    setPayments([{ method: "cash", amount: total, reference: null }])
  }, [total])

  const setFullCard = useCallback(() => {
    setPayments([{ method: "card", amount: total, reference: null }])
  }, [total])

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h3 className="mb-1 text-lg font-bold text-stone-800">Método de pago</h3>
        <p className="text-sm text-stone-500">
          Total a cobrar:{" "}
          <span className="font-bold text-rose-600">{formatCurrency(total)}</span>
        </p>
      </div>

      {/* Quick buttons */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={setFullCash}
          className="flex-1 gap-2"
        >
          <Banknote className="h-4 w-4" />
          Efectivo
        </Button>
        <Button
          variant="outline"
          onClick={setFullCard}
          className="flex-1 gap-2"
        >
          <CreditCard className="h-4 w-4" />
          Tarjeta
        </Button>
      </div>

      {/* Payment lines */}
      <div className="space-y-3">
        {payments.map((payment, index) => (
          <div
            key={index}
            className="flex items-center gap-2 rounded-lg border border-stone-200 bg-stone-50 p-3"
          >
            <select
              value={payment.method}
              onChange={(e) =>
                updatePayment(index, {
                  method: e.target.value as CartPayment["method"],
                })
              }
              className="h-8 rounded-md border border-stone-200 bg-white px-2 text-sm"
            >
              {Object.entries(PAYMENT_METHODS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
            <Input
              type="number"
              value={payment.amount || ""}
              onChange={(e) =>
                updatePayment(index, { amount: Number(e.target.value) })
              }
              className="h-8 w-28 text-sm"
              min={0}
              step={0.01}
            />
            {(payment.method === "transfer" || payment.method === "other") && (
              <Input
                value={payment.reference ?? ""}
                onChange={(e) =>
                  updatePayment(index, { reference: e.target.value || null })
                }
                placeholder="Referencia"
                className="h-8 flex-1 text-sm"
              />
            )}
            {payments.length > 1 && (
              <button
                onClick={() => removePayment(index)}
                className="text-stone-400 hover:text-rose-500"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Add split payment */}
      {remaining > 0 && (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => addPayment("cash")}
            className="text-xs"
          >
            <Plus className="mr-1 h-3 w-3" /> Efectivo
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => addPayment("card")}
            className="text-xs"
          >
            <Plus className="mr-1 h-3 w-3" /> Tarjeta
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => addPayment("transfer")}
            className="text-xs"
          >
            <Plus className="mr-1 h-3 w-3" /> Transferencia
          </Button>
        </div>
      )}

      {/* Summary */}
      <div className="rounded-lg bg-stone-50 p-3">
        {remaining > 0 && (
          <p className="text-sm font-medium text-amber-600">
            Faltante: {formatCurrency(remaining)}
          </p>
        )}
        {change > 0 && (
          <p className="text-sm font-medium text-teal-600">
            Cambio: {formatCurrency(change)}
          </p>
        )}
      </div>

      {/* Navigation */}
      <div className="flex gap-3 pt-2">
        <Button variant="outline" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Atrás
        </Button>
        <Button
          disabled={!isValid}
          onClick={() => onNext(payments)}
          className="flex-1 bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-40"
        >
          Continuar
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/features/pos/components/wizard-payment-step.tsx
git commit -m "feat(pos): add wizard payment step"
```

---

## Task 14: Sale Wizard — Confirmation Step

**Files:**
- Create: `src/features/pos/components/wizard-confirmation-step.tsx`

- [ ] **Step 1: Create confirmation step**

```typescript
"use client"

import { useState } from "react"
import { Check, Clock, Printer, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/utils"
import { PAYMENT_METHODS } from "@/lib/constants"
import { usePOSStore } from "../store"
import type { CartPayment } from "../types"

interface WizardConfirmationStepProps {
  payments: CartPayment[]
  onCompleteSale: () => Promise<void>
  onPendingSale: () => Promise<void>
  onPrint: () => void
  onBack: () => void
  saleResult: { sale_number: string } | null
}

export function WizardConfirmationStep({
  payments,
  onCompleteSale,
  onPendingSale,
  onPrint,
  onBack,
  saleResult,
}: WizardConfirmationStepProps) {
  const items = usePOSStore((s) => s.items)
  const customer = usePOSStore((s) => s.customer)
  const getSubtotal = usePOSStore((s) => s.getSubtotal)
  const getItemsDiscount = usePOSStore((s) => s.getItemsDiscount)
  const getTotal = usePOSStore((s) => s.getTotal)
  const [submitting, setSubmitting] = useState<"complete" | "pending" | null>(null)

  const paymentTotal = payments.reduce((sum, p) => sum + p.amount, 0)
  const change = paymentTotal > getTotal() ? paymentTotal - getTotal() : 0

  const handleComplete = async () => {
    setSubmitting("complete")
    try {
      await onCompleteSale()
    } finally {
      setSubmitting(null)
    }
  }

  const handlePending = async () => {
    setSubmitting("pending")
    try {
      await onPendingSale()
    } finally {
      setSubmitting(null)
    }
  }

  // Success state
  if (saleResult) {
    return (
      <div className="flex flex-col items-center gap-4 py-8">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-teal-100">
          <Check className="h-8 w-8 text-teal-600" />
        </div>
        <h3 className="text-xl font-bold text-stone-800">Venta completada</h3>
        <p className="text-sm text-stone-500">
          Folio: <span className="font-semibold">{saleResult.sale_number}</span>
        </p>
        <Button onClick={onPrint} variant="outline" className="gap-2">
          <Printer className="h-4 w-4" />
          Imprimir ticket
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h3 className="mb-1 text-lg font-bold text-stone-800">Confirmar venta</h3>
        <p className="text-sm text-stone-500">Revisa los detalles antes de confirmar</p>
      </div>

      {/* Customer */}
      {customer && (
        <div className="rounded-lg bg-teal-50 p-3">
          <p className="text-xs font-medium text-teal-700">Cliente</p>
          <p className="text-sm font-semibold text-stone-800">{customer.name}</p>
        </div>
      )}

      {/* Items summary */}
      <div className="space-y-2 rounded-lg border border-stone-200 p-3">
        <p className="text-xs font-medium text-stone-500">Productos</p>
        {items.map((item) => (
          <div
            key={item.variantId}
            className="flex items-center justify-between text-sm"
          >
            <span className="text-stone-700">
              {item.productName}{" "}
              <span className="text-stone-400">× {item.quantity}</span>
            </span>
            <span className="font-medium text-stone-800">
              {formatCurrency(item.unitPrice * item.quantity)}
            </span>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="space-y-1 rounded-lg bg-stone-50 p-3">
        <div className="flex justify-between text-sm text-stone-600">
          <span>Subtotal</span>
          <span>{formatCurrency(getSubtotal())}</span>
        </div>
        {getItemsDiscount() > 0 && (
          <div className="flex justify-between text-sm text-teal-600">
            <span>Descuento</span>
            <span>-{formatCurrency(getItemsDiscount())}</span>
          </div>
        )}
        <div className="flex justify-between border-t border-stone-200 pt-1 text-base font-extrabold">
          <span className="text-stone-800">Total</span>
          <span className="text-rose-600">{formatCurrency(getTotal())}</span>
        </div>
      </div>

      {/* Payments summary */}
      <div className="space-y-1 rounded-lg border border-stone-200 p-3">
        <p className="text-xs font-medium text-stone-500">Pagos</p>
        {payments.map((p, i) => (
          <div key={i} className="flex justify-between text-sm">
            <span className="text-stone-700">
              {PAYMENT_METHODS[p.method]}
              {p.reference ? ` (${p.reference})` : ""}
            </span>
            <span className="font-medium">{formatCurrency(p.amount)}</span>
          </div>
        ))}
        {change > 0 && (
          <div className="flex justify-between border-t border-stone-200 pt-1 text-sm font-medium text-teal-600">
            <span>Cambio</span>
            <span>{formatCurrency(change)}</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2 pt-2">
        <Button
          onClick={handleComplete}
          disabled={submitting !== null}
          className="h-11 bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50"
        >
          {submitting === "complete" ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Check className="mr-2 h-4 w-4" />
          )}
          Completar venta
        </Button>
        <Button
          variant="outline"
          onClick={handlePending}
          disabled={submitting !== null}
          className="h-10 gap-2 border-amber-200 text-amber-700 hover:bg-amber-50"
        >
          {submitting === "pending" ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Clock className="mr-2 h-4 w-4" />
          )}
          Confirmar después
        </Button>
        <Button
          variant="ghost"
          onClick={onBack}
          disabled={submitting !== null}
          className="text-stone-500"
        >
          Atrás
        </Button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/features/pos/components/wizard-confirmation-step.tsx
git commit -m "feat(pos): add wizard confirmation step with pending sale option"
```

---

## Task 15: Sale Wizard — Products Step (empty cart flow)

**Files:**
- Create: `src/features/pos/components/wizard-products-step.tsx`

- [ ] **Step 1: Create products+cart combined step**

```typescript
"use client"

import { ArrowLeft, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { usePOSStore } from "../store"
import { POSProductGrid } from "./pos-product-grid"
import { useAddProductToCart } from "./pos-landing"
import type { POSProductWithImage } from "../queries"

interface WizardProductsStepProps {
  onNext: () => void
  onBack: () => void
}

export function WizardProductsStep({ onNext, onBack }: WizardProductsStepProps) {
  const items = usePOSStore((s) => s.items)
  const getTotal = usePOSStore((s) => s.getTotal)
  const getItemCount = usePOSStore((s) => s.getItemCount)
  const { handleAddProduct } = useAddProductToCart()

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h3 className="mb-1 text-lg font-bold text-stone-800">
          Agregar productos
        </h3>
        <p className="text-sm text-stone-500">
          Busca y agrega productos al carrito
        </p>
      </div>

      <POSProductGrid onAdd={handleAddProduct} />

      {/* Cart summary bar */}
      {items.length > 0 && (
        <div className="sticky bottom-0 flex items-center justify-between rounded-xl border border-stone-200 bg-white p-3 shadow-md">
          <p className="text-sm text-stone-600">
            <span className="font-bold text-stone-800">{getItemCount()}</span> productos •{" "}
            <span className="font-bold text-rose-600">
              {new Intl.NumberFormat("es-MX", {
                style: "currency",
                currency: "MXN",
              }).format(getTotal())}
            </span>
          </p>
          <Button
            onClick={onNext}
            className="bg-rose-600 text-white hover:bg-rose-700"
          >
            Continuar al pago
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )}

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Atrás
        </Button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/features/pos/components/wizard-products-step.tsx
git commit -m "feat(pos): add wizard products+cart step for empty cart flow"
```

---

## Task 16: Sale Wizard Modal (Orchestrator)

**Files:**
- Create: `src/features/pos/components/pos-sale-wizard.tsx`

- [ ] **Step 1: Create wizard orchestrator**

```typescript
"use client"

import { useState, useCallback, useRef } from "react"
import { X } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { usePOSStore } from "../store"
import { createSale, createPendingSale, completePendingSale } from "../actions"
import { WizardCustomerStep } from "./wizard-customer-step"
import { WizardPaymentStep } from "./wizard-payment-step"
import { WizardConfirmationStep } from "./wizard-confirmation-step"
import { WizardProductsStep } from "./wizard-products-step"
import type { CartPayment } from "../types"
import type { PendingSaleWithSummary } from "../types"

type WizardMode = "from-cart" | "new-sale" | "complete-pending"

interface POSSaleWizardProps {
  open: boolean
  onClose: () => void
  mode: WizardMode
  pendingSale?: PendingSaleWithSummary | null
  onPrint?: () => void
}

const STEPS_FROM_CART = ["customer", "payment", "confirmation"] as const
const STEPS_NEW_SALE = ["customer", "products", "payment", "confirmation"] as const
const STEPS_COMPLETE = ["payment", "confirmation"] as const

export function POSSaleWizard({
  open,
  onClose,
  mode,
  pendingSale,
  onPrint,
}: POSSaleWizardProps) {
  const steps =
    mode === "from-cart"
      ? STEPS_FROM_CART
      : mode === "new-sale"
      ? STEPS_NEW_SALE
      : STEPS_COMPLETE

  const [stepIndex, setStepIndex] = useState(0)
  const [payments, setPayments] = useState<CartPayment[]>([])
  const [saleResult, setSaleResult] = useState<{ sale_number: string } | null>(null)

  const queryClient = useQueryClient()
  const items = usePOSStore((s) => s.items)
  const customer = usePOSStore((s) => s.customer)
  const getSubtotal = usePOSStore((s) => s.getSubtotal)
  const getItemsDiscount = usePOSStore((s) => s.getItemsDiscount)
  const getTotal = usePOSStore((s) => s.getTotal)
  const globalDiscount = usePOSStore((s) => s.globalDiscount)
  const notes = usePOSStore((s) => s.notes)
  const clear = usePOSStore((s) => s.clear)

  const currentStep = steps[stepIndex]
  const total = mode === "complete-pending" ? (pendingSale?.total ?? 0) : getTotal()

  const goNext = useCallback(() => setStepIndex((i) => Math.min(i + 1, steps.length - 1)), [steps.length])
  const goBack = useCallback(() => setStepIndex((i) => Math.max(i - 1, 0)), [])

  const handlePaymentNext = useCallback(
    (paymentData: CartPayment[]) => {
      setPayments(paymentData)
      goNext()
    },
    [goNext]
  )

  const invalidateAll = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["pos-dashboard-stats"] })
    queryClient.invalidateQueries({ queryKey: ["pos-top-selling"] })
    queryClient.invalidateQueries({ queryKey: ["pos-recently-sold"] })
    queryClient.invalidateQueries({ queryKey: ["pos-pending-sales"] })
    queryClient.invalidateQueries({ queryKey: ["pos-all-products"] })
    queryClient.invalidateQueries({ queryKey: ["sales"] })
  }, [queryClient])

  const handleCompleteSale = useCallback(async () => {
    if (mode === "complete-pending" && pendingSale) {
      const result = await completePendingSale({
        sale_id: pendingSale.id,
        payments: payments.map((p) => ({
          method: p.method,
          amount: p.amount,
          reference: p.reference,
        })),
      })
      if (result.error) {
        const msg = "_form" in result.error ? result.error._form?.[0] : "Error al completar la venta"
        toast.error(msg)
        return
      }
      toast.success(`Venta ${pendingSale.sale_number} completada`)
      setSaleResult({ sale_number: pendingSale.sale_number })
      invalidateAll()
      return
    }

    const saleItems = items.map((item) => ({
      product_variant_id: item.variantId,
      product_name: item.productName,
      variant_label: item.variantLabel,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      unit_cost: item.unitCost,
      discount: item.discount,
    }))

    const result = await createSale({
      customer_id: customer?.id ?? null,
      items: saleItems,
      payments: payments.map((p) => ({
        method: p.method,
        amount: p.amount,
        reference: p.reference,
      })),
      discount_amount: globalDiscount,
      notes: notes || null,
    })

    if (result.error) {
      const msg = "_form" in result.error ? result.error._form?.[0] : "Error al crear la venta"
      toast.error(msg)
      return
    }

    toast.success(`Venta ${result.data!.sale_number} completada`)
    setSaleResult({ sale_number: result.data!.sale_number })
    clear()
    invalidateAll()
  }, [mode, pendingSale, items, customer, payments, globalDiscount, notes, clear, invalidateAll])

  const handlePendingSale = useCallback(async () => {
    const saleItems = items.map((item) => ({
      product_variant_id: item.variantId,
      product_name: item.productName,
      variant_label: item.variantLabel,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      unit_cost: item.unitCost,
      discount: item.discount,
    }))

    const result = await createPendingSale({
      customer_id: customer?.id ?? null,
      items: saleItems,
      discount_amount: globalDiscount,
      notes: notes || null,
    })

    if (result.error) {
      const msg = "_form" in result.error ? result.error._form?.[0] : "Error al guardar la venta"
      toast.error(msg)
      return
    }

    toast.success(`Venta ${result.data!.sale_number} guardada como pendiente`)
    setSaleResult({ sale_number: result.data!.sale_number })
    clear()
    invalidateAll()
  }, [items, customer, globalDiscount, notes, clear, invalidateAll])

  const handleClose = useCallback(() => {
    setStepIndex(0)
    setPayments([])
    setSaleResult(null)
    onClose()
  }, [onClose])

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto p-0">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-100 px-6 py-4">
          <div>
            <h2 className="text-base font-bold text-stone-800">
              {mode === "complete-pending" ? "Completar pago" : "Nueva venta"}
            </h2>
            {!saleResult && (
              <div className="mt-1 flex gap-1">
                {steps.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1 w-8 rounded-full ${
                      i <= stepIndex ? "bg-rose-500" : "bg-stone-200"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep + (saleResult ? "-done" : "")}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.15 }}
            >
              {currentStep === "customer" && (
                <WizardCustomerStep onNext={goNext} />
              )}
              {currentStep === "products" && (
                <WizardProductsStep onNext={goNext} onBack={goBack} />
              )}
              {currentStep === "payment" && (
                <WizardPaymentStep
                  total={total}
                  onNext={handlePaymentNext}
                  onBack={goBack}
                />
              )}
              {currentStep === "confirmation" && (
                <WizardConfirmationStep
                  payments={payments}
                  onCompleteSale={handleCompleteSale}
                  onPendingSale={handlePendingSale}
                  onPrint={onPrint ?? (() => {})}
                  onBack={goBack}
                  saleResult={saleResult}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/features/pos/components/pos-sale-wizard.tsx
git commit -m "feat(pos): add multi-step sale wizard modal"
```

---

## Task 17: POS Landing Page (Main Component)

**Files:**
- Create: `src/features/pos/components/pos-landing.tsx`
- Modify: `src/app/(dashboard)/pos/page.tsx`

- [ ] **Step 1: Create the landing page component**

```typescript
"use client"

import { useState, useCallback, useRef } from "react"
import { Plus } from "lucide-react"
import { AnimatePresence } from "motion/react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { useRealtimeSync } from "@/hooks/use-realtime"
import { useReactToPrint } from "react-to-print"
import { usePOSStore } from "../store"
import { resolvePrice } from "../utils"
import { useTopSellingProducts, useRecentlySoldProducts } from "../queries"
import type { POSProductWithImage } from "../queries"
import type { PendingSaleWithSummary } from "../types"
import { POSKpiWidgets } from "./pos-kpi-widgets"
import { POSPendingSales } from "./pos-pending-sales"
import { POSProductCarousel } from "./pos-product-carousel"
import { POSProductGrid } from "./pos-product-grid"
import { POSSlidingCart, POSCartFAB } from "./pos-sliding-cart"
import { POSSaleWizard } from "./pos-sale-wizard"
import { SaleReceipt } from "./sale-receipt"

// Exported so wizard-products-step can reuse
export function useAddProductToCart() {
  const addItem = usePOSStore((s) => s.addItem)
  const customer = usePOSStore((s) => s.customer)
  const items = usePOSStore((s) => s.items)

  const handleAddProduct = useCallback(
    async (product: POSProductWithImage) => {
      // For simple products (1 variant), add directly
      // For multi-variant, use the first active variant with available stock
      const availableVariants = product.product_variants.filter(
        (v) => v.is_active && v.stock - v.reserved_stock > 0
      )
      if (availableVariants.length === 0) return

      const variant = availableVariants[0]

      // Check if already in cart and at stock limit
      const existingItem = items.find((i) => i.variantId === variant.id)
      const availableStock = variant.stock - variant.reserved_stock
      if (existingItem && existingItem.quantity >= availableStock) return

      // Resolve price for customer
      let price = variant.price
      if (customer) {
        price = await resolvePrice(
          variant.id,
          variant.price,
          customer.priceListId,
          customer.discountPercent
        )
      }

      addItem({
        variantId: variant.id,
        productId: product.id,
        productName: product.name,
        variantLabel: variant.name ?? product.name,
        sku: variant.sku,
        unitPrice: price,
        unitCost: variant.cost,
        stock: availableStock,
      })
    },
    [addItem, customer, items]
  )

  return { handleAddProduct }
}

export function POSLanding() {
  const [wizardOpen, setWizardOpen] = useState(false)
  const [wizardMode, setWizardMode] = useState<"from-cart" | "new-sale" | "complete-pending">("from-cart")
  const [pendingSaleToComplete, setPendingSaleToComplete] = useState<PendingSaleWithSummary | null>(null)
  const [mobileCartOpen, setMobileCartOpen] = useState(false)

  const items = usePOSStore((s) => s.items)
  const receiptRef = useRef<HTMLDivElement>(null)

  const { data: topSelling } = useTopSellingProducts(10)
  const { data: recentlySold } = useRecentlySoldProducts(10)

  const { handleAddProduct } = useAddProductToCart()

  // Realtime sync
  useRealtimeSync("product_variants", ["pos-all-products", "pos-top-selling", "pos-recently-sold"])
  useRealtimeSync("sales", ["pos-dashboard-stats", "pos-pending-sales", "sales"])

  const handlePrint = useReactToPrint({
    contentRef: receiptRef,
  })

  const openCheckoutWizard = useCallback(() => {
    setWizardMode("from-cart")
    setPendingSaleToComplete(null)
    setWizardOpen(true)
  }, [])

  const openNewSaleWizard = useCallback(() => {
    setWizardMode("new-sale")
    setPendingSaleToComplete(null)
    setWizardOpen(true)
  }, [])

  const openCompletePendingWizard = useCallback((sale: PendingSaleWithSummary) => {
    setWizardMode("complete-pending")
    setPendingSaleToComplete(sale)
    setWizardOpen(true)
  }, [])

  const hasItems = items.length > 0

  return (
    <div className="flex gap-4">
      {/* Main content */}
      <div className="min-w-0 flex-1">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-stone-800">Punto de venta</h1>
            <p className="text-xs text-stone-400">
              {format(new Date(), "EEEE, d 'de' MMMM yyyy", { locale: es })}
            </p>
          </div>
          <Button
            onClick={openNewSaleWizard}
            className="gap-2 bg-rose-600 text-white hover:bg-rose-700"
          >
            <Plus className="h-4 w-4" />
            Nueva venta
          </Button>
        </div>

        {/* KPI widgets */}
        <POSKpiWidgets />

        {/* Pending sales */}
        <POSPendingSales onComplete={openCompletePendingWizard} />

        {/* Top selling carousel */}
        <POSProductCarousel
          title="Más vendidos"
          icon="🔥"
          products={topSelling ?? []}
          onAdd={handleAddProduct}
        />

        {/* Recently sold carousel */}
        <POSProductCarousel
          title="Vendidos recientemente"
          icon="🕐"
          products={recentlySold ?? []}
          onAdd={handleAddProduct}
        />

        {/* Full product grid */}
        <POSProductGrid onAdd={handleAddProduct} />
      </div>

      {/* Sliding cart sidebar (desktop) */}
      <AnimatePresence>
        {hasItems && (
          <div className="hidden sm:block">
            <POSSlidingCart onCheckout={openCheckoutWizard} />
          </div>
        )}
      </AnimatePresence>

      {/* Mobile cart FAB */}
      <AnimatePresence>
        {hasItems && (
          <POSCartFAB onClick={() => setMobileCartOpen(true)} />
        )}
      </AnimatePresence>

      {/* Mobile cart overlay */}
      {mobileCartOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 sm:hidden" onClick={() => setMobileCartOpen(false)}>
          <div className="absolute bottom-0 left-0 right-0 max-h-[80vh] overflow-y-auto rounded-t-2xl bg-white p-4" onClick={(e) => e.stopPropagation()}>
            <POSSlidingCart onCheckout={() => { setMobileCartOpen(false); openCheckoutWizard() }} />
          </div>
        </div>
      )}

      {/* Sale wizard modal */}
      <POSSaleWizard
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        mode={wizardMode}
        pendingSale={pendingSaleToComplete}
        onPrint={handlePrint}
      />

      {/* Hidden receipt for printing */}
      <div className="hidden">
        <SaleReceipt ref={receiptRef} />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Update the page.tsx to use POSLanding**

Replace the content of `src/app/(dashboard)/pos/page.tsx`:

```typescript
"use client"

import { POSLanding } from "@/features/pos/components/pos-landing"

export default function POSPage() {
  return <POSLanding />
}
```

- [ ] **Step 3: Commit**

```bash
git add src/features/pos/components/pos-landing.tsx src/app/(dashboard)/pos/page.tsx
git commit -m "feat(pos): add POS landing page with dashboard layout and wizard integration"
```

---

## Task 18: Integration, Fixes & Polish

**Files:**
- Various files may need adjustments after initial integration

- [ ] **Step 1: Run the dev server and verify the page loads**

```bash
npm run dev
```

Navigate to `http://localhost:3000/pos` and verify:
- KPI widgets render (may show $0 if no sales today)
- Pending sales widget appears (if any pending sales)
- Carousels render (if any sales history)
- Product grid loads with all products
- Search and category filter work

- [ ] **Step 2: Test the add-to-cart flow**

- Click "+ Agregar" on a product card
- Verify sidebar slides in from the right
- Verify quantity controls work (±)
- Verify stock limits are enforced
- Add multiple products

- [ ] **Step 3: Test the checkout wizard flow (from cart)**

- Click "Confirmar venta →" on sidebar
- Step 1: Search and select a customer, or skip
- Step 2: Select payment method, enter amount
- Step 3: Click "Completar venta" — verify toast + success state
- Test "Confirmar después" — verify pending sale is created

- [ ] **Step 4: Test the new sale wizard flow (empty cart)**

- Click "+ Nueva venta" button in header
- Step 1: Select customer
- Step 2: Browse and add products in the wizard
- Step 3: Payment
- Step 4: Confirmation

- [ ] **Step 5: Test pending sale completion**

- Create a pending sale
- Verify it appears in the pending sales widget
- Click "Completar pago"
- Go through payment wizard
- Verify sale completes

- [ ] **Step 6: Run type-check and lint**

```bash
npm run type-check && npm run lint
```

Fix any TypeScript or ESLint errors.

- [ ] **Step 7: Fix the product grid column count when sidebar is open**

The grid should use fewer columns when the cart sidebar is visible. In `pos-product-grid.tsx`, the parent `pos-landing.tsx` handles the layout compression via flexbox, but verify the grid adapts. If needed, pass a `compact` prop:

In `pos-product-grid.tsx`, update the grid class:

```typescript
<div className={`grid gap-3 ${
  compact
    ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-4"
    : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
}`}>
```

- [ ] **Step 8: Commit all fixes**

```bash
git add -A
git commit -m "fix(pos): integration fixes and polish for POS redesign"
```

---

## Task 19: Ventas Page — Pending Sales Integration

**Files:**
- Modify: `src/features/ventas/` (types, queries, components)

- [ ] **Step 1: Add pending status badge and filter**

In the ventas sales table, ensure:
- "Pendiente" status shows with amber badge (alongside existing quote/completed/cancelled badges)
- Add "Pendientes" tab to the filter tabs
- Add "Completar pago" and "Cancelar" actions for pending sales

- [ ] **Step 2: Add complete/cancel actions to the ventas table**

The actions dropdown for pending sales should include:
- "Completar pago" → opens a simplified payment dialog or navigates to POS
- "Cancelar venta" → calls `cancelPendingSale()` with confirmation dialog

- [ ] **Step 3: Commit**

```bash
git add src/features/ventas/
git commit -m "feat(ventas): add pending sale status, complete/cancel actions"
```

---

## Task 20: Final Verification

- [ ] **Step 1: Run full type-check**

```bash
npm run type-check
```

- [ ] **Step 2: Run lint**

```bash
npm run lint
```

- [ ] **Step 3: Run build**

```bash
npm run build
```

- [ ] **Step 4: Manual E2E test**

Test the complete flows:
1. Add products from carousels → checkout → complete sale
2. Add products from grid → checkout → pending sale → complete later
3. New sale wizard (empty cart) → full flow
4. Cancel a pending sale → verify stock unreserved
5. Mobile layout verification

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "feat(pos): complete POS redesign — dashboard, wizard, pending sales"
```
