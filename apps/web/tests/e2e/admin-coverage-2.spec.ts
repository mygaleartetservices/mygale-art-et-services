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

test.describe('Admin: Redirect editing', () => {
  const fromPath = `/e2e-redirect-${Date.now()}`

  test('creates, then edits a redirect', async ({ page }) => {
    await login(page)
    await goto(page, '/admin/redirects/new')
    await typeFirst(page, 'input[name="fromPath"]', fromPath)
    await page.locator('input[name="toPath"]').fill('/about')
    await page.getByRole('button', { name: 'Create Redirect' }).click()
    await page.waitForURL('**/admin/redirects', { timeout: 15_000 })

    const created = await prisma.redirect.findUnique({ where: { fromPath } })
    expect(created).not.toBeNull()

    await goto(page, `/admin/redirects/${created!.id}/edit`)
    const toPathField = page.locator('input[name="toPath"]')
    await toPathField.click()
    await toPathField.fill('/contact')
    await Promise.all([
      page.waitForResponse(
        (res) => res.request().method() === 'POST' && res.url().includes('/admin/redirects'),
      ),
      page.getByRole('button', { name: /save/i }).click(),
    ])

    const updated = await prisma.redirect.findUnique({ where: { id: created!.id } })
    expect(updated?.toPath).toBe('/contact')
  })

  test.afterAll(async () => {
    await prisma.redirect.deleteMany({ where: { fromPath } })
  })
})

test.describe('Admin: Social link editing', () => {
  const label = `E2E Social ${Date.now()}`

  test('creates, then edits a social link', async ({ page }) => {
    await login(page)
    await goto(page, '/admin/social-links/new')
    await page.locator('select[name="platform"]').selectOption('X')
    await typeFirst(page, 'input[name="label"]', label)
    await page.locator('input[name="url"]').fill('https://x.com/example')
    await page.getByRole('button', { name: 'Add Social Link' }).click()
    await page.waitForURL('**/admin/social-links', { timeout: 15_000 })

    const created = await prisma.socialLink.findFirst({ where: { label } })
    expect(created).not.toBeNull()

    await goto(page, `/admin/social-links/${created!.id}/edit`)
    const urlField = page.locator('input[name="url"]')
    await urlField.click()
    await urlField.fill('https://x.com/example-updated')
    await Promise.all([
      page.waitForResponse(
        (res) => res.request().method() === 'POST' && res.url().includes('/admin/social-links'),
      ),
      page.getByRole('button', { name: /save/i }).click(),
    ])

    const updated = await prisma.socialLink.findUnique({ where: { id: created!.id } })
    expect(updated?.url).toBe('https://x.com/example-updated')
  })

  test.afterAll(async () => {
    await prisma.socialLink.deleteMany({ where: { label } })
  })
})

test.describe('Admin: Blog post editing', () => {
  const slug = `e2e-edit-post-${Date.now()}`

  test('creates, then edits a blog post', async ({ page }) => {
    await login(page)
    await goto(page, '/admin/blog/new')
    await typeFirst(page, 'input[name="title"]', 'E2E Edit Test Post')
    await page.locator('input[name="slug"]').fill(slug)
    await page.locator('textarea[name="excerpt"]').fill('E2E excerpt.')
    await page.locator('textarea[name="content"]').fill('# E2E\n\nOriginal content.')
    await page.locator('input[name="seoTitle"]').fill('E2E SEO Title')
    await page.locator('input[name="seoDescription"]').fill('E2E SEO description.')
    await page.getByRole('button', { name: 'Create Post' }).click()
    await page.waitForURL('**/admin/blog', { timeout: 30_000 })

    const created = await prisma.blogPost.findUnique({ where: { slug } })
    expect(created).not.toBeNull()

    await goto(page, `/admin/blog/${created!.id}/edit`)
    const excerptField = page.locator('textarea[name="excerpt"]')
    await excerptField.click()
    await excerptField.fill('E2E excerpt (edited).')
    await Promise.all([
      page.waitForResponse(
        (res) =>
          res.request().method() === 'POST' && res.url().includes(`/admin/blog/${created!.id}`),
      ),
      page.getByRole('button', { name: 'Save Changes' }).click(),
    ])

    const updated = await prisma.blogPost.findUnique({ where: { id: created!.id } })
    expect(updated?.excerpt).toBe('E2E excerpt (edited).')
  })

  test.afterAll(async () => {
    await prisma.blogPost.deleteMany({ where: { slug } })
  })
})

test.describe('Admin: Department deletion clears assignment', () => {
  test('deletes a department and its job role, unassigning any employee', async ({ page }) => {
    const dept = await prisma.department.create({ data: { name: `E2E Delete Dept ${Date.now()}` } })
    const role = await prisma.jobRole.create({
      data: { departmentId: dept.id, name: 'E2E Delete Role' },
    })
    const employee = await prisma.user.create({
      data: {
        name: 'E2E Delete Employee',
        email: `e2e-delete-dept-${Date.now()}@example.com`,
        passwordHash: 'x',
        role: 'USER',
        active: true,
        departmentId: dept.id,
        jobRoleId: role.id,
      },
    })

    await login(page)
    await goto(page, '/admin/departments')
    const card = page.locator('div.rounded-xl', { hasText: dept.name })
    await card.getByRole('button', { name: 'Delete Department' }).click()
    await expect(page.getByText(dept.name)).toHaveCount(0, { timeout: 15_000 })

    const deletedDept = await prisma.department.findUnique({ where: { id: dept.id } })
    expect(deletedDept).toBeNull()

    const updatedEmployee = await prisma.user.findUnique({ where: { id: employee.id } })
    expect(updatedEmployee?.departmentId).toBeNull()
    expect(updatedEmployee?.jobRoleId).toBeNull()

    await prisma.user.deleteMany({ where: { id: employee.id } })
  })
})

test.describe('Admin: Blog category deletion', () => {
  test('deletes a blog category', async ({ page }) => {
    const categoryName = `E2E Delete Category ${Date.now()}`
    await login(page)
    await goto(page, '/admin/blog-categories')
    await typeFirst(page, 'input[name="nameFr"]', categoryName)
    await page.locator('input[name="nameEn"]').fill(categoryName)
    await page.getByRole('button', { name: 'Add Category' }).click()
    await expect(page.getByText(categoryName).first()).toBeVisible({ timeout: 15_000 })

    const created = await prisma.blogCategory.findFirst({ where: { nameFr: categoryName } })
    expect(created).not.toBeNull()

    const row = page.locator('tr', { hasText: categoryName })
    await row.getByRole('button', { name: 'Delete' }).click()
    await expect(page.locator('tr', { hasText: categoryName })).toHaveCount(0, { timeout: 15_000 })

    const deleted = await prisma.blogCategory.findUnique({ where: { id: created!.id } })
    expect(deleted).toBeNull()
  })
})
