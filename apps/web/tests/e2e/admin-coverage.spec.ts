import { test, expect, type Page } from '@playwright/test'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD

test.describe.configure({ mode: 'serial' })

async function goto(page: Page, path: string) {
  await page.goto(`http://localhost:3000${path}`)
  await page.waitForLoadState('networkidle')
}

async function typeFirst(page: Page, selector: string, text: string) {
  const field = page.locator(selector)
  await field.click()
  await field.clear()
  await field.pressSequentially(text, { delay: 5 })
}

async function login(page: Page) {
  // The admin panel defaults to French when no locale cookie is set yet; pin
  // English so these assertions (written against the English strings) stay
  // deterministic. See tests/e2e/attendance.spec.ts for the same pattern.
  await page
    .context()
    .addCookies([{ name: 'NEXT_LOCALE', value: 'en', domain: 'localhost', path: '/' }])
  await goto(page, '/login')
  await page.locator('#login-email').click()
  await page.locator('#login-email').pressSequentially(ADMIN_EMAIL!, { delay: 5 })
  await page.locator('#login-password').click()
  await page.locator('#login-password').pressSequentially(ADMIN_PASSWORD!, { delay: 5 })
  await page.getByRole('button', { name: 'Sign in' }).click()
  await page.waitForURL('**/admin')
}

test.beforeAll(() => {
  test.skip(!ADMIN_EMAIL || !ADMIN_PASSWORD, 'E2E_ADMIN_EMAIL/E2E_ADMIN_PASSWORD not set')
})

test.afterAll(async () => {
  await prisma.$disconnect()
})

test.describe('Admin: Announcements CRUD', () => {
  const title = `E2E Announcement ${Date.now()}`

  test('creates, edits, toggles, and deletes an announcement', async ({ page }) => {
    await login(page)
    await goto(page, '/admin/announcements/new')

    await typeFirst(page, 'input[name="title"]', title)
    await page.locator('textarea[name="message"]').fill('E2E announcement message.')
    await page.locator('select[name="type"]').selectOption('promo')
    await page.getByRole('button', { name: 'Create Announcement' }).click()
    await page.waitForURL('**/admin/announcements', { timeout: 15_000 })

    let created = await prisma.announcement.findFirst({ where: { title } })
    expect(created).not.toBeNull()
    expect(created?.type).toBe('promo')
    expect(created?.active).toBe(true)

    // Edit
    await goto(page, `/admin/announcements/${created!.id}/edit`)
    const messageField = page.locator('textarea[name="message"]')
    await messageField.click()
    await messageField.fill('E2E announcement message (edited).')
    await page.getByRole('button', { name: 'Save Changes' }).click()
    await page.waitForURL('**/admin/announcements', { timeout: 15_000 })

    created = await prisma.announcement.findUnique({ where: { id: created!.id } })
    expect(created?.message).toBe('E2E announcement message (edited).')

    // Toggle off
    await goto(page, '/admin/announcements')
    const row = page.locator('tr', { hasText: title })
    await row.getByRole('button', { name: 'Off' }).click()
    await expect(row.getByText('Inactive')).toBeVisible({ timeout: 15_000 })

    const toggled = await prisma.announcement.findUnique({ where: { id: created!.id } })
    expect(toggled?.active).toBe(false)

    // Delete
    await goto(page, '/admin/announcements')
    const row2 = page.locator('tr', { hasText: title })
    await row2.getByRole('button', { name: 'Delete' }).click()
    await expect(page.locator('tr', { hasText: title })).toHaveCount(0, { timeout: 15_000 })

    const deleted = await prisma.announcement.findUnique({ where: { id: created!.id } })
    expect(deleted).toBeNull()
  })
})

test.describe('Admin: Navigation editing', () => {
  test('edits an existing navigation item label', async ({ page }) => {
    await login(page)
    await goto(page, '/admin/navigation')

    const item = await prisma.navigationItem.findFirst({
      where: { deletedAt: null, parentId: null },
    })
    expect(item).not.toBeNull()
    const marker = `E2E Nav ${Date.now()}`

    await goto(page, `/admin/navigation/${item!.id}/edit`)
    const labelField = page.locator('input[name="labelEn"]')
    await labelField.click()
    await labelField.fill(marker)
    await page.getByRole('button', { name: 'Save Changes' }).click()
    await page.waitForURL('**/admin/navigation', { timeout: 15_000 })

    const updated = await prisma.navigationItem.findUnique({ where: { id: item!.id } })
    expect(updated?.labelEn).toBe(marker)

    // Restore original label so the seed stays representative.
    await prisma.navigationItem.update({
      where: { id: item!.id },
      data: { labelEn: item!.labelEn },
    })
  })
})

test.describe('Admin: Site Settings editing', () => {
  test('edits and saves the company tagline', async ({ page }) => {
    await login(page)
    await goto(page, '/admin/settings')

    const before = await prisma.siteSettings.findUnique({ where: { id: 'singleton' } })
    expect(before).not.toBeNull()
    const marker = `E2E Tagline ${Date.now()}`

    await typeFirst(page, 'input[name="taglineEn"]', marker)
    // The redirect target is the same URL we started on, so neither
    // networkidle nor the input's own (possibly just-typed, unsaved) value
    // reliably signals the server round-trip is done (see admin-flows.spec.ts
    // for the same class of race). Wait for the actual POST response instead.
    await Promise.all([
      page.waitForResponse(
        (res) => res.request().method() === 'POST' && res.url().includes('/admin/settings'),
      ),
      page.getByRole('button', { name: /save/i }).first().click(),
    ])

    const updated = await prisma.siteSettings.findUnique({ where: { id: 'singleton' } })
    expect(updated?.taglineEn).toBe(marker)

    // Restore original value.
    await prisma.siteSettings.update({
      where: { id: 'singleton' },
      data: { taglineEn: before!.taglineEn },
    })
  })
})

test.describe('Admin: About page editing', () => {
  test('edits and saves the About page title', async ({ page }) => {
    await login(page)
    await goto(page, '/admin/about')

    const before = await prisma.aboutPage.findUnique({ where: { id: 'singleton' } })
    expect(before).not.toBeNull()
    const marker = `E2E About Title ${Date.now()}`

    await typeFirst(page, 'input[name="titleEn"]', marker)
    await Promise.all([
      page.waitForResponse(
        (res) => res.request().method() === 'POST' && res.url().includes('/admin/about'),
      ),
      page.getByRole('button', { name: /save/i }).first().click(),
    ])

    const updated = await prisma.aboutPage.findUnique({ where: { id: 'singleton' } })
    expect(updated?.titleEn).toBe(marker)

    await prisma.aboutPage.update({
      where: { id: 'singleton' },
      data: { titleEn: before!.titleEn },
    })
  })
})

test.describe('Admin: Contact submission status', () => {
  test('changes a submission status from the inbox', async ({ page }) => {
    const email = `e2e-contact-${Date.now()}@example.com`
    const submission = await prisma.contactSubmission.create({
      data: { name: 'E2E Contact', email, message: 'E2E test message for status change.' },
    })

    await login(page)
    await goto(page, `/admin/contact-submissions/thread/${encodeURIComponent(email)}`)
    await page.locator('select[name="status"]').selectOption('in_review')
    await page.waitForTimeout(500)

    const updated = await prisma.contactSubmission.findUnique({ where: { id: submission.id } })
    expect(updated?.status).toBe('in_review')

    await prisma.contactSubmission.delete({ where: { id: submission.id } })
  })
})

test.describe('Admin: Media library loads', () => {
  test('the media library page renders without error', async ({ page }) => {
    await login(page)
    await goto(page, '/admin/media')
    await expect(page.getByRole('heading', { name: /media/i }).first()).toBeVisible()
  })
})
