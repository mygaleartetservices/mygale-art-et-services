import { test, expect, type Page } from '@playwright/test'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// There's no SMTP configured in CI/sandboxes, so these tests read the reset
// token straight out of the Verification table (the same row the email link
// would point at) rather than an inbox — see requestPasswordReset in
// src/app/auth/actions.ts, which always persists the token even if the
// subsequent email send fails.
async function latestResetToken(email: string): Promise<string> {
  const row = await prisma.verification.findFirst({
    where: { identifier: email },
    orderBy: { createdAt: 'desc' },
  })
  if (!row) throw new Error(`No reset token found for ${email}`)
  return row.value
}

async function goto(page: Page, path: string) {
  await page.goto(`http://localhost:3000${path}`)
  await page.waitForLoadState('networkidle')
}

test.describe.configure({ mode: 'serial' })

const TEST_EMAIL = `e2e-password-reset-${Date.now()}@example.com`
const ORIGINAL_PASSWORD = 'OriginalPassword123!'
const NEW_PASSWORD = 'BrandNewPassword456!'

test.beforeAll(async () => {
  const passwordHash = await bcrypt.hash(ORIGINAL_PASSWORD, 10)
  await prisma.user.create({
    data: {
      name: 'E2E Password Reset',
      email: TEST_EMAIL,
      passwordHash,
      role: 'USER',
      active: true,
    },
  })
})

test.afterAll(async () => {
  await prisma.verification.deleteMany({ where: { identifier: TEST_EMAIL } })
  await prisma.user.deleteMany({ where: { email: TEST_EMAIL } })
  await prisma.$disconnect()
})

test('Forgot password: shows the same message for a known and an unknown email', async ({
  page,
}) => {
  await goto(page, '/forgot-password')
  await page.locator('#forgot-email').fill('not-a-real-account@example.com')
  await page.getByRole('button', { name: 'Send reset link' }).click()
  const genericMessage = "If an account exists for that email, we've sent a password reset link."
  await expect(page.getByText(genericMessage)).toBeVisible()

  await goto(page, '/forgot-password')
  await page.locator('#forgot-email').fill(TEST_EMAIL)
  await page.getByRole('button', { name: 'Send reset link' }).click()
  await expect(page.getByText(genericMessage)).toBeVisible()
})

test('Reset password: an invalid token is rejected', async ({ page }) => {
  await goto(page, '/reset-password?token=not-a-real-token')
  await page.locator('#reset-password').fill(NEW_PASSWORD)
  await page.locator('#reset-confirm-password').fill(NEW_PASSWORD)
  await page.getByRole('button', { name: 'Reset password' }).click()
  await expect(page.getByText('This password reset link is invalid or has expired.')).toBeVisible()
})

test('Reset password: mismatched passwords are rejected', async ({ page }) => {
  const token = await latestResetToken(TEST_EMAIL)
  await goto(page, `/reset-password?token=${token}`)
  await page.locator('#reset-password').fill(NEW_PASSWORD)
  await page.locator('#reset-confirm-password').fill('something-else-entirely')
  await page.getByRole('button', { name: 'Reset password' }).click()
  await expect(page.getByText('Passwords do not match.')).toBeVisible()
})

test('Reset password: a valid token resets the password, logs out other sessions, and cannot be reused', async ({
  page,
}) => {
  // Create a session for the account the way signInWithPassword would, to
  // verify the reset flow invalidates it.
  await page
    .context()
    .addCookies([{ name: 'NEXT_LOCALE', value: 'en', domain: 'localhost', path: '/' }])
  await goto(page, '/login')
  await page.locator('#login-email').click()
  await page.locator('#login-email').pressSequentially(TEST_EMAIL, { delay: 5 })
  await page.locator('#login-password').click()
  await page.locator('#login-password').pressSequentially(ORIGINAL_PASSWORD, { delay: 5 })
  await page.getByRole('button', { name: 'Sign in' }).click()
  await page.waitForURL('**/admin')

  const sessionCountBefore = await prisma.session.count({
    where: { user: { email: TEST_EMAIL } },
  })
  expect(sessionCountBefore).toBeGreaterThan(0)

  const token = await latestResetToken(TEST_EMAIL)
  const resetPage = await page.context().newPage()
  await goto(resetPage, `/reset-password?token=${token}`)
  await resetPage.locator('#reset-password').fill(NEW_PASSWORD)
  await resetPage.locator('#reset-confirm-password').fill(NEW_PASSWORD)
  await resetPage.getByRole('button', { name: 'Reset password' }).click()
  await expect(resetPage.getByText('Your password has been reset. You can now sign in.')).toBeVisible()

  // Old sessions are invalidated by a reset.
  const sessionCountAfter = await prisma.session.count({
    where: { user: { email: TEST_EMAIL } },
  })
  expect(sessionCountAfter).toBe(0)

  // The same link can't be used twice.
  const reusePage = await page.context().newPage()
  await goto(reusePage, `/reset-password?token=${token}`)
  await reusePage.locator('#reset-password').fill('AnotherPassword789!')
  await reusePage.locator('#reset-confirm-password').fill('AnotherPassword789!')
  await reusePage.getByRole('button', { name: 'Reset password' }).click()
  await expect(
    reusePage.getByText('This password reset link is invalid or has expired.'),
  ).toBeVisible()

  // The old password no longer works, the new one does.
  const loginPage = await page.context().newPage()
  await loginPage
    .context()
    .addCookies([{ name: 'NEXT_LOCALE', value: 'en', domain: 'localhost', path: '/' }])
  await goto(loginPage, '/login')
  await loginPage.locator('#login-email').click()
  await loginPage.locator('#login-email').pressSequentially(TEST_EMAIL, { delay: 5 })
  await loginPage.locator('#login-password').click()
  await loginPage.locator('#login-password').pressSequentially(ORIGINAL_PASSWORD, { delay: 5 })
  await loginPage.getByRole('button', { name: 'Sign in' }).click()
  await expect(loginPage.getByText('Invalid credentials.')).toBeVisible()

  // Fresh navigation rather than reusing the filled-in form — the password
  // field already holds ORIGINAL_PASSWORD, and pressSequentially types into
  // the existing value rather than replacing it.
  await goto(loginPage, '/login')
  await loginPage.locator('#login-email').click()
  await loginPage.locator('#login-email').pressSequentially(TEST_EMAIL, { delay: 5 })
  await loginPage.locator('#login-password').click()
  await loginPage.locator('#login-password').pressSequentially(NEW_PASSWORD, { delay: 5 })
  await loginPage.getByRole('button', { name: 'Sign in' }).click()
  await loginPage.waitForURL('**/admin')
})
