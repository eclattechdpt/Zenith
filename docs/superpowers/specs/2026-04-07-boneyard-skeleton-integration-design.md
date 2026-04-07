# Boneyard Skeleton Integration Design

**Date:** 2026-04-07
**Status:** Approved
**Goal:** Replace all manual skeleton loading states across Zenith with boneyard-js auto-generated pixel-perfect skeletons.

## Overview

Zenith currently uses hand-coded `<Skeleton>` divs with approximate sizes for loading states. Boneyard automates this: it captures real component layouts via headless browser at multiple breakpoints and generates `.bones.json` files that render pixel-perfect skeleton overlays at runtime.

**Animation style:** Shimmer (sweeping highlight effect)

## Architecture

### Installation & Config

- Package: `boneyard-js`
- Config file: `boneyard.config.json` at repo root
- Output directory: `src/bones/`
- Registry import: once in `src/app/layout.tsx`
- Bones files: git-tracked (no CLI needed at deploy time)

```json
// boneyard.config.json
{
  "breakpoints": [375, 640, 768, 1024, 1280, 1536],
  "out": "./src/bones",
  "wait": 1000,
  "color": "rgba(0,0,0,0.08)",
  "animate": "shimmer"
}
```

### Auth Strategy

The CLI uses Playwright to visit pages. Zenith has Supabase auth on all dashboard routes. Strategy: add a `BONEYARD_BUILD=true` environment variable check in the auth middleware to skip redirect during CLI capture. This mirrors the client-side `window.__BONEYARD_BUILD` flag the CLI already sets. Dev-only, never set in production.

### Fixture Strategy

Components behind data-fetching use the `fixture` prop to provide mock content during CLI capture:

```tsx
<BoneyardSkeleton name="dashboard-full" loading={isPending}
  fixture={<DashboardFixture />}>
  {data && <DashboardContent data={data} />}
</BoneyardSkeleton>
```

Each boneyard-wrapped component gets a lightweight fixture component with hardcoded representative data. Fixtures are tree-shaken in production (only rendered when `window.__BONEYARD_BUILD` is true).

### Build Workflow

```bash
npm run dev                    # Start dev server
npm run bones                  # Capture all skeletons
npm run bones:force            # Force recapture after UI changes
```

Package.json scripts:
```json
{
  "bones": "BONEYARD_BUILD=true npx boneyard-js build http://localhost:3000",
  "bones:force": "BONEYARD_BUILD=true npx boneyard-js build http://localhost:3000 --force"
}
```

## Scope: Components to Migrate (17)

### Boneyard candidates — full content area skeletons

| Component | File | Current Loading | Boneyard Name |
|-----------|------|-----------------|---------------|
| DashboardContent | dashboard-content.tsx | 4 KPI rects + 2 chart rects + 2 grid rects | `dashboard-full` |
| CustomerTable (mobile) | customer-table.tsx | 3 card skeletons | `customers-mobile` |
| CustomerTable (desktop) | customer-table.tsx | DataTable spinner | `customers-table` |
| SalesTable (mobile) | sales-table.tsx | 3 row skeletons | `sales-mobile` |
| SalesTable (desktop) | sales-table.tsx | DataTable spinner | `sales-table` |
| ProductTable | product-table.tsx | DataTable spinner | `products-table` |
| ProductCatalog | product-catalog.tsx | Grid with opacity fade | `product-catalog` |
| InventoryTable | inventory-table.tsx | TableSkeleton | `inventory-table` |
| TransitWeekDetail | transit-week-detail.tsx | Header + 3 items | `transit-week-detail` |
| POSProductGrid | pos-product-grid.tsx | 8 grid squares | `pos-product-grid` |
| ProductEditDialog | product-edit-dialog.tsx | FormSkeleton | `product-edit-form` |
| SaleDetail | sale-detail.tsx | Centered spinner | `sale-detail` |
| SaleDetailModal | sale-detail-modal.tsx | Centered spinner | `sale-detail-modal` |
| MediaBrowser | media-browser.tsx | 8 image grid | `media-gallery` |
| StorageOverview | storage-overview.tsx | 4 stat skeletons | `storage-overview` |
| ExportLog | export-log.tsx | 3 log rows | `export-log` |
| LoginSkeleton | login-skeleton.tsx | Full auth page skeleton | `login-page` |

### Keep as-is — inline spinners (9)

These are tiny action-level loading indicators (button spinners, save indicators) that boneyard cannot replace:

- ConfirmDialog — button spinner during action
- ReportCard — button spinner during export
- DangerZoneCard — button spinner during transition
- CustomerPriceEditor — inline save spinner per row
- PaymentDialog — credit notes loading spinner
- WizardCustomerStep — search results spinner
- ConvertQuoteDialog — small dialog spinner
- ProductSearch (POS) — search input spinner
- Auth login form — submit button spinner

## Component Wrapping Pattern

### Before (current manual skeleton):
```tsx
if (isPending || !data) {
  return (
    <>
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-[200px] rounded-2xl" />
      ))}
    </>
  )
}
return <RealContent data={data} />
```

### After (boneyard):
```tsx
import { Skeleton as BoneyardSkeleton } from 'boneyard-js/react'

<BoneyardSkeleton name="dashboard-full" loading={isPending || !data}
  animate="shimmer" fixture={<DashboardFixture />}>
  {data && <RealContent data={data} />}
</BoneyardSkeleton>
```

For responsive table/card views: boneyard captures at all breakpoints natively. One `<BoneyardSkeleton>` wrapper replaces both mobile card skeletons and desktop table skeletons.

## Files to Delete After Migration

- `src/components/shared/loading-skeleton.tsx` — TableSkeleton, CardSkeleton, FormSkeleton
- `src/features/auth/components/login-skeleton.tsx` — replaced by boneyard `login-page`
- `src/app/(auth)/login/loading.tsx` — replaced by boneyard wrapper
- All inline `Array.from({ length: N })` skeleton patterns in 7+ components

Keep `src/components/ui/skeleton.tsx` (shadcn primitive, may be used for non-boneyard inline cases).

## Naming Convention

Pattern: `{feature}-{view-type}`

- Dashboard: `dashboard-full`
- Tables: `{feature}-table` (e.g., `customers-table`, `products-table`)
- Mobile views: `{feature}-mobile` (e.g., `customers-mobile`, `sales-mobile`)
- Forms: `{feature}-form` (e.g., `product-edit-form`)
- Grids: `{feature}-grid` (e.g., `pos-product-grid`, `media-gallery`)
- Stats: `{feature}-overview` (e.g., `storage-overview`)
- Pages: `{feature}-page` (e.g., `login-page`)

## Fixture Components

Each fixture lives alongside its parent component in the feature module:

```
src/features/dashboard/components/fixtures/
  dashboard-fixture.tsx
src/features/clientes/components/fixtures/
  customers-table-fixture.tsx
  customers-mobile-fixture.tsx
src/features/ventas/components/fixtures/
  sales-table-fixture.tsx
...
```

Fixtures render hardcoded representative data — enough rows/cards/items to fill the viewport at each breakpoint. They use the same components as real content but with static props.
