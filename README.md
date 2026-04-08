# Eclat POS

Sistema de punto de venta e inventario web para tienda de belleza y cosmeticos.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Database**: Supabase (PostgreSQL + Auth + Storage + Realtime)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS + shadcn/ui
- **Animation**: Motion (Framer Motion)
- **State**: TanStack Query (server) + Zustand (POS cart) + nuqs (URL state)
- **Forms**: React Hook Form + Zod
- **Charts**: Tremor
- **Exports**: SheetJS (Excel) + @react-pdf/renderer (PDF)
- **Printing**: react-to-print

## Features

- Product catalog with variants, categories, bundles, and image management
- Point of sale terminal with cart, payments, receipts, and quotes
- Customer management with custom discounts and per-variant pricing
- Three independent inventories: Physical, In Transit, Initial Load
- Returns and credit notes with atomic stock reversal
- Dashboard with real-time KPIs, sales charts, and inventory alerts
- Reports hub with 6 Excel + 4 PDF export templates
- Collapsible sidebar with spring animations, mobile responsive

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Commands

```bash
npm run dev          # Development server
npm run build        # Production build
npm run lint         # ESLint
npm run type-check   # TypeScript check
```

## Project Structure

```
src/
  app/               # Next.js routes (pages, layouts, loading)
  features/          # Feature modules (productos, pos, ventas, inventario, etc.)
    {module}/
      actions.ts     # Server Actions
      queries.ts     # TanStack Query hooks
      schemas.ts     # Zod schemas
      types.ts       # Module types
      components/    # Module components
  components/
    ui/              # shadcn/ui (do not modify)
    shared/          # Shared components
  lib/
    supabase/        # Supabase clients (client.ts, server.ts, storage.ts)
  hooks/             # Custom hooks
  types/             # Database types (auto-generated)
```

## Design

Built by [abbrix](https://abbrix.com). Design system tokens in `/Context/`.

---

Powered by Eclat POS
