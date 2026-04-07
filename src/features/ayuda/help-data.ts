import {
  Monitor,
  Package,
  Warehouse,
  Users,
  Receipt,
  FileText,
  BarChart3,
  LayoutDashboard,
  Settings,
  type LucideIcon,
} from "lucide-react"

export interface HelpItem {
  question: string
  steps: string[]
  tip?: string
}

export interface HelpSection {
  id: string
  title: string
  icon: LucideIcon
  iconBg: string
  iconColor: string
  items: HelpItem[]
}

// Use **text** to bold keywords (module names, buttons, labels)

export const helpSections: HelpSection[] = [
  {
    id: "pos",
    title: "Punto de venta",
    icon: Monitor,
    iconBg: "bg-rose-50",
    iconColor: "text-rose-500",
    items: [
      {
        question: "Como crear una venta",
        steps: [
          "Abre **Punto de venta** desde el menu lateral",
          "Busca productos por nombre, marca o codigo, o seleccionalos del **catalogo**",
          "Agrega los productos al **carrito**",
          "Selecciona un **cliente** (opcional)",
          "Presiona **Cobrar**",
          "Elige el metodo de pago: **efectivo**, **tarjeta**, **transferencia** o **nota de credito**",
          "Confirma el monto y completa la venta",
        ],
        tip: "Al finalizar puedes imprimir el recibo directamente",
      },
      {
        question: "Como aplicar descuentos",
        steps: [
          "**Descuento por producto**: haz clic en el porcentaje junto al precio de cada item en el carrito",
          "Ingresa el **porcentaje de descuento** para ese producto",
          "**Descuento global**: usa el campo de descuento general del carrito",
          "Elige entre **porcentaje (%)** o **monto fijo ($)**",
        ],
        tip: "Ambos descuentos se pueden combinar en la misma venta",
      },
      {
        question: "Como guardar una cotizacion",
        steps: [
          "Arma el carrito con los productos deseados",
          "Presiona **Guardar cotizacion** en lugar de Cobrar",
          "La cotizacion se guarda con un folio automatico (**C-0001**)",
          "La vigencia es de **15 dias**",
        ],
        tip: "Las cotizaciones no descuentan stock ni requieren pago. Puedes convertirlas a venta desde **Ventas**",
      },
      {
        question: "Como dividir un pago",
        steps: [
          "En el dialogo de **Cobrar**, agrega el primer metodo de pago con su monto",
          "Presiona **agregar otro metodo de pago**",
          "Ingresa el monto del segundo metodo",
          "Repite si necesitas mas metodos",
          "El sistema calcula automaticamente el **faltante** o **cambio**",
        ],
        tip: "Puedes combinar **efectivo**, **tarjeta**, **transferencia** y **notas de credito** en un mismo pago",
      },
      {
        question: "Como imprimir un recibo",
        steps: [
          "Completa una venta normalmente",
          "Al finalizar aparece la opcion de **imprimir el recibo**",
          "El recibo incluye folio, fecha, cliente, productos, pagos y cambio",
        ],
        tip: "Tambien puedes reimprimir desde el detalle de cualquier venta en **Ventas**",
      },
    ],
  },
  {
    id: "productos",
    title: "Productos",
    icon: Package,
    iconBg: "bg-amber-50",
    iconColor: "text-amber-500",
    items: [
      {
        question: "Como agregar un producto",
        steps: [
          "Ve a **Productos** en el menu lateral",
          "Presiona **Nuevo producto**",
          "Llena **nombre**, **marca**, **categoria**, **codigo** y **precio**",
          "Ingresa el **stock** disponible",
          "Guarda el producto",
        ],
        tip: "El producto estara disponible inmediatamente en el **POS**",
      },
      {
        question: "Producto simple vs con variantes",
        steps: [
          "**Producto simple**: tiene un solo codigo, precio y stock (ej: un perfume especifico)",
          "**Con variantes**: activa el toggle **Tiene variantes** en el formulario",
          "Agrega cada variante con su **nombre** (ej: 50ml, 100ml)",
          "Cada variante tiene su propio **codigo**, **precio** y **stock** independiente",
        ],
      },
      {
        question: "Como crear un cofre (bundle)",
        steps: [
          "Al crear un producto, activa el toggle **Es un cofre**",
          "Busca y selecciona los productos que componen el cofre",
          "Define la **cantidad** de cada producto dentro del cofre",
          "Guarda el producto",
        ],
        tip: "Los toggles de **variantes** y **cofre** son mutuamente exclusivos",
      },
      {
        question: "Como gestionar categorias",
        steps: [
          "Ve a **Configuracion** en el menu lateral",
          "En la seccion de **Categorias**, presiona agregar",
          "Crea categorias padre (ej: Maquillaje)",
          "Expande una categoria padre para agregar **subcategorias** (ej: Labios, Ojos)",
        ],
        tip: "No puedes eliminar una categoria que tenga productos o subcategorias activas",
      },
      {
        question: "Como subir imagenes de producto",
        steps: [
          "Abre el formulario de un producto (**nuevo** o **editar**)",
          "**Arrastra** una imagen o haz clic para seleccionarla",
          "La **primera imagen** se usa como imagen principal en el catalogo",
          "Las imagenes se optimizan y almacenan automaticamente",
        ],
      },
    ],
  },
  {
    id: "inventario",
    title: "Inventario",
    icon: Warehouse,
    iconBg: "bg-blue-50",
    iconColor: "text-blue-500",
    items: [
      {
        question: "Que son los tres inventarios",
        steps: [
          "**Inventario Fisico** — stock real disponible para ventas. Se actualiza con cada venta, devolucion o ajuste",
          "**Carga Inicial** — referencia historica del inventario al iniciar el sistema. Util para comparaciones",
          "**En Transito** — mercancia en camino, organizada por semanas y meses",
        ],
        tip: "Cada inventario es independiente y se gestiona por separado",
      },
      {
        question: "Como ajustar stock",
        steps: [
          "Ve a **Inventario** > **Fisico** (o **Carga Inicial**)",
          "Busca el producto que necesitas ajustar",
          "Presiona **Ajustar stock**",
          "Ingresa la **nueva cantidad**",
          "Escribe el **motivo** del ajuste (ej: conteo fisico, merma)",
          "Confirma el ajuste",
        ],
        tip: "Todos los ajustes quedan registrados con fecha, hora y motivo para trazabilidad",
      },
      {
        question: "Como registrar entrada de mercancia",
        steps: [
          "Ve a **Inventario** > **Fisico**",
          "Presiona **Entrada de mercancia**",
          "Selecciona el producto",
          "Ingresa la **cantidad** que llego",
          "Agrega un **motivo** o referencia",
          "Confirma la entrada",
        ],
        tip: "El stock se incrementa automaticamente y se crea un registro de movimiento",
      },
      {
        question: "Como registrar inventario en transito",
        steps: [
          "Ve a **Inventario** > **En Transito**",
          "Presiona **Crear semana**",
          "Selecciona el **mes** y numero de **semana** (1-5)",
          "Agrega productos con las cantidades esperadas",
          "Guarda la semana",
        ],
        tip: "Puedes ver el resumen mensual con barras y navegar por ano",
      },
      {
        question: "Que significan las alertas de stock bajo",
        steps: [
          "Las alertas aparecen en el **Dashboard** cuando un producto tiene stock critico",
          "**Rojo** (critico): el producto esta a punto de agotarse",
          "**Amarillo** (advertencia): el stock es bajo pero no urgente",
        ],
        tip: "Revisa las alertas diariamente para planificar reabastecimiento",
      },
    ],
  },
  {
    id: "clientes",
    title: "Clientes",
    icon: Users,
    iconBg: "bg-teal-50",
    iconColor: "text-teal-500",
    items: [
      {
        question: "Como agregar un cliente",
        steps: [
          "Ve a **Clientes** en el menu lateral",
          "Presiona **Nuevo cliente**",
          "Llena el **nombre** (requerido)",
          "Agrega **telefono**, **email**, **direccion** y **notas** (opcionales)",
          "Selecciona un **descuento** si aplica",
          "Guarda el cliente",
        ],
        tip: "El cliente estara disponible para seleccionar en el **POS** al hacer ventas",
      },
      {
        question: "Como asignar un descuento personalizado",
        steps: [
          "Primero ve a **Configuracion** > **Descuentos personalizados**",
          "Crea un descuento (ej: 'Mayorista -15%')",
          "Ve a **Clientes** y edita el cliente deseado",
          "Selecciona el **descuento** en el campo correspondiente",
          "Guarda los cambios",
        ],
        tip: "Cuando ese cliente se seleccione en el **POS**, todos los precios se recalculan automaticamente",
      },
      {
        question: "Como establecer precios especificos",
        steps: [
          "Ve a **Configuracion** > **Descuentos personalizados**",
          "Selecciona el **editor de precios** del descuento",
          "Busca el producto que quieres personalizar",
          "Establece un **precio fijo** por variante",
          "Guarda el precio",
        ],
        tip: "Los precios especificos tienen **prioridad** sobre el descuento porcentual general",
      },
    ],
  },
  {
    id: "ventas",
    title: "Ventas y devoluciones",
    icon: Receipt,
    iconBg: "bg-rose-50",
    iconColor: "text-rose-400",
    items: [
      {
        question: "Como ver el detalle de una venta",
        steps: [
          "Ve a **Ventas** en el menu lateral",
          "Busca la venta por **numero** o **nombre de cliente**",
          "Haz clic en **Ver detalle** en el menu de acciones",
          "Veras los items, precios, descuentos, pagos y timeline de devoluciones",
        ],
      },
      {
        question: "Como hacer una devolucion",
        steps: [
          "Abre el detalle de una venta completada en **Ventas**",
          "Presiona **Devolver**",
          "Selecciona los **items** a devolver",
          "Ajusta la **cantidad** (respetando el maximo devolvible)",
          "Elige si deseas **reingresar** los productos al stock",
          "Agrega un **motivo** (opcional)",
          "Confirma la devolucion",
        ],
        tip: "Se genera automaticamente una **nota de credito** con el monto correspondiente",
      },
      {
        question: "Como cancelar una venta",
        steps: [
          "Abre el detalle de la venta en **Ventas** o usa el menu de acciones en la tabla",
          "Selecciona **Cancelar venta**",
          "Confirma la cancelacion",
        ],
        tip: "Solo puedes cancelar ventas sin devoluciones previas. El stock se revierte automaticamente",
      },
      {
        question: "Como convertir una cotizacion a venta",
        steps: [
          "Ve a **Ventas** y filtra por **Cotizaciones**",
          "Busca la cotizacion deseada",
          "Presiona **Convertir a venta**",
          "Selecciona el **metodo de pago** y confirma el monto",
          "Completa la venta",
        ],
        tip: "La cotizacion original se marca como cancelada y se crea una nueva venta con folio propio",
      },
    ],
  },
  {
    id: "notas-credito",
    title: "Notas de credito",
    icon: FileText,
    iconBg: "bg-teal-50",
    iconColor: "text-teal-500",
    items: [
      {
        question: "Que es una nota de credito",
        steps: [
          "Se genera automaticamente cuando procesas una **devolucion**",
          "Contiene el **monto devuelto** y se vincula al **cliente**",
          "El cliente puede usarla como **metodo de pago** en futuras compras",
        ],
      },
      {
        question: "Como usar una nota de credito como pago",
        steps: [
          "Selecciona un **cliente** en el **POS** antes de cobrar",
          "Presiona **Cobrar** para abrir el dialogo de pago",
          "Las **notas de credito activas** del cliente aparecen como opcion de pago",
          "Selecciona la nota y el monto se aplica al total",
        ],
        tip: "Cuando el saldo de la nota llega a cero, se marca como **aplicada** automaticamente",
      },
      {
        question: "Estados de notas de credito",
        steps: [
          "**Activa** — tiene saldo disponible para usar",
          "**Aplicada** — el saldo fue utilizado completamente",
          "**Expirada** — la nota vencio sin ser utilizada",
        ],
        tip: "Puedes filtrar por estos estados en la pagina de **Notas de credito**",
      },
    ],
  },
  {
    id: "reportes",
    title: "Reportes",
    icon: BarChart3,
    iconBg: "bg-violet-50",
    iconColor: "text-violet-500",
    items: [
      {
        question: "Que reportes estan disponibles",
        steps: [
          "**Ventas** — por dia, semana, mes o rango personalizado",
          "**Inventario fisico** — snapshot del stock actual",
          "**Carga inicial** — inventario historico de referencia",
          "**En transito** — mercancia en camino por periodo",
          "**Catalogo de productos** — todos los productos con variantes",
          "**Listado de clientes** — directorio completo",
        ],
        tip: "Todos se exportan a **Excel** (.xlsx) y algunos tambien a **PDF**",
      },
      {
        question: "Como exportar un reporte",
        steps: [
          "Ve a **Reportes** en el menu lateral",
          "Selecciona el tipo de reporte que necesitas",
          "Elige el **rango de fechas** si aplica",
          "Presiona el boton de **exportar** (Excel o PDF)",
          "El archivo se descarga automaticamente",
        ],
      },
    ],
  },
  {
    id: "dashboard",
    title: "Dashboard",
    icon: LayoutDashboard,
    iconBg: "bg-pink-50",
    iconColor: "text-pink-500",
    items: [
      {
        question: "Que muestran los KPIs del dashboard",
        steps: [
          "**Ventas del dia** — monto total con comparacion vs ayer",
          "**Productos vendidos** — unidades vendidas esta semana",
          "**Transacciones** — numero de ventas realizadas",
          "**Metodos de pago** — desglose entre efectivo, tarjeta, transferencia y notas de credito",
          "**Alertas de stock** — productos con inventario bajo o critico",
        ],
      },
      {
        question: "Como leer las graficas",
        steps: [
          "**Barras semanales**: muestran ventas por dia, la semana actual esta destacada",
          "**Barra de salud del inventario**: proporcion de stock OK (verde), bajo (amarillo) y critico (rojo)",
          "**Feed de actividad**: registro en tiempo real de ventas, devoluciones y ajustes",
        ],
        tip: "El feed es util para tener visibilidad rapida de lo que pasa en la tienda",
      },
    ],
  },
  {
    id: "configuracion",
    title: "Configuracion",
    icon: Settings,
    iconBg: "bg-neutral-100",
    iconColor: "text-neutral-500",
    items: [
      {
        question: "Como gestionar categorias",
        steps: [
          "Ve a **Configuracion** en el menu lateral",
          "En la seccion de **Categorias**, presiona agregar",
          "Escribe el **nombre** de la categoria y guarda",
          "Para subcategorias: expande la **categoria padre** y agrega dentro",
        ],
        tip: "No puedes eliminar categorias con subcategorias activas o productos asignados",
      },
      {
        question: "Como crear descuentos personalizados",
        steps: [
          "Ve a **Configuracion** en el menu lateral",
          "En la seccion de **Descuentos personalizados**, presiona agregar",
          "Escribe un **nombre** (ej: 'VIP', 'Mayorista')",
          "Define el **porcentaje de descuento**",
          "Guarda el descuento",
        ],
        tip: "Estas listas se asignan a clientes y se aplican automaticamente en el **POS**",
      },
    ],
  },
]
