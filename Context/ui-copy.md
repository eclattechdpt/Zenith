# ECLAT — UI Copy & Microcopy

---

## 1. Tono general

**Directo, cálido, eficiente.**

- Como hablar con alguien que trabaja en el negocio de cosméticos, no con un sistema corporativo.
- Sin rodeos. Si algo sale bien, se dice en 4 palabras. Si algo sale mal, se dice qué pasó y cómo arreglarlo.
- Nunca condescendiente ("¡Excelente trabajo!"). Nunca robótico ("Operación ejecutada satisfactoriamente").
- El software es una herramienta, no una persona. No dice "yo" ni "nosotros" salvo en errores de sistema donde se disculpa.

**Idioma**: Español de México. Tú (no usted, no vos).

**Anglicismos permitidos** (se usan en el giro y no tienen traducción práctica):
stock, display, set, look, swatch, gloss, matte, shimmer, liner, primer, highlighter, blush (producto), mascara, concealer

**Anglicismos prohibidos** (tienen equivalente claro):
- ~~item~~ → producto
- ~~transaction~~ → venta
- ~~checkout~~ → cobro
- ~~dashboard~~ → panel (o simplemente el nombre de la sección)
- ~~settings~~ → configuración
- ~~delete~~ → eliminar
- ~~cancel~~ → cancelar
- ~~submit~~ → (usar el verbo de la acción: cobrar, guardar, registrar)

---

## 2. Patrones de microcopy

### Botones

| Tipo | Patrón | Ejemplo correcto | Ejemplo incorrecto |
|------|--------|-------------------|---------------------|
| Primario | Verbo + objeto directo | Cobrar $1,805 | Procesar pago |
| Primario (acción sin monto) | Verbo + objeto | Registrar cliente | Guardar datos del cliente |
| Secundario | Verbo neutro | Guardar | Guardar cambios |
| Destructivo | Verbo directo | Eliminar producto | ¿Estás seguro de eliminar? |
| Cancelar | Solo "Cancelar" | Cancelar | No, regresar |

### Confirmaciones (toasts de éxito)

**Patrón**: Resultado + detalle breve.

```
✓ Venta registrada #0042
✓ Cliente guardado
✓ Inventario actualizado — 24 unidades
✓ Caja abierta con $2,000.00
✓ Corte de caja completado
✓ Descuento aplicado — 20% en toda la venta
```

### Errores de validación

**Patrón**: Qué falta o qué está mal + cómo corregir.

```
Agrega al menos 1 producto para cobrar.
El precio debe ser mayor a $0.
Selecciona un método de pago.
Este SKU ya existe. Usa otro código.
El RFC no tiene el formato correcto (12 o 13 caracteres).
No hay suficiente stock de este producto (disponible: 3).
```

### Errores de sistema

**Patrón**: Disculpa breve + qué pasó + qué hacer.

```
No pudimos conectar con el servidor. Revisa tu conexión e intenta de nuevo.
Algo salió mal al procesar el pago. Intenta de nuevo o usa otro método.
No se pudo generar el ticket. Intenta reimprimir desde el historial de ventas.
```

### Estados vacíos

**Patrón**: Qué habrá aquí + acción o ánimo.

```
Carrito:       Agrega productos para iniciar una venta.
Ventas hoy:    Aún no hay ventas hoy. La primera está por llegar.
Clientes:      Aún no hay clientes registrados. Agrega el primero.
Búsqueda:      No encontramos resultados para "{término}". Prueba con otro nombre o SKU.
Inventario:    No hay movimientos de inventario en este periodo.
Dashboard:     No hay datos suficientes para mostrar estadísticas. Las ventas irán apareciendo aquí.
```

### Placeholders

**Patrón**: Ejemplo real del campo, precedido por "Ej:" si no es obvio.

```
Nombre del producto:    Ej: Labial Ultra Matte
SKU:                    Ej: ZN-LB-001
Nombre del cliente:     Ej: María López
Teléfono:               +52 33 1234 5678
Buscar:                 Buscar por nombre, SKU o código de barras...
Monto de apertura:      Ej: $2,000.00
Notas:                  Agregar una nota (opcional)
```

### Tooltips

**Patrón**: Contexto adicional breve. Una oración máximo.

```
Incluye IVA (16%).
Stock disponible en esta sucursal.
El PIN es de 4 a 6 dígitos.
Se puede dividir el pago entre efectivo y tarjeta.
Solo administradores pueden modificar este campo.
```

### Loading

**Patrón**: Qué se está haciendo, con "..." al final.

```
Cargando productos...
Procesando pago...
Generando ticket...
Actualizando inventario...
Calculando corte de caja...
Buscando clientes...
```

### Diálogos de confirmación

**Patrón**: Pregunta directa + consecuencia si es destructiva.

```
¿Cancelar esta venta?
Se eliminarán todos los productos del carrito.
[Cancelar venta]  [Regresar]

¿Eliminar este producto?
Se eliminará de forma permanente. Esta acción no se puede deshacer.
[Eliminar]  [Cancelar]

¿Cerrar la caja?
Se generará el corte con los totales actuales. No podrás registrar más ventas hasta abrir una nueva caja.
[Cerrar caja]  [Cancelar]

¿Aplicar devolución de la venta #0042?
Se reintegrará $1,805.00 y el stock se actualizará.
[Aplicar devolución]  [Cancelar]
```

---

## 3. Glosario de términos del dominio

Términos del dominio en la UI.

| Concepto | Término en UI | Nunca usar |
|----------|---------------|------------|
| Producto cosmético | Producto | Artículo, ítem, SKU (como sustantivo visible) |
| Variante de producto | Variante | Opción, versión |
| Categoría de producto | Categoría | Tipo, grupo, familia |
| Color/shade del cosmético | Tono | Color (es ambiguo), shade |
| Tipo de acabado | Acabado | Finish (en UI), textura |
| Transacción de venta | Venta | Transacción, orden, pedido, ticket |
| Línea de venta | Producto (en contexto de carrito) | Ítem, línea, artículo |
| Comprador | Cliente | Consumidor, comprador, usuario |
| Empleado del POS | Operador | Empleado, usuario (ambiguo con cliente) |
| Proceso de cobro | Cobro | Checkout, cierre, proceso de pago |
| Sesión de caja | Caja | Registro, terminal, sesión |
| Cierre/corte de caja | Corte de caja | Cierre, arqueo, reconciliación |
| Monto de cambio | Cambio | Vuelto, regreso, diferencia |
| Existencias | Stock | Existencias (es válido pero "stock" es más usado en el giro) |
| Tienda física | Sucursal | Tienda, local, branch |
| Recibo/nota | Ticket | Recibo, comprobante (salvo contexto fiscal) |
| Factura fiscal | Factura (CFDI) | Comprobante fiscal |
| Rebaja de precio | Descuento | Promoción (a menos que sea una promo específica) |
| Ajuste de inventario | Ajuste | Corrección, modificación |
| Pérdida de producto | Merma | Pérdida, daño |

### Términos de cosméticos (se usan tal cual)

- **Tono**: El color específico del cosmético (Rouge Allure, Nude Pink, Coral Sunset)
- **Acabado**: La textura o efecto del cosmético (matte, satin, shimmer, gloss, metallic, cream)
- **Swatch**: Muestra visual del color en la UI (el círculo de color)
- **Set**: Conjunto de productos que se vende como unidad
- **Look**: Combinación de productos aplicados (se usa más en descripción que en UI operativa)

---

## 4. Formato de datos

### Moneda

```
Formato:     $1,805.00
Separador de miles:   coma (,)
Separador decimal:    punto (.)
Símbolo:     $ (siempre antes del monto, sin espacio)
Sufijo:      MXN (solo cuando se necesita clarificar divisa, raro en POS local)
Cero:        $0.00 (nunca $0, nunca $-.-)
Negativo:    -$150.00 (signo antes del $)
```

### Fecha

```
Formato corto:    18 mar 2026
Formato largo:    18 de marzo de 2026
Solo mes/año:     Marzo 2026 (capitalizado)
Relativo:         Hoy, Ayer, Hace 3 días (solo para < 7 días)
```

### Hora

```
Formato:     2:30 pm
Estilo:      12 horas
AM/PM:       Minúsculas, con espacio (2:30 pm, no 2:30PM)
```

### Fecha + hora combinados

```
18 mar 2026 · 2:30 pm
```

El separador es un punto medio (·) con espacio a cada lado.

### SKU

```
Formato:     ZN-XX-###
Ejemplo:     ZN-LB-001
ZN:          Prefijo ECLAT
XX:          Código de categoría (LB=Labios, OJ=Ojos, RO=Rostro, UN=Uñas, HR=Herramientas, ST=Sets, SK=Skincare)
###:         Secuencial de 3 dígitos
```

### Teléfono

```
Formato:     +52 33 1234 5678
Código país:  +52
Separador:    Espacios (no guiones, no paréntesis)
```

### Número de venta

```
Formato:     #0042
Padding:     4 dígitos con ceros a la izquierda
Prefijo:     # (siempre)
```

### Porcentajes

```
Formato:     20% (sin espacio entre número y %)
Descuento:   -20% (con signo negativo)
Crecimiento: +15.3% (con signo positivo y decimal si aplica)
```

### Cantidades/unidades

```
Peso:        3.5 g, 30 ml (espacio entre número y unidad, unidad en minúscula)
Stock:       24 unidades (no "24 u" ni "24 pcs")
```

---

## 5. Navegación y títulos de sección

| Sección | Título en sidebar | Título en header de página |
|---------|-------------------|---------------------------|
| Punto de venta | Venta | Punto de venta |
| Catálogo de productos | Productos | Productos |
| Detalle de producto | — (no aparece en nav) | {Nombre del producto} |
| Inventario | Inventario | Inventario |
| Clientes | Clientes | Clientes |
| Detalle de cliente | — | {Nombre del cliente} |
| Dashboard | Panel | Panel de ventas |
| Historial de ventas | Ventas | Historial de ventas |
| Caja registradora | Caja | Caja registradora |
| Configuración | Configuración | Configuración |

---

## 6. Mensajes de ticket / nota de venta

```
Encabezado:
  ECLAT
  {Nombre de sucursal}
  {Dirección}
  RFC: {RFC de la sucursal}

Cuerpo:
  Venta #{número}
  Fecha: {fecha} · {hora}
  Atendió: {nombre del operador}
  Cliente: {nombre del cliente} (si aplica)

  ─────────────────────
  {cantidad}x {nombre producto}
     {variante: tono + acabado}
     ${precio unitario}    ${subtotal línea}

  ─────────────────────
  Subtotal:    ${subtotal}
  Descuento:   -${descuento} (si aplica)
  IVA (16%):   ${iva}
  Total:       ${total}

  Pagado con:  {método} ${monto}
  Cambio:      ${cambio} (si efectivo)

Pie:
  ¡Gracias por tu compra!
  www.eclatcosmetics.mx
```
