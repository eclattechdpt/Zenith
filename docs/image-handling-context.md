# Image Handling Improvements — Testing Context

## What was done

We redesigned the product image handling system to be fully automatic and storage-efficient. Three files were created/modified, plus a config fix.

### 1. NEW: `src/app/api/image-proxy/route.ts`
- Server-side proxy that bypasses CORS to download external images
- POST endpoint: `{ url: string }` → returns raw image bytes
- Validates URL format, checks Content-Type is `image/*`, 25MB hard limit, 15s timeout
- Error messages in Spanish

### 2. MODIFIED: `src/lib/supabase/storage.ts`
- **Tiered validation** — `validateImageFile()` now returns `{ status: "ok" | "warn" | "blocked", message }`:
  - `<= 15MB`: silent green path
  - `15-25MB`: amber warning but allowed
  - `> 25MB`: hard block
  - (Previously was a flat 5MB hard block)
- **New function** `fetchImageFromUrl(url)` — calls the proxy API, returns a `File` object
- **Compression settings** (unchanged from earlier session):
  - `maxSizeMB: 0.03` (30KB target)
  - `maxWidthOrHeight: 400`
  - `initialQuality: 0.7`
  - Output: WebP
  - Cache: 1 year (`31536000`)
- Exported `compressImage()` for the picker to use directly

### 3. MODIFIED: `src/features/productos/components/product-image-picker.tsx`
Major rewrite of the URL flow:
- **URL choice panel**: When user pastes a URL and hits Enter, instead of immediately storing the raw URL, a choice panel appears with:
  - **"Descargar y optimizar"** (teal, recommended badge) — downloads via proxy, compresses, uploads to Supabase
  - **"Usar enlace directo"** — keeps the external URL as-is (no storage used)
- **File upload**: Updated to use tiered validation (amber warning for 15-25MB, red block for 25MB+)
- **Compression feedback**: After upload, shows "Optimizada: X KB" teal badge with sparkle icon on the preview
- **Loading states**: Spinner with progress text ("Descargando...", "Optimizando...", "Subiendo...")
- **Warning bar**: Amber bar (separate from red error bar) for non-blocking warnings
- Max file hint updated from "5 MB" to "25 MB"

### 4. MODIFIED: `next.config.ts`
- Added `images.remotePatterns` for `lccclwtwkegbvlpdwisu.supabase.co` to fix `next/image` error on POS page when displaying Supabase-stored images

## What needs testing (end-to-end via browser)

### Test 1: URL paste → Download & optimize
1. Go to `/productos`
2. Click edit (pencil) on any product
3. Remove existing image if any
4. Switch to "URL" tab
5. Paste: `https://www.costco.com.mx/medias/sys_master/products/h73/hd5/310037438103582.jpg`
6. Hit Enter or click checkmark
7. **Expected**: Choice panel appears with two options
8. Click "Descargar y optimizar"
9. **Expected**: Spinner → image appears with "SUPABASE" badge + "Optimizada: X KB" badge
10. Click "Guardar cambios"
11. **Expected**: Product updated successfully, card shows image

### Test 2: URL paste → Keep link
1. Same flow but click "Usar enlace directo" instead
2. **Expected**: Image appears with "URL" badge (blue), no compression badge
3. Save and verify

### Test 3: File upload (normal, < 15MB)
1. Upload a regular JPG/PNG image
2. **Expected**: Compresses silently, shows SUPABASE badge + compression info

### Test 4: File upload (warning, 15-25MB)
1. Upload a large image (15-25MB)
2. **Expected**: Amber warning "Imagen pesada, se optimizara automaticamente" appears, but image still processes

### Test 5: File upload (blocked, > 25MB)
1. Try uploading a 30MB+ file
2. **Expected**: Red error "Imagen demasiado grande (max 25 MB)"

### Test 6: New product wizard
1. Click "Nuevo producto"
2. Upload or paste URL for image
3. Fill required fields and save
4. **Expected**: Deferred upload works — image appears on the new product card

### Test 7: POS page
1. Navigate to `/pos`
2. **Expected**: No `next/image` hostname errors, product images display correctly

## Proxy API test (curl)
```bash
curl -s -X POST http://localhost:3000/api/image-proxy \
  -H "Content-Type: application/json" \
  -d '{"url":"https://www.costco.com.mx/medias/sys_master/products/h73/hd5/310037438103582.jpg"}' \
  -w "\nHTTP: %{http_code} | Size: %{size_download} bytes" -o /dev/null
# Expected: HTTP 200, ~63KB (original size before client compression)
```
This was already verified and returns HTTP 200 with 63,832 bytes.

## Key files
| File | Path |
|---|---|
| Image proxy API | `src/app/api/image-proxy/route.ts` |
| Storage utils | `src/lib/supabase/storage.ts` |
| Image picker | `src/features/productos/components/product-image-picker.tsx` |
| Next config | `next.config.ts` |
| Wizard dialog | `src/features/productos/components/product-wizard-dialog.tsx` (unchanged, verify compatibility) |
| Edit dialog | `src/features/productos/components/product-edit-dialog.tsx` (unchanged) |

## Pre-existing issues (not related to this work)
- TypeScript error in `src/features/productos/components/variant-manager.tsx:52` — NumericFormat type incompatibility (pre-existing)
- The Playwright browser session kept dying — needs fresh launch for browser testing
