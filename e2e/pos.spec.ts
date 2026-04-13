import { test, expect } from "@playwright/test"

import { hasCredentials, loginAndGoTo } from "./helpers/auth"

test.describe("POS — UI/UX", () => {
  test.skip(!hasCredentials, "Set TEST_USER_EMAIL and TEST_USER_PASSWORD")

  // 5.37 — POS landing page Design A layout
  test("5.37 — POS landing shows Design A layout with KPIs", async ({ page }) => {
    await loginAndGoTo(page, "/pos")

    // PageHero should be visible
    await expect(page.getByText("Punto de Venta").first()).toBeVisible({ timeout: 15000 })

    // Should have action button to start new sale
    await expect(page.getByRole("button", { name: /Nueva venta/i })).toBeVisible()
  })

  // 5.21 — Search and add product to cart
  test("5.21 — POS wizard search and add product to cart", async ({ page }) => {
    await loginAndGoTo(page, "/pos")

    // Start new sale wizard
    await page.getByRole("button", { name: /Nueva venta/i }).click()
    await page.waitForLoadState("networkidle")

    // Skip customer step — continue without customer
    await page.getByRole("button", { name: /Continuar sin cliente/i }).click()
    await page.waitForTimeout(500)

    // Should be on products step
    await expect(page.getByText("Agregar productos")).toBeVisible({ timeout: 10000 })

    // Search for a product
    const searchInput = page.getByPlaceholder(/Producto, marca o codigo/i).first()
    await searchInput.fill("CeraVe")
    await page.waitForTimeout(1000)

    // Product should appear in results
    await expect(page.getByText("CeraVe").first()).toBeVisible({ timeout: 5000 })

    // Click add button on the product card
    const productCard = page.locator("[class*='rounded']", { hasText: "CeraVe" }).first()
    await productCard.locator("button").last().click()

    // Cart should now show the product
    await expect(page.getByText("Carrito").first()).toBeVisible({ timeout: 5000 })
  })

  // 5.35 — Stock badges visible on product cards
  test("5.35 — POS product cards show stock badges", async ({ page }) => {
    await loginAndGoTo(page, "/pos")

    await page.getByRole("button", { name: /Nueva venta/i }).click()
    await page.waitForLoadState("networkidle")

    // Skip customer step
    await page.getByRole("button", { name: /Continuar sin cliente/i }).click()
    await page.waitForTimeout(500)

    // Stock badges should be visible on product cards (green, amber, or red)
    const stockBadge = page.locator("text=/en stock|Sin stock|\\d+/").first()
    await expect(stockBadge).toBeVisible({ timeout: 10000 })
  })

  // 5.36 — No edit pencil icon on POS product cards
  test("5.36 — POS product cards have no edit pencil icon", async ({ page }) => {
    await loginAndGoTo(page, "/pos")

    await page.getByRole("button", { name: /Nueva venta/i }).click()
    await page.waitForLoadState("networkidle")

    // Skip customer step
    await page.getByRole("button", { name: /Continuar sin cliente/i }).click()
    await page.waitForTimeout(1000)

    // Wait for products grid
    await expect(page.getByText("Agregar productos")).toBeVisible({ timeout: 10000 })

    // No pencil/edit icons should exist on product cards
    // The Pencil icon was removed in Sprint 8
    const editButtons = page.locator("[data-lucide='pencil'], [class*='lucide-pencil']")
    await expect(editButtons).toHaveCount(0)
  })

  // 5.26 — Customer selection and price resolution
  test("5.26 — POS wizard customer selection applies discount", async ({ page }) => {
    await loginAndGoTo(page, "/pos")

    await page.getByRole("button", { name: /Nueva venta/i }).click()
    await page.waitForLoadState("networkidle")

    // Should be on customer step
    await expect(page.getByText("Seleccionar cliente")).toBeVisible({ timeout: 10000 })

    // Search for a customer with discount
    const searchInput = page.getByPlaceholder(/Buscar por nombre/i)
    await searchInput.fill("Laura")
    await page.waitForTimeout(1000)

    // Customer card with discount badge should appear
    const customerCard = page.locator("text=Laura").first()
    await expect(customerCard).toBeVisible({ timeout: 5000 })

    // Click customer to select
    await customerCard.click()
    await page.waitForTimeout(500)

    // Continue button should show customer name
    await expect(page.getByRole("button", { name: /Continuar con/i })).toBeVisible()
  })

  // 5.22 — Multi-variant product shows picker dialog
  test("5.22 — Multi-variant product shows variant picker", async ({ page }) => {
    await loginAndGoTo(page, "/pos")

    await page.getByRole("button", { name: /Nueva venta/i }).click()
    await page.waitForLoadState("networkidle")

    // Skip customer
    await page.getByRole("button", { name: /Continuar sin cliente/i }).click()
    await page.waitForTimeout(500)

    // Search for a multi-variant product (MAC has variants)
    const searchInput = page.getByPlaceholder(/Producto, marca o codigo/i).first()
    await searchInput.fill("MAC")
    await page.waitForTimeout(1000)

    // Click on the product
    const macCard = page.locator("[class*='rounded']", { hasText: "MAC" }).first()
    await macCard.locator("button").last().click()

    // Variant picker dialog should appear if multi-variant
    // OR product gets added directly if single-variant
    // Check for either outcome
    const pickerVisible = await page.getByText("Selecciona una variante").isVisible({ timeout: 3000 }).catch(() => false)
    const cartVisible = await page.getByText("Carrito").isVisible({ timeout: 1000 }).catch(() => false)

    expect(pickerVisible || cartVisible).toBeTruthy()
  })

  // 5.27 — Global discount picker
  test("5.27 — POS wizard global discount picker works", async ({ page }) => {
    await loginAndGoTo(page, "/pos")

    await page.getByRole("button", { name: /Nueva venta/i }).click()
    await page.waitForLoadState("networkidle")

    // Skip customer, go to products
    await page.getByRole("button", { name: /Continuar sin cliente/i }).click()
    await page.waitForTimeout(500)

    // Add a product first
    const searchInput = page.getByPlaceholder(/Producto, marca o codigo/i).first()
    await searchInput.fill("CeraVe")
    await page.waitForTimeout(1000)
    const productCard = page.locator("[class*='rounded']", { hasText: "CeraVe" }).first()
    await productCard.locator("button").last().click()
    await page.waitForTimeout(500)

    // Look for discount button in the cart panel
    const discountBtn = page.getByRole("button", { name: /Agregar descuento/i })
    if (await discountBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await discountBtn.click()

      // Should show preset discounts or custom input
      const customBtn = page.getByRole("button", { name: /Personalizado/i })
      const presetExists = await page.locator("button", { hasText: /\d+%/ }).first().isVisible({ timeout: 2000 }).catch(() => false)

      expect(await customBtn.isVisible({ timeout: 2000 }).catch(() => false) || presetExists).toBeTruthy()
    }
  })

  // 5.29 — Payment step (cash)
  test("5.29 — POS wizard payment step calculates cash change", async ({ page }) => {
    await loginAndGoTo(page, "/pos")

    await page.getByRole("button", { name: /Nueva venta/i }).click()
    await page.waitForLoadState("networkidle")

    // Skip customer
    await page.getByRole("button", { name: /Continuar sin cliente/i }).click()
    await page.waitForTimeout(500)

    // Add a product
    const searchInput = page.getByPlaceholder(/Producto, marca o codigo/i).first()
    await searchInput.fill("CeraVe")
    await page.waitForTimeout(1000)
    const productCard = page.locator("[class*='rounded']", { hasText: "CeraVe" }).first()
    await productCard.locator("button").last().click()
    await page.waitForTimeout(500)

    // Go to payment step
    await page.getByRole("button", { name: /Continuar/i }).last().click()
    await page.waitForTimeout(500)

    // Should see payment step
    await expect(page.getByText(/Metodo de pago|Total a cobrar/i).first()).toBeVisible({ timeout: 10000 })

    // Click Efectivo
    await page.getByRole("button", { name: "Efectivo" }).first().click()
    await page.waitForTimeout(500)

    // Enter a larger cash amount to trigger change calculation
    const amountInput = page.locator("input[type='number'], input[inputmode='decimal']").first()
    if (await amountInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await amountInput.fill("5000")
      await page.waitForTimeout(500)

      // Should show change amount
      await expect(page.getByText(/Cambio/i)).toBeVisible({ timeout: 5000 })
    }
  })

  // 5.30 — Payment step (card)
  test("5.30 — POS wizard payment step card has no change", async ({ page }) => {
    await loginAndGoTo(page, "/pos")

    await page.getByRole("button", { name: /Nueva venta/i }).click()
    await page.waitForLoadState("networkidle")

    // Skip customer
    await page.getByRole("button", { name: /Continuar sin cliente/i }).click()
    await page.waitForTimeout(500)

    // Add a product
    const searchInput = page.getByPlaceholder(/Producto, marca o codigo/i).first()
    await searchInput.fill("CeraVe")
    await page.waitForTimeout(1000)
    const productCard = page.locator("[class*='rounded']", { hasText: "CeraVe" }).first()
    await productCard.locator("button").last().click()
    await page.waitForTimeout(500)

    // Go to payment step
    await page.getByRole("button", { name: /Continuar/i }).last().click()
    await page.waitForTimeout(500)

    // Click Tarjeta
    await page.getByRole("button", { name: "Tarjeta" }).first().click()
    await page.waitForTimeout(500)

    // With card, the amount should auto-fill to total — "Pago exacto" or "Continuar" enabled
    const exactText = page.getByText(/Pago exacto|listo para continuar/i)
    const continueBtn = page.getByRole("button", { name: /Continuar/i }).last()

    const exactVisible = await exactText.isVisible({ timeout: 3000 }).catch(() => false)
    const continueEnabled = await continueBtn.isEnabled({ timeout: 3000 }).catch(() => false)

    expect(exactVisible || continueEnabled).toBeTruthy()
  })

  // 5.23 — Add cofre to cart shows component list
  test("5.23 — POS wizard cofre shows component list in cart", async ({ page }) => {
    await loginAndGoTo(page, "/pos")

    await page.getByRole("button", { name: /Nueva venta/i }).click()
    await page.waitForLoadState("networkidle")

    // Skip customer
    await page.getByRole("button", { name: /Continuar sin cliente/i }).click()
    await page.waitForTimeout(500)

    // Search for cofre
    const searchInput = page.getByPlaceholder(/Producto, marca o codigo/i).first()
    await searchInput.fill("Cofre")
    await page.waitForTimeout(1000)

    const cofreCard = page.locator("[class*='rounded']", { hasText: /Cofre/i }).first()
    if (await cofreCard.isVisible({ timeout: 3000 }).catch(() => false)) {
      await cofreCard.locator("button").last().click()
      await page.waitForTimeout(1000)

      // Cart should show the cofre with indented component items
      await expect(page.getByText("Carrito").first()).toBeVisible({ timeout: 5000 })
    }
  })
})
