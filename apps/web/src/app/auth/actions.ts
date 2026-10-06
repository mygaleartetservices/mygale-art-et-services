'use server'

import crypto from 'crypto'
import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import bcrypt from 'bcryptjs'
import nodemailer from 'nodemailer'
import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { writeAuditLog } from '@/lib/revisions'
import { escapeHtml } from '@/lib/escapeHtml'
import { getClientIp, isRateLimited, rateLimit, recordFailedAttempt } from '@/lib/rateLimit'

const SESSION_TTL_DAYS = 30

// Password-reset links are single-use and short-lived — long enough for
// someone to receive and act on the email, short enough to limit the damage
// if an inbox is compromised later.
const RESET_TOKEN_TTL_MS = 60 * 60_000

// These endpoints aren't credential brute-forcing targets the way /login is
// (the token is a 32-byte random value, and the request form doesn't accept
// a password), but both are still rate-limited to blunt scripted abuse
// (email-bombing an address via the request form, or scripted guesses
// against the reset form).
const PASSWORD_RESET_REQUEST_LIMIT = 5
const PASSWORD_RESET_REQUEST_WINDOW_MS = 60 * 60_000
const PASSWORD_RESET_SUBMIT_LIMIT = 10
const PASSWORD_RESET_SUBMIT_WINDOW_MS = 60 * 60_000

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
  success?: string
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

  redirect(safeAdminRedirect(formData.get('next')))
}

// requireRole() (lib/auth.ts) passes the page an unauthenticated visitor was
// trying to reach back here as `next`, so e.g. a QR check-in link opened
// while logged out still lands on the check-in button after signing in,
// instead of the bare dashboard. Only ever follow it into our own /admin
// tree — formData is attacker-controllable, so without this an open
// redirect (`next=https://evil.example`) would be possible.
function safeAdminRedirect(next: FormDataEntryValue | null): string {
  if (typeof next !== 'string' || !next.startsWith('/admin') || next.startsWith('//')) {
    return '/admin'
  }
  return next
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

// Same message whether or not the email matches an account — a reset form
// that says "no account with that email" is a trivial way to enumerate
// every registered address.
const GENERIC_RESET_REQUEST_MESSAGE =
  "If an account exists for that email, we've sent a password reset link."

export async function requestPasswordReset(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const headerStore = await headers()
  const clientIp = getClientIp(headerStore)
  const rate = rateLimit(
    `password-reset-request:${clientIp}`,
    PASSWORD_RESET_REQUEST_LIMIT,
    PASSWORD_RESET_REQUEST_WINDOW_MS,
  )
  if (!rate.success) {
    return { error: 'Too many requests. Please try again later.' }
  }

  const email = normalizeEmail(formData.get('email'))
  if (!email) {
    return { error: 'Email is required.' }
  }

  const user = await prisma.user.findUnique({ where: { email } })

  // Only accounts that can actually sign in with a password get a reset
  // link — mirrors the same guard signInWithPassword uses.
  if (user && user.role && user.passwordHash && user.active) {
    const token = crypto.randomBytes(32).toString('hex')
    const now = new Date()
    const expiresAt = new Date(now.getTime() + RESET_TOKEN_TTL_MS)

    // Drop any outstanding tokens for this address first, so only the
    // most recently requested link is ever valid.
    await prisma.verification.deleteMany({ where: { identifier: email } })
    await prisma.verification.create({
      data: {
        id: crypto.randomUUID(),
        identifier: email,
        value: token,
        expiresAt,
        createdAt: now,
        updatedAt: now,
      },
    })

    const baseUrl = (
      process.env.FRONTEND_URL ||
      process.env.NEXTAUTH_URL ||
      'http://localhost:3000'
    ).replace(/\/$/, '')
    const resetUrl = `${baseUrl}/reset-password?token=${token}`

    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT),
        secure: true,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      })

      await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: user.email,
        subject: 'Reset your password',
        text: `We received a request to reset your password.\n\nReset it here (expires in 1 hour):\n${resetUrl}\n\nIf you didn't request this, you can ignore this email.`,
        html: `<p>We received a request to reset your password.</p><p><a href="${escapeHtml(resetUrl)}">Reset your password</a> (expires in 1 hour).</p><p>If you didn't request this, you can ignore this email.</p>`,
      })
    } catch (emailError) {
      console.error('[requestPasswordReset] Email send failed:', emailError)
    }

    await writeAuditLog(
      'auth.password_reset_requested',
      { entityType: 'User', entityId: user.id },
      user.id,
    )
  }

  return { success: GENERIC_RESET_REQUEST_MESSAGE }
}

export async function resetPassword(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const headerStore = await headers()
  const clientIp = getClientIp(headerStore)
  const rate = rateLimit(
    `password-reset-submit:${clientIp}`,
    PASSWORD_RESET_SUBMIT_LIMIT,
    PASSWORD_RESET_SUBMIT_WINDOW_MS,
  )
  if (!rate.success) {
    return { error: 'Too many requests. Please try again later.' }
  }

  const token = asString(formData.get('token'))
  const password = asString(formData.get('password'))
  const confirmPassword = asString(formData.get('confirmPassword'))

  if (!token) {
    return { error: 'This password reset link is invalid or has expired.' }
  }
  if (!password || password.length < 8) {
    return { error: 'Password must be at least 8 characters.' }
  }
  if (password !== confirmPassword) {
    return { error: 'Passwords do not match.' }
  }

  const verification = await prisma.verification.findFirst({ where: { value: token } })
  if (!verification || verification.expiresAt <= new Date()) {
    return { error: 'This password reset link is invalid or has expired.' }
  }

  const user = await prisma.user.findUnique({ where: { email: verification.identifier } })
  if (!user || !user.active) {
    return { error: 'This password reset link is invalid or has expired.' }
  }

  const passwordHash = await bcrypt.hash(password, 10)

  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } })
  // The token is single-use; also clear any other outstanding tokens for
  // this address left over from earlier requests.
  await prisma.verification.deleteMany({ where: { identifier: verification.identifier } })
  // A password reset is a strong signal the old sessions may not be trusted
  // (e.g. the account may have been compromised) — sign out everywhere.
  await prisma.session.deleteMany({ where: { userId: user.id } })

  await writeAuditLog('auth.password_reset', { entityType: 'User', entityId: user.id }, user.id)

  return { success: 'Your password has been reset. You can now sign in.' }
}
