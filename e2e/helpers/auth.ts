import { type Page, expect } from "@playwright/test"

export const TEST_EMAIL = process.env.TEST_USER_EMAIL ?? ""
export const TEST_PASSWORD = process.env.TEST_USER_PASSWORD ?? ""
export const hasCredentials = TEST_EMAIL.length > 0 && TEST_PASSWORD.length > 0

export async function loginAs(
  page: Page,
  email: string,
  password: string
) {
  await page.goto("/login")
  await page.locator("#email").first().fill(email)
  await page.locator("#password").first().fill(password)
  await page.getByRole("button", { name: "Entrar" }).first().click()
  // Wait for either redirect to / or for the dashboard content to appear
  // router.push is a soft navigation — use polling assertion
  await expect(page).toHaveURL("/", { timeout: 15000 })
}

/**
 * Login and navigate to a specific route. Waits for the page to settle.
 */
export async function loginAndGoTo(page: Page, path: string) {
  await loginAs(page, TEST_EMAIL, TEST_PASSWORD)
  if (path !== "/") {
    await page.goto(path)
  }
  // Wait for main content to be interactive
  await page.waitForLoadState("networkidle", { timeout: 15000 })
}

/**
 * Wait for a toast notification to appear with given text.
 */
export async function expectToast(page: Page, text: string | RegExp) {
  const toast = page.locator("[data-sonner-toast]", { hasText: text }).first()
  await expect(toast).toBeVisible({ timeout: 10000 })
}

/**
 * Open the first dropdown menu (⋯ button) in a table row and click an action.
 */
export async function clickRowAction(page: Page, rowText: string, actionLabel: string) {
  const row = page.locator("tr", { hasText: rowText }).first()
  await row.getByRole("button").filter({ hasText: "" }).last().click()
  await page.getByRole("menuitem", { name: actionLabel }).click()
}

/**
 * Wait for content to load (skeleton gone, data visible).
 */
export async function waitForContent(page: Page, text: string | RegExp, timeout = 15000) {
  await expect(page.getByText(text).first()).toBeVisible({ timeout })
}
