# POS Backend Hardening — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Harden every server action, schema, and client-side flow in the POS module so sales are created correctly, edge cases are caught with clear Spanish error messages, and the UI degrades gracefully when the network drops.

**Architecture:** Three layers — (1) Zod schemas catch malformed input, (2) server actions validate business rules before calling Supabase RPCs, (3) client components wrap every mutation call in try/catch, show toasts, and disable UI when offline. No new tables or RPCs required — all fixes are in the application layer.

**Tech Stack:** Next.js Server Actions, Zod 4, Supabase RPC, TanStack Query, Zustand, Sonner toasts

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `src/features/pos/schemas.ts` | Modify | Add `.min(1)` to createSale payments, tighten constraints |
| `src/features/pos/actions.ts` | Modify | Auth guard, humanized errors, idempotency headers |
| `src/features/pos/utils.ts` | Modify | Wrap resolvePrice in try/catch |
| `src/hooks/use-online-status.ts` | Create | Online/offline detection hook |
| `src/features/pos/components/pos-sale-wizard.tsx` | Modify | try/catch on every mutation, offline guard, success toast |
| `src/features/pos/components/wizard-customer-step.tsx` | Modify | Handle resolvePrice failure |
| `src/features/pos/components/wizard-products-step.tsx` | Modify | Validate cart before advancing |
| `src/features/pos/components/wizard-payment-step.tsx` | Modify | Validate payment covers total on submit |
| `src/features/pos/components/wizard-confirmation-step.tsx` | Modify | Already handles submitting states, add offline guard |
| `src/features/pos/components/pos-landing.tsx` | Modify | try/catch on handleAddProduct, offline banner |
| `src/features/pos/components/pos-sliding-cart.tsx` | Modify | Stock freshness check before checkout |

---

### Task 1: Harden Zod Schemas

**Files:**
- Modify: `src/features/pos/schemas.ts`

- [ ] **Step 1: Add payments min(1) to createSaleSchema**

The schema currently accepts an empty payments array. The server action catches this at line 44 but the schema should enforce it:

```typescript
// In createSaleSchema — line 24
// BEFORE:
payments: z.array(paymentSchema),
// AFTER:
payments: z.array(paymentSchema).min(1, "Registra al menos un pago"),
```

- [ ] **Step 2: Add unit_price positive check to cartItemSchema**

Currently `min(0)` allows $0 prices. For POS sales (not quotes), prices should be positive. Since the same schema is used for quotes that could have $0, keep `min(0)` but add a comment documenting the decision:

```typescript
// $0 is allowed for bundle components / promotional items
unit_price: z.number().min(0, "El precio no puede ser negativo"),
unit_cost: z.number().min(0, "El costo no puede ser negativo"),
```

No change needed — this is already correct. Leave as-is.

- [ ] **Step 3: Commit**

```bash
git add src/features/pos/schemas.ts
git commit -m "fix(pos): enforce min 1 payment in createSaleSchema"
```

---

### Task 2: Harden Server Actions — Auth & Error Handling

**Files:**
- Modify: `src/features/pos/actions.ts`

- [ ] **Step 1: Add auth guard to getUserId**

Currently `getUserId()` silently returns `null` if no session. Every action should fail fast with a clear error when unauthenticated:

```typescript
async function requireUserId(): Promise<string> {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("NO_AUTH")
  return user.id
}
```

- [ ] **Step 2: Replace getUserId with requireUserId in createSale**

Wrap the entire action body in a try/catch. If `requireUserId` throws `"NO_AUTH"`, return a human error:

```typescript
export async function createSale(input: CreateSaleInput) {
  const parsed = createSaleSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  let userId: string
  try {
    userId = await requireUserId()
  } catch {
    return { error: { _form: ["Tu sesion expiro. Vuelve a iniciar sesion."] } }
  }

  // ... rest of the function, replacing `await getUserId()` with `userId`
```

- [ ] **Step 3: Apply the same auth pattern to createPendingSale**

Replace the inline `supabase.auth.getUser()` call (lines 198-200) with `requireUserId()` in a try/catch, same pattern as step 2.

- [ ] **Step 4: Apply to completePendingSale and cancelPendingSale**

Same pattern. `cancelPendingSale` currently doesn't check auth at all — add `requireUserId()` to it too (the RPC needs `p_created_by` for audit trail even though it doesn't currently require it).

- [ ] **Step 5: Add human-readable error extraction helper**

Add at the top of actions.ts:

```typescript
function extractError(error: unknown, fallback: string): { error: { _form: string[] } } {
  if (error && typeof error === "object" && "message" in error) {
    const msg = (error as { message: string }).message
    // Translate common Supabase/PG errors to Spanish
    if (msg.includes("sales_status_check")) {
      return { error: { _form: ["El estado de la venta no permite esta operacion."] } }
    }
    if (msg.includes("check_stock_positive")) {
      return { error: { _form: ["Stock insuficiente para uno o mas productos."] } }
    }
    if (msg.includes("duplicate key")) {
      return { error: { _form: ["Operacion duplicada. Intenta de nuevo."] } }
    }
    return { error: { _form: [msg] } }
  }
  return { error: { _form: [fallback] } }
}
```

- [ ] **Step 6: Use extractError in all RPC error handlers**

Replace every `if (error) return { error: { _form: [error.message] } }` with:

```typescript
if (error) return extractError(error, "Error al crear la venta")
```

Apply to: `createSale` (line 89), `createPendingSale` (line 225), `completePendingSale` (line 249), `cancelPendingSale` (line 267).

- [ ] **Step 7: Commit**

```bash
git add src/features/pos/actions.ts
git commit -m "fix(pos): auth guard, humanized error messages in all server actions"
```

---

### Task 3: Create Online Status Hook

**Files:**
- Create: `src/hooks/use-online-status.ts`

- [ ] **Step 1: Implement the hook**

```typescript
import { useSyncExternalStore } from "react"

function subscribe(callback: () => void) {
  window.addEventListener("online", callback)
  window.addEventListener("offline", callback)
  return () => {
    window.removeEventListener("online", callback)
    window.removeEventListener("offline", callback)
  }
}

function getSnapshot() {
  return navigator.onLine
}

function getServerSnapshot() {
  return true
}

export function useOnlineStatus() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/use-online-status.ts
git commit -m "feat: add useOnlineStatus hook for offline detection"
```

---

### Task 4: Harden resolvePrice / resolvePrices

**Files:**
- Modify: `src/features/pos/utils.ts`

- [ ] **Step 1: Wrap resolvePrice in try/catch, fallback to basePrice**

If the Supabase query fails (network error), the function should gracefully return the basePrice instead of throwing:

```typescript
export async function resolvePrice(
  variantId: string,
  basePrice: number,
  priceListId: string | null,
  discountPercent: number
): Promise<number> {
  if (!priceListId) return basePrice

  try {
    const supabase = createClient()

    // Check for specific customer price
    const { data: specificPrice } = await supabase
      .from("customer_prices")
      .select("price")
      .eq("price_list_id", priceListId)
      .eq("product_variant_id", variantId)
      .maybeSingle()

    if (specificPrice?.price != null) {
      return Math.round(Number(specificPrice.price) * 100) / 100
    }

    // Apply percentage discount
    if (discountPercent > 0) {
      return Math.round(basePrice * (1 - discountPercent / 100) * 100) / 100
    }

    return basePrice
  } catch {
    // Network failure — fall back to base price
    return basePrice
  }
}
```

Apply the same try/catch pattern to `resolvePrices`.

- [ ] **Step 2: Commit**

```bash
git add src/features/pos/utils.ts
git commit -m "fix(pos): resolvePrice falls back to basePrice on network error"
```

---

### Task 5: Harden the Sale Wizard Orchestrator

**Files:**
- Modify: `src/features/pos/components/pos-sale-wizard.tsx`

- [ ] **Step 1: Add online status import and offline-aware mutation wrapper**

At the top of the file, add:

```typescript
import { useOnlineStatus } from "@/hooks/use-online-status"
```

Inside the component, add:

```typescript
const isOnline = useOnlineStatus()
```

- [ ] **Step 2: Wrap handleCompleteSale in try/catch for network errors**

The current code calls `createSale(...)` or `completePendingSale(...)` and checks `result.error`. But if the network is down, the server action call itself throws (no HTTP response). Wrap the entire function:

```typescript
const handleCompleteSale = useCallback(async () => {
  if (!isOnline) {
    toast.error("Sin conexion", {
      description: "Revisa tu conexion a internet e intenta de nuevo.",
    })
    return
  }

  try {
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
        const msg =
          "_form" in result.error
            ? (result.error._form as string[])[0]
            : "Error al completar la venta"
        toast.error(msg)
        return
      }
      setSaleResult({ sale_number: result.data!.sale_number })
      toast.success(`Venta ${result.data!.sale_number} completada`)
    } else {
      // ... same pattern for createSale, add try/catch and success toast
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
        const msg =
          "_form" in result.error
            ? (result.error._form as string[])[0]
            : "Error al crear la venta"
        toast.error(msg)
        return
      }
      setSaleResult({ sale_number: result.data!.sale_number })
      toast.success(`Venta ${result.data!.sale_number} completada`)
      clear()
    }

    queryClient.invalidateQueries({ queryKey: ["sales"] })
    queryClient.invalidateQueries({ queryKey: ["inventory"] })
    queryClient.invalidateQueries({ queryKey: ["dashboard"] })
    queryClient.invalidateQueries({ queryKey: ["pos"] })
    queryClient.invalidateQueries({ queryKey: ["pending-sales"] })
  } catch {
    toast.error("Error de conexion", {
      description: "No se pudo conectar con el servidor. Intenta de nuevo.",
    })
  }
}, [isOnline, mode, pendingSale, items, customer, globalDiscount, notes, payments, clear, queryClient])
```

- [ ] **Step 3: Wrap handlePendingSale with same pattern**

Add offline check + try/catch + success toast:

```typescript
const handlePendingSale = useCallback(async () => {
  if (!isOnline) {
    toast.error("Sin conexion", {
      description: "Revisa tu conexion a internet e intenta de nuevo.",
    })
    return
  }

  try {
    // ... existing logic ...
    // After success:
    toast.success("Venta guardada como pendiente", {
      description: "Recuerda cobrar esta venta desde la seccion de ventas pendientes.",
    })
  } catch {
    toast.error("Error de conexion", {
      description: "No se pudo conectar con el servidor. Intenta de nuevo.",
    })
  }
}, [...deps, isOnline])
```

- [ ] **Step 4: Commit**

```bash
git add src/features/pos/components/pos-sale-wizard.tsx
git commit -m "fix(pos): offline guard, network error handling, success toasts in wizard"
```

---

### Task 6: Harden Customer Step — Price Resolution Failure

**Files:**
- Modify: `src/features/pos/components/wizard-customer-step.tsx`

- [ ] **Step 1: Wrap handleSelect price resolution in try/catch**

The customer step calls `resolvePrices()` which queries Supabase. If the network is flaky, this can fail. The function itself now falls back to basePrice (Task 4), but the dynamic import of `createClient` and the `supabase.from()` call before it could also fail:

```typescript
const handleSelect = useCallback(
  async (raw: { ... }) => {
    const cartCustomer: CartCustomer = { ... }
    setCustomer(cartCustomer)

    if (items.length > 0) {
      try {
        const { createClient } = await import("@/lib/supabase/client")
        const supabase = createClient()
        const { data: variantData } = await supabase
          .from("product_variants")
          .select("id, price")
          .in("id", items.map((i) => i.variantId))

        if (variantData) {
          const basePrices = items.map((i) => {
            const dbVariant = variantData.find((d) => d.id === i.variantId)
            return {
              variantId: i.variantId,
              basePrice: dbVariant ? Number(dbVariant.price) : i.unitPrice,
            }
          })

          const priceMap = await resolvePrices(
            basePrices,
            cartCustomer.priceListId,
            cartCustomer.discountPercent
          )

          for (const [variantId, price] of priceMap) {
            updateItemPrice(variantId, price)
          }
        }
      } catch {
        // Price resolution failed — customer is still selected,
        // prices stay at their current values. Show a warning.
        toast.warning("No se pudieron actualizar los precios", {
          description: "Los precios del carrito podrian no reflejar el descuento del cliente.",
        })
      }
    }

    setSearch("")
  },
  [setCustomer, items, updateItemPrice]
)
```

Add `import { toast } from "sonner"` at the top.

- [ ] **Step 2: Commit**

```bash
git add src/features/pos/components/wizard-customer-step.tsx
git commit -m "fix(pos): handle price resolution failure in customer step"
```

---

### Task 7: Harden Products Step — Cart Validation

**Files:**
- Modify: `src/features/pos/components/wizard-products-step.tsx`

- [ ] **Step 1: Block advancement with empty cart**

The "Continuar" button already has `disabled={!hasItems}` so the user can't click it. This is sufficient — no server-side validation needed here since the schema enforces `items.min(1)`.

No code change needed. Mark complete.

- [ ] **Step 2: Wrap handleAddProduct in try/catch**

If `resolvePrice` fails (network), the product should still be added at base price:

```typescript
const handleAddProduct = useCallback(
  async (product: POSProductWithImage) => {
    const availableVariants = product.product_variants.filter(
      (v) => v.is_active && v.stock - v.reserved_stock > 0
    )
    if (availableVariants.length === 0) return

    const variant = availableVariants[0]
    const existingItem = items.find((i) => i.variantId === variant.id)
    const availableStock = variant.stock - variant.reserved_stock
    if (existingItem && existingItem.quantity >= availableStock) return

    let price = variant.price
    if (customer) {
      try {
        price = await resolvePrice(
          variant.id,
          variant.price,
          customer.priceListId,
          customer.discountPercent
        )
      } catch {
        // Use base price if resolution fails
      }
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
```

- [ ] **Step 3: Commit**

```bash
git add src/features/pos/components/wizard-products-step.tsx
git commit -m "fix(pos): handle price resolution failure when adding products"
```

---

### Task 8: Harden Payment Step — Final Validation

**Files:**
- Modify: `src/features/pos/components/wizard-payment-step.tsx`

- [ ] **Step 1: Verify isValid computation is correct**

Current logic (already correct):
```typescript
const isValid =
  total === 0 ||
  (paymentTotal >= total && payments.every((p) => p.amount > 0))
```

This prevents: empty payments, underpayment, and $0 payment entries. The button is already `disabled={!isValid}`. No change needed.

- [ ] **Step 2: Strip negative amounts on blur**

Add an `onBlur` handler to the amount input to prevent negative values from persisting:

In the amount input, add:

```typescript
onBlur={(e) => {
  const val = Number(e.target.value)
  if (val < 0 || isNaN(val)) {
    updatePayment(index, { amount: 0 })
  }
}}
```

- [ ] **Step 3: Commit**

```bash
git add src/features/pos/components/wizard-payment-step.tsx
git commit -m "fix(pos): strip negative payment amounts on blur"
```

---

### Task 9: Harden Confirmation Step — Offline Guard

**Files:**
- Modify: `src/features/pos/components/wizard-confirmation-step.tsx`

- [ ] **Step 1: Add offline status to disable buttons**

```typescript
import { useOnlineStatus } from "@/hooks/use-online-status"
// Inside component:
const isOnline = useOnlineStatus()
```

Add disabled condition to both action buttons:

```typescript
// "Completar venta" button
disabled={submitting !== null || !isOnline}

// "Confirmar despues" button
disabled={submitting !== null || !isOnline}
```

Add an offline banner above the footer when `!isOnline`:

```tsx
{!isOnline && (
  <div className="flex-shrink-0 bg-amber-50 px-6 py-2 text-center text-xs font-semibold text-amber-700 sm:px-8">
    Sin conexion a internet — los botones se activaran cuando vuelvas a estar en linea
  </div>
)}
```

Place this `div` just before the footer `div`.

- [ ] **Step 2: Commit**

```bash
git add src/features/pos/components/wizard-confirmation-step.tsx
git commit -m "fix(pos): disable confirmation actions when offline"
```

---

### Task 10: Harden Landing Page — Add Product Try/Catch

**Files:**
- Modify: `src/features/pos/components/pos-landing.tsx`

- [ ] **Step 1: Wrap handleAddProduct in try/catch**

The landing page's `handleAddProduct` calls `resolvePrice` which can now fail gracefully (Task 4), but the entire callback should also be wrapped:

```typescript
const handleAddProduct = useCallback(
  async (product: POSProductWithImage) => {
    const availableVariants = product.product_variants.filter(
      (v) => v.is_active && v.stock - v.reserved_stock > 0
    )
    if (availableVariants.length === 0) return

    const variant = availableVariants[0]
    const existingItem = items.find((i) => i.variantId === variant.id)
    const availableStock = variant.stock - variant.reserved_stock
    if (existingItem && existingItem.quantity >= availableStock) return

    let price = variant.price
    if (customer) {
      try {
        price = await resolvePrice(
          variant.id,
          variant.price,
          customer.priceListId,
          customer.discountPercent
        )
      } catch {
        // Fall back to base price
      }
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
  [items, addItem, customer]
)
```

- [ ] **Step 2: Move the pending sale toast out of confirmation step**

The `handlePendingSale` in `pos-sale-wizard.tsx` should be the one showing the toast (it already has the try/catch from Task 5). Remove the duplicate toast from `wizard-confirmation-step.tsx`'s `handlePending`:

In `wizard-confirmation-step.tsx`, remove the `toast.success(...)` call from `handlePending` since the parent wizard handles it.

- [ ] **Step 3: Commit**

```bash
git add src/features/pos/components/pos-landing.tsx src/features/pos/components/wizard-confirmation-step.tsx
git commit -m "fix(pos): try/catch on landing page add-to-cart, deduplicate pending toast"
```

---

## Summary of All Changes

| Issue | Fix | File |
|-------|-----|------|
| Schema allows empty payments | `.min(1)` on createSaleSchema | schemas.ts |
| Auth null → silent failure | `requireUserId()` throws early | actions.ts |
| Raw PG errors shown to user | `extractError()` translator | actions.ts |
| Network failure crashes wizard | try/catch + toast | pos-sale-wizard.tsx |
| Offline submit → hanging UI | `useOnlineStatus` + disabled buttons | hook + confirmation step |
| resolvePrice network fail → throw | try/catch → fallback to basePrice | utils.ts |
| Customer price fail → no feedback | toast.warning | wizard-customer-step.tsx |
| No success confirmation | toast.success after sale/pending | pos-sale-wizard.tsx |
| Negative payment amounts | onBlur sanitizer | wizard-payment-step.tsx |
| Duplicate pending toast | Centralize in wizard, not step | confirmation step |
