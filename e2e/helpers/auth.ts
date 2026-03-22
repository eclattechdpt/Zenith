import { type Page, expect } from "@playwright/test"

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
