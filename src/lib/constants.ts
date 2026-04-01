// ── Sale statuses ──

export const SALE_STATUSES = {
  pending: "Pendiente",
  quote: "Cotización",
  completed: "Completada",
  partially_returned: "Devolución parcial",
  fully_returned: "Devuelta",
  cancelled: "Cancelada",
} as const

export type SaleStatus = keyof typeof SALE_STATUSES

// ── Payment methods ──

export const PAYMENT_METHODS = {
  cash: "Efectivo",
  card: "Tarjeta",
  transfer: "Transferencia",
  credit_note: "Nota de crédito",
  other: "Otro",
} as const

export type PaymentMethod = keyof typeof PAYMENT_METHODS

// ── Inventory movement types ──

export const MOVEMENT_TYPES = {
  sale: "Venta",
  purchase: "Compra/Entrada",
  adjustment: "Ajuste manual",
  return: "Devolución",
  transfer: "Traspaso",
  initial: "Carga inicial",
} as const

export type MovementType = keyof typeof MOVEMENT_TYPES

// ── Credit note statuses ──

export const CREDIT_NOTE_STATUSES = {
  active: "Activa",
  redeemed: "Aplicada",
  expired: "Expirada",
  cancelled: "Cancelada",
} as const

export type CreditNoteStatus = keyof typeof CREDIT_NOTE_STATUSES

// ── Return statuses ──

export const RETURN_STATUSES = {
  completed: "Completada",
  cancelled: "Cancelada",
} as const

export type ReturnStatus = keyof typeof RETURN_STATUSES

// ── Defaults ──

export const DEFAULT_QUOTE_EXPIRY_DAYS = 15
export const DEFAULT_CREDIT_NOTE_EXPIRY_DAYS = 90

// ── Number prefixes ──

export const SALE_NUMBER_PREFIX = "V"
export const QUOTE_NUMBER_PREFIX = "C"
export const RETURN_NUMBER_PREFIX = "D"
export const CREDIT_NOTE_PREFIX = "NC"
