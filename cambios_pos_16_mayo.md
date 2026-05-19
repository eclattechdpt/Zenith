# Cambios POS — 16 de mayo

Última actualización: 2026-05-19

## En curso

_(nada en curso)_

## Pendientes (diferidos para después)

- **4.** Cambiar el formato de la impresora POS para que sea más legible (referencia: formato tipo Walmart).

## Por discutir / planear

- **6.** Marcar clientas como "red interna" o "red externa".
- **12.** Modificar inventario para que la suma sea solo físico + tránsito (excluir carga inicial).

## Terminados

- **1 + 8.** Descuento por producto (presets, custom %, custom $, **Regalo**) + el descuento del cliente como cart-level explícito con chip toggle. **Sin stacking** (resuelve el bug del 30% × 50% = 65% efectivo). Soporta cofres como regalo completo. Persistido en BD (`sale_items.discount_percent` + `sales.discount_percent`). ✅
- **3.** Al imprimir una nota mostrar el precio tachado + descuento aplicado (solo porcentaje). ✅
- **5.** Imprimir el comentario del pago "Otro" en el recibo (HTML + PDF). ✅
- **9.** Imprimir el número de distribuidor del cliente en el recibo (HTML + PDF). ✅
- **10.** Variantes de productos ordenadas por SKU (natural) en TODOS los lugares donde se listan: inventario, POS (search + wizard), productos (list/card expandibles), bundle picker, transit picker, notas de crédito picker, customer price editor. Helper `sortVariantsBySku` movido a `@/lib/utils`. ✅
- **7.** Al elegir cliente con descuento base, decidir si se usa o se cambia por otro activo (resuelto como parte de 1+8 — el descuento del cliente es ahora un cart-level toggleable). ✅
- **2.** Venta pendiente con descuento al reabrir mostraba el botón "Agregar descuento" en vez del banner "Descuento aplicado". Fix: nueva prop `pendingSaleDiscount` en `WizardPaymentStep` que hidrata el descuento desde la venta pendiente (read-only — sin X de remover, sin botón de agregar) en modo `complete-pending`. ✅
- **13.** (Nuevo) POS landing tenía un sliding cart de fondo que se duplicaba con el carrito del wizard (mismo store, dos UIs editables → bugs de sincronización). Eliminado `pos-sliding-cart.tsx`. Ahora al agregar un producto el wizard auto-abre en paso "Cliente", y cerrar el wizard limpia el carrito (descarta venta en curso). Modo `from-cart` eliminado por desuso. ✅
- **11.** KPIs de `/ventas` ahora reactivos al filtro de fecha (Hoy / Esta semana / Mes / Fecha custom). Subtítulos reflejan el rango activo ("ventas · hoy", "ingresos · mayo 2026", etc.). Filtro state subido al page, `SalesTable` ahora controlada via `dateFilter` + `onDateFilterChange`. Helpers `getDateRange` y `getRangeLabel` extraídos a `src/features/ventas/date-filter.ts`. Resuelve la incoherencia previa donde los KPIs eran all-time y la tabla filtrada por fecha. ✅
