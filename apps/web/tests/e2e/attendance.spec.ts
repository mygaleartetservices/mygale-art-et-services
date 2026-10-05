import { test, expect, type Page } from '@playwright/test'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

const prisma = new PrismaClient()

/**
 * Mirrors the rotating-token scheme in src/lib/attendanceQr.ts: checking in
 * or out now requires a token proving a recent QR scan, not just being
 * logged in. Duplicated here (rather than imported) to keep this test file
 * self-contained, matching its existing style of local helpers.
 */
function attendanceToken(minutesAgo = 0): string {
  const secret =
    process.env.ATTENDANCE_QR_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    process.env.DATABASE_URL ||
    'attendance-qr-dev-fallback-secret'
  const windowIndex = Math.floor(Date.now() / 1000 / 60) - minutesAgo
  return crypto.createHmac('sha256', secret).update(String(windowIndex)).digest('hex').slice(0, 20)
}

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

async function login(page: Page, email: string, password: string) {
  // The site defaults to French when no locale cookie is set yet; pin English
  // so these assertions (written against the English strings) stay deterministic.
  await page
    .context()
    .addCookies([{ name: 'NEXT_LOCALE', value: 'en', domain: 'localhost', path: '/' }])
  await goto(page, '/login')
  await page.locator('#login-email').click()
  await page.locator('#login-email').pressSequentially(email, { delay: 5 })
  await page.locator('#login-password').click()
  await page.locator('#login-password').pressSequentially(password, { delay: 5 })
  await page.getByRole('button', { name: 'Sign in' }).click()
  await page.waitForURL('**/admin')
}

/** Creates an active employee account directly in the DB (bypassing the UI) so tests can log in as them without going through the admin form each time. */
async function createEmployee(opts: {
  email: string
  departmentId?: string | null
  jobRoleId?: string | null
}) {
  const passwordHash = await bcrypt.hash('TestPassword123!', 10)
  return prisma.user.create({
    data: {
      name: 'E2E Employee',
      email: opts.email,
      passwordHash,
      role: 'USER',
      active: true,
      departmentId: opts.departmentId ?? null,
      jobRoleId: opts.jobRoleId ?? null,
    },
  })
}

test.beforeAll(() => {
  test.skip(!ADMIN_EMAIL || !ADMIN_PASSWORD, 'E2E_ADMIN_EMAIL/E2E_ADMIN_PASSWORD not set')
})

test.afterAll(async () => {
  await prisma.$disconnect()
})

test.describe('Admin: Departments and job roles', () => {
  const deptName = `E2E Department ${Date.now()}`
  const roleName = `E2E Role ${Date.now()}`

  test('creates a department and a job role inside it', async ({ page }) => {
    await login(page, ADMIN_EMAIL!, ADMIN_PASSWORD!)
    await goto(page, '/admin/departments')

    await typeFirst(page, 'input[name="name"]', deptName)
    await page.getByRole('button', { name: 'Add Department' }).click()
    await expect(page.getByText(deptName)).toBeVisible({ timeout: 15_000 })

    const department = await prisma.department.findUnique({ where: { name: deptName } })
    expect(department).not.toBeNull()

    await goto(page, '/admin/departments')
    const card = page.locator('div.rounded-xl', { hasText: deptName })
    await card.locator('input[name="name"]').fill(roleName)
    await card.getByRole('button', { name: 'Add Role' }).click()
    await expect(page.getByText(roleName)).toBeVisible({ timeout: 15_000 })

    const jobRole = await prisma.jobRole.findFirst({
      where: { name: roleName, departmentId: department!.id },
    })
    expect(jobRole).not.toBeNull()
  })

  test.afterAll(async () => {
    const department = await prisma.department.findUnique({ where: { name: deptName } })
    if (department) {
      await prisma.user.updateMany({
        where: { departmentId: department.id },
        data: { departmentId: null, jobRoleId: null },
      })
      await prisma.jobRole.deleteMany({ where: { departmentId: department.id } })
      await prisma.department.delete({ where: { id: department.id } })
    }
  })
})

test.describe('Admin: Employee creation with department/role assignment', () => {
  const email = `e2e-employee-${Date.now()}@example.com`
  let departmentId: string

  test.beforeAll(async () => {
    const department = await prisma.department.create({
      data: { name: `E2E Emp Dept ${Date.now()}` },
    })
    departmentId = department.id
    await prisma.jobRole.create({ data: { departmentId, name: 'E2E Job Role' } })
  })

  test('admin creates an employee assigned to a department and role', async ({ page }) => {
    await login(page, ADMIN_EMAIL!, ADMIN_PASSWORD!)
    await goto(page, '/admin/users/new')

    await typeFirst(page, 'input[name="name"]', 'E2E New Employee')
    await page.locator('input[name="email"]').fill(email)
    await page.locator('input[name="password"]').fill('TestPassword123!')
    await page.locator('select[name="role"]').selectOption('USER')
    await page.locator('select[name="departmentId"]').selectOption(departmentId)
    await page.locator('select[name="jobRoleId"]').selectOption({ label: 'E2E Job Role' })
    await page.getByRole('button', { name: 'Create User' }).click()
    await page.waitForURL('**/admin/users', { timeout: 15_000 })

    const created = await prisma.user.findUnique({ where: { email } })
    expect(created).not.toBeNull()
    expect(created?.departmentId).toBe(departmentId)
    expect(created?.active).toBe(true)
  })

  test.afterAll(async () => {
    await prisma.user.deleteMany({ where: { email } })
    await prisma.jobRole.deleteMany({ where: { departmentId } })
    await prisma.attendanceWindow.deleteMany({ where: { departmentId } })
    await prisma.department.delete({ where: { id: departmentId } })
  })
})

test.describe('Employee attendance check-in', () => {
  const onTimeEmail = `e2e-attendance-ontime-${Date.now()}@example.com`
  const lateEmail = `e2e-attendance-late-${Date.now()}@example.com`
  let departmentId: string

  test.beforeAll(async () => {
    const department = await prisma.department.create({
      data: { name: `E2E Attendance Dept ${Date.now()}` },
    })
    departmentId = department.id
    await createEmployee({ email: onTimeEmail, departmentId })
    await createEmployee({ email: lateEmail, departmentId })
  })

  test('arrival on or before the configured window end is ON TIME', async ({ page }) => {
    // Window end set far in the future so "now" is always <= it.
    await prisma.attendanceWindow.upsert({
      where: { departmentId },
      create: { departmentId, windowStartMinutes: 0, windowEndMinutes: 23 * 60 + 59 },
      update: { windowStartMinutes: 0, windowEndMinutes: 23 * 60 + 59 },
    })

    await login(page, onTimeEmail, 'TestPassword123!')
    await goto(page, `/admin/my-attendance?t=${attendanceToken()}`)
    await page.getByRole('button', { name: 'Scan Attendance QR' }).click()
    await expect(page.getByText('Attendance recorded successfully.')).toBeVisible({
      timeout: 15_000,
    })
    await expect(page.getByText('Status: ON TIME')).toBeVisible()

    const user = await prisma.user.findUnique({ where: { email: onTimeEmail } })
    const record = await prisma.attendance.findFirst({ where: { userId: user!.id } })
    expect(record?.status).toBe('ON_TIME')
    expect(record?.arrivalAt).not.toBeNull()
  })

  test('arrival after the configured window end is LATE', async ({ page }) => {
    // Window end set far in the past so "now" is always after it.
    await prisma.attendanceWindow.upsert({
      where: { departmentId },
      create: { departmentId, windowStartMinutes: 0, windowEndMinutes: 1 },
      update: { windowStartMinutes: 0, windowEndMinutes: 1 },
    })

    await login(page, lateEmail, 'TestPassword123!')
    await goto(page, `/admin/my-attendance?t=${attendanceToken()}`)
    await page.getByRole('button', { name: 'Scan Attendance QR' }).click()
    await expect(page.getByText('Attendance recorded successfully.')).toBeVisible({
      timeout: 15_000,
    })
    await expect(page.getByText('Status: LATE')).toBeVisible()

    const user = await prisma.user.findUnique({ where: { email: lateEmail } })
    const record = await prisma.attendance.findFirst({ where: { userId: user!.id } })
    expect(record?.status).toBe('LATE')
  })

  test('a repeated scan does not create a duplicate attendance record', async ({ page }) => {
    const user = await prisma.user.findUnique({ where: { email: onTimeEmail } })
    const before = await prisma.attendance.count({ where: { userId: user!.id } })
    expect(before).toBe(1)

    await login(page, onTimeEmail, 'TestPassword123!')
    await goto(page, '/admin/my-attendance')
    // Already recorded today: the page shows the recorded status directly,
    // with no scan button to click again.
    await expect(page.getByText("Today's attendance is recorded.")).toBeVisible()

    const after = await prisma.attendance.count({ where: { userId: user!.id } })
    expect(after).toBe(1)
  })

  test.afterAll(async () => {
    const users = await prisma.user.findMany({ where: { email: { in: [onTimeEmail, lateEmail] } } })
    const userIds = users.map((u) => u.id)
    await prisma.attendance.deleteMany({ where: { userId: { in: userIds } } })
    await prisma.user.deleteMany({ where: { id: { in: userIds } } })
    await prisma.attendanceWindow.deleteMany({ where: { departmentId } })
    await prisma.department.delete({ where: { id: departmentId } })
  })
})

test.describe('Attendance requires a fresh QR scan', () => {
  const email = `e2e-scan-required-${Date.now()}@example.com`

  test.beforeAll(async () => {
    await createEmployee({ email })
  })

  test('visiting the page without a scan shows no check-in button', async ({ page }) => {
    await login(page, email, 'TestPassword123!')
    // No ?t= param — simulates reopening a bookmark or browser history entry
    // while still logged in, without having scanned the QR code.
    await goto(page, '/admin/my-attendance')

    await expect(page.getByRole('button', { name: 'Scan Attendance QR' })).toHaveCount(0)
    await expect(page.getByText(/scan the attendance qr code.*to check in/i)).toBeVisible()
  })

  test('a stale or tampered token is rejected server-side even if submitted directly', async ({
    page,
  }) => {
    await login(page, email, 'TestPassword123!')
    // Load with a currently-valid token so the button renders, then tamper
    // the hidden field to a token from 10 minutes ago (well outside the
    // ~60-120s tolerance) before submitting — this exercises the server
    // action's own check independent of the page's client-visible gating.
    await goto(page, `/admin/my-attendance?t=${attendanceToken()}`)
    await page.evaluate((staleToken) => {
      const input = document.querySelector<HTMLInputElement>('input[name="t"]')
      if (input) input.value = staleToken
    }, attendanceToken(10))
    await page.getByRole('button', { name: 'Scan Attendance QR' }).click()

    await expect(page.getByText(/scan the attendance qr code again/i)).toBeVisible({
      timeout: 10_000,
    })

    const user = await prisma.user.findUnique({ where: { email } })
    const record = await prisma.attendance.findFirst({ where: { userId: user!.id } })
    expect(record).toBeNull()
  })

  test.afterAll(async () => {
    await prisma.user.deleteMany({ where: { email } })
  })
})

test.describe('Attendance window configuration', () => {
  test('rejects an end time that is not after the start time', async ({ page }) => {
    await login(page, ADMIN_EMAIL!, ADMIN_PASSWORD!)
    await goto(page, '/admin/attendance/config')

    // The sidebar's own sign-out <form> renders before <main> in the DOM, so
    // scope to the input names (unique to WindowForm) rather than `form`
    // itself, which would otherwise resolve to that sign-out form first.
    const defaultForm = page
      .locator('form', { has: page.locator('input[name="windowStart"]') })
      .first()
    await defaultForm.locator('input[name="windowStart"]').fill('09:00')
    await defaultForm.locator('input[name="windowEnd"]').fill('08:00')
    await defaultForm.getByRole('button', { name: 'Save Window' }).click()

    await expect(page.getByText('The end time must be after the start time.')).toBeVisible({
      timeout: 10_000,
    })
  })
})

test.describe('Unauthorized access is blocked', () => {
  const email = `e2e-unauthorized-${Date.now()}@example.com`

  test.beforeAll(async () => {
    await createEmployee({ email })
  })

  test('a plain employee account cannot open the attendance dashboard or departments admin', async ({
    page,
  }) => {
    await login(page, email, 'TestPassword123!')

    await goto(page, '/admin/attendance')
    await expect(page.getByText('No access to this section')).toBeVisible()

    await goto(page, '/admin/departments')
    await expect(page.getByText('No access to this section')).toBeVisible()

    // Their own attendance page must still work regardless. (The sidebar
    // also has a "My Attendance" link, so scope to the page heading.)
    await goto(page, '/admin/my-attendance')
    await expect(page.getByRole('heading', { name: 'My Attendance' })).toBeVisible()
  })

  test.afterAll(async () => {
    await prisma.user.deleteMany({ where: { email } })
  })
})

test.describe('Manual attendance correction', () => {
  const email = `e2e-manual-${Date.now()}@example.com`

  test.beforeAll(async () => {
    await createEmployee({ email })
  })

  test('admin adds a missing attendance record with a required reason', async ({ page }) => {
    const user = await prisma.user.findUnique({ where: { email } })
    await login(page, ADMIN_EMAIL!, ADMIN_PASSWORD!)
    await goto(page, '/admin/attendance/correct/new')

    await page.locator('select[name="userId"]').selectOption(user!.id)
    const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Douala' }).format(new Date())
    await page.locator('input[name="date"]').fill(today)
    await page.locator('input[name="arrivalTime"]').fill('08:10')
    await page.locator('textarea[name="note"]').fill('E2E: employee forgot to scan.')
    await page.getByRole('button', { name: 'Add Attendance' }).click()
    await page.waitForURL('**/admin/attendance', { timeout: 15_000 })

    const record = await prisma.attendance.findFirst({ where: { userId: user!.id } })
    expect(record).not.toBeNull()
    expect(record?.source).toBe('MANUAL')
    expect(record?.correctedById).not.toBeNull()
    expect(record?.note).toContain('forgot to scan')
  })

  test.afterAll(async () => {
    const user = await prisma.user.findUnique({ where: { email } })
    if (user) {
      await prisma.attendance.deleteMany({ where: { userId: user.id } })
      await prisma.user.delete({ where: { id: user.id } })
    }
  })
})

test.describe('Employees cannot self-register', () => {
  test('there is no public sign-up route for the admin/employee account system', async ({
    page,
  }) => {
    // Accounts are only created via /admin/users/new by an authenticated
    // Admin (requireRole('ADMIN')) — there is no public registration form.
    const res = await page.request.get('http://localhost:3000/register')
    expect(res.status()).toBe(404)
    const res2 = await page.request.get('http://localhost:3000/signup')
    expect(res2.status()).toBe(404)
  })
})
