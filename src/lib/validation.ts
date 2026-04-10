import { z } from "zod"

/**
 * Validates a single UUID string. Use for all server action ID parameters.
 * Uses regex (not z.uuid()) because Zod v4 strictly enforces version bits,
 * which rejects seed/legacy UUIDs that use 0000 in the version position.
 */
const UUID_PATTERN = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/
export const zUUID = z.string().regex(UUID_PATTERN, "ID con formato invalido")

/** Validates a non-empty trimmed string (for names, labels, etc.) */
export const zNonEmpty = z.string().min(1, "Campo requerido").trim()

/**
 * Validates a single ID param. Returns early-return error object on failure.
 * Usage: `const v = validateId(id); if (v.error) return v;`
 */
export function validateId(
  id: string
): { error: { _form: string[] } } | null {
  const result = zUUID.safeParse(id)
  if (!result.success) return { error: { _form: ["ID con formato invalido"] } }
  return null
}

/**
 * Validates multiple ID params at once. Returns early-return error object on failure.
 * Usage: `const v = validateIds({ productId, categoryId }); if (v.error) return v;`
 */
export function validateIds(
  ids: Record<string, string>
): { error: { _form: string[] } } | null {
  for (const [key, value] of Object.entries(ids)) {
    const result = zUUID.safeParse(value)
    if (!result.success) return { error: { _form: [`${key}: ID con formato invalido`] } }
  }
  return null
}
