# Cambios POS — 16 de mayo

Última actualización: 2026-05-19 (v2)

## En curso

_(nada en curso)_

## Pendientes (diferidos para después)

_(nada pendiente)_

## Por discutir / planear

_(nada por discutir)_

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
- **12.** "Valor total combinado" del hub de inventario ahora suma solo físico + tránsito (excluye carga inicial). Las pills de abajo siguen mostrando los 3 valores individuales. Carga inicial es inventario de referencia y no debe sumarse al operativo. Widget "Proporción del total" sigue calculando initial vs all-three con un sum local porque `grand_total` cambió de semántica. ✅
- **6.** Clientes ahora se pueden clasificar por "Red" (interna, externa, referida, etc.) — lista editable desde Configuración → tab nueva "Redes". Tabla nueva `customer_networks` (name, color, sort_order); columna `network_id` opcional en customers. CRUD admin: `NetworkManager` con tarjetas tipo PriceListManager, color picker con 8 presets, conteo de clientes por red, soft delete que limpia el network_id de clientes afectados. Pills coloreadas en el form de cliente (sección "Detalles adicionales", default "Sin red"). Columna "Red" en la tabla de clientes con pill tinted por el color de la red. KPIs específicos en tab Redes (totalNetworks / clientesClasificados / promedioPorRed). ✅
- **4a.** (Pre-rediseño Walmart) Paridad de descuentos entre detalle on-screen y recibos impresos. El detalle de la venta ya mostraba precio tachado + -% por producto y un breakdown per-producto en el footer (con icono % / 🎁 y badge REGALO), pero ambos recibos (HTML para impresión + PDF) solo mostraban un "Descuento" agregado y NO el -% inline. Fix: incluir `discount_percent` por item en `receiptData` (faltaba en `sale-detail.tsx` y `sale-detail-modal.tsx`); ambos recibos ahora muestran línea por producto con icono y badge cuando los % difieren entre items. ✅
- **4.** Recibo de impresión rediseñado para impresora térmica (estilo Zara/Bodega Aurrera). El recibo HTML usado por `react-to-print` antes era colorido con fondos rosa, gradients y emojis — la térmica los renderiza como gris pálido que se desvanece. Nuevo formato: monospace (JetBrains Mono / Courier), puro negro sobre blanco, sin fondos, sin emojis. Bold solo en información clave (folio, total, headers de sección, %); regular para detalles. Separadores con dashed lines. Logos en B&W: nuevo `public/EclatLogo_Black.svg` (emblema + texto en `#000`, generado a partir del `DarkWithPink` original) para el header del ticket y como inline pequeño en "Powered by"; abbrixLogo.svg ya era 100% negro, se reusa como "Desarrollado por". El PDF descargable NO se tocó — sigue siendo el colorido bonito. Toda la información (folio, fecha, cliente, distribuidor, items con %/REGALO, subtotal, breakdown de descuentos, total, forma de pago, cambio, referencia) preservada. ✅
