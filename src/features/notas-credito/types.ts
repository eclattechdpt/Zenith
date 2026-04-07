import type { Tables } from "@/types/database"

export type CreditNoteRow = Tables<"credit_notes">
export type CreditNoteItemRow = Tables<"credit_note_items">

export interface CreditNoteWithDetails extends CreditNoteRow {
  customers: { id: string; name: string }
  returns: { return_number: string } | null
  credit_note_items?: CreditNoteItemRow[]
}
