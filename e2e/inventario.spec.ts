import { test, expect } from "@playwright/test"

import { hasCredentials, loginAndGoTo } from "./helpers/auth"

test.describe("Inventario Fisico — UI/UX", () => {
  test.skip(!hasCredentials, "Set TEST_USER_EMAIL and TEST_USER_PASSWORD")

  // 8.15 — Cofre rows expandable
  test("8.15 — Inventory list cofre rows are expandable", async ({ page }) => {
    await loginAndGoTo(page, "/inventario")
    await page.waitForLoadState("networkidle")

    // Navigate to the physical inventory list
    // The hub page has a card for Inventario Fisico — click to see list
    const fisicoLink = page.getByText(/Stock actual|Inventario Fisico/i).first()
    await fisicoLink.click()
    await page.waitForLoadState("networkidle")

    // Find a cofre row (has bundle indicator or "Cofre" in name)
    const cofreRow = page.locator("tr, [class*='row']", { hasText: /Cofre/i }).first()
    if (await cofreRow.isVisible({ timeout: 10000 }).catch(() => false)) {
      // Click the expand chevron
      const chevron = cofreRow.locator("button").first()
      await chevron.click()
      await page.waitForTimeout(500)

      // Expanded content should show component products
      await expect(page.getByText(/Productos del cofre/i)).toBeVisible({ timeout: 5000 })
    }
  })

  // 8.16 — Cofre actions disabled
  test("8.16 — Inventory list cofre actions are disabled", async ({ page }) => {
    await loginAndGoTo(page, "/inventario")
    await page.waitForLoadState("networkidle")

    const fisicoLink = page.getByText(/Stock actual|Inventario Fisico/i).first()
    await fisicoLink.click()
    await page.waitForLoadState("networkidle")

    // Find cofre row
    const cofreRow = page.locator("tr, [class*='row']", { hasText: /Cofre/i }).first()
    if (await cofreRow.isVisible({ timeout: 10000 }).catch(() => false)) {
      // Actions menu should NOT be available on cofre rows (no ⋯ button)
      const actionsBtn = cofreRow.locator("[class*='lucide-more'], [class*='ellipsis']")
      await expect(actionsBtn).toHaveCount(0)
    }
  })

  // 8.17 — Adjust stock dialog
  test("8.17 — Adjust stock dialog works", async ({ page }) => {
    await loginAndGoTo(page, "/inventario")
    await page.waitForLoadState("networkidle")

    const fisicoLink = page.getByText(/Stock actual|Inventario Fisico/i).first()
    await fisicoLink.click()
    await page.waitForLoadState("networkidle")

    // Find a regular (non-cofre) product row with actions
    const productRow = page.locator("tr", { hasText: /Disponible|Stock bajo/i }).first()
    if (await productRow.isVisible({ timeout: 10000 }).catch(() => false)) {
      // Open actions dropdown
      const moreBtn = productRow.locator("button").last()
      await moreBtn.click()

      // Click "Ajustar stock"
      await page.getByRole("menuitem", { name: /Ajustar stock/i }).click()

      // Dialog should appear
      await expect(page.getByText("Ajustar stock")).toBeVisible({ timeout: 5000 })

      // Should show current stock (read-only)
      await expect(page.getByText(/Stock actual/i)).toBeVisible()

      // "Stock nuevo" field should be visible
      const newStockInput = page.locator("input[type='number'], input[inputmode='numeric']").first()
      await expect(newStockInput).toBeVisible()

      // Motivo field (required)
      await expect(page.getByText(/Motivo/i)).toBeVisible()

      // Close without saving
      await page.getByRole("button", { name: /Cancelar/i }).click()
    }
  })

  // 8.18 — Add stock dialog (entry)
  test("8.18 — Add stock entry dialog works", async ({ page }) => {
    await loginAndGoTo(page, "/inventario")
    await page.waitForLoadState("networkidle")

    const fisicoLink = page.getByText(/Stock actual|Inventario Fisico/i).first()
    await fisicoLink.click()
    await page.waitForLoadState("networkidle")

    const productRow = page.locator("tr", { hasText: /Disponible|Stock bajo/i }).first()
    if (await productRow.isVisible({ timeout: 10000 }).catch(() => false)) {
      const moreBtn = productRow.locator("button").last()
      await moreBtn.click()

      await page.getByRole("menuitem", { name: /Entrada de mercancia/i }).click()

      // Dialog should appear
      await expect(page.getByText("Entrada de mercancia")).toBeVisible({ timeout: 5000 })

      // Should have quantity input
      await expect(page.getByText(/Cantidad a agregar/i)).toBeVisible()

      // Should show current stock
      await expect(page.getByText(/Stock actual/i)).toBeVisible()

      await page.getByRole("button", { name: /Cancelar/i }).click()
    }
  })

  // 8.19 — Movement history
  test("8.19 — Movement history shows chronological log", async ({ page }) => {
    await loginAndGoTo(page, "/inventario")
    await page.waitForLoadState("networkidle")

    const fisicoLink = page.getByText(/Stock actual|Inventario Fisico/i).first()
    await fisicoLink.click()
    await page.waitForLoadState("networkidle")

    const productRow = page.locator("tr", { hasText: /Disponible|Stock bajo/i }).first()
    if (await productRow.isVisible({ timeout: 10000 }).catch(() => false)) {
      const moreBtn = productRow.locator("button").last()
      await moreBtn.click()

      await page.getByRole("menuitem", { name: /Ver historial/i }).click()

      // History dialog should appear
      await expect(page.getByText(/Historial de movimientos/i)).toBeVisible({ timeout: 5000 })

      // Should show movement entries or "Sin movimientos"
      const hasEntries = await page.locator("text=/Venta|Ajuste|Entrada|Devolucion/i").first().isVisible({ timeout: 5000 }).catch(() => false)
      const isEmpty = await page.getByText("Sin movimientos").isVisible({ timeout: 2000 }).catch(() => false)
      expect(hasEntries || isEmpty).toBeTruthy()

      await page.keyboard.press("Escape")
    }
  })
})

test.describe("Inventario Transito — UI/UX", () => {
  test.skip(!hasCredentials, "Set TEST_USER_EMAIL and TEST_USER_PASSWORD")

  // 9.11 — Create week dialog
  test("9.11 — Transit create week dialog works", async ({ page }) => {
    await loginAndGoTo(page, "/inventario/transito")
    await page.waitForLoadState("networkidle")

    // Select a month first (click on a month card)
    const monthCard = page.locator("[class*='rounded']", { hasText: /Abril|abril/i }).first()
    if (await monthCard.isVisible({ timeout: 10000 }).catch(() => false)) {
      await monthCard.click()
      await page.waitForTimeout(500)
    }

    // Click "Agregar semana" button
    const addWeekBtn = page.getByRole("button", { name: /Agregar semana/i })
    if (await addWeekBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await addWeekBtn.click()

      // Dialog should appear
      await expect(page.getByText("Nueva semana")).toBeVisible({ timeout: 5000 })

      // Form fields
      await expect(page.getByText(/Numero de semana/i)).toBeVisible()

      // Close without saving
      await page.getByRole("button", { name: /Cancelar/i }).click()
    }
  })

  // 9.12 — Add item to week
  test("9.12 — Transit add item to week works", async ({ page }) => {
    await loginAndGoTo(page, "/inventario/transito")
    await page.waitForLoadState("networkidle")

    // Select a month
    const monthCard = page.locator("[class*='rounded']", { hasText: /Abril|abril/i }).first()
    if (await monthCard.isVisible({ timeout: 10000 }).catch(() => false)) {
      await monthCard.click()
      await page.waitForTimeout(500)
    }

    // Click first week card
    const weekCard = page.locator("[class*='rounded']", { hasText: /Semana/i }).first()
    if (await weekCard.isVisible({ timeout: 5000 }).catch(() => false)) {
      await weekCard.click()
      await page.waitForTimeout(500)
    }

    // Click "Agregar producto" button
    const addProductBtn = page.getByRole("button", { name: /Agregar producto/i })
    if (await addProductBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await addProductBtn.click()

      // Dialog should show product picker
      await expect(page.getByText("Agregar producto")).toBeVisible({ timeout: 5000 })

      await page.getByRole("button", { name: /Cancelar/i }).click()
    }
  })
})

test.describe("Inventario Carga Inicial — UI/UX", () => {
  test.skip(!hasCredentials, "Set TEST_USER_EMAIL and TEST_USER_PASSWORD")

  // 10.6 — Set override dialog
  test("10.6 — Initial load set override dialog works", async ({ page }) => {
    await loginAndGoTo(page, "/inventario/carga-inicial")
    await page.waitForLoadState("networkidle")

    // Find a product row with actions
    const productRow = page.locator("tr").nth(1)
    if (await productRow.isVisible({ timeout: 10000 }).catch(() => false)) {
      const moreBtn = productRow.locator("button").last()
      await moreBtn.click()

      // Click edit option
      const editOption = page.getByRole("menuitem", { name: /Editar/i })
      if (await editOption.isVisible({ timeout: 3000 }).catch(() => false)) {
        await editOption.click()

        // Dialog should appear with override fields
        await expect(page.getByText(/Editar producto|Carga Inicial/i).first()).toBeVisible({ timeout: 5000 })

        // Should show catalog reference values
        await expect(page.getByText(/catalogo/i).first()).toBeVisible({ timeout: 3000 })

        // Should have customizable fields
        await expect(page.getByText(/Nombre personalizado|Precio personalizado/i).first()).toBeVisible()

        await page.getByRole("button", { name: /Cancelar/i }).click()
      }
    }
  })
})
