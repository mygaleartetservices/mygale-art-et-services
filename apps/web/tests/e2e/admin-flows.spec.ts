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

/**
 * .fill() on the first field interacted with on a freshly-loaded page is
 * unreliable in this environment (confirmed reproducible on both controlled
 * and uncontrolled inputs, across unrelated pages) — real keystrokes via
 * pressSequentially work reliably. Use this for the first field per page;
 * .fill() is fine for every field after that.
 */
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

test.describe('Admin: Services CRUD', () => {
  const slugStamp = `e2e-test-service-${Date.now()}`

  test('creates a service with a section', async ({ page }) => {
    await login(page)
    await goto(page, '/admin/services/new')

    await typeFirst(page, 'input[name="titleFr"]', 'Service Test E2E')
    await page.locator('input[name="titleEn"]').fill('E2E Test Service')
    await page.locator('input[name="slug"]').fill(slugStamp)
    await page.locator('textarea[name="summaryFr"]').fill('Résumé de test E2E.')
    await page.locator('textarea[name="summaryEn"]').fill('E2E test summary.')

    // Add one bullet-list section
    await page.getByRole('button', { name: '+ Add section' }).click()
    await page.getByTestId('section-title-fr-0').fill('Titre section')
    await page.getByTestId('section-title-en-0').fill('Section title')

    await page.getByRole('button', { name: 'Create Service' }).click()
    await page.waitForURL('**/admin/services', { timeout: 15_000 })

    const created = await prisma.service.findUnique({
      where: { slug: slugStamp },
      include: { sections: true },
    })
    expect(created).not.toBeNull()
    expect(created?.titleFr).toBe('Service Test E2E')
    expect(created?.published).toBe(true)
    expect(created?.sections.length).toBe(1)

    await expect(page.locator('table').getByText('Service Test E2E')).toBeVisible()
  })

  test('edits the service and records a revision', async ({ page }) => {
    await login(page)
    const service = await prisma.service.findUnique({ where: { slug: slugStamp } })
    expect(service).not.toBeNull()

    const revisionsBefore = await prisma.revision.count({
      where: { entityType: 'Service', entityId: service!.id },
    })

    await goto(page, `/admin/services/${service!.id}/edit`)
    const titleField = page.locator('input[name="titleFr"]')
    await titleField.click()
    await titleField.clear()
    await titleField.pressSequentially('Service Test E2E (modifié)', { delay: 5 })
    await page.getByRole('button', { name: 'Save Changes' }).click()
    await page.waitForURL('**/admin/services', { timeout: 15_000 })

    const updated = await prisma.service.findUnique({ where: { id: service!.id } })
    expect(updated?.titleFr).toBe('Service Test E2E (modifié)')

    const revisionsAfter = await prisma.revision.count({
      where: { entityType: 'Service', entityId: service!.id },
    })
    expect(revisionsAfter).toBeGreaterThan(revisionsBefore)
  })

  test('unpublishes, previews as draft, then republishes', async ({ page }) => {
    await login(page)
    const service = await prisma.service.findUnique({ where: { slug: slugStamp } })

    await goto(page, '/admin/services')
    const row = page.locator('tr', { hasText: 'Service Test E2E' })
    await row.getByRole('button', { name: 'Unpublish' }).click()
    // Wait for the actual server-confirmed UI state, not just network-idle
    // (the redirect target here is the same URL we're already on, which can
    // otherwise race ahead of the mutation actually completing server-side).
    await expect(row.getByText('Draft')).toBeVisible({ timeout: 15_000 })

    const unpublished = await prisma.service.findUnique({ where: { id: service!.id } })
    expect(unpublished?.published).toBe(false)

    // Public page should 404 now
    const publicResp = await page.request.get(`http://localhost:3000/services/${slugStamp}`)
    expect(publicResp.status()).toBe(404)

    // Preview should work while authenticated
    await goto(page, `/services/${slugStamp}?preview=1`)
    await expect(page.getByText('Preview mode')).toBeVisible()

    // Republish
    await goto(page, '/admin/services')
    const row2 = page.locator('tr', { hasText: 'Service Test E2E' })
    await row2.getByRole('button', { name: 'Publish' }).click()
    await expect(row2.getByText('Published')).toBeVisible({ timeout: 15_000 })

    const republished = await prisma.service.findUnique({ where: { id: service!.id } })
    expect(republished?.published).toBe(true)
  })

  test('soft-deletes and restores the service', async ({ page }) => {
    await login(page)
    const service = await prisma.service.findUnique({ where: { slug: slugStamp } })

    await goto(page, '/admin/services')
    const row = page.locator('tr', { hasText: 'Service Test E2E' })
    await row.getByRole('button', { name: 'Delete' }).click()
    // The row leaves the Active list once the soft-delete has actually committed.
    await expect(page.locator('tr', { hasText: 'Service Test E2E' })).toHaveCount(0, {
      timeout: 15_000,
    })

    const deleted = await prisma.service.findUnique({ where: { id: service!.id } })
    expect(deleted?.deletedAt).not.toBeNull()

    await goto(page, '/admin/services?tab=trash')
    await expect(page.getByText('Service Test E2E')).toBeVisible()
    await page.getByRole('button', { name: 'Restore' }).click()
    // restoreService redirects to the active list (not back to ?tab=trash). The
    // row is already visible on the trash page pre-click, so asserting on text
    // alone would pass instantly against the stale DOM before the mutation and
    // navigation actually complete — wait for the URL change first instead.
    await page.waitForURL((url) => url.pathname === '/admin/services' && !url.search, {
      timeout: 15_000,
    })
    await expect(page.locator('tr', { hasText: 'Service Test E2E' })).toBeVisible({
      timeout: 15_000,
    })

    const restored = await prisma.service.findUnique({ where: { id: service!.id } })
    expect(restored?.deletedAt).toBeNull()
  })

  test.afterAll(async () => {
    // Cleanup: fully remove the test service and its sections/revisions.
    const service = await prisma.service.findUnique({ where: { slug: slugStamp } })
    if (service) {
      await prisma.serviceSection.deleteMany({ where: { serviceId: service.id } })
      await prisma.revision.deleteMany({ where: { entityType: 'Service', entityId: service.id } })
      await prisma.service.delete({ where: { id: service.id } })
    }
  })
})

test.describe('Admin: Homepage + About content edits', () => {
  test('edits the About homepage section and sees it reflected on the homepage', async ({
    page,
  }) => {
    await login(page)
    const section = await prisma.homepageSection.findUnique({ where: { key: 'about' } })
    expect(section).not.toBeNull()
    const original = section!.bodyFr

    await goto(page, `/admin/homepage/${section!.id}/edit`)
    const marker = `E2E marker ${Date.now()}`
    // The public homepage renders whichever language the viewer's NEXT_LOCALE
    // cookie selects (pinned to English for this whole suite), so the marker
    // needs to land in both fields for the visibility check below to be
    // locale-independent.
    await typeFirst(page, 'textarea[name="bodyFr"]', marker)
    await page.locator('textarea[name="bodyEn"]').fill(marker)
    await page.getByRole('button', { name: 'Save Changes' }).click()
    await page.waitForURL('**/admin/homepage', { timeout: 15_000 })

    const updated = await prisma.homepageSection.findUnique({ where: { key: 'about' } })
    expect(updated?.bodyFr).toBe(marker)
    expect(updated?.bodyEn).toBe(marker)

    await goto(page, '/')
    await expect(page.getByText(marker)).toBeVisible()

    // Restore original content so the seed stays representative.
    await prisma.homepageSection.update({
      where: { key: 'about' },
      data: { bodyFr: original, bodyEn: section!.bodyEn },
    })
  })
})

test.describe('Admin: Social Links CRUD', () => {
  const label = `E2E Test Link ${Date.now()}`

  test('creates, then deletes a social link', async ({ page }) => {
    await login(page)
    await goto(page, '/admin/social-links/new')
    await page.locator('select[name="platform"]').selectOption('X')
    await typeFirst(page, 'input[name="label"]', label)
    await page.locator('input[name="url"]').fill('https://x.com/example')
    await page.getByRole('button', { name: 'Add Social Link' }).click()
    await page.waitForURL('**/admin/social-links', { timeout: 15_000 })

    const created = await prisma.socialLink.findFirst({ where: { label } })
    expect(created).not.toBeNull()
    await expect(page.locator('table').getByText(label)).toBeVisible()

    const row = page.locator('tr', { hasText: label })
    await row.getByRole('button', { name: 'Delete' }).click()
    await expect(page.locator('tr', { hasText: label })).toHaveCount(0, { timeout: 15_000 })

    const afterDelete = await prisma.socialLink.findUnique({ where: { id: created!.id } })
    expect(afterDelete?.deletedAt).not.toBeNull()
  })
})

test.describe('Admin: Redirects', () => {
  const fromPath = `/e2e-old-page-${Date.now()}`

  test('creates a redirect', async ({ page }) => {
    await login(page)
    await goto(page, '/admin/redirects/new')
    await typeFirst(page, 'input[name="fromPath"]', fromPath)
    await page.locator('input[name="toPath"]').fill('/about')
    await page.getByRole('button', { name: 'Create Redirect' }).click()
    await page.waitForURL('**/admin/redirects', { timeout: 15_000 })

    const created = await prisma.redirect.findUnique({ where: { fromPath } })
    expect(created).not.toBeNull()
    expect(created?.active).toBe(true)

    await prisma.redirect.delete({ where: { fromPath } })
  })
})

test.describe('Admin: Blog categories + posts', () => {
  const categoryName = `E2E Category ${Date.now()}`
  const postSlug = `e2e-test-post-${Date.now()}`

  test('creates a blog category', async ({ page }) => {
    await login(page)
    await goto(page, '/admin/blog-categories')
    await typeFirst(page, 'input[name="nameFr"]', categoryName)
    await page.locator('input[name="nameEn"]').fill(categoryName)
    await page.getByRole('button', { name: 'Add Category' }).click()
    await expect(page.getByText(categoryName).first()).toBeVisible({ timeout: 15_000 })

    const created = await prisma.blogCategory.findFirst({ where: { nameFr: categoryName } })
    expect(created).not.toBeNull()
  })

  test('creates and publishes a blog post with that category', async ({ page }) => {
    test.setTimeout(60_000)
    await login(page)
    const category = await prisma.blogCategory.findFirst({ where: { nameFr: categoryName } })

    await goto(page, '/admin/blog/new')
    await typeFirst(page, 'input[name="title"]', 'E2E Test Post')
    await page.locator('input[name="slug"]').fill(postSlug)
    await page.locator('textarea[name="excerpt"]').fill('E2E excerpt.')
    await page.locator('textarea[name="content"]').fill('# E2E\n\nTest content.')
    await page.locator('select[name="categoryId"]').selectOption(category!.id)
    await page.locator('input[name="seoTitle"]').fill('E2E SEO Title')
    await page.locator('input[name="seoDescription"]').fill('E2E SEO description.')
    await page.locator('input[name="published"]').check()
    await page.getByRole('button', { name: 'Create Post' }).click()
    await page.waitForURL('**/admin/blog', { timeout: 30_000 })

    const created = await prisma.blogPost.findUnique({ where: { slug: postSlug } })
    expect(created).not.toBeNull()
    expect(created?.published).toBe(true)
    expect(created?.categoryId).toBe(category!.id)

    await goto(page, `/blog/${postSlug}`)
    await expect(page.locator('h1')).toContainText('E2E Test Post')
    await expect(page.getByText(categoryName)).toBeVisible()
  })

  test.afterAll(async () => {
    await prisma.blogPost.deleteMany({ where: { slug: postSlug } })
    await prisma.blogCategory.deleteMany({ where: { nameFr: categoryName } })
  })
})

test.describe('Admin: Users management', () => {
  const email = `e2e-test-user-${Date.now()}@example.com`

  test('creates an EDITOR user, then deactivates them', async ({ page }) => {
    await login(page)
    await goto(page, '/admin/users/new')
    await typeFirst(page, 'input[name="name"]', 'E2E Test Editor')
    await page.locator('input[name="email"]').fill(email)
    await page.locator('input[name="password"]').fill('TestPassword123!')
    await page.locator('select[name="role"]').selectOption('EDITOR')
    await page.getByRole('button', { name: 'Create User' }).click()
    await page.waitForURL('**/admin/users', { timeout: 15_000 })

    const created = await prisma.user.findUnique({ where: { email } })
    expect(created).not.toBeNull()
    expect(created?.role).toBe('EDITOR')
    expect(created?.active).toBe(true)

    await goto(page, `/admin/users/${created!.id}/edit`)
    await page.locator('input[name="active"]').uncheck()
    await page.getByRole('button', { name: 'Save Changes' }).click()
    await page.waitForURL('**/admin/users', { timeout: 15_000 })

    const deactivated = await prisma.user.findUnique({ where: { id: created!.id } })
    expect(deactivated?.active).toBe(false)
  })

  test.afterAll(async () => {
    await prisma.user.deleteMany({ where: { email } })
  })
})

test.describe('Admin: Audit log captures activity', () => {
  test('shows recent activity', async ({ page }) => {
    await login(page)
    await goto(page, '/admin/audit-log')
    const rows = page.locator('tbody tr')
    await expect(rows.first()).toBeVisible()
    const count = await rows.count()
    expect(count).toBeGreaterThan(0)
  })
})
