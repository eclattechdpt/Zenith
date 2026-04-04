<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Zenith POS — Agent Guidelines

## User Profile

- Developer and designer, works under the brand **abbrix**
- Building Zenith POS for a beauty/cosmetics shop client in Zapopan, Jalisco, Mexico
- Communicates in English; product UI is entirely in Spanish (es-MX)
- Comfortable with advanced frontend (Motion springs, layout animations, TanStack Query patterns)
- Prefers to see results and iterate visually — provides screenshots for feedback
- Uses Supabase MCP for database operations

## Design Preferences

### Color Philosophy
- **Rose/pink is ONLY for reactive/CTA elements**: buttons, active states, hover shadows, badges, accent borders. Never for container or section backgrounds.
- **Section tints use warm brownish tones**: `#faf6f3`, `#f5efe9`, `#efe8e2`. These feel warm and neutral without competing with rose CTAs.
- **Teal** is the accent for customers, credit notes, and success states (Supabase badge, compression badge, success dialog checkmark).
- **Amber/warning** is for low stock alerts, pending states, and file size warnings.
- **Color-coded modules**: rose = products/sales, teal = customers/credit notes, blush = activity, amber = inventory alerts.

### Typography & Layout
- Font stack: Plus Jakarta Sans (body) + Geist Mono (code) + Zodiak (display)
- Headings stay OUTSIDE cards — cards only wrap form inputs/interactive content, not titles.
- Modal headers: big title (`text-2xl font-display`), action-oriented subtitle (`text-[12px] text-neutral-400`), standalone domain icon in `rose-400` (no background container, no Plus icon).
- KPI cards use tinted backgrounds with contextual visualizations (pace trackers, bar charts, payment pills, health bars) — not generic number-only cards.
- Overline labels: uppercase, tracking-wider, small text for section headers.

### Animation Standards
- Use Motion (framer-motion) for all transitions — spring physics preferred over tween.
- Sidebar: collapsible with spring animation, concave scoops on active tab, state persisted in localStorage with blocking script (anti-flash pattern like next-themes).
- Staggered entrance animations on card grids and lists.
- Never animate `opacity` on a container with `backdrop-blur` or `bg-white/N` — separate clip wrapper (height) from content (opacity) to avoid rendering artifacts.
- Layout animations on siblings that reposition when content expands/collapses.
- Dashboard widgets are informational — NO hover animations on KPIs, charts, or data cards.

### Component Patterns
- Product creation: single-page dialog with collapsible tinted sections (not multi-step wizard). Sections auto-collapse when filled. "Avanzado" starts collapsed.
- Tables: DataTable (TanStack Table) on desktop, card layout on mobile (`<640px`).
- Toasts: use Sileo for notifications (success, error, warning). Sonner as fallback.
- Tooltips: neutral-600 bg, neutral-50 text (not default foreground/background).
- Numeric inputs: commit-on-blur AND commit-on-Enter, useRef to avoid stale state, min/max via Zod (not HTML attributes) to avoid native browser tooltips.

### Image Handling
- Image picker has two tabs: "SUBIR ARCHIVO" (file upload) and "URL" (paste link).
- URL flow presents a choice panel: "Descargar y optimizar" (RECOMENDADO badge) downloads via server proxy, compresses to ~10KB WebP, uploads to Supabase; "Usar enlace directo" keeps external URL as-is.
- Badges: "SUPABASE" (teal) for stored images, "URL Externa" (blue dot) for external links, "Pendiente" (amber) for deferred uploads on new products.
- Compression feedback: teal badge with sparkle icon showing final size (e.g., "10.0 KB").
- Tiered file validation: ≤15MB silent, 15-25MB amber warning, >25MB hard block.

### Mobile Responsiveness
- Titles centered on mobile (`text-center sm:text-left`) to avoid overlap with burger menu.
- Card layouts replace tables below 640px with full info cards.
- Responsive padding: `p-4 sm:p-6` on content sections.
- Sidebar becomes Sheet-based mobile nav with organic button (concave scoops flush to left edge).

## Workflow Preferences
- Do NOT run `npm run build` unless explicitly asked — user controls when builds happen.
- Avoid nuqs `useQueryState` for ephemeral UI state — use plain `useState` instead. nuqs causes re-render cascades with React Query.
- Use nuqs only when URL persistence is truly needed (deep-link sharing, browser back navigation).
- Unsaved changes guard: intercept client-side navigation, beforeunload for tab close, guardedNavigate for action buttons.
- SKU fields auto-uppercase, labeled as "Codigo" in UI.
- Currency formatting: `Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' })` — never `toFixed()`.
- Soft delete everywhere: always filter `.is("deleted_at", null)` in queries.
- Debug tools welcome in dev mode (gated behind `NODE_ENV === "development"`).
