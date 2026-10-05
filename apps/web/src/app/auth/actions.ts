'use server'

import crypto from 'crypto'
import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { writeAuditLog } from '@/lib/revisions'
import { getClientIp, isRateLimited, recordFailedAttempt } from '@/lib/rateLimit'

const SESSION_TTL_DAYS = 30

// 10 *failed* attempts per 15 minutes per client IP, to slow down credential
// brute-forcing without locking out legitimate users on a shared IP. Only
// wrong-credential attempts consume this budget (see recordFailedAttempt
// calls below) — a shared office network with many employees signing in
// with correct passwords around the same time never trips it, no matter how
// many of them there are.
const LOGIN_RATE_LIMIT = 10
const LOGIN_RATE_WINDOW_MS = 15 * 60_000

function normalizeEmail(value: FormDataEntryValue | null) {
  return typeof value === 'string' ? value.trim().toLowerCase() : ''
}

function asString(value: FormDataEntryValue | null) {
  return typeof value === 'string' ? value : ''
}

type ActionState = {
  error?: string
}

export async function signInWithPassword(_prevState: ActionState, formData: FormData) {
  const headerStoreForRateLimit = await headers()
  const clientIp = getClientIp(headerStoreForRateLimit)
  const rateLimitKey = `login:${clientIp}`
  if (isRateLimited(rateLimitKey, LOGIN_RATE_LIMIT)) {
    return { error: 'Too many login attempts. Please try again later.' }
  }

  const email = normalizeEmail(formData.get('email'))
  const password = asString(formData.get('password'))

  if (!email || !password) {
    return { error: 'Email and password are required.' }
  }

  const user = await prisma.user.findUnique({
    where: { email },
  })

  // Any account with a role can sign in — which admin pages they can actually
  // see from there is governed by hasPageAccess() (see admin/layout.tsx).
  if (!user || !user.role || !user.passwordHash || !user.active) {
    recordFailedAttempt(rateLimitKey, LOGIN_RATE_LIMIT, LOGIN_RATE_WINDOW_MS)
    return { error: 'Invalid credentials.' }
  }

  let validPassword = false
  try {
    validPassword = await bcrypt.compare(password, user.passwordHash)
  } catch {
    validPassword = false
  }

  if (!validPassword) {
    recordFailedAttempt(rateLimitKey, LOGIN_RATE_LIMIT, LOGIN_RATE_WINDOW_MS)
    return { error: 'Invalid credentials.' }
  }

  const now = new Date()
  const expiresAt = new Date(now.getTime() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000)
  const token = crypto.randomBytes(32).toString('hex')
  const sessionId = crypto.randomUUID()

  const headerStore = await headers()
  const forwardedFor = headerStore.get('x-forwarded-for')
  const ipAddress = forwardedFor ? forwardedFor.split(',')[0]?.trim() : null
  const userAgent = headerStore.get('user-agent')

  await prisma.session.create({
    data: {
      id: sessionId,
      token,
      userId: user.id,
      expiresAt,
      createdAt: now,
      updatedAt: now,
      ipAddress,
      userAgent,
    },
  })

  const cookieStore = await cookies()
  cookieStore.set('authjs.session-token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    expires: expiresAt,
  })

  await writeAuditLog('auth.login', { entityType: 'User', entityId: user.id }, user.id)

  redirect('/admin')
}

export async function signOut() {
  const user = await getCurrentUser()
  const cookieStore = await cookies()
  const token = cookieStore.get('authjs.session-token')?.value

  if (token) {
    await prisma.session.deleteMany({ where: { token } })
  }
  cookieStore.delete('authjs.session-token')

  if (user) {
    await writeAuditLog('auth.logout', { entityType: 'User', entityId: user.id }, user.id)
  }

  redirect('/login')
}
