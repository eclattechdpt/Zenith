// Metadata config must be statically parseable in this file — Turbopack
// rejects re-exporting `runtime` / `size` / `contentType` / `alt` from
// another module. Only the default export (the component) is re-exported.
export { default } from "./opengraph-image"

export const runtime = "edge"
export const alt = "Eclat POS — Sistema de punto de venta"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"
