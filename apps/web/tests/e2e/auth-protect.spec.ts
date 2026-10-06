import { test, expect } from '@playwright/test'

// requireRole() (src/lib/auth.ts) carries the originally requested admin URL
// through as ?next=..., so a QR check-in link (or any deep link) opened
// while logged out comes right back after signing in instead of stranding
// the visitor on the bare /admin dashboard — see signInWithPassword in
// src/app/auth/actions.ts.
test('Auth: visiting /admin without a session redirects to /login, preserving the destination', async ({
  page,
}) => {
  await page.goto('http://localhost:3000/admin')
  await expect(page).toHaveURL(/\/login\?next=%2Fadmin$/)
})

test('Auth: visiting /admin/services without a session redirects to /login, preserving the destination', async ({
  page,
}) => {
  await page.goto('http://localhost:3000/admin/services')
  await expect(page).toHaveURL(/\/login\?next=%2Fadmin%2Fservices$/)
})
