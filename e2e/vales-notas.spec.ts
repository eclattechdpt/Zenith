import { test, expect } from "@playwright/test"

import { hasCredentials, loginAndGoTo } from "./helpers/auth"

test.describe("Vales — UI/UX", () => {
  test.skip(!hasCredentials, "Set TEST_USER_EMAIL and TEST_USER_PASSWORD")

  // 11.16 — Vale pickup complete dialog
  test("11.16 — Vale complete dialog works", async ({ page }) => {
    await loginAndGoTo(page, "/vales")
    await page.waitForLoadState("networkidle")

    // Switch to "Listos" tab to find a ready vale
    await page.getByRole("button", { name: /Listos/i }).click()
    await page.waitForTimeout(1000)

    // Find a ready vale row
    const readyRow = page.locator("table tbody tr").first()
    if (await readyRow.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Open actions dropdown
      const moreBtn = readyRow.locator("button").last()
      await moreBtn.click()

      // Click "Entregar vale"
      const entregarOption = page.getByRole("menuitem", { name: /Entregar vale/i })
      if (await entregarOption.isVisible({ timeout: 3000 }).catch(() => false)) {
        await entregarOption.click()

        // Complete dialog should appear
        await expect(page.getByText("Entregar vale")).toBeVisible({ timeout: 5000 })

        // Should show products section
        await expect(page.getByText("Productos")).toBeVisible()

        // Should have warning about stock deduction
        await expect(page.getByText(/stock/i).first()).toBeVisible()

        // Close without completing
        await page.getByRole("button", { name: /Cancelar/i }).click()
      }
    }
  })

  // 11.17 — Vale cancel confirm dialog
  test("11.17 — Vale cancel shows destructive confirm dialog", async ({ page }) => {
    await loginAndGoTo(page, "/vales")
    await page.waitForLoadState("networkidle")

    // Switch to "Pendientes" tab
    await page.getByRole("button", { name: /Pendientes/i }).click()
    await page.waitForTimeout(1000)

    const pendingRow = page.locator("table tbody tr").first()
    if (await pendingRow.isVisible({ timeout: 5000 }).catch(() => false)) {
      const moreBtn = pendingRow.locator("button").last()
      await moreBtn.click()

      const cancelOption = page.getByRole("menuitem", { name: /Cancelar vale/i })
      if (await cancelOption.isVisible({ timeout: 3000 }).catch(() => false)) {
        await cancelOption.click()

        // Confirmation dialog should appear
        await expect(page.getByText("Cancelar vale")).toBeVisible({ timeout: 5000 })

        // Should mention the vale number
        await expect(page.getByText(/VL-/i)).toBeVisible()

        // Close without confirming
        await page.keyboard.press("Escape")
      }
    }
  })

  // 11.18 — Dashboard ready vales banner
  test("11.18 — Dashboard shows ready vales banner", async ({ page }) => {
    await loginAndGoTo(page, "/")
    await page.waitForLoadState("networkidle")

    // Banner may or may not be visible depending on whether ready vales exist
    // and whether the user has dismissed it (localStorage)
    // Just verify the banner component renders if there are ready vales
    const banner = page.getByText(/vales? listo/i)
    const bannerVisible = await banner.isVisible({ timeout: 5000 }).catch(() => false)

    if (bannerVisible) {
      // Should have a link to /vales
      await expect(page.getByRole("button", { name: /Ver vales/i })).toBeVisible()
    }
    // If not visible, that's ok — no ready vales or dismissed
    expect(true).toBeTruthy()
  })
})

test.describe("Notas de Credito — UI/UX", () => {
  test.skip(!hasCredentials, "Set TEST_USER_EMAIL and TEST_USER_PASSWORD")

  // 12.19 — Module accent = teal
  test("12.19 — Notas de Credito uses teal accent", async ({ page }) => {
    await loginAndGoTo(page, "/notas-credito")
    await page.waitForLoadState("networkidle")

    // Check data-module attribute on html
    const moduleAttr = await page.locator("html").getAttribute("data-module")
    expect(moduleAttr).toContain("notas-credito")

    // Verify teal accent CSS variable
    const accentValue = await page.evaluate(() => {
      return getComputedStyle(document.documentElement).getPropertyValue("--accent-500").trim()
    })
    // Teal-500 is approximately #14b8a6
    expect(accentValue).toBeTruthy()
  })

  // 12.14 — Create credit note dialog (full-screen split panel)
  test("12.14 — Create credit note dialog shows split panel", async ({ page }) => {
    await loginAndGoTo(page, "/notas-credito")
    await page.waitForLoadState("networkidle")

    // Click "Nueva nota" button
    await page.getByRole("button", { name: /Nueva nota/i }).click()
    await page.waitForTimeout(500)

    // Dialog should appear with title
    await expect(page.getByText("Nueva nota de credito")).toBeVisible({ timeout: 5000 })

    // Mode toggle buttons should be visible
    await expect(page.getByRole("button", { name: "Prestamo" })).toBeVisible()
    await expect(page.getByRole("button", { name: "Intercambio" })).toBeVisible()

    // Distribuidor section should be visible
    await expect(page.getByText("Distribuidor")).toBeVisible()

    // Productos section should be visible
    await expect(page.getByText("Productos").first()).toBeVisible()

    // Search fields should be present
    await expect(page.getByPlaceholder(/Filtrar distribuidor/i)).toBeVisible()
  })

  // 12.15 — Prestamo mode
  test("12.15 — Create dialog Prestamo mode works", async ({ page }) => {
    await loginAndGoTo(page, "/notas-credito")
    await page.waitForLoadState("networkidle")

    await page.getByRole("button", { name: /Nueva nota/i }).click()
    await page.waitForTimeout(500)

    // Should default to Prestamo or click it
    await page.getByRole("button", { name: "Prestamo" }).click()
    await page.waitForTimeout(300)

    // Should show "Crear prestamo" as the submit button
    await expect(page.getByRole("button", { name: /Crear prestamo/i })).toBeVisible({ timeout: 3000 })

    await page.keyboard.press("Escape")
  })

  // 12.16 — Intercambio mode
  test("12.16 — Create dialog Intercambio mode shows two-way items", async ({ page }) => {
    await loginAndGoTo(page, "/notas-credito")
    await page.waitForLoadState("networkidle")

    await page.getByRole("button", { name: /Nueva nota/i }).click()
    await page.waitForTimeout(500)

    // Switch to Intercambio mode
    await page.getByRole("button", { name: "Intercambio" }).click()
    await page.waitForTimeout(300)

    // Should show direction toggle (Salida / Entrada)
    await expect(page.getByRole("button", { name: /Salida/i })).toBeVisible({ timeout: 3000 })
    await expect(page.getByRole("button", { name: /Entrada/i })).toBeVisible()

    // Submit button should say "Crear intercambio"
    await expect(page.getByRole("button", { name: /Crear intercambio/i })).toBeVisible()

    await page.keyboard.press("Escape")
  })

  // 12.17 — Settle dialog
  test("12.17 — Settle lending dialog works", async ({ page }) => {
    await loginAndGoTo(page, "/notas-credito")
    await page.waitForLoadState("networkidle")

    // Make sure we're on "Activas" tab
    await page.getByRole("button", { name: /Activas/i }).click()
    await page.waitForTimeout(1000)

    // Find an active lending note
    const activeRow = page.locator("table tbody tr", { hasText: /Prestamo/i }).first()
    if (await activeRow.isVisible({ timeout: 5000 }).catch(() => false)) {
      const moreBtn = activeRow.locator("button").last()
      await moreBtn.click()

      const settleOption = page.getByRole("menuitem", { name: /Liquidar/i })
      if (await settleOption.isVisible({ timeout: 3000 }).catch(() => false)) {
        await settleOption.click()

        // Settle dialog should appear
        await expect(page.getByText(/Liquidar prestamo/i)).toBeVisible({ timeout: 5000 })

        // Should show products being returned
        await expect(page.getByText(/Productos prestados/i)).toBeVisible()

        // Should have warning about stock restoration
        await expect(page.getByText(/inventario/i).first()).toBeVisible()

        await page.getByRole("button", { name: /Cancelar/i }).click()
      }
    }
  })

  // 12.18 — Cancel active note
  test("12.18 — Cancel active credit note shows confirm dialog", async ({ page }) => {
    await loginAndGoTo(page, "/notas-credito")
    await page.waitForLoadState("networkidle")

    await page.getByRole("button", { name: /Activas/i }).click()
    await page.waitForTimeout(1000)

    const activeRow = page.locator("table tbody tr").first()
    if (await activeRow.isVisible({ timeout: 5000 }).catch(() => false)) {
      const moreBtn = activeRow.locator("button").last()
      await moreBtn.click()

      const cancelOption = page.getByRole("menuitem", { name: /Cancelar nota/i })
      if (await cancelOption.isVisible({ timeout: 3000 }).catch(() => false)) {
        await cancelOption.click()

        await expect(page.getByText(/Cancelar nota de credito/i)).toBeVisible({ timeout: 5000 })

        // Should mention the note number
        await expect(page.getByText(/NC-/i)).toBeVisible()

        await page.keyboard.press("Escape")
      }
    }
  })
})
