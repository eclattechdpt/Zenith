# 09 — Image Handling & Media Management

## Current Implementation (Sprint 8)

### Architecture

Product images flow through a three-layer pipeline:

```
User Input → Processing → Storage
  (URL, file, data URL)   (compress, validate)   (Supabase Storage or external URL)
```

### Image Sources Supported

| Source | How it works |
|--------|-------------|
| **File upload** | Drag-and-drop or file picker. Compressed client-side to ~30 KB WebP (400px max). Uploaded to Supabase Storage. |
| **HTTP/HTTPS URL** | User pastes a URL. Choice panel: "Download & optimize" (proxy → compress → Supabase) or "Keep external link" (stores URL as-is). |
| **Data URL** | Base64-encoded images (e.g., from web scraping, clipboard). Decoded client-side via `fetch()`, then compressed and uploaded. No proxy needed. |
| **Existing Supabase image** | Already optimized. Displayed with "Supabase Storage" badge. |

### Components

| File | Responsibility |
|------|---------------|
| `src/lib/supabase/storage.ts` | Compression (`browser-image-compression`), upload/delete, validation (tiered: silent < 15MB, warn 15-25MB, block > 25MB), `getImageMeta()` for hosting type detection, `dataUrlToFile()` for base64 decode, `fetchImageFromUrl()` routing (data URLs client-side, HTTP via proxy) |
| `src/app/api/image-proxy/route.ts` | Server-side proxy to bypass CORS for external image downloads. Magic byte detection (JPEG/PNG/WebP/GIF/BMP/AVIF) for servers returning wrong Content-Type. 15s timeout, 25MB limit. |
| `src/features/productos/components/product-image-picker.tsx` | UI component with two modes: **preview** (info bar with hosting type, source domain, actions) and **picker** (upload/URL tabs). Supports convert-in-place (URL → Supabase), change-without-remove, and data URL auto-processing. |

### Storage Details

- **Bucket**: `product-images` (Supabase Storage)
- **Path pattern**: `{tenant_id}/{product_id}.webp`
- **Compression**: 30 KB target, 400px max dimension, WebP, 70% quality
- **Cache**: `Cache-Control: max-age=31536000` (1 year, immutable)
- **One image per product** — stored in `products.image_url` column

### Hosting Type Detection

The `getImageMeta(url)` function classifies any image URL:

| Type | Detection | Badge color |
|------|-----------|-------------|
| `supabase` | URL contains `/storage/v1/object/public/product-images/` | Teal |
| `url` | Any `http://` or `https://` URL not matching Supabase | Blue |
| `data` | Starts with `data:image/` | Violet |
| `pending` | Starts with `blob:` (local, pre-upload) | Amber |

### Database

- `products.image_url` — Single `text` column, nullable. Stores either a Supabase public URL or an external URL.
- `product_images` table — **Exists in schema but unused**. Designed for multi-image galleries (has `storage_path`, `sort_order`). Reserved for future use.

---

## Future: Media Management Module

### Why it's needed

Currently, images are managed implicitly through the product form. As the catalog grows, several operational needs will emerge:

1. **Storage visibility** — No way to see total storage used, per-product sizes, or orphaned files
2. **Bulk operations** — Can't re-optimize all images, bulk convert URL images to Supabase, or clean up unused files
3. **Orphaned media** — Deleted products leave images in storage (soft delete doesn't clean storage)
4. **Multi-image support** — The `product_images` table exists but isn't wired up. Products currently support only one image.
5. **Variant-specific images** — No way to assign different images per variant (e.g., different colors)

### Proposed Scope

A dedicated `/media` or `/configuracion/media` page that provides:

#### Storage Overview
- Total storage used (query Supabase Storage API)
- Breakdown: optimized vs external-linked products
- Products without images count
- Alert when approaching storage quota

#### Media Browser
- Grid of all product images with product name, size, hosting type
- Filter by: hosting type (Supabase/URL/none), product category, size range
- Sort by: size, date uploaded, product name

#### Bulk Actions
- **Batch optimize**: Select multiple URL-hosted images → download & compress all to Supabase
- **Orphan cleanup**: Find and delete storage files not linked to any active product
- **Re-compress**: Re-run compression on old images with updated settings (e.g., if target size changes)
- **Export audit**: Generate report of all images with sizes, types, and product links

#### Multi-Image Gallery (uses `product_images` table)
- Enable multiple images per product with drag-to-reorder
- Primary image selection (first in sort order = `products.image_url`)
- Gallery view in product detail / POS

#### Variant Images
- Assign images per variant (add `image_url` to `product_variants`)
- Inherit from product if variant has no specific image

### Dependencies

- Supabase Storage API for bucket metrics (`/storage/v1/bucket/product-images` usage)
- Wire up `product_images` table (already migrated, has `id`, `product_id`, `storage_path`, `sort_order`, `tenant_id`)
- Add `image_url` column to `product_variants` table (migration needed)

### Priority

This is a **Sprint 9+ item** — operational tooling. Not blocking for MVP but becomes important as catalog exceeds ~100 products with images.
