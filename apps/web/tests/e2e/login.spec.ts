import { test, expect } from '@playwright/test'

// Chrome's password-manager heuristics intercept .fill()'s synthetic value-set
// on this page's email/password inputs (confirmed: works fine on other pages
// without a password field). Real keystrokes via pressSequentially are reliable.
async function typeCredentials(page: import('@playwright/test').Page, email: string, password: string) {
  await page.locator('#login-email').click()
  await page.locator('#login-email').pressSequentially(email, { delay: 10 })
  await page.locator('#login-password').click()
  await page.locator('#login-password').pressSequentially(password, { delay: 10 })
}

test('Login: invalid credentials show an error', async ({ page }) => {
  await page.goto('http://localhost:3000/login')
  await typeCredentials(page, 'not-a-real-admin@example.com', 'wrong-password')
  await page.getByRole('button', { name: 'Sign in' }).click()

  await expect(page.getByText('Invalid credentials.')).toBeVisible()
  await expect(page).toHaveURL(/\/login$/)
})

// Requires E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD for an EDITOR-or-above account
// (e.g. the account created by `pnpm db:seed`). Skipped when not configured.
test('Login: valid credentials redirect to /admin', async ({ page }) => {
  test.skip(
    !process.env.E2E_ADMIN_EMAIL || !process.env.E2E_ADMIN_PASSWORD,
    'E2E_ADMIN_EMAIL/E2E_ADMIN_PASSWORD not set',
  )

  // The admin panel defaults to French when no locale cookie is set yet; pin
  // English so this assertion (written against the English string) stays
  // deterministic. See tests/e2e/attendance.spec.ts for the same pattern.
  await page
    .context()
    .addCookies([{ name: 'NEXT_LOCALE', value: 'en', domain: 'localhost', path: '/' }])
  await page.goto('http://localhost:3000/login')
  await typeCredentials(page, process.env.E2E_ADMIN_EMAIL!, process.env.E2E_ADMIN_PASSWORD!)
  await page.getByRole('button', { name: 'Sign in' }).click()

  await page.waitForURL('**/admin')
  await expect(page.locator('h1')).toContainText('Admin Dashboard')
})

// Regression test: the login rate limiter (10 attempts/15min/IP) used to
// count every attempt, successful or not — so e.g. 20 employees signing in
// from behind one shared office IP around the same time would see more
// than 10 of them hard-rejected with "Too many login attempts," even though
// every single one of them typed the right password. Fixed to only count
// failed attempts. This logs in more than the old limit, back-to-back, with
// correct credentials every time, and expects every one to succeed.
test('Login: many successful logins in a row from the same IP never trip the rate limiter', async ({
  page,
}) => {
  test.skip(!process.env.E2E_ADMIN_EMAIL || !process.env.E2E_ADMIN_PASSWORD, 'E2E_ADMIN_EMAIL/E2E_ADMIN_PASSWORD not set')

  const ATTEMPTS = 12 // > the 10/15min limit

  for (let i = 0; i < ATTEMPTS; i++) {
    await page.goto('http://localhost:3000/login')
    await typeCredentials(page, process.env.E2E_ADMIN_EMAIL!, process.env.E2E_ADMIN_PASSWORD!)
    await page.getByRole('button', { name: 'Sign in' }).click()
    await page.waitForURL('**/admin', { timeout: 15_000 })

    // Drop the session so the next loop iteration goes through the login
    // form again instead of an already-authenticated redirect.
    await page.context().clearCookies()
  }
})
