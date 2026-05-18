# Plan de pruebas — Refactor de descuentos (#1 + #7 + #8)

Fecha: 2026-05-18

Verifica los 7 fases del refactor:
- A · Migración BD + RPCs
- B · Store con `cartDiscount` y per-item override
- C · `resolvePrice` sin aplicar % del cliente
- D · Chip toggle del descuento del cliente
- E · Picker per-item con Regalo
- F · Display del % per-item en recibos y sale-detail
- G · Wire-up: schemas, acciones, persistencia

---

## Parte 1 — Verificación de base de datos (5 min)

Ejecutar en SQL Editor de Supabase o vía MCP. Todas deben pasar.

### V1. Columna `sales.discount_percent` existe
```sql
SELECT column_name, data_type, numeric_precision, numeric_scale, is_nullable
FROM information_schema.columns
WHERE table_name = 'sales' AND column_name = 'discount_percent';
```
**Esperado:** 1 fila con `numeric(5,2)`, nullable=YES.

### V2. Columna `sale_items.discount_percent` existe
```sql
SELECT column_name, data_type, numeric_precision, numeric_scale, is_nullable
FROM information_schema.columns
WHERE table_name = 'sale_items' AND column_name = 'discount_percent';
```
**Esperado:** 1 fila con `numeric(5,2)`, nullable=YES.

### V3. RPCs aceptan `p_discount_percent`
```sql
SELECT proname, pg_get_function_identity_arguments(oid) AS args
FROM pg_proc
WHERE proname IN ('create_sale_transaction', 'create_pending_sale')
ORDER BY proname;
```
**Esperado:** ambos signatures incluyen `p_discount_percent numeric`.

### V4. Ventas creadas con %
Después de hacer ventas en la UI:
```sql
SELECT sale_number, status, subtotal, discount_amount, discount_percent, total, created_at
FROM sales
WHERE deleted_at IS NULL
ORDER BY created_at DESC
LIMIT 10;
```
**Esperado:** `discount_percent` con valor cuando aplicaste %, NULL cuando custom_amount o sin descuento.

### V5. Items con `discount_percent` per-item
```sql
SELECT si.id, s.sale_number, si.product_name, si.unit_price, si.quantity,
       si.discount, si.discount_percent, si.line_total
FROM sale_items si
JOIN sales s ON s.id = si.sale_id
WHERE s.created_at > (now() - interval '1 day')
ORDER BY s.created_at DESC, si.id;
```
**Esperado:** items con override per-item muestran su `discount_percent` específico; items que siguen el cart-level muestran el % del carrito.

---

## Parte 2 — Pruebas manuales en UI

### Setup
1. `npm run dev`
2. Abre `http://localhost:3000/pos`
3. Asegúrate de tener al menos un cliente con `price_list` (ej. "Consentido 30%") y al menos otra `price_list` activa con %>0 (ej. "Promo Mayo 50%"). Si no, crea en `/configuracion → Descuentos`.

---

### Test 1 · Descuento del cliente como cart-level (Fase D)

**Setup:** carrito vacío, sin cliente.

1. Agrega 2 productos al carrito (cualquier precio).
2. **Verifica:** no hay chip de descuento. Precios iguales a `basePrice` × cantidad.
3. Elige un cliente con `Consentido 30%`.
4. **Verifica ✅:**
   - Aparece chip rojo "Desc. cliente (30%) -$X" en el footer del carrito.
   - Cada item muestra precio tachado + nuevo precio + chip `-30%`.
   - Total = subtotal × 0.70.
5. Click en la **X** del chip.
6. **Verifica ✅:**
   - Chip desaparece.
   - Items vuelven a precio base.
   - Aparece botón "Agregar descuento".

---

### Test 2 · Cambiar el descuento del cliente por otro (#7)

**Setup:** carrito con cliente "Consentido 30%" → chip 30% activo.

1. Click ✕ en el chip → descuento eliminado.
2. Click "Agregar descuento" → elige "Promo Mayo 50%".
3. **Verifica ✅:**
   - Chip cambia a "Descuento (50%) -$X".
   - Items recalculan al 50%.
4. **NO debe haber stacking**: si el customer es 30% Y picker muestra 50%, el efectivo es **50%**, no 65%.
   - Si subtotal = $1000 y elegiste 50% → total debe ser $500 exacto (no $350).

---

### Test 3 · Override per-item — Listas de precios (Fase E)

**Setup:** carrito con 3 items, cliente "Consentido 30%" activo.

1. Click en el chip "..." (botón pequeño) en el primer item del carrito.
2. **Verifica ✅:** popover abre con: Regalo, listas activas, Custom %, Custom $, Quitar override.
3. Elige una preset (ej. "Promo 50%").
4. **Verifica ✅:**
   - El primer item muestra chip "-50%" + nuevo precio.
   - Los otros items mantienen el 30% del carrito.
   - Total = item1 × 0.50 + item2 × 0.70 + item3 × 0.70.
5. Click "..." en el primer item → "Quitar override · usar carrito".
6. **Verifica ✅:** item1 vuelve a usar 30%.

---

### Test 4 · Override per-item — Custom % decimal

**Setup:** carrito con 1 item de $1000.

1. Click "..." → "Personalizado" → modo `%` → teclea `33.45` → Aplicar.
2. **Verifica ✅:**
   - Item muestra `-33.45%`.
   - Precio = $1000 × (1 - 0.3345) = $665.50.
   - Chip exacto: "−33.45%" (no redondeado a "−33%").

---

### Test 5 · Override per-item — Custom $

**Setup:** carrito con 1 item de $1000, cantidad 2 (subtotal item = $2000).

1. Click "..." → "Personalizado" → modo `$` → teclea `500` → Aplicar.
2. **Verifica ✅:**
   - Item descontado por $500.
   - Chip muestra el equivalente en % (`-25%`).
   - Line total = $1500.

---

### Test 6 · Regalo (#1)

**Setup:** carrito con 3 items, cualquier configuración.

1. Click "..." en el item del medio → botón "🎁 Regalo".
2. **Verifica ✅:**
   - Chip violeta "🎁 Regalo" reemplaza el chip rojo.
   - Línea muestra "GRATIS" en lugar del precio.
   - El total del carrito **resta** ese item completo.
3. Avanza al wizard de venta → paso de pago → confirmación.
4. **Verifica ✅:** la pantalla de confirmación muestra el item como "GRATIS" con badge violeta.

---

### Test 7 · Regalo de cofre completo

**Setup:** carrito con un cofre.

1. Click "..." en el cofre → "Regalo".
2. **Verifica ✅:**
   - Cofre muestra "GRATIS".
   - Total cambia (resta el precio del cofre).
3. Completa la venta.
4. **Verifica en BD ✅:** Stock de componentes del cofre **sí se descuenta** (regalo solo afecta el precio, no el stock):
   ```sql
   SELECT pv.id, p.name, pv.stock
   FROM product_variants pv
   JOIN products p ON p.id = pv.product_id
   WHERE p.id IN (
     SELECT bi.product_variant_id
     FROM bundle_items bi
     WHERE bi.bundle_id = '<el-cofre-id>'
   );
   ```

---

### Test 8 · No stacking en cofres con regalo

**Setup:** cliente "Consentido 30%", cofre $500 en carrito.

1. Cart-level activo al 30%. Item cofre muestra $350 (30% off).
2. Marca el cofre como Regalo per-item.
3. **Verifica ✅:** cofre = $0 (GRATIS), **no** $350×0 (= incorrecto). El override gana sobre el cart-level.

---

### Test 9 · Persistencia y display histórico (Fase F)

**Setup:** completa una venta con descuento mixto (algunos items con override, otros siguiendo cart-level).

1. Completa la venta → toma nota del `sale_number`.
2. Ve a `/ventas` → encuentra la venta → click "Ver detalle".
3. **Verifica ✅:**
   - Cada item muestra precio tachado + % específico aplicado.
   - Items "regalo" muestran badge "REGALO" + "GRATIS".
   - Footer muestra "Descuento (X%) -$Y" donde X es el cart-level (o cálculo, si la venta venía sin `discount_percent`).

### Test 10 · Recibo HTML e impresión

**Setup:** venta del Test 9.

1. En el detalle de la venta, click "Imprimir".
2. **Verifica ✅ en el preview:**
   - Por cada item con descuento: precio tachado + `-X%` en rojo.
   - Items regalo: "GRATIS" en violeta.
   - Footer del recibo: "Descuento (X%)" + monto.

### Test 11 · Recibo PDF

**Setup:** misma venta.

1. Click "Descargar PDF".
2. **Verifica ✅ en el archivo PDF:**
   - Layout idéntico al HTML.
   - Tachados, % rojos, "GRATIS" violeta.
   - Renderiza sin errores con `@react-pdf/renderer`.

---

### Test 12 · Custom_amount no se aplica per-item

**Setup:** carrito con 3 items.

1. Cart-level: usa "Personalizado" → modo `$` → teclea `100`.
2. **Verifica ✅:**
   - Chip muestra "-$100".
   - Items individuales **no** se ven afectados (mantienen sus precios).
   - Total = subtotal - $100.
3. Si haces override per-item con %, ese item se modifica además, pero el `-$100` se aplica al final.

---

### Test 13 · Ventas pendientes y descuento

**Setup:** carrito con 2 items, cliente con 30%.

1. En el wizard, después de elegir productos, deja la venta como "pendiente" (guardar sin cobrar).
2. Confirma que se creó la venta pendiente con descuento.
3. **Verifica en BD ✅:**
   ```sql
   SELECT s.sale_number, s.status, s.discount_percent, s.discount_amount,
          si.product_name, si.discount, si.discount_percent
   FROM sales s
   JOIN sale_items si ON si.sale_id = s.id
   WHERE s.status = 'pending'
   ORDER BY s.created_at DESC LIMIT 5;
   ```
   - `sales.discount_percent = 30`
   - Cada `sale_item.discount_percent = 30`
   - `sale_item.discount` = unit_price × qty × 0.30

**(Nota: el bug #2 — "al regresar al carrito no muestra el descuento" — sigue pendiente. Cuando se complete una venta pendiente, los precios del cart NO traen el descuento. Está marcado en `cambios_pos_16_mayo.md` como pendiente.)**

---

### Test 14 · No-regresión — Ventas sin cliente

**Setup:** carrito sin cliente.

1. Agrega 2 items → completa venta sin descuento.
2. **Verifica ✅:**
   - `sales.discount_percent = NULL`
   - `sales.discount_amount = 0`
   - `sale_items.discount = 0`, `discount_percent = NULL`

---

### Test 15 · No-regresión — Customer-specific prices siguen funcionando

**Setup:** un cliente con `customer_prices` específico para una variante (ej. $50 cuando el base es $100).

1. Agrega al carrito ese variante.
2. **Verifica ✅:** unitPrice = $50 (precio específico negociado).
3. Aplica descuento del cliente del 30%.
4. **Verifica ✅:** descuento se calcula sobre $50 × qty (no sobre $100). Total = $50 × 0.70 = $35.

---

## Parte 3 — Pruebas automatizadas (smoke SQL)

Estos queries deben pasar **después** de la Parte 2:

```sql
-- A. Ventas con % decimal se guardan correctamente
SELECT COUNT(*) AS rows
FROM sales
WHERE discount_percent IS NOT NULL
  AND discount_percent != FLOOR(discount_percent);
-- Esperado: ≥ 1 si hiciste Test 4

-- B. Items con regalo (100% off) tienen line_total = 0
SELECT COUNT(*) AS rows
FROM sale_items
WHERE discount_percent = 100 AND line_total != 0;
-- Esperado: 0

-- C. La suma de descuentos por item coincide con el descuento_amount calculado
SELECT
  s.sale_number,
  s.subtotal AS sale_subtotal,
  s.discount_amount AS cart_discount,
  s.total AS sale_total,
  SUM(si.discount) AS items_discount_sum,
  s.subtotal - SUM(si.discount) - s.discount_amount AS computed_total,
  s.total - (s.subtotal - SUM(si.discount) - s.discount_amount) AS diff
FROM sales s
JOIN sale_items si ON si.sale_id = s.id
WHERE s.deleted_at IS NULL AND s.created_at > now() - interval '1 day'
GROUP BY s.id
HAVING ABS(s.total - (s.subtotal - SUM(si.discount) - s.discount_amount)) > 0.01;
-- Esperado: 0 filas (todos los totales cuadran)
```

---

## Checklist final

- [ ] V1–V5 BD verifican OK
- [ ] Test 1: chip toggle del cliente
- [ ] Test 2: cambiar descuento sin stacking
- [ ] Test 3: override per-item con preset
- [ ] Test 4: custom % decimal (33.45%)
- [ ] Test 5: custom $ per-item
- [ ] Test 6: Regalo per-item
- [ ] Test 7: Regalo de cofre (stock descontado)
- [ ] Test 8: regalo en cofre con cart-level activo
- [ ] Test 9: persistencia y display en sale-detail
- [ ] Test 10: recibo HTML
- [ ] Test 11: recibo PDF
- [ ] Test 12: custom_amount no aplica per-item
- [ ] Test 13: venta pendiente con descuento
- [ ] Test 14: ventas sin descuento siguen bien
- [ ] Test 15: customer-specific prices intactos
- [ ] Queries A/B/C smoke pasan

Si todos pasan, marcar #1+#8 como definitivamente terminado y proceder al commit.
