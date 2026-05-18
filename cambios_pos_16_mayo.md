# Cambios POS — 16 de mayo

Última actualización: 2026-05-18

## En curso

_(nada en curso)_

## Pendientes (diferidos para después)

- **2.** Cuando el usuario deja una venta pendiente con descuento y regresa al carrito, la venta no muestra el descuento aplicado.
- **4.** Cambiar el formato de la impresora POS para que sea más legible (referencia: formato tipo Walmart).
- **5.** Imprimir el comentario del pago "Otro" en el recibo.

## Por discutir / planear

- **6.** Marcar clientas como "red interna" o "red externa".
- **9.** Revisar si aparece el número de distribuidor al imprimir una nota.
- **10.** Arreglar el orden al buscar productos para que salgan en orden numérico.
- **11.** Mostrar las ventas del día en la sección `/ventas`.
- **12.** Modificar inventario para que la suma sea solo físico + tránsito (excluir carga inicial).

## Terminados

- **1 + 8.** Descuento por producto (presets, custom %, custom $, **Regalo**) + el descuento del cliente como cart-level explícito con chip toggle. **Sin stacking** (resuelve el bug del 30% × 50% = 65% efectivo). Soporta cofres como regalo completo. Persistido en BD (`sale_items.discount_percent` + `sales.discount_percent`). ✅
- **3.** Al imprimir una nota mostrar el precio tachado + descuento aplicado (solo porcentaje). ✅
- **7.** Al elegir cliente con descuento base, decidir si se usa o se cambia por otro activo (resuelto como parte de 1+8 — el descuento del cliente es ahora un cart-level toggleable). ✅
