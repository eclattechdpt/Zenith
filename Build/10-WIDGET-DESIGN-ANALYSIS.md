# Widget Design Analysis — Reference Study for Dashboard Redesign

> Study of three modern dashboard/widget reference sheets. Captures the visual language, spacing grammar, typographic hierarchy and interaction cues that make these feel contemporary and premium — not as loose inspiration, but as a concrete pattern library we will re-use to redesign Eclat's home page widgets.

---

## 0 · The three references at a glance

| # | Reference | Domain | Core mood | Primary accent | Surface strategy |
|---|-----------|--------|-----------|----------------|------------------|
| 1 | EV / Battery widget stack | Automotive, iOS-style widgets | Bold, chunky, playful | Poppy orange `~#F24E1E` | Accent card + black pills + a single white pill |
| 2 | Personal finance bento | Fintech web app | Clean, premium, modular | Indigo / violet `~#6C5CE7` | White cards + 1 accent-filled card + 1 profile-black header |
| 3 | Sales analytics dashboard | E-commerce analytics | Dark, data-dense, minimal | Lavender `~#BBB0F0` pills on dark | All-black cards on lavender page |

Despite three very different visual styles, the grammar underneath is the same. That grammar is what we'll extract.

---

## 1 · Image-by-image walkthrough

### 1.1 Reference A — EV / Battery widget stack

**Layout**. Two columns. Left column: one large "hero" widget (the Battery Status at 60%) plus a wide map widget underneath. Right column: a vertical stack of compact "pill" widgets, ending in a collapsed black restatement of the primary widget (80%).

**The hero widget — Primary Battery (expanded, orange)**
- Surface: saturated coral/orange fill, ~32 px radius, roughly square (slightly taller than wide).
- Padding: ~28–32 px all around. Content is allowed to be big because the card is big.
- Header row: two concentric pieces of information stacked — a tiny eyebrow label "Primary Battery" (white @ ~45% opacity, ~12 px) sits above the main title "Battery Status" (white, ~24 px, semibold, with a chevron-down glyph inline to indicate the card can re-pick a battery). A power icon precedes the title.
- Top-right: a circular chevron-up button (~44 px diameter) filled with a slightly darker orange — this is the expand/collapse affordance.
- State row: right-aligned "● Charging" — small dot + label in a darker-tinted orange, no box around it. Status lives as a modifier, not a badge.
- Visualization: five **vertical pill-shaped bars**, evenly spaced, each labeled "+30 Kms" at the bottom. The first three are a darker red-orange and carry a checkmark glyph at the top; the last two are faded (lower opacity of the same orange). This is progress-as-segments — not a progress bar, but a chart.
- Hero numeral: **"60%"** sits bottom-left at roughly **96–112 px, extra-bold**. This is by far the largest single element in the frame, and it's the entire point of the widget.
- Bottom-right, opposite the hero: a small two-line block "Can go 90 Kms / 1h 20m remain" (~13 px, regular, ~70% opacity). Opposing-corner placement creates diagonal balance.

**The pill widgets (right column)**
All share the same silhouette: a ~72 px tall, fully rounded-corner rectangle with a circular icon container on the far left, a two-line label pair next to it, and a circular chevron on the far right. The variants communicate priority purely through surface color:
- Black surface → default tier (Recent Rides, Monthly memories, Primary Battery collapsed).
- Accent orange → attention tier (Charging History).
- White → "confirmed / healthy" tier (Vehicle Health, "Well Maintained").

Within each pill, metadata uses a **colored dot as a separator**, e.g. "11 KWh in 2h 35m ● Sat, Oct 11" — the dot is the accent color, tying secondary metadata back to the primary palette.

**The collapsed "80%" widget**
A compressed restatement of the primary widget's DNA on a black surface: icon + eyebrow + title at the top, "80%" hero bottom-left, "5.3 hrs remain" bottom-right — the battery segments are gone because the card is short. This proves the widget has a defined **expand/collapse contract** with two clear states that share hierarchy.

**The map widget — "Parked Safely"**
Internal 50/50 split. Left half: a rounded-corner **"map tile" illustration** (square, radius ~20 px) with a pink-tinted base, white street strokes, and a pulsing red target dot. Right half: eyebrow "Parked Safely", hero "20 ms", subtitle with the address, and a navigation arrow button at the bottom-right corner of the text column. The point: **an illustrated decorative panel can live next to content inside a single card** without becoming a collage — the key is that both halves share the card's padding and radius.

---

### 1.2 Reference B — Finance bento

**Layout**. Three-column bento. Cards have different heights and widths and snap to an invisible grid. The canvas is a neutral warm-gray (`~#DADADA`) so white cards float clearly. Radii: ~20–24 px. Shadows are near-zero, offsetting with pure color contrast instead.

**"My accounts" (white, wide)**
- Header: plain title "My accounts" at ~20 px left, + an **"+ Add card" pill button** right (gray `#ECECEC` fill, ~36 px tall, inline plus glyph). This "label + ghost action" header pattern repeats across modern dashboards.
- Body: a **credit-card illustration**. Two cards are layered with a small offset — a violet-filled card behind a white card with VISA wordmark + contactless glyph + last-4 digits + expiry. This is decorative but branded — an illustrative hero that sells the card mental model. The offset (~16 px) and slight rotation sells depth without leaving 2D.

**"Net worth" (white, expandable tree)**
- Header row: subtle mail/account icon, title "Net worth", right-aligned total "$16,531.54" in the same type size. **The header *is* the KPI** — there's no separate hero numeral, because the data is a tree.
- Body: a disclosure tree. Row pattern: triangle glyph (▶ collapsed / ▼ open) + label + right-aligned value. Children indent without a vertical connector line — purely through left padding. No bullets. No dividers. The whitespace does the structuring.

**"Income" (filled violet)**
- Header: eyebrow title "Income" left, a **dropdown pill** "Past 30 days ▾" right.
- Hero: "**$3,800**" white, ~56 px, extra-bold — shifted to the left and lower-middle of the card so the chart can overlap it on the right.
- Trend: "↑ 16.4%" (tiny glyph + %) below-left of the hero, small.
- Chart: a **dotted, sketched line curve** overlays the right ~70% of the card, rising to the right. One data point is "pinned" with a white ring, attached to a small white tooltip pill "Feb 12" connected by a dashed vertical guide. This proves one important idea: **charts inside KPI cards don't have to be axes-and-all — they can be a single expressive stroke that gives the number a trajectory.**

**"Financial growth" (white, decorative)**
- "+18%" hero at ~48 px, extra-bold, black. Subtitle "Account activity has increased" below at ~14 px, ~50% opacity.
- Visual: two stylized "credit card" rectangles standing up at the bottom of the card (one violet, one black), staggered like figures on a stage. They're not data — they're symbolic decoration. This reminds us that **even on a finance card, playful illustration is allowed** when it echoes the product's subject matter.

**"My profile" (white with black top cap)**
- A rare **compound card**: a black top section (like a letterhead) shows the icon + "My profile" + handle "@williamgrace". Below, a white body lists account settings, a divider, a "Switch account" section with avatar rows + radio-dot selection, and a final gray "Log out of all accounts" button.
- Lesson: a card can have **interior regions with different surfaces** (black cap / white body) without becoming two cards — the radius wraps both.

**"Category insights" (white, wide)**
- Header: small **icon-in-square container** (chart glyph inside a rounded-square with a thin border) left + title right. The icon-square is the dashboard analog of an app icon — it says "this section has an identity."
- Body: a two-column mini-dashboard inside a card. Each column has its own eyebrow ("Grocery" / "Entertainment"), hero ("$1.2k" / "$4.5k"), a **green trend pill** with arrow (for the hero that has a delta), a comparison subtitle ("vs July 2025"), and a **texture bar** — the left column uses a diagonally striped orange fill, the right uses dense vertical gray ticks. The visual texture differentiates the categories without adding a legend.

---

### 1.3 Reference C — Sales analytics dashboard

**Layout**. Five black cards in an asymmetric grid on a lavender page. Consistent ~24 px radius, no strokes, no shadows. This is the "data-first" end of the spectrum — decoration is almost nil.

**"Sales Growth" (left tall — product leaderboard)**
- Top zone: two side-by-side micro-KPIs — "All pcs" with an inline zigzag sparkline, and "Average Price $457,5" with its own sparkline. Each is a label + sparkline + number triplet. **The sparklines are tiny, unlabeled, stroke-only** — they just suggest motion.
- Body: **a leaderboard** of five products. Row: circular product thumbnail (~48 px), product name eyebrow (~12 px, muted lavender), quantity "381" (~36 px, bold white) + unit "pcs." (~14 px, muted white), and a percentage "17%" right-aligned (~18 px, muted).
- The row has no divider — it stands alone on whitespace. This is a masterclass in **list-as-KPI**: every row has its own hero numeral, not a flat table.

**"Sales Growth" (center wide — area chart)**
- Eyebrow "Sales Growth" tiny at top-left.
- Hero "**$32,450**" ~64 px, extra-bold white, followed inline by a **lavender pill "+12%"** — tight horizontal stacking.
- Chart: area chart filling the bottom 60% of the card. **No axis frame, no gridlines, no ticks** — just three vertical dashed guides connecting specific data points to their x-labels ("18", "22", "24") at the very bottom, and floating white numeric labels ("8.220", "12.220", "10.220") near the peaks. The line is thin; the fill is a ghost of the line. This is the cleanest possible chart that still feels informative.

**"Orders by Region" (right — bar columns)**
- Eyebrow "Orders by Region".
- Hero "1216" with lavender "+231" pill.
- Visualization: **three tall bars** with subtle border-only treatment. Each bar has a **horizontal line marker at the data height** with the number sitting on top of it (512 / 187 / 63). The bars aren't filled — they're outlined hollow boxes, and the data line is the only thing drawn "solid." This makes three very different magnitudes readable without overwhelming the card.

**"Revenue Breakdown"**
- Eyebrow "Revenue Breakdown" left + muted "see all" right.
- Lead row: "↑ 64% Electronics" where the ↑ lives inside a **circular icon bg** (lavender tint), the 64% is hero-sized, "Electronics" is the label. Below: thin progress bar filled to 64% in lavender, rest in dark gray.
- Three more rows at smaller scale, same pattern.
- Lesson: **a KPI row can itself be a mini-widget** — arrow glyph in circle + percentage hero + label + progress bar.

**"Visited / Conversion Rate" (bottom-right)**
- **Two heroes in one card**: left half = "Visited / 3242 / +231", right half = "Conversion Rate / 4.5% / +0.5%". Same vertical rhythm in both, no divider.
- Below: **concentric half-ring chart** (three nested semi-circles at 10%, 30%, 60% — repeat sale / sale / lead) with a dot-legend at the bottom. The chart spans the full card width, gracefully.
- This proves **two KPI stats can share one card** if the visualization beneath unifies them.

---

## 2 · Synthesized patterns

These are the rules that all three references follow. They're what we'll implement.

### P1 · Hero-first hierarchy
Every widget has one, and only one, number-that-matters. That number is typographically dominant — 2×–4× larger than anything else in the card. Labels, units, trends are all demoted to supporting roles. Never have two competing heroes in the same card unless you're intentionally splitting it (Pattern P10).

| Role | Size (on a ~360 px card) | Weight | Color |
|------|--------------------------|--------|-------|
| Hero numeral | 56–96 px | Extra-bold / Black (800–900) | Full-opacity on surface |
| Title | 18–24 px | Semibold (600) | Full-opacity |
| Eyebrow | 11–13 px | Regular/Medium (400–500) | 50–60% opacity |
| Unit / suffix | 12–14 px | Regular | 60% opacity |
| Trend pill | 12–14 px | Medium | In pill (see P5) |
| Meta / supplement | 12–14 px | Regular | 60–70% opacity |

### P2 · Generous, consistent padding
Internal padding is ~24–32 px on every card regardless of size. Small cards don't get tight — they just fit less content. The card feels confident because the content isn't hugging the edge.

### P3 · Large, consistent radii
All three references use large radii (~20–32 px), consistent across every card in the sheet. The sheet is unified because the radii never change.

**Recommendation for Eclat**: pick **one** base radius per widget tier and never break it. Suggested scale:
- XL (hero widgets): **28 px**
- L (standard cards): **24 px**
- M (pill/list rows): **18 px**
- S (inline chips, buttons): **12 px**

### P4 · Surface-tier communicates priority

Across the sheet, a card's **surface color** does the work that a badge or border would do:

- **Accent fill** (orange / violet / black-with-lavender-text) = "this is the most important card" or "this card is calling for action." Exactly ONE accent-filled card per section is the norm.
- **Dark/black surface** = default carrier for data (especially when the page is light).
- **White surface** = neutral / informational / confirmatory content.
- **Light-tinted surface** = grouping / secondary containers.

Rule of thumb: **fill a card only when it deserves top-of-mind attention.** Overusing fills destroys the visual hierarchy.

### P5 · Trend / delta pills
Tiny pill-shaped badges (~24 px tall, ~8–12 px horizontal padding, full-round corners) sit next to hero values to contextualize them. Content is always one of:
- `+12%` / `-5%` — percentage deltas
- `+231` / `-47` — absolute deltas
- `↑ +12%` / `↓ -5%` — glyph + delta

Color:
- On a dark card → pill uses the accent tint as fill, text in accent-light.
- On a white card → pill uses a green/red/neutral light fill with matching dark text.
- **Never** a harsh red/green combo — all references use muted, friendly variants.

### P6 · Circular icon containers (40–48 px)
Icons almost never float free. They live inside a **circle** (most common) or **rounded square** (Category insights). The container fills the card's negative space between the edge and the icon, and:
- On accent cards → container is a darker tint of the accent (~15–25% darker).
- On dark cards → container is `white @ 10%`.
- On white cards → container is a neutral-100 fill (`#F3F4F6`).

Circular chevron/action buttons follow the exact same sizing and styling, creating parity between "identity" (icon) and "affordance" (chevron).

### P7 · Dot separators in metadata
`"11 KWh in 2h 35m ● Sat, Oct 11"` — a small colored dot (the accent color) is used as a separator in horizontal metadata strings. It does double duty: separates fields AND ties the meta-text back to the card's palette. **Never use pipes (`|`) or slashes (`/`) for this purpose** — they look enterprise-y. Dots and middots (`·`) are the modern move.

### P8 · Stripped chart styling
Charts inside widgets never have:
- Axis lines / borders
- Gridlines (or only very faint dashed verticals)
- Tick marks
- Labeled y-axis

They often have:
- Inline floating numeric labels at data-peaks
- Dashed guide lines for selected x-values
- A single pinned tooltip for a "current" point
- A subtle gradient fill beneath the line

**The chart is background; the number is foreground.** Never make the chart out-compete the hero numeral.

### P9 · Diagonal corner balance
In most cards the hero lives in one corner (usually bottom-left or top-left) and supplementary info lives in the opposite corner (bottom-right). This creates a diagonal read and leaves the other diagonal free for decoration / visualization. **Avoid** placing all content in one quadrant or dead-centering small text in a big card.

### P10 · Split-hero cards
When two stats are genuinely peers (e.g. Visited + Conversion Rate), split the card into two vertical halves that share the same rhythm (eyebrow / hero / pill) — then unify them with a visualization that spans the full width beneath. Never divide with a border; let the shared baseline do the uniting.

### P11 · Illustrative panels are allowed
References A and B both include **illustrated, non-data visuals** inside data cards — a map tile, a credit-card mock, two stylized mini-cards. These add personality without adding noise **if** they stay inside the card's padding and radius, use only colors already in the palette, and don't out-compete the hero numeral. One illustration per bento, max.

### P12 · Header row pattern: eyebrow + action
Almost every card has a tiny eyebrow title (11–13 px, muted) and — when relevant — a ghost-styled action on the right (pill button, dropdown, icon button). Actions are always ghost/outline-level, not primary buttons. The hero does the shouting, not the chrome.

### P13 · Expand / collapse as a first-class state
Reference A in particular shows that cards are designed with **two clearly-defined states** — expanded shows the visualization, collapsed shows only hero + meta. Both states preserve hierarchy. The chevron button in the top-right is the state toggle. If we adopt this, we need both states designed in parallel for every widget that supports it.

### P14 · Decoration with gradient *inside* the data
Where any color depth appears (the orange battery bars, the Income chart fill, the "concentric rings"), it's always **a same-hue gradient from saturated → transparent**. No multi-color gradients. No tinted shadows. The color of the data is the color of the brand.

### P15 · Progress as segments, not bars
Reference A's battery uses **discrete pill segments** with checkmarks instead of a continuous progress bar. This pattern is great for things like "goal tracking" — it feels like badges being collected, not a meter being filled. Use when the steps are countable (days of a week, stock threshold steps). Use a continuous bar when the underlying quantity is truly continuous.

### P16 · List-as-KPI
Reference C's leaderboard treats each row as its own tiny widget: thumbnail + eyebrow + hero numeral + unit + trailing %. No tables. No dividers. No striped rows. Rows are big (~64–80 px tall) and breathe. The list IS the visualization.

---

## 3 · Extractable design tokens

A concrete token sheet we can translate into Tailwind / CSS vars for Eclat.

### Radii
```
--r-xl: 28px   /* hero widgets */
--r-lg: 24px   /* standard widgets */
--r-md: 18px   /* pill widgets, list rows */
--r-sm: 12px   /* inline chips, buttons */
--r-icon: 9999px /* circle icon/chevron containers */
```

### Padding
```
--pad-xl: 28px  /* hero widgets */
--pad-lg: 24px  /* standard */
--pad-md: 20px  /* pill rows, list rows */
--pad-sm: 16px  /* inline */
```

### Type scale
```
--type-hero-xl: 96px / 0.9 / 800   /* single-card heroes like "60%" */
--type-hero-lg: 72px / 0.95 / 800  /* main dashboard KPIs */
--type-hero-md: 48px / 1 / 800     /* bento grid KPIs */
--type-hero-sm: 32px / 1.05 / 700  /* list-row heroes */
--type-title:   20px / 1.3 / 600
--type-eyebrow: 12px / 1.3 / 500 uppercase-optional letter-spacing 0.02em
--type-body:    14px / 1.4 / 400
--type-meta:    13px / 1.4 / 400 opacity 0.6
--type-unit:    13px / 1 / 400 opacity 0.7
--type-pill:    13px / 1 / 500
```

### Icon container sizes
```
--icon-container-lg: 48px (circle, for card headers)
--icon-container-md: 40px (circle, for pill widgets, chevrons)
--icon-container-sm: 32px (circle, for in-row icons)
--icon-glyph-ratio: 50% (glyph size = container × 0.5)
```

### Surface strategy (map to Eclat)
```
Tier 1 — Accent fill:   bg = accent-500 or accent-600, text = white
Tier 2 — Dark:          bg = neutral-900 / #121212, text = white
Tier 3 — White:         bg = #FFFFFF, text = neutral-900
Tier 4 — Light tint:    bg = neutral-50 / #FAFAF9, text = neutral-900
```

One Tier-1 card per section is the limit. Everything else is Tier-2/3/4.

### Trend pill variants
```
Positive on dark:   bg = accent-400 @ 20%, text = accent-200
Positive on light:  bg = emerald-100, text = emerald-700
Negative on dark:   bg = red-400 @ 20%, text = red-300
Negative on light:  bg = red-50, text = red-700
Neutral:            bg = neutral-200, text = neutral-700
```

### Dot separator
```
content: "·" or "●"
color: accent-500 (if card is dark) / accent-600 (if card is light)
margin: 0 0.5em
font-size: matches surrounding meta text
```

### Chart styling
```
Gridlines: none OR faint dashed verticals at selected x-values (stroke-width 1, dashed 2,3, opacity 0.2)
Axis line: none
Line weight: 1.5–2 px
Fill: same-hue gradient, 0% → 20–25% opacity top-to-bottom
Tooltip: white pill, ~24 px tall, drop shadow 0 1 4 rgba(0,0,0,0.12)
```

---

## 4 · Applying this to Eclat's home widgets

Here's a direct mapping from patterns → what each of our home widgets becomes.

### 4.1 PageHero
Currently: date pill + Zodiak title + subtitle + CTA.
Redesign cues:
- Keep the date pill as eyebrow (matches P12).
- Elevate title typography to a Tier-1-sized statement (~56–64 px on desktop) if we want it to feel like the `$32,450` sales-growth hero of Reference C.
- The CTA remains ghost/neutral — secondary to the hero (P12).

### 4.2 KpiCards (SalesProgress / WeeklyBarChart / PaymentBreakdown / InventoryHealth)
Today these are white cards with mini-viz as children. Under the new patterns:
- **One** of the four should be promoted to Tier-1 accent fill (the most important today's-metric — likely SalesProgress in rose accent). The other three stay white or Tier-4.
- Every card gets: eyebrow (12 px muted) / hero (56–64 px extra-bold) / trend pill / mini-viz stripped of axes.
- Move supplementary info (e.g. "of daily goal", "vs yesterday") to bottom-right per P9.
- Trend pills go inline next to the hero, not below it (P1 + P5).

Reference-specific moves:
- **SalesProgress**: treat like "Income" (Ref B) — filled rose card, hero $ amount in white, `↑ %` meta below, dotted sparkline overlapping bottom-right, pinned tooltip on today's value.
- **WeeklyBarChart**: treat like "Orders by Region" (Ref C) — hero total for the week, `+N vs last week` pill, seven hollow bar outlines with a horizontal line marker at each day's height + tiny label on top. Keeps the existing motion story.
- **PaymentBreakdown**: treat like "Revenue Breakdown" (Ref C) — lead row at hero scale ("67% Efectivo" with arrow-in-circle + progress bar) + 2 smaller rows below.
- **InventoryHealth**: treat like "Visited / Conversion Rate" (Ref C split-hero) — left: "Saludables X", right: "Alertas Y" with the semi-ring viz beneath spanning both.

### 4.3 SalesChart (wide)
Today: motion bars, gradient fills, glow, pulse rings, ★ markers, CountUp total.
Redesign cues:
- Adopt Reference C's "Sales Growth (wide)" structure: eyebrow + hero total + inline trend pill at top, chart at bottom 60%.
- Keep the bar + gradient story but **drop all gridlines and the coordinate overlay** (they were removed already per CLAUDE.md — good).
- Replace the ★ amber best-week marker with a **floating numeric label** above the peak bar (matches "8.220 / 12.220 / 10.220" treatment) — cleaner than decoration.
- Keep active bar's white-ringed dot + pulse ring — it's our version of Reference B's pinned tooltip on the Income curve.

### 4.4 TopProducts
Today: grid of cards, cap 3.
Redesign cues: rebuild as the **"Sales Growth leaderboard" from Reference C** (Pattern P16).
- Each row = 64–80 px tall, no divider.
- Thumbnail circle (~48 px) left.
- Eyebrow product-name / hero quantity "381 pcs." / trailing "17%" right-aligned.
- Drop the grid, go linear — scannability goes up, visual clutter goes way down.

### 4.5 ActivityFeed (home preview)
Today: card with vertical list of events, opens dialog.
Redesign cues:
- Each row becomes a **pill widget** in the spirit of Reference A's right column: circle icon (accent-tinted per event type) + title + meta with dot-separators + trailing chevron.
- Use surface-tier to sort priority: alerts → Tier-1 accent fill, today's sales → Tier-2 dark, completed things → Tier-3 white. This is radical but solves the "wall of white rows" problem.
- Keep the "Ver todo" action as the ghost header action (P12).

### 4.6 InventoryAlerts
Today: inline list in a card.
Redesign cues:
- Treat as a **Revenue Breakdown-style** widget (Ref C): lead row = worst-alert product at hero scale with progress bar showing how far below threshold (e.g. "0/5 stock"). 2–3 more rows below at smaller scale.
- Or, alternatively, an **"Orders by Region"-style** bar triptych showing "Sin stock / Bajo / Saludables" counts.

### 4.7 QuickActions
Today: white cards with colored icon containers.
Redesign cues:
- These are the smallest widgets — should be pill-shaped per Reference A.
- Sizing ~64–72 px tall, radius 18 px, circle icon (40 px) + label + trailing chevron.
- Use Tier-2 dark or Tier-3 white depending on action weight; reserve Tier-1 accent for "Nueva venta" (the primary action) only.

---

## 5 · Non-negotiables for the redesign pass

If we only keep five rules:

1. **One hero per card, and it's enormous.** Everything else supports it. (P1)
2. **One accent-filled card per bento section, tops.** Everything else is dark, white, or light-tinted. (P4)
3. **No gridlines, no axis lines, no chart chrome.** Use floating labels + dashed guides only. (P8)
4. **All metadata uses dot separators in the accent color.** No pipes. No slashes. (P7)
5. **All icons and chevrons live inside circles of the same size.** Consistent 40 or 48 px. (P6)

---

## 6 · What to decide before we cut code

Questions we should answer before touching components, listed fastest-to-slowest:

1. Is rose still our accent, or does module-scoped accent (per current `data-module` system) also drive which widget becomes Tier-1 on each page? *(likely: keep module accent, but at home, rose is Tier-1).*
2. Do we want the expand/collapse pattern from Reference A for home widgets, or is the home page strictly static? *(adds complexity — start without.)*
3. Are we willing to promote one KPI above the others, or should all four stay peer-level? *(Reference B and C both promote exactly one — I'd recommend we do the same.)*
4. Do we keep Zodiak for heroes and Plus Jakarta Sans for body? *(Yes — these references all use a single geometric sans for hero numerals, which Zodiak satisfies beautifully.)*
5. Playful illustrations (map tile, card stack) — in or out? *(I'd say: out for v1, revisit once the numbers land.)*

Once these five answers are locked, we can generate per-component specs and implement.
