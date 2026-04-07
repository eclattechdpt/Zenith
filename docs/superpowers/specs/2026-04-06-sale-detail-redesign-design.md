# Sale Detail Page Redesign

**Date**: 2026-04-06
**Scope**: Redesign `src/features/ventas/components/sale-detail.tsx` to follow the hybrid approach — Design A structure (PageHero-style header, SectionCards, KpiCards) with receipt-inspired content layout inside the cards.

## Decisions

- **Direction**: Hybrid — system's standard component structure wrapping receipt-inspired content
- **PDF/Print**: Reuse existing `SaleReceipt` component via `react-to-print` (no new PDF renderer)
- **Actions**: "Imprimir ticket" as primary CTA in header; "Devolver" and "Cancelar venta" moved to a "..." dropdown menu

## Sections

### 1. Header

Follows PageHero pattern adapted for detail view:

- **Overline**: CalendarDays icon + formatted date — `text-[11px] font-bold uppercase tracking-[2px] text-neutral-400`
- **Title**: Sale number in Zodiak display (`text-[32px] sm:text-[40px]`) + inline status badge (existing STATUS_COLORS)
- **Subtitle**: Time (`HH:mm hrs`) + customer name in teal (or "Cliente Regular" in neutral)
- **Back button**: ArrowLeft ghost button, same position as current
- **Right side**:
  - "Imprimir ticket" — filled rose accent button with Printer icon (PageHero CTA style)
  - "..." DropdownMenu (shadcn) with:
    - "Devolver" (RotateCcw icon) — conditional on `isReturnable`
    - "Cancelar venta" (XCircle icon, text-destructive) — conditional on `canCancel`

### 2. Summary KPI Strip

3 compact KpiCard (default variant) in a horizontal row:

| Card | Value | Icon | Tint |
|------|-------|------|------|
| Total | formatted currency | Receipt | rose |
| Productos | `{n} artículos` | ShoppingBag | blush |
| Pago | method label or "Mixto" | Banknote/CreditCard | neutral |

Staggered entrance (0, 0.06, 0.12 delays).

### 3. Items SectionCard (receipt-inspired)

`SectionCard` — label "Productos", ShoppingBag icon, `iconBg="bg-rose-50"`, `iconColor="text-rose-400"`.

Inner layout mirrors receipt:

- **Table header**: "Producto" left / "Importe" right — `text-[9px] uppercase tracking-wider text-neutral-400`, bottom border
- **Item rows**: product name (font-medium), variant label (smaller, conditional), qty x price detail (neutral-400), line total right (tabular-nums, font-semibold). Discount line in rose if > 0. Light border-b between items.
- **Totals** (below border-t):
  - Subtotal: neutral-500 / neutral-700
  - Discount (conditional): rose-600
  - **Total bar**: `bg-gradient-to-r from-rose-50 to-rose-100/60 rounded-xl px-4 py-3`. "TOTAL" uppercase bold left, `text-lg font-bold` amount right.

### 4. Payments SectionCard

`SectionCard` — label "Forma de pago", Banknote icon, `iconBg="bg-neutral-100"`, `iconColor="text-neutral-500"`.

Inner gray card (`bg-neutral-50 rounded-xl p-4`):

- Payment rows: method label left (+ reference), amount right
- Change row (conditional): teal-colored, above a separator

### 5. Returns SectionCard (conditional)

Only if `sale.returns.length > 0`.

`SectionCard` — label "Devoluciones", RotateCcw icon, `iconBg="bg-rose-50"`, `iconColor="text-rose-500"`. Rose-tinted border.

Inner content: same return card structure as current (return number, date, reason, items with restock icons, credit notes). Already well-designed.

### 6. Print Integration

- `SaleReceipt` rendered hidden with ref
- `useReactToPrint` hook, triggered by "Imprimir ticket" button
- Receipt data mapped from `sale` detail object (same fields as POS wizard mapping)

### 7. Animation

- Container: `staggerChildren: 0.08, delayChildren: 0.1`
- Each section: blur(4px) + y:20 + opacity:0 entrance (same as current `itemVariants`)
- KPI cards: 0.06 stagger between each

### 8. Mobile

- Header stacks vertically (title + actions)
- KPI strip: single column stack on mobile
- SectionCards: `p-4` mobile / `p-6` desktop
- DropdownMenu works natively on mobile

## Files Changed

- `src/features/ventas/components/sale-detail.tsx` — full rewrite
- No new files needed (reuses existing shared components + SaleReceipt)

## Dependencies

- `react-to-print` (already installed)
- `SaleReceipt` from `@/features/pos/components/sale-receipt`
- `PageHero`-style patterns (inline, not importing PageHero directly since detail headers differ)
- `SectionCard` from `@/components/shared/section-card`
- `KpiCard` from `@/components/shared/kpi-card`
- shadcn `DropdownMenu` components
