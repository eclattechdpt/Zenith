import { test, expect } from "@playwright/test"

import { loginAs } from "./helpers/auth"

const EMAIL = process.env.TEST_USER_EMAIL ?? ""
const PASSWORD = process.env.TEST_USER_PASSWORD ?? ""
const hasCredentials = EMAIL.length > 0 && PASSWORD.length > 0

test.describe("Auth — route protection", () => {
  test("unauthenticated user visiting / is redirected to /login", async ({
    page,
  }) => {
    await page.goto("/")
    await expect(page).toHaveURL(/\/login/)
  })

  test("unauthenticated user visiting /any-route is redirected to /login", async ({
    page,
  }) => {
    await page.goto("/productos")
    await expect(page).toHaveURL(/\/login/)
  })

  test("/login page renders the login form", async ({ page }) => {
    await page.goto("/login")
    await expect(page.locator("#email").first()).toBeVisible({ timeout: 10000 })
    await expect(page.locator("#password").first()).toBeVisible()
    await expect(
      page.getByRole("button", { name: "Entrar" }).first()
    ).toBeVisible()
  })
})

test.describe("Auth — login flow", () => {
  test("invalid credentials show error message", async ({ page }) => {
    await page.goto("/login")
    await page.locator("#email").first().fill("wrong@test.com")
    await page.locator("#password").first().fill("wrongpassword")
    await page.getByRole("button", { name: "Entrar" }).first().click()
    await expect(
      page.locator("[class*='border-red']").first()
    ).toBeVisible({ timeout: 10000 })
  })

  test("empty form shows validation errors", async ({ page }) => {
    await page.goto("/login")
    await page.getByRole("button", { name: "Entrar" }).first().click()
    await expect(
      page.getByText("Correo electrónico inválido").first()
    ).toBeVisible({ timeout: 5000 })
  })
})

test.describe("Auth — session (requires TEST_USER_EMAIL & TEST_USER_PASSWORD)", () => {
  test.skip(!hasCredentials, "Set TEST_USER_EMAIL and TEST_USER_PASSWORD env vars to run these tests")

  test("successful login redirects to /", async ({ page }) => {
    await loginAs(page, EMAIL, PASSWORD)
    await expect(page).toHaveURL("/")
    await expect(page.getByText("Bienvenido a Zenith")).toBeVisible()
  })

  test("authenticated user visiting /login is redirected to /", async ({
    page,
  }) => {
    await loginAs(page, EMAIL, PASSWORD)
    await page.goto("/login")
    await expect(page).toHaveURL("/")
  })

  test("logout redirects to /login", async ({ page }) => {
    await loginAs(page, EMAIL, PASSWORD)
    await page.getByRole("button", { name: "Cerrar sesion" }).first().click()
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 })
  })

  test("after logout, visiting / redirects to /login", async ({
    page,
  }) => {
    await loginAs(page, EMAIL, PASSWORD)
    await page.getByRole("button", { name: "Cerrar sesion" }).first().click()
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 })
    await page.goto("/")
    await expect(page).toHaveURL(/\/login/)
  })
})
