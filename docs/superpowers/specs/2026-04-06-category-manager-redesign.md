# Category Manager Redesign — Interactive Tree with Drag & Drop

**Date**: 2026-04-06
**Scope**: Replace `CategoryManager` component with rich interactive tree view

## Problem

Current CategoryManager is a flat list with basic expand/collapse and a generic dialog for CRUD. No visual differentiation between categories, no drag & drop for reordering, and the create/edit flow is disconnected (modal popup).

## Design

### Visual: Tree with Nesting & Color Coding

Each category is a **rich card node** in an expandable tree:

```
┌─ [drag] [●rose] Maquillaje          12 productos  [+ sub] [✎] [🗑]
│   ├─ [drag] [●rose-light] Labiales   5 productos  [✎] [🗑]
│   └─ [drag] [●rose-light] Ojos       7 productos  [✎] [🗑]
│
├─ [drag] [●teal] Cuidado de piel      8 productos  [+ sub] [✎] [🗑]
│   └─ [drag] [●teal-light] Facial     8 productos  [✎] [🗑]
│
└─ [drag] [●amber] Fragancias          3 productos  [+ sub] [✎] [🗑]
```

**Color system**: 10 preset colors. Each parent picks a color; subcategories inherit a lighter tint. Colors stored in DB (`color` column on categories table).

**Preset palette**:
```
rose, teal, amber, violet, blue, emerald, orange, pink, cyan, slate
```

### DB Change

Add `color` column to `categories` table:
```sql
ALTER TABLE categories ADD COLUMN color text DEFAULT NULL;
```

Nullable — categories without a color get auto-assigned from a rotation.

### Drag & Drop

**Library**: `@dnd-kit/core` + `@dnd-kit/sortable` + `@dnd-kit/utilities`

**Operations**:
1. **Reorder within same level** — drag up/down changes `sort_order`
2. **No cross-level reparenting** via drag (too complex, error-prone). Reparenting via edit dialog if needed.

**Server action**: New `reorderCategories(items: { id: string; sort_order: number }[])` batch updates sort_order.

### CRUD Redesign

**Create**: Click "+" button → inline row appears at bottom of level with:
- Name input (auto-focus)
- Color picker (preset dots)
- Enter to save, Escape to cancel

**Edit**: Click pencil → card switches to edit mode inline:
- Name becomes editable input
- Color picker appears
- Description textarea expands below
- Save/Cancel buttons

**Delete**: Same ConfirmDialog pattern (unchanged).

### Component Architecture

```
CategoryManager (root)
├── CategoryTree (DndContext + SortableContext wrapper)
│   └── CategoryNode (recursive, one per category)
│       ├── CategoryCard (display mode)
│       ├── CategoryCardEdit (inline edit mode)
│       └── CategoryTree (children, recursive)
├── InlineCreateRow (appears when adding)
└── ColorPicker (preset color dots popover)
```

### Animations

- Drag: `@dnd-kit` overlay with scale(1.02) + shadow elevation
- Expand/collapse: Same AnimatePresence height animation (existing pattern)
- Create: Slide-in from left with opacity + y animation
- Color change: Smooth background-color transition
- Reorder: Layout animation via `motion.div layout`

### Files Changed

1. **New**: `src/features/productos/components/category-tree.tsx` — main tree + DnD
2. **New**: `src/features/productos/components/category-node.tsx` — single node (card + edit)
3. **New**: `src/features/productos/components/category-color-picker.tsx` — color preset picker
4. **Rewrite**: `src/features/productos/components/category-manager.tsx` — orchestrator
5. **Edit**: `src/features/productos/schemas.ts` — add `color` to categorySchema
6. **Edit**: `src/features/productos/actions.ts` — add `reorderCategories` action, update existing actions for color
7. **DB migration**: Add `color` column via Supabase MCP

### What stays the same

- `useCategories()` query hook (unchanged)
- `deleteCategory()` action (unchanged logic)
- Category types from database.ts
- Product-category junction table relationship
- All product form category pickers (they consume useCategories, unaffected)
