# Debouncing & Duplicate-Action Hardening — Audit Report

Session date: 2026-04-16
Status: **Implementation complete**, awaiting end-to-end browser verification.

This document catalogs every change made during the cross-module audit of CRUD
debouncing and duplicate-action prevention. Use it as the starting point for
verification, regression testing, or follow-up work.

---

## 1. Methodology

Every CRUD path was graded against a 4-layer rubric:

| Layer | What it guarantees |
|-------|--------------------|
| **L1 — Button gate** | Submit/confirm button is `disabled` while a request is in flight. |
| **L2 — Mutation gate** | Component uses TanStack `useMutation` (or equivalent ref/state) and reads `isPending` in the UI. No raw `await action()` from `onClick` that ignores pending state. |
| **L3 — Server gate** | Server action detects "already done" state before mutating — status check, unique constraint pre-check, idempotency key lookup. |
| **L4 — DB gate** | The RPC or SQL uses `FOR UPDATE` + status re-check inside the transaction, **or** a unique index catches races. |

High-risk mutations (money, stock, irreversible status transitions) must have **L3 + L4**.
Low-risk ones can get by with **L1 + L2**.

Phase 1A+1B audit covered all 11 feature modules (60 server actions). Atomic
RPC verification ran directly against Postgres via MCP. Phase 2 triage produced
a ranked punch list; Phases 3 (Wave 1 → 3) implemented the fixes.

---

## 2. RPC verification (Phase 1C)

Queried live RPC bodies to confirm `FOR UPDATE` + status re-check. Results as
of the audit:

| RPC | FOR UPDATE | Status check | Notes |
|-----|:---:|:---:|---|
| `cancel_sale` | ✅ | ✅ | safe |
| `cancel_return` | ✅ | ✅ | safe |
| `cancel_pending_sale` | ✅ | ✅ | safe |
| `complete_pending_sale` | ✅ | ✅ | safe |
| `complete_vale` | ✅ | ✅ | safe |
| `settle_credit_note` | ✅ | ✅ | safe |
| `create_sale_transaction` | ✅ | ✅ | safe |
| `create_return_transaction` | ✅ | ✅ | safe |
| `create_distributor_credit_note` | ✅ | n/a | INSERT-only |
| `create_pending_sale` | ✅ | n/a | INSERT-only |
| `create_vale` | ❌ | ❌ | INSERT-only; app-layer L1+L2 |
| `cancel_vale` | **new** ✅ | **new** ✅ | introduced in Wave 2.1 |

This meant several gaps initially flagged CRITICAL (double-complete vale,
double-settle credit note) were actually already protected at L4 and only
needed better app-layer UX.

---

## 3. DB migrations applied

Applied to project `lccclwtwkegbvlpdwisu` (Zenith System).

```sql
-- Wave 1.2 — Inventario idempotency
ALTER TABLE inventory_movements
  ADD COLUMN IF NOT EXISTS idempotency_key TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS inventory_movements_idempotency_key_idx
  ON inventory_movements (tenant_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;

-- Wave 1.3 — Ventas idempotency
ALTER TABLE returns
  ADD COLUMN IF NOT EXISTS idempotency_key TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS returns_idempotency_key_idx
  ON returns (tenant_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;

-- Wave 2.1 — Atomic cancel_vale
CREATE OR REPLACE FUNCTION public.cancel_vale(
  p_vale_id uuid,
  p_tenant_id uuid,
  p_created_by uuid DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE v_vale RECORD;
BEGIN
  SELECT id, vale_number, status INTO v_vale
  FROM vales
  WHERE id = p_vale_id AND tenant_id = p_tenant_id AND deleted_at IS NULL
  FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'Vale no encontrado'; END IF;

  IF v_vale.status = 'cancelled' THEN
    RETURN jsonb_build_object('id', v_vale.id, 'vale_number', v_vale.vale_number, 'already_cancelled', true);
  END IF;

  IF v_vale.status NOT IN ('pending', 'ready') THEN
    RAISE EXCEPTION 'El vale ya fue completado, no se puede cancelar';
  END IF;

  UPDATE vales SET status = 'cancelled', updated_at = now() WHERE id = p_vale_id;
  RETURN jsonb_build_object('id', v_vale.id, 'vale_number', v_vale.vale_number, 'cancelled_at', now());
END;
$$;

-- Wave 2.2 — Productos unique join
CREATE UNIQUE INDEX IF NOT EXISTS product_categories_unique_pair_idx
  ON product_categories (tenant_id, product_id, category_id);

-- Wave 2.3 — Clientes unique client_number per tenant
CREATE UNIQUE INDEX IF NOT EXISTS customers_tenant_client_number_idx
  ON customers (tenant_id, client_number)
  WHERE client_number IS NOT NULL AND deleted_at IS NULL;
```

The `src/types/database.ts` file was manually augmented with the two new
`idempotency_key` columns. If someone regenerates types with the Supabase CLI,
they should match.

---

## 4. Application-layer changes by module

### 4.1 — POS (`src/features/pos/components/payment-dialog.tsx`)
- Replaced `useState(isSubmitting)` + `await createSale()` with TanStack `useMutation`.
- Button `disabled={saleMutation.isPending}`.
- `Dialog onOpenChange` blocks close while `saleMutation.isPending` (no more ESC/overlay mid-flight).
- Cart snapshot captured **before** mutation fires so the receipt survives `store.clear()` even on race conditions.
- `try/catch` around `mutateAsync` for network-failure resilience.

### 4.2 — Inventario (4 stock actions + initial-load override)
- `src/features/inventario/schemas.ts` — added optional `idempotency_key: z.string().regex(uuidPattern).optional()` to `stockAdjustmentSchema`, `stockEntrySchema`, `initialLoadOverrideSchema`.
- `src/features/inventario/actions.ts` — new helper `lookupExistingMovement()`:
  - Pre-check: if key already exists, return existing movement (no stock re-read).
  - 23505 fallback: narrow-race duplicate hits unique index, we swallow and return the winning row.
- Dialogs (`stock-adjustment-dialog.tsx`, `stock-entry-dialog.tsx`, `initial-load-edit-dialog.tsx`):
  - Fresh `crypto.randomUUID()` per form session.
  - `submittingRef` gates parent Dialog's `onOpenChange` (ESC/overlay ignored during submit).
  - `handleSubmit` early-returns if already pending.

### 4.3 — Ventas (`createReturn`)
- `src/features/ventas/schemas.ts` — added `idempotency_key` to `createReturnSchema`.
- `src/features/ventas/actions.ts` — pre-check by key returns the existing return's `{ return_id, return_number, total_refund, sale_status }`. After RPC success, tags the new return with the key. Parallel-race loser swallows 23505 silently.
- `return-dialog.tsx` — fresh key regenerated on `saleId` change; passed to action; Dialog `onOpenChange` blocked while `isSubmitting`.

### 4.4 — Vales (`cancelVale`)
- `src/features/vales/actions.ts` — `cancelVale` now calls the new atomic RPC `cancel_vale` instead of `.in("status", [...])` PostgREST filter. Idempotent on retry (returns `already_cancelled: true` rather than erroring).

### 4.5 — Productos
- `src/features/productos/actions.ts` — `assignProductToCategory` catches 23505 and surfaces `"El producto ya pertenece a esta categoria"` (defense-in-depth over existing pre-check).
- `src/features/productos/components/category-manager.tsx` — DnD handler uses `reorderingRef` to drop rapid drags fired while a previous reorder is in flight.

### 4.6 — Clientes
- `src/features/clientes/actions.ts` — `createCustomer` + `updateCustomer` catch 23505 on the new `client_number` partial unique index and surface a field-level error (`{ client_number: ["Ya existe un cliente con este número"] }`).
- `src/features/clientes/components/customer-price-editor.tsx` — `OverrideRow` now takes `isDeleting` prop; delete button shows spinner and is disabled while the mutation is in flight.

### 4.7 — Configuracion (purge destructive actions)
- `src/features/configuracion/components/dev-panel.tsx` — each of the 4 purge `DangerZoneCard`s now has a distinct `confirmWord`:
  - `ELIMINAR PRODUCTOS`
  - `ELIMINAR VENTAS`
  - `ELIMINAR CLIENTES`
  - `ELIMINAR INVENTARIO`
- `purgeAll` already had `RESET` before the audit.

### 4.8 — Media (`BulkActionToolbar`)
- `src/features/media/components/bulk-action-toolbar.tsx` — `handleBatchOptimize` and `handleRecompress` now track a `Set<productId>` per batch and skip already-processed products. Multi-variant selections of the same product no longer upload the same file multiple times to Supabase Storage.

### 4.9 — Reportes (`logExport`)
- `src/features/reportes/actions.ts` — 5-second dedup window per `(tenant, exported_by, report_name, format)`. Double-clicks within the window don't write duplicate audit rows.

### 4.10 — Shared helper
- `src/components/shared/guarded-dialog.tsx` — `GuardedDialog` wraps `Dialog` and takes an `isSubmitting` prop. Blocks `onOpenChange(false)` when truthy. Available for new dialogs; existing usages still use their inline `submittingRef` pattern (equivalent behavior).

---

## 5. Modules left intentionally unchanged

| Module | Reason |
|--------|--------|
| **auth** | Supabase handles login/logout idempotency natively; repeated calls are no-ops. |
| **ayuda** | Static content only; no mutations. |
| **productos/createProduct** | Existing unique slug + unique SKU + image upsert already cover the double-submit scenarios. |
| **clientes/setCustomerPrice** | Upsert with `onConflict: "price_list_id,product_variant_id"` is idempotent by design. |
| **transit weeks** | Existing partial unique index on `(tenant_id, year, month, week_number) WHERE deleted_at IS NULL` and the app's 23505 handling were already correct. |

---

## 6. Manual verification checklist

Boot the dev server (`npm run dev`) and walk through each scenario. "Pass"
means the second action is silently suppressed and no duplicate rows appear in
the DB.

### Critical flows (do these first)

- [ ] **POS: rapid double-click on "Confirmar venta"** — should create exactly one sale. Press ESC while the mutation is in flight — dialog should stay open.
- [ ] **POS: open payment dialog, confirm, immediately press ESC before response** — receipt should still render (cart snapshot survives).
- [ ] **Stock adjustment: rapid-click Save** — exactly one movement row. Verify in `inventory_movements` (filter by `created_at` within the last minute).
- [ ] **Stock entry: same test** — exactly one row.
- [ ] **Initial-load edit: same test** — exactly one movement row (if stock changed).
- [ ] **Return dialog: rapid double-click Confirm** — exactly one `returns` row, exactly one stock reversal per item.
- [ ] **Vale cancel: click twice fast on "Cancelar"** — should succeed once, show cancelled state. Click again after success (idempotent retry) — no error, confirms `already_cancelled: true` behavior.

### Medium priority

- [ ] **Category drag-reorder: drag category multiple times rapidly** — only first reorder actually fires server-side (check Network tab).
- [ ] **Assign product to category twice** (simulate via two tabs if possible) — second fails with "El producto ya pertenece a esta categoria".
- [ ] **Customer create with duplicate `client_number`** — `client_number` field shows "Ya existe un cliente con este número".
- [ ] **CustomerPriceEditor: rapid-click delete on a price override** — delete button spinners and disables; no double call.
- [ ] **Dev panel purge buttons** — confirm the distinct `confirmWord` phrases are required before each purge enables.
- [ ] **Media bulk optimize with duplicate productIds in selection** — only one upload per productId in Network tab.
- [ ] **Reportes: double-click an export button** — only one row appears in `export_logs` for the 5-second window.

### DB-level spot checks

After manual testing, run these queries via Supabase MCP to catch regressions:

```sql
-- Any inventory movements created within 1 second of each other for the same variant + user?
SELECT product_variant_id, created_by, COUNT(*)
FROM inventory_movements
WHERE created_at > now() - interval '1 hour'
GROUP BY product_variant_id, created_by, (extract(epoch from created_at)::int)
HAVING COUNT(*) > 1;

-- Any returns with the same idempotency_key? (Should be zero thanks to the unique index, but verifies the index is populating.)
SELECT idempotency_key, COUNT(*)
FROM returns
WHERE idempotency_key IS NOT NULL
GROUP BY idempotency_key
HAVING COUNT(*) > 1;

-- Duplicate product_categories rows?
SELECT tenant_id, product_id, category_id, COUNT(*)
FROM product_categories
GROUP BY tenant_id, product_id, category_id
HAVING COUNT(*) > 1;

-- Duplicate client_numbers per tenant?
SELECT tenant_id, client_number, COUNT(*)
FROM customers
WHERE client_number IS NOT NULL AND deleted_at IS NULL
GROUP BY tenant_id, client_number
HAVING COUNT(*) > 1;
```

All four queries should return **zero rows**.

---

## 7. Known gaps (accepted for this pass)

1. **Stock-movement read-modify-write race**: two concurrent adjustments for the same variant will both read the same `currentStock` and the second write clobbers the first (stock value ends up correct only if both writes target the same final stock). The idempotency key prevents duplicate *movements* but not the lost-update race. Fix requires either an RPC wrapping the R-M-W in a transaction or optimistic concurrency via a `stock_version` column. Not addressed in this audit.
2. **`create_vale` RPC** is INSERT-only; no FOR UPDATE is meaningful. A fast double-click would create two vales with different sequential numbers before the app-layer L1 gate engages. In practice L1+L2 prevent this; tighter protection would require an advisory lock keyed on customer+cart hash.
3. **`GuardedDialog`** exists but is not yet adopted by existing dialogs. Each Wave-1/2 dialog rolls its own gating. Future refactor opportunity, not a correctness issue.

---

## 8. Files touched

New:
- `src/components/shared/guarded-dialog.tsx`
- `DEBOUNCING-AUDIT.md` (this file)

Modified (audit-related):
- `src/features/pos/components/payment-dialog.tsx`
- `src/features/inventario/actions.ts`
- `src/features/inventario/schemas.ts`
- `src/features/inventario/components/initial-load-edit-dialog.tsx`
- `src/features/inventario/components/stock-adjustment-dialog.tsx`
- `src/features/inventario/components/stock-entry-dialog.tsx`
- `src/features/ventas/actions.ts`
- `src/features/ventas/schemas.ts`
- `src/features/ventas/components/return-dialog.tsx`
- `src/features/vales/actions.ts`
- `src/features/productos/actions.ts`
- `src/features/productos/components/category-manager.tsx`
- `src/features/clientes/actions.ts`
- `src/features/clientes/components/customer-price-editor.tsx`
- `src/features/configuracion/components/dev-panel.tsx`
- `src/features/media/components/bulk-action-toolbar.tsx`
- `src/features/reportes/actions.ts`
- `src/types/database.ts` (manual augmentation for new columns)

Type check after all changes: `npx tsc --noEmit` → clean.
