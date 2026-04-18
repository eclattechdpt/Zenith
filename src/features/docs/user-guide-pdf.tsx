import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
} from "@react-pdf/renderer"

import { registerPdfFonts, PDF_FONT } from "@/lib/pdf-fonts"

registerPdfFonts()

// ─ Palette (matches app design system) ─────────────────────────────────────
const N = {
  50: "#FDFBFA",
  100: "#F7F3F0",
  200: "#EDE7E2",
  300: "#DED6CF",
  400: "#C4B8AE",
  500: "#A99D93",
  600: "#8A7F76",
  700: "#6E655E",
  800: "#4E4741",
  900: "#302B27",
  950: "#1A1714",
}

const ROSE = { bg: "#FFF0F3", fill: "#F43F6B", text: "#871335" }
const TEAL = { bg: "#EFFCFC", fill: "#25A6B6", text: "#1E3D47" }
const AMBER = { bg: "#FFFBEB", fill: "#D97706", text: "#92400E" }
const VIOLET = { bg: "#F5F3FF", fill: "#7C3AED", text: "#5B21B6" }
const EMERALD = { bg: "#ECFDF5", fill: "#059669", text: "#065F46" }
const BLUE = { bg: "#EFF6FF", fill: "#2563EB", text: "#1E40AF" }
const SLATE = { bg: "#F1F5F9", fill: "#475569", text: "#0F172A" }

// ─ Styles ──────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  page: {
    padding: 48,
    paddingTop: 48,
    paddingBottom: 64,
    fontFamily: PDF_FONT,
    fontSize: 10,
    color: N[900],
    lineHeight: 1.5,
  },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 48,
    right: 48,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: 8,
    color: N[500],
    borderTopWidth: 1,
    borderTopColor: N[200],
    paddingTop: 8,
  },
  // Cover
  coverPage: {
    padding: 0,
    fontFamily: PDF_FONT,
    color: N[900],
  },
  coverTopBar: {
    height: 320,
    backgroundColor: ROSE.fill,
    padding: 48,
    justifyContent: "flex-end",
  },
  coverBrand: {
    fontSize: 14,
    fontWeight: 700,
    color: "#FFF",
    letterSpacing: 4,
    marginBottom: 16,
  },
  coverTitle: {
    fontSize: 48,
    fontWeight: 700,
    color: "#FFF",
    lineHeight: 1.1,
  },
  coverSubtitle: {
    fontSize: 16,
    color: "#FFD2DC",
    marginTop: 12,
  },
  coverBody: {
    padding: 48,
    flex: 1,
    justifyContent: "space-between",
  },
  coverIntro: {
    fontSize: 13,
    color: N[700],
    lineHeight: 1.6,
  },
  coverMeta: {
    fontSize: 10,
    color: N[500],
    textAlign: "right",
  },
  // Section cover
  sectionHeader: {
    marginBottom: 16,
    paddingBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: N[900],
  },
  sectionKicker: {
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: 2,
    color: ROSE.fill,
    marginBottom: 6,
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: 700,
    color: N[950],
    lineHeight: 1.15,
  },
  sectionIntro: {
    fontSize: 11,
    color: N[700],
    marginBottom: 14,
    lineHeight: 1.6,
  },
  // Content
  h3: {
    fontSize: 14,
    fontWeight: 700,
    color: N[900],
    marginTop: 14,
    marginBottom: 6,
  },
  p: {
    marginBottom: 8,
    color: N[800],
  },
  strong: {
    fontWeight: 700,
    color: N[950],
  },
  // Bullet list
  ulRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  ulBullet: {
    width: 10,
    color: ROSE.fill,
    fontWeight: 700,
  },
  ulText: {
    flex: 1,
    color: N[800],
  },
  // Screenshot
  screenshot: {
    marginTop: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: N[200],
    borderRadius: 4,
  },
  caption: {
    fontSize: 9,
    color: N[500],
    textAlign: "center",
    marginBottom: 14,
    marginTop: -4,
  },
  // Callout
  callout: {
    marginTop: 10,
    marginBottom: 10,
    padding: 12,
    borderRadius: 6,
    backgroundColor: AMBER.bg,
    borderLeftWidth: 3,
    borderLeftColor: AMBER.fill,
  },
  calloutLabel: {
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: 1,
    color: AMBER.text,
    marginBottom: 4,
  },
  calloutText: {
    fontSize: 10,
    color: N[800],
  },
  tip: {
    marginTop: 10,
    marginBottom: 10,
    padding: 12,
    borderRadius: 6,
    backgroundColor: TEAL.bg,
    borderLeftWidth: 3,
    borderLeftColor: TEAL.fill,
  },
  tipLabel: {
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: 1,
    color: TEAL.text,
    marginBottom: 4,
  },
  // TOC
  tocRow: {
    flexDirection: "row",
    marginBottom: 5,
    borderBottomWidth: 0.5,
    borderBottomColor: N[200],
    paddingBottom: 4,
  },
  tocNumber: {
    width: 24,
    fontSize: 10,
    color: N[400],
  },
  tocTitle: {
    flex: 1,
    fontSize: 11,
    color: N[800],
  },
  tocPage: {
    width: 24,
    fontSize: 10,
    color: N[500],
    textAlign: "right",
  },
  // Module colors block
  colorTag: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 8,
  },
  colorTagText: {
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: 1,
  },
})

// ─ Reusable pieces ─────────────────────────────────────────────────────────

function Footer() {
  return (
    <View style={s.footer} fixed>
      <Text>Eclat POS · Guía de usuario</Text>
      <Text
        render={({ pageNumber, totalPages }) =>
          `Página ${pageNumber} de ${totalPages}`
        }
      />
    </View>
  )
}

function SectionHeader({ kicker, title, accent = ROSE }: {
  kicker: string
  title: string
  accent?: { bg: string; fill: string; text: string }
}) {
  return (
    <>
      <View style={[s.colorTag, { backgroundColor: accent.bg }]}>
        <Text style={[s.colorTagText, { color: accent.text }]}>{kicker}</Text>
      </View>
      <View style={s.sectionHeader}>
        <Text style={[s.sectionKicker, { color: accent.fill }]}>MÓDULO</Text>
        <Text style={s.sectionTitle}>{title}</Text>
      </View>
    </>
  )
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <View style={s.ulRow}>
      <Text style={s.ulBullet}>•</Text>
      <Text style={s.ulText}>{children}</Text>
    </View>
  )
}

function Tip({ children, label = "Consejo" }: { children: React.ReactNode; label?: string }) {
  return (
    <View style={s.tip} wrap={false}>
      <Text style={s.tipLabel}>{label.toUpperCase()}</Text>
      <Text style={s.calloutText}>{children}</Text>
    </View>
  )
}

function Callout({ children, label = "Importante" }: { children: React.ReactNode; label?: string }) {
  return (
    <View style={s.callout} wrap={false}>
      <Text style={s.calloutLabel}>{label.toUpperCase()}</Text>
      <Text style={s.calloutText}>{children}</Text>
    </View>
  )
}

function Screenshot({ src, caption }: { src: string; caption?: string }) {
  return (
    <View wrap={false}>
      <Image style={s.screenshot} src={src} />
      {caption && <Text style={s.caption}>{caption}</Text>}
    </View>
  )
}

function BaseOrigin() {
  // The PDF can be generated from any deployment; keep image paths relative
  // to site root so Next.js serves them.
  if (typeof window !== "undefined") return window.location.origin
  return ""
}

const IMG = (filename: string) =>
  `${BaseOrigin()}/docs/user-guide/screenshots/${filename}`

// ─ Document ────────────────────────────────────────────────────────────────

export function UserGuidePdf() {
  return (
    <Document
      title="Eclat POS · Guía de usuario"
      author="Eclat"
      subject="Manual del usuario del sistema Eclat POS"
    >
      {/* COVER */}
      <Page size="LETTER" style={s.coverPage}>
        <View style={s.coverTopBar}>
          <Text style={s.coverBrand}>ECLAT POS</Text>
          <Text style={s.coverTitle}>Guía de usuario</Text>
          <Text style={s.coverSubtitle}>
            Todo lo que necesitas saber para vender con confianza.
          </Text>
        </View>
        <View style={s.coverBody}>
          <View>
            <Text style={s.coverIntro}>
              Esta guía te acompaña por cada parte del sistema. Te explica
              qué hace cada módulo, cuándo lo vas a usar y cómo hacer las
              tareas más comunes. No necesitas conocimientos técnicos: está
              escrita para ti, con ejemplos reales del día a día de la tienda.
            </Text>
            <Text style={[s.coverIntro, { marginTop: 14 }]}>
              Léela una vez completa al comenzar, y después consúltala cuando
              tengas dudas puntuales. El índice en la siguiente página te lleva
              directo a la sección que necesites.
            </Text>
          </View>
          <View>
            <Text style={s.coverMeta}>Versión 1.0 · Abril 2026</Text>
            <Text style={s.coverMeta}>Eclat POS por Abbrix</Text>
          </View>
        </View>
      </Page>

      {/* TOC */}
      <Page size="LETTER" style={s.page}>
        <View style={s.sectionHeader}>
          <Text style={s.sectionKicker}>NAVEGACIÓN</Text>
          <Text style={s.sectionTitle}>Contenido</Text>
        </View>

        {[
          { n: "1", t: "Bienvenida" },
          { n: "2", t: "Primeros pasos — iniciar sesión y navegar" },
          { n: "3", t: "Inicio — tu panel del día" },
          { n: "4", t: "Punto de venta (POS)" },
          { n: "5", t: "Productos" },
          { n: "6", t: "Inventario" },
          { n: "7", t: "Clientes" },
          { n: "8", t: "Ventas" },
          { n: "9", t: "Vales" },
          { n: "10", t: "Notas de Crédito" },
          { n: "11", t: "Reportes" },
          { n: "12", t: "Configuración" },
          { n: "13", t: "Situaciones comunes (FAQ)" },
          { n: "14", t: "Glosario de términos" },
        ].map((row) => (
          <View key={row.n} style={s.tocRow}>
            <Text style={s.tocNumber}>{row.n}</Text>
            <Text style={s.tocTitle}>{row.t}</Text>
          </View>
        ))}

        <Footer />
      </Page>

      {/* 1 · BIENVENIDA */}
      <Page size="LETTER" style={s.page}>
        <SectionHeader kicker="01 · BIENVENIDA" title="Bienvenida" />

        <Text style={s.sectionIntro}>
          Eclat POS es tu sistema de punto de venta e inventario. Te permite
          vender, registrar clientes, controlar el stock, emitir vales y
          notas, y sacar reportes de cómo va el negocio. Todo desde la web, sin
          instalar nada.
        </Text>

        <Text style={s.h3}>Qué vas a poder hacer</Text>
        <Bullet>Cobrar ventas desde una caja sencilla (POS).</Bullet>
        <Bullet>
          Llevar el stock de productos al día — se actualiza solo con cada venta.
        </Bullet>
        <Bullet>Guardar datos de clientes y aplicarles precios especiales.</Bullet>
        <Bullet>Crear cofres (paquetes de varios productos).</Bullet>
        <Bullet>
          Registrar devoluciones, vales para productos sin stock, y notas de
          crédito con distribuidores.
        </Bullet>
        <Bullet>
          Descargar reportes en Excel o PDF para contabilidad.
        </Bullet>

        <Text style={s.h3}>Cómo está organizado este manual</Text>
        <Text style={s.p}>
          Cada módulo del sistema tiene su propia sección. En cada una vas a
          encontrar:
        </Text>
        <Bullet>
          <Text style={s.strong}>Qué hace</Text> y cuándo usarlo.
        </Bullet>
        <Bullet>Una imagen de cómo se ve.</Bullet>
        <Bullet>
          Los <Text style={s.strong}>pasos</Text> para las tareas más frecuentes.
        </Bullet>
        <Bullet>Consejos y advertencias importantes.</Bullet>

        <Tip>
          Al final encontrarás una sección de &quot;Situaciones comunes&quot;
          con respuestas rápidas a dudas típicas, y un glosario con las
          palabras del sistema.
        </Tip>

        <Footer />
      </Page>

      {/* 2 · PRIMEROS PASOS */}
      <Page size="LETTER" style={s.page}>
        <SectionHeader kicker="02 · PRIMEROS PASOS" title="Iniciar sesión y navegar" />

        <Text style={s.sectionIntro}>
          Para usar el sistema abre tu navegador (Chrome, Safari o el que
          prefieras) y entra a <Text style={s.strong}>eclatpos.com</Text>. Vas
          a ver la pantalla de bienvenida.
        </Text>

        <Screenshot src={IMG("01-login.png")} caption="Pantalla de inicio de sesión" />

        <Text style={s.h3}>Cómo iniciar sesión</Text>
        <Bullet>Escribe tu correo electrónico.</Bullet>
        <Bullet>Escribe tu contraseña.</Bullet>
        <Bullet>
          Toca <Text style={s.strong}>Entrar</Text>.
        </Bullet>

        <Callout>
          Si olvidas la contraseña, contacta al administrador del sistema. El
          acceso queda guardado en el navegador, así que no tendrás que
          escribirla cada vez que entres desde el mismo dispositivo.
        </Callout>

        <Text style={s.h3}>El menú lateral (sidebar)</Text>
        <Text style={s.p}>
          A la izquierda de la pantalla tienes un menú con todas las
          secciones. Puedes ocultarlo tocando <Text style={s.strong}>Ocultar</Text>{" "}
          abajo del todo si necesitas más espacio de trabajo.
        </Text>

        <Text style={s.h3}>Cerrar sesión</Text>
        <Text style={s.p}>
          Abajo del menú lateral, toca <Text style={s.strong}>Cerrar sesión</Text>.
          Hazlo siempre al terminar de trabajar si compartes la computadora.
        </Text>

        <Footer />
      </Page>

      {/* 3 · INICIO / DASHBOARD */}
      <Page size="LETTER" style={s.page}>
        <SectionHeader kicker="03 · INICIO" title="Tu panel del día" />

        <Text style={s.sectionIntro}>
          Es la primera pantalla que ves al entrar. Te muestra un resumen
          rápido de cómo va tu día y accesos directos a las tareas más
          frecuentes.
        </Text>

        <Screenshot src={IMG("02-dashboard.png")} caption="Panel de inicio — resumen del día" />

        <Text style={s.h3}>Qué encontrarás aquí</Text>
        <Bullet>
          <Text style={s.strong}>Ventas del día</Text> — cuánto has vendido hoy
          y comparación con ayer.
        </Bullet>
        <Bullet>
          <Text style={s.strong}>Productos vendidos esta semana</Text> — gráfica por día.
        </Bullet>
        <Bullet>
          <Text style={s.strong}>Transacciones</Text> — desglose por forma de
          pago (efectivo, tarjeta, transferencia).
        </Bullet>
        <Bullet>
          <Text style={s.strong}>Stock bajo</Text> — alerta de cuántos productos
          están por agotarse.
        </Bullet>

        <Text style={s.h3}>Accesos rápidos</Text>
        <Bullet>
          <Text style={s.strong}>Nueva venta</Text> — abre la caja directamente.
        </Bullet>
        <Bullet>
          <Text style={s.strong}>Ver productos</Text> — catálogo completo.
        </Bullet>
        <Bullet>
          <Text style={s.strong}>Registrar cliente</Text> — agregar un cliente nuevo.
        </Bullet>

        <Tip>
          Los datos del dashboard se actualizan solos cada cierto tiempo. Si
          quieres verlos al instante después de hacer una venta, recarga la
          página con <Text style={s.strong}>F5</Text>.
        </Tip>

        <Footer />
      </Page>

      {/* 4 · POS */}
      <Page size="LETTER" style={s.page}>
        <SectionHeader kicker="04 · PUNTO DE VENTA" title="Vender en el POS" accent={ROSE} />

        <Text style={s.sectionIntro}>
          La sección más usada. Aquí cobras a tus clientes. Abres una venta,
          agregas productos al carrito, eliges cómo paga el cliente, y cierras
          la operación. El inventario se descuenta automáticamente.
        </Text>

        <Screenshot src={IMG("03-pos.png")} caption="Pantalla de Punto de Venta con catálogo" />

        <Text style={s.h3}>Cómo hacer una venta</Text>
        <Bullet>
          Toca <Text style={s.strong}>Nueva venta</Text>. Se abre el asistente
          de venta.
        </Bullet>
        <Bullet>
          Busca productos por nombre, marca o código de barras/SKU. También
          puedes filtrar por categoría.
        </Bullet>
        <Bullet>
          Toca <Text style={s.strong}>+</Text> en cada producto para agregarlo.
          Si tiene variantes (ej. color), se abre un selector.
        </Bullet>
        <Bullet>
          En el carrito puedes cambiar cantidad, aplicar descuento por
          producto o retirar uno.
        </Bullet>
        <Bullet>
          Asigna un cliente si aplica (para precios especiales o historial).
        </Bullet>
        <Bullet>
          Aplica un descuento global si corresponde: fijo en $ o porcentaje %.
        </Bullet>
        <Bullet>
          Toca <Text style={s.strong}>Cobrar</Text>, elige el método de pago
          (efectivo, tarjeta, transferencia, mixto), confirma.
        </Bullet>
        <Bullet>
          Imprime el ticket o descarga el recibo en PDF.
        </Bullet>

        <Footer />
      </Page>

      <Page size="LETTER" style={s.page}>
        <Text style={s.h3}>Otras opciones útiles del POS</Text>
        <Bullet>
          <Text style={s.strong}>Cotización</Text> — si el cliente aún no
          decide, puedes guardar la lista de productos como cotización y
          retomarla después en el módulo Ventas.
        </Bullet>
        <Bullet>
          <Text style={s.strong}>Vale</Text> — si el cliente quiere productos
          agotados, genera un vale. Cuando llegue el stock, se lo entregas.
        </Bullet>
        <Bullet>
          <Text style={s.strong}>Venta + Vale mixto</Text> — si tiene productos
          en stock y otros agotados, el sistema divide la venta automáticamente.
        </Bullet>

        <Callout label="Si se va el internet">
          El sistema necesita conexión para cobrar. Si se cae el internet a
          mitad de una venta, no pierdes lo que ya cargaste: queda guardado
          como cotización. Cuando regrese la conexión, la retomas desde Ventas
          → Cotizaciones.
        </Callout>

        <Text style={s.h3}>Colores de stock</Text>
        <Bullet>
          <Text style={s.strong}>Verde</Text> — stock saludable (6 o más).
        </Bullet>
        <Bullet>
          <Text style={s.strong}>Ámbar</Text> — stock bajo (1 a 5).
        </Bullet>
        <Bullet>
          <Text style={s.strong}>Rojo</Text> — sin stock. Aún puedes tocarlo
          para generar un vale.
        </Bullet>

        <Tip>
          La búsqueda funciona con o sin acentos: &quot;locion&quot; encuentra
          &quot;Loción&quot;. También encuentra por nombre de variante (ej.
          &quot;porcelana&quot; encuentra el maquillaje Porcelana).
        </Tip>

        <Footer />
      </Page>

      {/* 5 · PRODUCTOS */}
      <Page size="LETTER" style={s.page}>
        <SectionHeader kicker="05 · PRODUCTOS" title="Gestionar el catálogo" accent={ROSE} />

        <Text style={s.sectionIntro}>
          Aquí está todo tu catálogo. Puedes crear productos nuevos, editar
          los existentes, manejar variantes (talla, color) y armar cofres
          (paquetes de varios productos).
        </Text>

        <Screenshot src={IMG("04-productos.png")} caption="Catálogo de productos con filtros por categoría" />

        <Text style={s.h3}>Crear un producto simple</Text>
        <Bullet>
          Toca <Text style={s.strong}>+ Nuevo producto</Text>.
        </Bullet>
        <Bullet>
          Llena <Text style={s.strong}>Nombre</Text>, <Text style={s.strong}>Marca</Text>{" "}
          (Ideal o Eclat), <Text style={s.strong}>Precio</Text>,{" "}
          <Text style={s.strong}>SKU</Text> (código único).
        </Bullet>
        <Bullet>
          Opcionalmente asigna categoría y sube una foto.
        </Bullet>
        <Bullet>
          Ingresa el <Text style={s.strong}>stock inicial</Text> si ya tienes
          unidades físicas.
        </Bullet>
        <Bullet>Toca Guardar.</Bullet>

        <Text style={s.h3}>Crear un producto con variantes</Text>
        <Text style={s.p}>
          Úsalo cuando el mismo producto tiene diferentes versiones (colores,
          tonos, tamaños) que se venden por separado.
        </Text>
        <Bullet>
          Activa <Text style={s.strong}>Tiene variantes</Text>.
        </Bullet>
        <Bullet>
          Agrega cada variante con su propio SKU y stock (ej. Labial →
          &quot;Rosa mexicano&quot;, &quot;Rouge&quot;, &quot;Jubilee&quot;).
        </Bullet>
        <Bullet>
          El precio puede ser el mismo para todas, o distinto por variante.
        </Bullet>

        <Footer />
      </Page>

      <Page size="LETTER" style={s.page}>
        <Text style={s.h3}>Crear un cofre (paquete)</Text>
        <Text style={s.p}>
          Un cofre es un paquete que agrupa varios productos vendidos juntos a
          un precio. El stock del cofre se calcula solo: es el mínimo stock
          entre sus componentes (si tienes 5, 5 y 10 unidades de los
          productos, puedes armar 5 cofres).
        </Text>
        <Bullet>
          Activa <Text style={s.strong}>Es cofre</Text> al crear el producto.
        </Bullet>
        <Bullet>Ponle nombre, precio total y categoría (ej. &quot;Cofres&quot;).</Bullet>
        <Bullet>
          En <Text style={s.strong}>Productos del cofre</Text>, toca{" "}
          <Text style={s.strong}>Agregar producto al cofre</Text> y busca cada
          componente.
        </Bullet>
        <Bullet>Guarda.</Bullet>

        <Callout>
          Cuando vendas un cofre, se descuenta una unidad de cada componente
          (no del cofre en sí). Si un componente se agota, el cofre deja de
          estar disponible automáticamente.
        </Callout>

        <Text style={s.h3}>Editar o desactivar un producto</Text>
        <Bullet>
          Pasa el cursor sobre la tarjeta del producto y toca el ícono de lápiz.
        </Bullet>
        <Bullet>
          Cambia los datos que necesites. Si cierras sin guardar el sistema te
          preguntará antes de perder los cambios.
        </Bullet>
        <Bullet>
          Para dejar de mostrarlo en el POS sin borrarlo, desactiva{" "}
          <Text style={s.strong}>Activo</Text>. Los datos y el historial se conservan.
        </Bullet>

        <Tip>
          Puedes cambiar entre vista de cuadrícula y vista de lista con los
          íconos junto al contador del catálogo. La lista es útil cuando tienes
          muchos productos y quieres ver stock/precio de un vistazo.
        </Tip>

        <Footer />
      </Page>

      {/* 6 · INVENTARIO */}
      <Page size="LETTER" style={s.page}>
        <SectionHeader kicker="06 · INVENTARIO" title="Controlar tu stock" accent={AMBER} />

        <Text style={s.sectionIntro}>
          El módulo de inventario tiene tres vistas independientes. Cada una
          sirve para un propósito distinto. Al principio puede parecer mucho,
          pero la gran mayoría del tiempo solo vas a usar Inventario Físico.
        </Text>

        <Screenshot src={IMG("05-inventario-hub.png")} caption="Centro de inventario con los tres tipos" />

        <Text style={s.h3}>Los 3 tipos de inventario</Text>

        <Bullet>
          <Text style={s.strong}>Físico</Text> — lo que realmente tienes en el
          almacén hoy. Baja con cada venta y sube con cada devolución o
          entrada de mercancía.
        </Bullet>
        <Bullet>
          <Text style={s.strong}>En tránsito</Text> — mercancía que ya pediste
          pero aún no ha llegado. Se organiza por semana y mes.
        </Bullet>
        <Bullet>
          <Text style={s.strong}>Carga inicial</Text> — una foto histórica de
          con cuánto empezaste al configurar el sistema. No se mueve con
          ventas; es solo referencia.
        </Bullet>

        <Callout>
          Las ventas, devoluciones y vales <Text style={s.strong}>solo afectan al inventario físico</Text>.
          La carga inicial y el tránsito nunca cambian automáticamente.
        </Callout>

        <Footer />
      </Page>

      <Page size="LETTER" style={s.page}>
        <Text style={s.h3}>Inventario Físico</Text>
        <Text style={s.p}>
          Es tu lista actual de productos con stock, precio y estado. Aquí vas
          a trabajar el 99% del tiempo.
        </Text>

        <Screenshot src={IMG("06-inventario-fisico.png")} caption="Stock físico — se actualiza con cada venta" />

        <Text style={s.h3}>Qué puedes hacer</Text>
        <Bullet>
          <Text style={s.strong}>Ajustar stock</Text> — si hiciste un conteo
          físico y el número no coincide, toca el producto y corrige. Pide un
          motivo (ej. &quot;conteo físico&quot;, &quot;producto dañado&quot;)
          para dejar registro.
        </Bullet>
        <Bullet>
          <Text style={s.strong}>Entrada de mercancía</Text> — cuando llega un
          pedido, registra la entrada. El stock sube y queda en el historial.
        </Bullet>
        <Bullet>
          <Text style={s.strong}>Ver historial</Text> — cada producto tiene su
          historial de movimientos (ventas, entradas, ajustes).
        </Bullet>
        <Bullet>
          <Text style={s.strong}>Filtrar por categoría o stock bajo</Text> para
          ver solo lo que te interesa.
        </Bullet>

        <Text style={s.h3}>Valor total</Text>
        <Text style={s.p}>
          Arriba del listado ves el valor total de tu inventario en dinero,
          desglosado por marca (Ideal y Eclat). Es útil para reportes de
          cierre y auditorías.
        </Text>

        <Footer />
      </Page>

      <Page size="LETTER" style={s.page}>
        <Text style={s.h3}>Inventario en Tránsito</Text>
        <Text style={s.p}>
          Sirve para llevar control de los pedidos que hiciste a tus
          proveedores pero que aún no llegaron. Se organiza por mes y por
          semana.
        </Text>

        <Screenshot src={IMG("08-inventario-transito.png")} caption="Inventario en tránsito organizado por mes" />

        <Bullet>
          Entra al mes correspondiente, toca <Text style={s.strong}>Nueva semana</Text>.
        </Bullet>
        <Bullet>
          Agrega los productos que esperas recibir con cantidad y precio.
        </Bullet>
        <Bullet>
          Cuando llegue la mercancía, pasa esos productos al inventario
          físico como entrada de mercancía.
        </Bullet>

        <Tip>
          El tránsito es 100% manual — tú decides qué registras ahí. No afecta
          ni al POS ni al físico hasta que tú lo ingresas.
        </Tip>

        <Text style={s.h3}>Inventario Carga Inicial</Text>
        <Text style={s.p}>
          Es la foto del stock con el que arrancó el sistema. Normalmente se
          llena una sola vez, cuando empiezas a usar Eclat POS. Después queda
          como referencia para comparar.
        </Text>

        <Screenshot src={IMG("07-inventario-carga-inicial.png")} caption="Carga inicial — referencia histórica" />

        <Bullet>
          Puedes editar el stock inicial, ponerle un nombre distinto o un
          precio distinto solo para esta vista (sin afectar el catálogo).
        </Bullet>
        <Bullet>
          No se modifica con ventas. Si dentro de 6 meses quieres saber con
          cuánto empezaste, aquí está intacto.
        </Bullet>

        <Footer />
      </Page>

      {/* 7 · CLIENTES */}
      <Page size="LETTER" style={s.page}>
        <SectionHeader kicker="07 · CLIENTES" title="Gestionar clientes" accent={TEAL} />

        <Text style={s.sectionIntro}>
          Aquí guardas los datos de contacto de tus clientes, su número de
          cliente, historial de compras y —lo más útil— puedes asignarles
          listas de descuento personalizadas.
        </Text>

        <Screenshot src={IMG("09-clientes.png")} caption="Directorio de clientes" />

        <Text style={s.h3}>Crear un cliente</Text>
        <Bullet>
          Toca <Text style={s.strong}>+ Nuevo cliente</Text>.
        </Bullet>
        <Bullet>
          Llena los datos básicos: nombre, teléfono, correo. El número de
          cliente es opcional pero ayuda a identificarlo rápido en el POS.
        </Bullet>
        <Bullet>
          En <Text style={s.strong}>Detalles adicionales</Text> puedes agregar
          dirección y notas.
        </Bullet>
        <Bullet>
          Asigna una lista de descuento si aplica (ej. &quot;Mayorista 10%&quot;).
        </Bullet>

        <Text style={s.h3}>Ver historial del cliente</Text>
        <Bullet>
          Toca el nombre del cliente en la lista. Se abre un panel lateral
          con sus compras.
        </Bullet>
        <Bullet>
          Puedes filtrar por año y mes para ver cuánto te ha comprado en un período.
        </Bullet>

        <Tip>
          Si asignas un cliente al hacer una venta en el POS, los precios
          especiales se aplican solos. No necesitas recordar qué descuento le
          toca.
        </Tip>

        <Footer />
      </Page>

      {/* 8 · VENTAS */}
      <Page size="LETTER" style={s.page}>
        <SectionHeader kicker="08 · VENTAS" title="Historial de ventas y devoluciones" accent={ROSE} />

        <Text style={s.sectionIntro}>
          Es el historial completo de todas las ventas, cotizaciones, devoluciones y
          ventas canceladas. Aquí procesas las devoluciones y retomas cotizaciones.
        </Text>

        <Screenshot src={IMG("10-ventas.png")} caption="Historial de ventas con filtros de fecha y estado" />

        <Text style={s.h3}>Filtros disponibles</Text>
        <Bullet>
          Por fecha: Hoy, Esta semana, Mes (con navegación hacia atrás/adelante) o fecha personalizada.
        </Bullet>
        <Bullet>
          Por estado: Todos, Cotizaciones, Ventas, Devoluciones, Canceladas.
        </Bullet>
        <Bullet>Por número de venta o de cotización en el buscador.</Bullet>

        <Text style={s.h3}>Procesar una devolución</Text>
        <Bullet>Busca la venta original y ábrela.</Bullet>
        <Bullet>
          Toca <Text style={s.strong}>Nueva devolución</Text>. Elige los
          productos y cantidades que regresa el cliente.
        </Bullet>
        <Bullet>
          Decide si el producto es <Text style={s.strong}>vendible</Text>{" "}
          (vuelve al stock) o no (producto dañado, va directo a baja).
        </Bullet>
        <Bullet>
          Opcionalmente agrega un <Text style={s.strong}>cambio</Text>: el cliente
          se lleva otro producto en vez del dinero.
        </Bullet>
        <Bullet>Confirma. Imprime el recibo de devolución.</Bullet>

        <Text style={s.h3}>Convertir una cotización en venta</Text>
        <Bullet>Filtra por Cotizaciones y busca la del cliente.</Bullet>
        <Bullet>
          Ábrela y toca <Text style={s.strong}>Convertir a venta</Text>. Elige
          método de pago y cierras la venta normal.
        </Bullet>

        <Callout>
          Las ventas canceladas devuelven automáticamente todo el stock. No
          uses cancelación para corregir errores de registro — usa
          devolución. La cancelación está pensada para cuando el cliente se
          arrepiente antes de pagar completo.
        </Callout>

        <Footer />
      </Page>

      {/* 9 · VALES */}
      <Page size="LETTER" style={s.page}>
        <SectionHeader kicker="09 · VALES" title="Vales por productos sin stock" accent={VIOLET} />

        <Text style={s.sectionIntro}>
          Un vale es un comprobante que le das al cliente cuando quiere un
          producto que no tienes en stock. El cliente paga (o lo deja pendiente)
          y cuando llegue el producto, se lo entregas.
        </Text>

        <Screenshot src={IMG("11-vales.png")} caption="Registro de vales por estado" />

        <Text style={s.h3}>Estados de un vale</Text>
        <Bullet>
          <Text style={s.strong}>Pendiente</Text> — aún no hay stock del producto.
        </Bullet>
        <Bullet>
          <Text style={s.strong}>Listo</Text> — ya llegó el stock, el sistema
          te avisa automáticamente.
        </Bullet>
        <Bullet>
          <Text style={s.strong}>Completado</Text> — ya entregaste el producto al cliente.
        </Bullet>
        <Bullet>
          <Text style={s.strong}>Cancelado</Text> — se canceló el vale sin entrega.
        </Bullet>

        <Text style={s.h3}>Crear un vale</Text>
        <Bullet>
          Desde el POS, al terminar una venta toca <Text style={s.strong}>Vale</Text>.
        </Bullet>
        <Bullet>
          O si el cliente solo quiere productos agotados, créalo directo: en el
          POS aún puedes agregar productos sin stock (aparecen en rojo) y se
          convierten en vale automáticamente.
        </Bullet>
        <Bullet>
          Elige el cliente, método de pago (cobrado o pendiente), guarda.
        </Bullet>

        <Text style={s.h3}>Entregar un vale</Text>
        <Bullet>
          Cuando el sistema marque el vale como <Text style={s.strong}>Listo</Text>,
          ábrelo y toca <Text style={s.strong}>Entregar</Text>.
        </Bullet>
        <Bullet>
          El stock se descuenta automáticamente y el vale pasa a Completado.
        </Bullet>

        <Tip>
          En el panel de inicio aparecerá un aviso &quot;Ready&quot; cuando
          tengas vales listos para entregar. Toca <Text style={s.strong}>Ver vales</Text>{" "}
          para ir directo al listado.
        </Tip>

        <Footer />
      </Page>

      {/* 10 · NOTAS DE CRÉDITO */}
      <Page size="LETTER" style={s.page}>
        <SectionHeader kicker="10 · NOTAS DE CRÉDITO" title="Préstamos e intercambios con distribuidores" accent={TEAL} />

        <Text style={s.sectionIntro}>
          Este módulo no es para clientes finales — es para transacciones con
          distribuidores o proveedores. Te permite registrar préstamos o
          intercambios de mercancía.
        </Text>

        <Screenshot src={IMG("12-notas-credito.png")} caption="Registro de notas de crédito con distribuidores" />

        <Text style={s.h3}>Dos tipos de nota</Text>

        <Bullet>
          <Text style={s.strong}>Préstamo</Text> — le prestas mercancía a un
          distribuidor. El stock sale de tu físico. Cuando te la devuelven o
          te la pagan, &quot;liquidas&quot; la nota y vuelve el stock.
        </Bullet>
        <Bullet>
          <Text style={s.strong}>Intercambio</Text> — das productos y recibes
          otros a cambio. Ambos stocks se ajustan (el que das baja, el que
          recibes sube).
        </Bullet>

        <Text style={s.h3}>Crear una nota</Text>
        <Bullet>
          Toca <Text style={s.strong}>+ Nueva nota</Text>. Se abre un diálogo a
          pantalla completa con dos paneles: clientes a la izquierda y
          productos a la derecha.
        </Bullet>
        <Bullet>Elige el distribuidor y el tipo de nota.</Bullet>
        <Bullet>
          Marca los productos y cantidades. En Intercambio define qué sale y
          qué entra.
        </Bullet>
        <Bullet>Guarda.</Bullet>

        <Text style={s.h3}>Liquidar una nota de préstamo</Text>
        <Bullet>Ábrela desde el listado.</Bullet>
        <Bullet>
          Toca <Text style={s.strong}>Liquidar</Text>. El stock regresa a tu
          inventario físico y la nota pasa a estado Liquidada.
        </Bullet>

        <Footer />
      </Page>

      {/* 11 · REPORTES */}
      <Page size="LETTER" style={s.page}>
        <SectionHeader kicker="11 · REPORTES" title="Exportar información" accent={EMERALD} />

        <Text style={s.sectionIntro}>
          Descarga reportes en Excel o PDF para tu contador, auditorías o
          análisis. Los reportes no cambian nada en el sistema — solo leen y
          exportan.
        </Text>

        <Screenshot src={IMG("13-reportes.png")} caption="Galería de reportes exportables" />

        <Text style={s.h3}>Reportes disponibles</Text>

        <Bullet>
          <Text style={s.strong}>Ventas</Text> — historial con métricas, pagos,
          clientes. En Excel o PDF (semanal, mensual, personalizado).
        </Bullet>
        <Bullet>
          <Text style={s.strong}>Inventario físico</Text> — stock actual con
          alertas, mínimos y valor total.
        </Bullet>
        <Bullet>
          <Text style={s.strong}>Inventario en tránsito</Text> — semanas de
          tránsito con productos y valores.
        </Bullet>
        <Bullet>
          <Text style={s.strong}>Inventario carga inicial</Text> — stock inicial
          con precios editados y valor total.
        </Bullet>
        <Bullet>
          <Text style={s.strong}>Clientes</Text> — lista completa con datos de
          contacto.
        </Bullet>
        <Bullet>
          <Text style={s.strong}>Productos</Text> — catálogo completo con
          variantes y precios.
        </Bullet>

        <Text style={s.h3}>Historial de descargas</Text>
        <Text style={s.p}>
          Abajo de la galería ves el registro de todos los reportes que has
          descargado, agrupados por mes. Útil si necesitas reenviar uno sin
          regenerarlo.
        </Text>

        <Tip>
          Usa el formato Excel para análisis (podrás filtrar, sumar, hacer
          tablas dinámicas) y PDF para archivar o imprimir.
        </Tip>

        <Footer />
      </Page>

      {/* 12 · CONFIGURACIÓN */}
      <Page size="LETTER" style={s.page}>
        <SectionHeader kicker="12 · CONFIGURACIÓN" title="Ajustes del sistema" accent={SLATE} />

        <Text style={s.sectionIntro}>
          Desde aquí manejas categorías, listas de descuento y biblioteca de
          imágenes. No es un módulo del día a día — lo visitas cuando quieres
          organizar el catálogo o crear nuevas reglas de precios.
        </Text>

        <Screenshot src={IMG("14-configuracion.png")} caption="Configuración — pestañas de Categorías, Descuentos e Imágenes" />

        <Text style={s.h3}>Pestaña Categorías</Text>
        <Bullet>
          Organiza los productos en grupos (ej. Cuidado Facial, Maquillaje,
          Nutricional). Cada categoría puede tener subcategorías.
        </Bullet>
        <Bullet>
          Al crear o editar un producto, le asignas una categoría para que
          aparezca en el filtro correcto del POS.
        </Bullet>
        <Bullet>
          Cada categoría tiene un color que se muestra en los filtros.
        </Bullet>

        <Text style={s.h3}>Pestaña Descuentos</Text>
        <Bullet>
          Crea &quot;listas de precios&quot; con descuentos genéricos (ej.
          &quot;Mayorista -10%&quot;, &quot;Empleados -15%&quot;).
        </Bullet>
        <Bullet>
          Asigna la lista a clientes específicos para que el descuento se
          aplique automáticamente al cobrarles.
        </Bullet>
        <Bullet>
          También puedes dar precios especiales por producto (más preciso que
          un descuento global).
        </Bullet>

        <Text style={s.h3}>Pestaña Imágenes</Text>
        <Bullet>
          Gestor centralizado de las imágenes de productos. Ve cuántas tienen
          imagen, cuáles no, su peso total en MB.
        </Bullet>
        <Bullet>
          Puedes optimizar imágenes pesadas, re-comprimir, limpiar imágenes
          huérfanas (sin producto asociado).
        </Bullet>

        <Footer />
      </Page>

      {/* 13 · FAQ */}
      <Page size="LETTER" style={s.page}>
        <SectionHeader kicker="13 · SITUACIONES COMUNES" title="Preguntas frecuentes" accent={AMBER} />

        <Text style={s.h3}>Se me fue el internet a mitad de una venta</Text>
        <Text style={s.p}>
          No pierdes lo que cargaste. Si no pudiste cerrar la venta, revisa en
          Ventas → Cotizaciones — debería estar ahí. Cuando regrese el
          internet, ábrela y continúa desde donde estabas.
        </Text>

        <Text style={s.h3}>El cliente quiere cambiar un producto por otro</Text>
        <Text style={s.p}>
          Ve a Ventas, busca la venta original, entra y toca{" "}
          <Text style={s.strong}>Nueva devolución</Text>. En el diálogo marca
          &quot;Cambio para el cliente&quot; y elige el producto que se lleva
          en reemplazo. El sistema ajusta el stock de ambos.
        </Text>

        <Text style={s.h3}>Me equivoqué al cobrar una venta</Text>
        <Text style={s.p}>
          Si ya se cerró: haz una devolución por los productos mal cobrados y
          rehaz la venta correcta. <Text style={s.strong}>No uses cancelar</Text>{" "}
          si ya cobraste; cancelación es solo para cotizaciones o ventas
          pendientes que nunca se pagaron.
        </Text>

        <Text style={s.h3}>Un producto no aparece en el POS</Text>
        <Text style={s.p}>
          Primero revisa en Productos si está activo (toggle{" "}
          <Text style={s.strong}>Activo</Text>). Si el producto es un cofre,
          revisa que todos sus componentes tengan stock. También verifica que
          tengas stock físico — si es 0 aparece en rojo pero aún puedes crear
          vale.
        </Text>

        <Text style={s.h3}>Olvidé mi contraseña</Text>
        <Text style={s.p}>
          Contacta al administrador técnico del sistema. Por seguridad la
          recuperación no se hace desde la aplicación.
        </Text>

        <Text style={s.h3}>El stock no coincide con lo que tengo físicamente</Text>
        <Text style={s.p}>
          Ve a Inventario Físico, busca el producto, toca{" "}
          <Text style={s.strong}>Ajustar stock</Text>. Pon la cantidad real y un
          motivo (&quot;conteo físico&quot;, &quot;producto dañado&quot;, etc.).
          Queda en el historial para auditoría.
        </Text>

        <Text style={s.h3}>Quiero hacer una venta sin asignar cliente</Text>
        <Text style={s.p}>
          Es perfectamente válido: simplemente no asignes cliente al hacer la
          venta. Solo pierdes el historial y los descuentos personalizados. Si
          después quieres vincularla, no se puede editar — habría que cancelar
          y rehacer.
        </Text>

        <Text style={s.h3}>El ticket no se imprime</Text>
        <Text style={s.p}>
          Verifica que tu impresora esté conectada y con papel. Alternativa:
          usa el botón <Text style={s.strong}>Descargar PDF</Text> en la misma
          pantalla y manda el PDF a imprimir desde tu sistema.
        </Text>

        <Footer />
      </Page>

      {/* 14 · GLOSARIO */}
      <Page size="LETTER" style={s.page}>
        <SectionHeader kicker="14 · GLOSARIO" title="Términos del sistema" accent={BLUE} />

        <Text style={s.sectionIntro}>
          Palabras que se repiten en toda la aplicación. Vuelve a esta página
          cuando dudes qué significa algo.
        </Text>

        <Text style={s.h3}>Cofre</Text>
        <Text style={s.p}>
          Un paquete de varios productos vendidos juntos a un precio. Su stock
          es derivado automáticamente: es el mínimo del stock de sus
          componentes. Ejemplo: Cofre Always Radiant incluye 4 cremas; si la
          de menor stock tiene 5 unidades, puedes vender 5 cofres.
        </Text>

        <Text style={s.h3}>Variante</Text>
        <Text style={s.p}>
          Una versión específica de un producto. Un labial puede tener variantes
          &quot;Rosa mexicano&quot;, &quot;Rouge&quot;, etc. Cada variante
          tiene su propio SKU y stock.
        </Text>

        <Text style={s.h3}>SKU</Text>
        <Text style={s.p}>
          Código único de cada producto/variante (ej. &quot;D-2100&quot;,
          &quot;N-0021&quot;). Sirve para identificar rápido en el POS. Puede
          ser también el código de barras si lo usas con escáner.
        </Text>

        <Text style={s.h3}>Vale</Text>
        <Text style={s.p}>
          Comprobante pendiente por producto sin stock. El cliente paga (o
          deja apartado) y se lleva el producto cuando llegue.
        </Text>

        <Text style={s.h3}>Cotización</Text>
        <Text style={s.p}>
          Venta no confirmada. El cliente aún decide. Se guarda para retomarla
          después. No afecta el inventario hasta que se convierte en venta real.
        </Text>

        <Text style={s.h3}>Nota de crédito</Text>
        <Text style={s.p}>
          Documento para préstamos o intercambios con distribuidores (no con
          clientes finales).
        </Text>

        <Text style={s.h3}>Devolución vs cancelación</Text>
        <Text style={s.p}>
          <Text style={s.strong}>Devolución</Text> es cuando el cliente regresa
          productos después de una venta ya cerrada. <Text style={s.strong}>Cancelación</Text>{" "}
          es anular una venta o cotización antes de completarla del todo.
        </Text>

        <Text style={s.h3}>Inventario físico / tránsito / carga inicial</Text>
        <Text style={s.p}>
          <Text style={s.strong}>Físico</Text>: lo que tienes hoy en el almacén.
          <Text style={s.strong}> Tránsito</Text>: lo que pediste pero aún no
          llega. <Text style={s.strong}>Carga inicial</Text>: foto histórica con
          lo que arrancaste, no cambia solo.
        </Text>

        <Text style={s.h3}>Ideal y Eclat</Text>
        <Text style={s.p}>
          Las dos marcas del catálogo. Cada producto pertenece a una. Los
          reportes y totales los separan para que puedas ver cada marca por
          separado.
        </Text>

        <Footer />
      </Page>

      {/* CIERRE */}
      <Page size="LETTER" style={s.page}>
        <View style={{ marginTop: 120, alignItems: "center" }}>
          <Text style={[s.sectionTitle, { textAlign: "center" }]}>Gracias</Text>
          <Text style={[s.sectionIntro, { textAlign: "center", marginTop: 20 }]}>
            Si después de leer esta guía aún tienes dudas, pregunta al
            administrador del sistema. Siempre es mejor preguntar antes de
            hacer algo que no estás seguro.
          </Text>
          <Text style={[s.coverMeta, { marginTop: 60, textAlign: "center" }]}>
            Eclat POS · Versión 1.0 · Abril 2026
          </Text>
          <Text style={[s.coverMeta, { textAlign: "center" }]}>
            Desarrollado por Abbrix
          </Text>
        </View>
      </Page>
    </Document>
  )
}
