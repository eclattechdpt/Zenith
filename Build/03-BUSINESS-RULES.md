# Business Rules — Reglas de negocio y lógica del sistema

## 1. Resolución de precios

Cuando se selecciona un producto en el POS, el precio se resuelve con la siguiente prioridad (de mayor a menor):

1. **Precio específico**: Si el cliente tiene una `price_list_id` y existe un registro en `customer_prices` para esa lista + esa variante → usar ese `price` fijo.
2. **Descuento de lista**: Si el cliente tiene una `price_list_id` con `discount_percent > 0` pero NO hay precio específico → calcular `variant.price * (1 - discount_percent / 100)`.
3. **Precio base**: Si no hay cliente seleccionado o el cliente no tiene lista de precios → usar `product_variants.price` directamente.

```
function resolvePrice(variant, customer):
  if customer AND customer.price_list_id:
    specificPrice = findCustomerPrice(customer.price_list_id, variant.id)
    if specificPrice:
      return specificPrice.price

    priceList = findPriceList(customer.price_list_id)
    if priceList.discount_percent > 0:
      return variant.price * (1 - priceList.discount_percent / 100)

  return variant.price
```

---

## 2. Flujo de venta completa

### Paso a paso

1. **Buscar producto** en el POS (por nombre, SKU, o código de barras)
2. **Seleccionar variante** específica
3. **Seleccionar cliente** (opcional — si no se selecciona, se usa precio base)
4. **Agregar al carrito** — se resuelve el precio según las reglas de la sección anterior
5. **Aplicar descuento** (opcional — descuento manual sobre la venta completa o por item)
6. **Registrar pago(s)** — puede ser dividido entre múltiples métodos
7. **Confirmar venta** — se ejecuta en una TRANSACCIÓN que hace todo lo siguiente:

### Operaciones atómicas (dentro de transacción)

```
BEGIN TRANSACTION:

  a. Crear registro en `sales` con status 'completed'
     - Generar sale_number secuencial (V-0001)
     - Calcular subtotal, discount_amount, total

  b. Crear registros en `sale_items` por cada item del carrito
     - Guardar snapshots: product_name, variant_label, unit_price, unit_cost
     - Calcular line_total = (unit_price * quantity) - discount

  c. Crear registros en `sale_payments` por cada método de pago
     - Validar que SUM(payments.amount) >= sales.total

  d. Por cada sale_item:
     - Leer stock actual de product_variant
     - Actualizar stock: product_variants.stock -= quantity
     - Crear registro en inventory_movements:
       - type: 'sale'
       - quantity: -quantity (negativo = salida)
       - stock_before: stock actual
       - stock_after: stock actual - quantity
       - sale_id: referencia a la venta

COMMIT TRANSACTION
```

### Validaciones

- No se puede vender una variante con `is_active = false`
- No se puede vender cantidad 0 o negativa
- La suma de los pagos debe ser >= total de la venta
- Si la suma de pagos > total, el excedente se trata como cambio (no se registra)
- El stock PUEDE quedar negativo (esto permite ventas con stock pendiente de reposición) — se genera una alerta visual pero NO se bloquea la venta

---

## 3. Flujo de cotización

1. Mismos pasos 1-5 que una venta completa
2. En lugar de cobrar, se guarda como cotización:
   - `sales.status = 'quote'`
   - `sales.expires_at = fecha actual + días de vigencia configurables (default: 15 días)`
   - NO se descuenta stock
   - NO se crean inventory_movements
   - NO se crean sale_payments
3. Se puede generar un PDF de la cotización
4. Para convertir cotización en venta:
   - Verificar que no esté expirada
   - Actualizar status a 'completed'
   - Registrar pagos
   - Descontar stock (misma lógica de transacción de venta)
5. Para cancelar cotización:
   - Actualizar status a 'cancelled'
   - No hay stock que reversar

---

## 4. Flujo de devolución

### Devolución parcial

1. Seleccionar la venta original
2. Seleccionar los items a devolver y la cantidad de cada uno
3. Validar que la cantidad a devolver <= cantidad vendida originalmente - cantidad ya devuelta previamente
4. Decidir por cada item si se hace restock o no (`return_items.restock`)
5. Ejecutar en TRANSACCIÓN:

```
BEGIN TRANSACTION:

  a. Crear registro en `returns`
     - return_number secuencial (D-0001)
     - sale_id = venta original
     - status = 'completed'
     - total_refund = suma de line_totals de return_items

  b. Crear registros en `return_items`
     - Referencia al sale_item original
     - Cantidad devuelta, precio original, line_total

  c. Por cada return_item donde restock = true:
     - Leer stock actual de product_variant
     - Actualizar stock: product_variants.stock += quantity
     - Crear inventory_movement:
       - type: 'return'
       - quantity: +quantity (positivo = entrada)
       - stock_before / stock_after
       - return_id: referencia a la devolución

  d. Generar credit_note:
     - credit_number secuencial (NC-0001)
     - original_amount = total_refund
     - remaining_amount = total_refund
     - status = 'active'
     - customer_id = cliente de la venta original

  e. Actualizar sales.status:
     - Si todos los items fueron devueltos completamente → 'fully_returned'
     - Si solo algunos items o cantidades parciales → 'partially_returned'

COMMIT TRANSACTION
```

### Regla de protección contra devoluciones excesivas

Para cada sale_item, la cantidad total devuelta no puede exceder la cantidad original:

```sql
-- Validar antes de crear return_items
SELECT si.quantity - COALESCE(SUM(ri.quantity), 0) as max_returnable
FROM sale_items si
LEFT JOIN return_items ri ON ri.sale_item_id = si.id
  AND ri.return_id IN (SELECT id FROM returns WHERE status = 'completed')
WHERE si.id = {sale_item_id}
GROUP BY si.quantity
```

---

## 5. Notas de crédito

### Usar como método de pago

1. En el POS, al momento de pagar, seleccionar "Nota de crédito" como método
2. Mostrar notas de crédito activas del cliente seleccionado
3. Seleccionar la nota de crédito a usar
4. El monto aplicado no puede exceder `remaining_amount`
5. Si la nota de crédito cubre todo el total, no se necesita otro pago
6. Si no cubre todo, se combina con otro método (pago dividido)

### Actualización de nota de crédito al usarla

```
credit_note.remaining_amount -= monto aplicado
if credit_note.remaining_amount <= 0:
  credit_note.status = 'redeemed'
```

### En sale_payments

```
method: 'credit_note'
amount: monto aplicado de la nota
reference: credit_note.id
```

---

## 6. Gestión de inventario

### Tipos de movimiento

| Tipo | quantity | Cuándo |
|------|----------|--------|
| `sale` | Negativo | Venta completada |
| `return` | Positivo | Devolución con restock |
| `purchase` | Positivo | Entrada de mercancía |
| `adjustment` | +/- | Conteo físico no coincide |
| `initial` | Positivo | Carga inicial de inventario |

### Ajuste manual de stock

Cuando el usuario hace un ajuste manual (conteo físico):

```
new_stock = cantidad contada por el usuario
current_stock = product_variants.stock
difference = new_stock - current_stock

Crear inventory_movement:
  type: 'adjustment'
  quantity: difference (puede ser positivo o negativo)
  stock_before: current_stock
  stock_after: new_stock
  reason: texto libre del usuario explicando el ajuste

Actualizar product_variants.stock = new_stock
```

### Alertas de stock bajo

Condición: `product_variants.stock <= product_variants.stock_min AND is_active = true`

El dashboard debe mostrar una sección con todas las variantes que cumplen esta condición, ordenadas por la diferencia más grande (las más urgentes primero).

---

## 7. Cancelación de venta

Solo se pueden cancelar ventas con status `completed` que no tengan devoluciones.

```
BEGIN TRANSACTION:

  a. Validar que la venta no tenga returns asociados
  
  b. Por cada sale_item:
     - Leer stock actual
     - Actualizar stock: product_variants.stock += quantity (reversar)
     - Crear inventory_movement:
       - type: 'adjustment'
       - quantity: +quantity
       - reason: 'Cancelación de venta {sale_number}'
  
  c. Actualizar sales.status = 'cancelled'

COMMIT TRANSACTION
```

---

## 8. Números secuenciales

| Entidad | Prefijo | Ejemplo | Campo |
|---------|---------|---------|-------|
| Venta | V | V-0001 | sales.sale_number |
| Cotización | C | C-0001 | sales.sale_number |
| Devolución | D | D-0001 | returns.return_number |
| Nota de crédito | NC | NC-0001 | credit_notes.credit_number |

Los números son por `tenant_id` y secuenciales. El prefijo distingue ventas de cotizaciones en la misma tabla.

---

## 9. Búsqueda de productos en POS

La búsqueda en el POS debe buscar en:

1. `products.name` (full-text search con tsvector español)
2. `products.brand`
3. `product_variants.sku` (búsqueda exacta o parcial)
4. `product_variants.barcode` (búsqueda exacta — escaneo)

La búsqueda por barcode debe ser priorizada: si el texto ingresado coincide exactamente con un barcode, ir directo a esa variante sin mostrar resultados intermedios.

---

## 10. Dashboard KPIs

### KPIs principales

| KPI | Cálculo | Período |
|-----|---------|---------|
| Ventas del día | SUM(sales.total) WHERE status = 'completed' AND created_at = today | Hoy |
| Ventas de la semana | SUM(sales.total) WHERE status = 'completed' AND created_at >= start_of_week | Semana actual |
| Ventas del mes | SUM(sales.total) WHERE status = 'completed' AND created_at >= start_of_month | Mes actual |
| Margen bruto | SUM(sale_items.line_total - (sale_items.unit_cost * sale_items.quantity)) | Período seleccionado |
| Ticket promedio | AVG(sales.total) WHERE status = 'completed' | Período seleccionado |
| Productos con stock bajo | COUNT(*) FROM product_variants WHERE stock <= stock_min AND is_active | Tiempo real |
| Productos top (por volumen) | SUM(sale_items.quantity) GROUP BY product, ORDER DESC LIMIT 10 | Período seleccionado |
| Productos top (por monto) | SUM(sale_items.line_total) GROUP BY product, ORDER DESC LIMIT 10 | Período seleccionado |

### Filtros del dashboard

- Rango de fechas (con presets: hoy, esta semana, este mes, último mes, personalizado)
- Por categoría
- Por producto específico

Los filtros se almacenan en la URL via nuqs para que sean compartibles y persistentes.

---

## 11. Exportaciones

### PDF

Generar con @react-pdf/renderer:

- **Ticket de venta**: formato reducido para impresión térmica (58mm o 80mm de ancho)
- **Nota de venta**: formato carta/A4, con datos del negocio, cliente, items, totales
- **Cotización**: similar a nota de venta, con fecha de vigencia
- **Reporte de inventario**: listado de productos con stock actual, stock mínimo, valor
- **Reporte de ventas**: listado de ventas por período con totales

### Excel/CSV

Generar con SheetJS (xlsx):

- Listado de productos con variantes
- Historial de ventas
- Movimientos de inventario
- Listado de clientes

### Impresión

Usar react-to-print para tickets de venta. El componente de impresión se renderiza oculto y se envía a la impresora del sistema.

---

## 12. Generación de tipos TypeScript

Ejecutar después de cada migración:

```bash
npx supabase gen types typescript --project-id <project-id> > src/types/database.ts
```

Esto genera tipos TypeScript automáticos para todas las tablas. Usarlos en todo el proyecto para type-safety completo.
