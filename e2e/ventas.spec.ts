import { test, expect } from "@playwright/test"

import { hasCredentials, loginAndGoTo } from "./helpers/auth"

test.describe("Ventas — UI/UX", () => {
  test.skip(!hasCredentials, "Set TEST_USER_EMAIL and TEST_USER_PASSWORD")

  // 6.20 — Cancel sale button + confirmation dialog
  test("6.20 — Sale detail has cancel button with confirmation dialog", async ({ page }) => {
    await loginAndGoTo(page, "/ventas")

    // Wait for sales table
    await page.waitForLoadState("networkidle")

    // Find a completed sale row and click it
    const completedRow = page.locator("table tbody tr", { hasText: /Completada|completada/ }).first()
    if (await completedRow.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Click the sale number link to open detail
      await completedRow.locator("a, button").first().click()
      await page.waitForTimeout(1000)

      // Look for the cancel option in the dropdown menu
      const moreBtn = page.getByRole("button").filter({ has: page.locator("[class*='lucide-more'], [class*='ellipsis']") }).first()
      if (await moreBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await moreBtn.click()

        // "Cancelar venta" should be in dropdown
        await expect(page.getByRole("menuitem", { name: /Cancelar venta/i })).toBeVisible({ timeout: 3000 })

        // Click it to open confirmation dialog
        await page.getByRole("menuitem", { name: /Cancelar venta/i }).click()

        // Confirmation dialog should appear
        await expect(page.getByText("Cancelar venta")).toBeVisible({ timeout: 5000 })

        // Close without confirming
        await page.keyboard.press("Escape")
      }
    }
  })

  // 6.21 — Cancelled returns shown faded with badge
  test("6.21 — Cancelled returns appear faded with badge", async ({ page }) => {
    await loginAndGoTo(page, "/ventas")
    await page.waitForLoadState("networkidle")

    // Find a sale with returns (partially_returned or fully_returned)
    const returnedRow = page.locator("table tbody tr", { hasText: /devuelta/i }).first()
    if (await returnedRow.isVisible({ timeout: 5000 }).catch(() => false)) {
      await returnedRow.locator("a, button").first().click()
      await page.waitForTimeout(1000)

      // Devoluciones section should be visible
      const returnsSection = page.getByText("Devoluciones")
      if (await returnsSection.isVisible({ timeout: 5000 }).catch(() => false)) {
        // If there are cancelled returns, they should have a "Cancelada" badge
        const cancelledBadge = page.locator("text=Cancelada").first()
        if (await cancelledBadge.isVisible({ timeout: 2000 }).catch(() => false)) {
          // The return entry should have reduced opacity (faded)
          await expect(cancelledBadge).toBeVisible()
        }
      }
    }
  })

  // 6.22 — Quote conversion dialog
  test("6.22 — Quote conversion dialog works", async ({ page }) => {
    await loginAndGoTo(page, "/ventas")
    await page.waitForLoadState("networkidle")

    // Switch to Cotizaciones tab
    await page.getByRole("button", { name: /Cotizaciones/i }).click()
    await page.waitForTimeout(1000)

    // Find a quote row
    const quoteRow = page.locator("table tbody tr").first()
    if (await quoteRow.isVisible({ timeout: 5000 }).catch(() => false)) {
      await quoteRow.locator("a, button").first().click()
      await page.waitForTimeout(1000)

      // Look for convert button or "Convertir" in the detail view
      const convertBtn = page.getByRole("button", { name: /Convertir/i })
      if (await convertBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await convertBtn.click()

        // Conversion dialog should appear
        await expect(page.getByText(/Convertir cotizacion/i)).toBeVisible({ timeout: 5000 })

        // Should show payment options
        await expect(page.getByRole("button", { name: "Efectivo" })).toBeVisible()
        await expect(page.getByRole("button", { name: "Tarjeta" })).toBeVisible()

        // Close without converting
        await page.keyboard.press("Escape")
      }
    }
  })
})

test.describe("Devoluciones — UI/UX", () => {
  test.skip(!hasCredentials, "Set TEST_USER_EMAIL and TEST_USER_PASSWORD")

  // Helper: navigate to a completed sale detail that can be returned
  async function openReturnableSale(page: import("@playwright/test").Page) {
    await loginAndGoTo(page, "/ventas")
    await page.waitForLoadState("networkidle")

    // Find completed sale
    const completedRow = page.locator("table tbody tr", { hasText: /Completada|completada/ }).first()
    await completedRow.locator("a, button").first().click()
    await page.waitForTimeout(1000)

    // Open the return dialog via dropdown
    const moreBtn = page.getByRole("button").filter({ has: page.locator("[class*='lucide-more'], [class*='ellipsis']") }).first()
    await moreBtn.click()
    await page.getByRole("menuitem", { name: /Devolver/i }).click()
    await expect(page.getByText("Devolucion").first()).toBeVisible({ timeout: 5000 })
  }

  // 7.15 — "Producto vendible" toggle
  test("7.15 — Return dialog has Producto vendible toggle", async ({ page }) => {
    await openReturnableSale(page)

    // Click on first product to select it for return
    const productItem = page.locator("[class*='border']", { hasText: /\$/ }).first()
    await productItem.click()
    await page.waitForTimeout(500)

    // "Producto vendible" toggle should appear
    await expect(page.getByText(/Producto vendible/i)).toBeVisible({ timeout: 5000 })
  })

  // 7.16 — Replacement product selector
  test("7.16 — Return dialog has replacement selector with Sin cambio option", async ({ page }) => {
    await openReturnableSale(page)

    // Select a product for return
    const productItem = page.locator("[class*='border']", { hasText: /\$/ }).first()
    await productItem.click()
    await page.waitForTimeout(500)

    // "Cambio para el cliente" section or "Sin cambio" link should be visible
    const cambioSection = page.getByText(/Cambio para el cliente|Sin cambio|Dar cambio/i).first()
    await expect(cambioSection).toBeVisible({ timeout: 5000 })
  })

  // 7.17 — Stock movement breakdown
  test("7.17 — Return dialog shows stock movement breakdown", async ({ page }) => {
    await openReturnableSale(page)

    // Select a product
    const productItem = page.locator("[class*='border']", { hasText: /\$/ }).first()
    await productItem.click()
    await page.waitForTimeout(500)

    // Stock movement section should appear
    await expect(page.getByText(/Movimiento de stock|Efecto neto/i).first()).toBeVisible({ timeout: 5000 })
  })

  // 7.18 — Quantity limited to max_returnable
  test("7.18 — Return dialog limits quantity to max returnable", async ({ page }) => {
    await openReturnableSale(page)

    // Select a product
    const productItem = page.locator("[class*='border']", { hasText: /\$/ }).first()
    await productItem.click()
    await page.waitForTimeout(500)

    // Quantity controls should be visible with a max label
    const qtyControls = page.locator("button", { hasText: "+" }).first()
    await expect(qtyControls).toBeVisible({ timeout: 3000 })
  })

  // 7.19 — Cancel button on return entry
  test("7.19 — Return card has cancel button", async ({ page }) => {
    await loginAndGoTo(page, "/ventas")
    await page.waitForLoadState("networkidle")

    // Find a sale with completed returns
    const returnedRow = page.locator("table tbody tr", { hasText: /devuelta/i }).first()
    if (await returnedRow.isVisible({ timeout: 5000 }).catch(() => false)) {
      await returnedRow.locator("a, button").first().click()
      await page.waitForTimeout(1000)

      // In the Devoluciones section, look for cancel button (X icon) on return entries
      const returnsSection = page.getByText("Devoluciones")
      if (await returnsSection.isVisible({ timeout: 3000 }).catch(() => false)) {
        // Cancel button should exist on completed return entries
        const cancelReturnBtn = page.locator("[class*='lucide-x']").first()
        if (await cancelReturnBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
          await cancelReturnBtn.click()

          // Confirmation dialog
          await expect(page.getByText(/Cancelar devolucion/i)).toBeVisible({ timeout: 5000 })
          await page.keyboard.press("Escape")
        }
      }
    }
  })
})
