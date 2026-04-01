# POS Redesign — Design Spec

## Overview

Redesign the Punto de Venta page from a split-panel terminal layout to a dashboard-first product catalog with sliding cart sidebar and a wizard modal for completing sales. The goal is to make creating a sale the easiest process possible — browse, quick-add, confirm.

## Landing Page Layout

### Header
- Page title "Punto de venta" + date
- Global product search bar (searches name, brand, código)
- "+ Nueva venta" button (opens wizard modal with empty cart)

### KPI Widgets Row (3 cards)
- **Ventas hoy**: total revenue, transaction count, % vs yesterday
- **Productos vendidos**: unit count today
- **Ticket promedio**: average sale amount, % vs yesterday
- Data sourced from `sales` + `sale_items` tables filtered to today
- Rose/teal/amber gradient backgrounds matching existing design system

### Pending Sales Widget
- Amber-themed card showing sales with `status = 'pending'`
- Each pending sale shows: sale_number, customer name, item count, time ago, total
- "Completar pago" button opens wizard at payment step with sale data pre-loaded
- "Ver todas →" link navigates to `/ventas` filtered to pending
- Hidden when no pending sales exist

### Carousel: Más Vendidos
- Horizontal scrollable carousel of top-selling products (by unit volume, last 30 days)
- Query: aggregate `sale_items` grouped by `product_id`, ordered by SUM(quantity) DESC, limit 10
- Each card: product image (Supabase Storage, fallback to initials/gradient), name, price, "+ Agregar" button, edit icon (✏️ → `/productos/[id]`)
- Clicking "+ Agregar" adds to cart (Zustand store), sidebar slides in if first item

### Carousel: Vendidos Recientemente
- Horizontal scrollable carousel of most recently sold products
- Query: distinct products from `sale_items` JOIN `sales` ordered by `sales.created_at` DESC, limit 10
- Same card design as "Más vendidos"

### Product Grid: Todos los Productos
- Full product grid with category filter dropdown
- Cards: product image (Supabase Storage, fallback), name, price, "+ Agregar", edit icon
- Search filters this grid (shared with header search bar)
- 5 columns desktop (full-width), 4 columns when sidebar visible, 2 columns mobile
- Pagination or infinite scroll for large catalogs
- Products with `has_variants = true` show variant selector on click (popover or expand)

## Sliding Cart Sidebar

### Behavior
- **0 items**: sidebar hidden, full-width layout
- **1+ items**: sidebar slides in from right (animated with Motion), main content compresses
- **Cart cleared**: sidebar slides out, back to full-width
- **Mobile**: collapses to floating FAB (bottom-right) with item count badge; tapping opens full-screen cart overlay

### Sidebar Content
- Header: "🛒 Carrito" + item count badge
- Item list: product image thumbnail, name, unit price × qty, quantity controls (±), line total
- Footer: subtotal, total (bold rose), "Confirmar venta →" button, "Vaciar carrito" secondary button
- Sticky positioning on desktop (doesn't scroll with page)

### Cart Store
- Reuses existing Zustand store (`pos/store.ts`) — no changes to store API
- addItem, removeItem, updateQuantity, clear — all existing

## Sale Wizard Modal

### Entry Points
1. **"Confirmar venta"** from sidebar cart → opens at Step 1 (customer) with items pre-loaded
2. **"Nueva venta"** button (empty cart) → opens at Step 1 (customer), Step 2 shows products+cart combined
3. **"Completar pago"** from pending sale widget → opens at Step 2 (payment) with sale data pre-loaded

### Steps (from sidebar cart / normal flow)

**Step 1 — Cliente**
- Customer search (reuses existing `customer-picker.tsx` logic)
- Shows customer name, phone, discount % if applicable
- "Continuar sin cliente" option (customer is optional but prompted)
- Selecting customer recalculates cart prices (existing `resolvePrices` utility)

**Step 2 — Pago**
- Shows order summary: item list (read-only), subtotal, discounts, total
- Payment method selection: Efectivo, Tarjeta, Transferencia (quick buttons)
- Split payment support (add multiple methods)
- Amount inputs, reference field for transfers
- Change calculation for cash
- Validation: total paid ≥ sale total

**Step 3 — Confirmación**
- Sale summary: customer, items, payment breakdown, total
- Two actions:
  - **"Completar venta"** → calls `createSale()` server action, prints receipt, clears cart
  - **"Confirmar después"** → calls `createPendingSale()` server action, reserves stock, clears cart
- Success state: sale number, receipt preview, print button

### Steps (from "Nueva venta" with empty cart)

**Step 1 — Cliente** (same as above)

**Step 2 — Productos + Carrito** (combined view)
- Left: product search + grid (similar to landing page but inside modal)
- Right: cart panel with items, quantities, totals
- "Continuar al pago →" button when cart has items

**Step 3 — Pago** (same as Step 2 above)

**Step 4 — Confirmación** (same as Step 3 above)

### Steps (from "Completar pago" on pending sale)

**Step 1 — Resumen** (read-only order summary, customer already set)

**Step 2 — Pago** (same payment UI)

**Step 3 — Confirmación** (completes the pending sale, converts stock from reserved to deducted)

## Pending Sales (Venta Pendiente)

### Database Changes
- Add `reserved_stock` column (integer, default 0) to `product_variants` table
- New sale status: `pending` (alongside existing `completed`, `quote`, `cancelled`)

### Stock Model
- `stock`: total physical stock
- `reserved_stock`: stock reserved by pending sales
- `available = stock - reserved_stock`: what POS shows as sellable
- All POS queries and search use `available` (stock - reserved_stock) for stock checks

### Server Actions

**`createPendingSale(input)`**
- Creates sale record with `status = 'pending'`
- Creates sale_items (snapshots)
- Increments `reserved_stock` on each product_variant (does NOT decrement `stock`)
- Does NOT create payments or inventory_movements
- Generates sequential sale_number (same V- prefix as regular sales)

**`completePendingSale(saleId, payments)`**
- Validates sale exists and status = 'pending'
- Validates payments cover the total
- Decrements `reserved_stock` AND `stock` on each variant
- Creates sale_payments and inventory_movements
- Updates sale status to `completed`
- Atomic via RPC

**`cancelPendingSale(saleId)`**
- Validates sale exists and status = 'pending'
- Decrements `reserved_stock` (returns stock to available)
- Updates sale status to `cancelled`

### Ventas Page Integration
- Pending sales show with amber badge "Pendiente" in `/ventas` DataTable
- Actions: "Completar pago", "Cancelar venta"
- Filter tab: add "Pendientes" tab

## Product Images

### Display Only (on POS)
- Product cards show image from Supabase Storage URL
- Use `next/image` with Supabase storage loader for optimization
- Fallback: gradient background with product initials (2 letters)
- Image URL stored in `products.image_url` column (nullable string)

### Database Change
- Add `image_url` column (text, nullable) to `products` table
- Stores the Supabase Storage path (e.g., `product-images/{product_id}.webp`)

### Upload (separate scope — productos module)
- Not part of this POS redesign
- Will be handled in product form (`/productos/nuevo`, `/productos/[id]`)
- Uses existing `product-images` Supabase Storage bucket

## New Queries Needed

- `useTopSellingProducts(limit)`: aggregate sale_items by product, last 30 days
- `useRecentlySoldProducts(limit)`: distinct products from recent sales
- `usePendingSales()`: sales with status = 'pending' for the widget
- `usePOSDashboardStats()`: today's revenue, units sold, avg ticket
- `useAllProducts(search, categoryId)`: all active products for the grid (existing query adapted)

## Component Architecture

### New Components
- `pos-landing.tsx` — main landing page layout (replaces `pos-terminal.tsx` as page root)
- `pos-kpi-widgets.tsx` — KPI cards row
- `pos-pending-sales.tsx` — pending sales widget
- `pos-product-carousel.tsx` — reusable horizontal carousel
- `pos-product-card.tsx` — minimal product card (image, name, price, add, edit)
- `pos-product-grid.tsx` — filterable product grid
- `pos-sliding-cart.tsx` — animated sidebar cart
- `pos-sale-wizard.tsx` — multi-step wizard modal
- `pos-wizard-customer-step.tsx` — customer selection step
- `pos-wizard-payment-step.tsx` — payment step
- `pos-wizard-products-step.tsx` — products+cart combined step (for empty cart flow)
- `pos-wizard-confirmation-step.tsx` — confirmation + receipt step

### Refactored Components
- `customer-picker.tsx` — extract reusable search logic for wizard step
- `payment-dialog.tsx` — extract payment form logic for wizard step
- `product-search.tsx` — adapt for both landing grid and wizard product step

### Preserved
- `sale-receipt.tsx` — unchanged, used in confirmation step
- `store.ts` — unchanged Zustand store
- `utils.ts` — unchanged price resolution
- `schemas.ts` — extended with pendingSaleSchema
- `actions.ts` — extended with createPendingSale, completePendingSale, cancelPendingSale

## Mobile Behavior
- KPIs: single column stack
- Carousels: horizontally scrollable (touch-friendly)
- Product grid: 2 columns
- Cart: floating FAB (bottom-right) with count badge → full-screen overlay on tap
- Wizard: full-screen modal with step indicator
- Pending sales widget: stacked cards
