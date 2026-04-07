/**
 * Module accent system — maps URL paths to per-module accent color scopes.
 *
 * The accent color shifts depending on which module the user is viewing:
 *   - /inventario                 → amber
 *   - /inventario/transito        → blue
 *   - /inventario/carga-inicial   → slate
 *   - /clientes                   → teal
 *   - /notas-credito              → teal
 *   - /reportes                   → neutral
 *   - /configuracion              → neutral
 *   - (everything else)           → rose (brand default)
 *
 * The actual color values live in `globals.css` under `[data-module="X"]`
 * selectors. This file only handles pathname → module-name resolution
 * and generates the inline blocking script that runs before hydration
 * to prevent any first-paint flash of the wrong accent.
 */

/**
 * Ordered prefix map. Longer/more-specific prefixes must come before
 * shorter ones so `/inventario/transito` matches before `/inventario`,
 * and `/notas-credito` doesn't get absorbed by `/notas` etc.
 *
 * Sub-modules inside /inventario each have their own identity:
 *   - /inventario/transito       → blue
 *   - /inventario/carga-inicial  → slate
 *   - /inventario/fisico         → amber (falls through to "inventario")
 *   - /inventario (hub)          → amber
 */
export const MODULE_ACCENT_MAP = {
  "/inventario/transito": "inventario-transito",
  "/inventario/carga-inicial": "inventario-carga-inicial",
  "/inventario": "inventario",
  "/clientes": "clientes",
  "/vales": "vales",
  "/notas-credito": "notas-credito",
  "/reportes": "reportes",
  "/configuracion": "configuracion",
} as const

export type ModuleAccent = (typeof MODULE_ACCENT_MAP)[keyof typeof MODULE_ACCENT_MAP]

/**
 * Resolves a pathname to a module accent name.
 * Matches exact prefix OR prefix followed by "/" (so /inventario and
 * /inventario/fisico both resolve to "inventario", but /inventarios would not).
 */
export function resolveModuleAccent(pathname: string): ModuleAccent | null {
  for (const prefix in MODULE_ACCENT_MAP) {
    if (pathname === prefix || pathname.startsWith(prefix + "/")) {
      return MODULE_ACCENT_MAP[prefix as keyof typeof MODULE_ACCENT_MAP]
    }
  }
  return null
}

/**
 * Generates a minified inline script that runs synchronously in <head>,
 * before React hydration or <body> paints, setting `data-module` on
 * <html> based on the current pathname. Prevents first-paint accent flash.
 *
 * Kept in lockstep with `resolveModuleAccent` — do not let these diverge.
 */
export function moduleAccentInlineScript(): string {
  // JSON-embedding the map is safer than string interpolation
  const mapJson = JSON.stringify(MODULE_ACCENT_MAP)
  return (
    `(function(){try{` +
    `var p=window.location.pathname;` +
    `var m=null;` +
    `var o=${mapJson};` +
    `for(var k in o){if(p===k||p.indexOf(k+"/")===0){m=o[k];break;}}` +
    `if(m)document.documentElement.setAttribute("data-module",m);` +
    `}catch(e){}})();`
  )
}
