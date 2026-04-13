import { test, expect } from "@playwright/test"

import { hasCredentials, loginAndGoTo, expectToast } from "./helpers/auth"

test.describe("Clientes — UI/UX", () => {
  test.skip(!hasCredentials, "Set TEST_USER_EMAIL and TEST_USER_PASSWORD")

  // 4.24 — KPI cards render correct counts
  test("4.24 — KPI cards show total / con descuento / sin descuento", async ({ page }) => {
    await loginAndGoTo(page, "/clientes")
    await expect(page.getByText("Total clientes")).toBeVisible({ timeout: 15000 })
    await expect(page.getByText("Con descuento")).toBeVisible()
    await expect(page.getByText("Sin descuento")).toBeVisible()

    // Values should be numbers, not NaN or empty
    const totalCard = page.locator("text=Total clientes").locator("..").locator("..")
    await expect(totalCard).not.toContainText("NaN")
  })

  // 4.17 — Create new customer dialog
  test("4.17 — Customer dialog creates new customer", async ({ page }) => {
    await loginAndGoTo(page, "/clientes")

    await page.getByRole("button", { name: "Nuevo cliente" }).click()
    await expect(page.getByText("Nuevo cliente").nth(1)).toBeVisible({ timeout: 5000 })

    // Fill required field
    const uniqueName = `Test Playwright ${Date.now()}`
    await page.locator("#cd-name").fill(uniqueName)
    await page.locator("#cd-phone").fill("5551234567")

    // Submit
    await page.getByRole("button", { name: "Crear cliente" }).click()

    // Should show success animation
    await expect(page.getByText("Cliente creado")).toBeVisible({ timeout: 10000 })

    // Dialog should auto-close after success
    await expect(page.getByText("Cliente creado")).not.toBeVisible({ timeout: 5000 })

    // Customer should appear in table
    await expect(page.getByText(uniqueName)).toBeVisible({ timeout: 10000 })
  })

  // 4.18 — Edit existing customer dialog
  test("4.18 — Customer dialog edits existing customer", async ({ page }) => {
    await loginAndGoTo(page, "/clientes")

    // Wait for table to load
    await page.waitForLoadState("networkidle")

    // Open actions on first customer row and click Edit
    const firstRow = page.locator("table tbody tr").first()
    await firstRow.getByRole("button").last().click()
    await page.getByRole("menuitem", { name: "Editar" }).click()

    // Dialog should show "Editar cliente"
    await expect(page.getByText("Editar cliente")).toBeVisible({ timeout: 5000 })

    // Name field should be pre-populated (not empty)
    const nameInput = page.locator("#cd-name")
    await expect(nameInput).not.toHaveValue("")

    // Save without changes
    await page.getByRole("button", { name: "Guardar cambios" }).click()
    await expect(page.getByText("Cliente actualizado")).toBeVisible({ timeout: 10000 })
  })

  // 4.19 — Collapsible sections in customer dialog
  test("4.19 — Customer dialog has collapsible sections", async ({ page }) => {
    await loginAndGoTo(page, "/clientes")

    await page.getByRole("button", { name: "Nuevo cliente" }).click()
    await expect(page.getByText("Nuevo cliente").nth(1)).toBeVisible({ timeout: 5000 })

    // "Informacion" section should be visible (open by default)
    await expect(page.getByText("Informacion").first()).toBeVisible()
    await expect(page.locator("#cd-name")).toBeVisible()

    // "Detalles adicionales" section should exist
    const detailsSection = page.getByText("Detalles adicionales")
    await expect(detailsSection).toBeVisible()

    // Click to toggle "Detalles adicionales"
    await detailsSection.click()

    // Notes field should become visible
    await expect(page.locator("#cd-notes")).toBeVisible({ timeout: 3000 })

    // Close dialog
    await page.keyboard.press("Escape")
  })

  // 4.20 — Customer detail sheet opens on name click
  test("4.20 — Customer detail sheet opens on name click", async ({ page }) => {
    await loginAndGoTo(page, "/clientes")
    await page.waitForLoadState("networkidle")

    // Click the first customer name in the table
    const firstNameLink = page.locator("table tbody tr").first().locator("button").first()
    await firstNameLink.click()

    // Detail sheet should appear with profile info
    await expect(page.getByText("Historial de compras")).toBeVisible({ timeout: 10000 })
    await expect(page.getByText("Editar cliente")).toBeVisible()
  })

  // 4.21 — Customer detail sheet date filters
  test("4.21 — Customer detail sheet date filters work", async ({ page }) => {
    await loginAndGoTo(page, "/clientes")
    await page.waitForLoadState("networkidle")

    // Open detail sheet for first customer
    const firstNameLink = page.locator("table tbody tr").first().locator("button").first()
    await firstNameLink.click()
    await expect(page.getByText("Historial de compras")).toBeVisible({ timeout: 10000 })

    // Filter pills should be visible
    await expect(page.getByRole("button", { name: "Todo" })).toBeVisible()
    await expect(page.getByRole("button", { name: "Este mes" })).toBeVisible()
    await expect(page.getByRole("button", { name: "Anterior" })).toBeVisible()
    await expect(page.getByRole("button", { name: "Elegir" })).toBeVisible()

    // Click "Este mes" — should filter
    await page.getByRole("button", { name: "Este mes" }).click()
    await page.waitForTimeout(500)

    // Click "Elegir" — month grid should appear
    await page.getByRole("button", { name: "Elegir" }).click()
    await page.waitForTimeout(500)

    // Month names should be visible (Ene, Feb, etc.)
    await expect(page.getByText("Ene")).toBeVisible({ timeout: 3000 })
  })

  // 4.23 — Client number field visible and editable
  test("4.23 — Client number field visible in dialog", async ({ page }) => {
    await loginAndGoTo(page, "/clientes")

    await page.getByRole("button", { name: "Nuevo cliente" }).click()
    await expect(page.getByText("Nuevo cliente").nth(1)).toBeVisible({ timeout: 5000 })

    // Client number field should be visible
    const clientNumberInput = page.locator("#cd-client-number")
    await expect(clientNumberInput).toBeVisible()

    // Should be editable
    await clientNumberInput.fill("CLT-999")
    await expect(clientNumberInput).toHaveValue("CLT-999")

    await page.keyboard.press("Escape")
  })
})
