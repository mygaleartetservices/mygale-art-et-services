import crypto from 'crypto'
import QRCode from 'qrcode'
import prisma from '@/lib/prisma'

/**
 * The attendance QR is meant to be printed and posted at the entrance, so it
 * must stay valid for a long, admin-configurable period (default 7 days)
 * instead of rotating every minute. The token is an HMAC of a random seed
 * stored in AttendanceQrConfig; it is accepted until
 * rotatedAt + validityHours, or until an admin regenerates it (which draws a
 * new seed and invalidates every previously printed code). Scanning is still
 * required for every check-in/out because the page only offers the button
 * when the URL carries a valid token.
 */
export const DEFAULT_QR_VALIDITY_HOURS = 24 * 7
export const MIN_QR_VALIDITY_HOURS = 1
export const MAX_QR_VALIDITY_HOURS = 24 * 365

function getQrSecret(): string {
  // Set ATTENDANCE_QR_SECRET explicitly in production; the others are
  // fallbacks so local dev never breaks for lack of a dedicated env var.
  return (
    process.env.ATTENDANCE_QR_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    process.env.DATABASE_URL ||
    'attendance-qr-dev-fallback-secret'
  )
}

function computeToken(seed: string): string {
  return crypto.createHmac('sha256', getQrSecret()).update(seed).digest('hex').slice(0, 24)
}

function timingSafeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)
  if (bufA.length !== bufB.length) return false
  return crypto.timingSafeEqual(bufA, bufB)
}

/** Loads the singleton config, creating it on first use. */
export async function getQrConfig() {
  const existing = await prisma.attendanceQrConfig.findUnique({ where: { id: 'default' } })
  if (existing) return existing
  try {
    return await prisma.attendanceQrConfig.create({
      data: { id: 'default', tokenSeed: crypto.randomBytes(16).toString('hex') },
    })
  } catch {
    // Lost a creation race — read the winner's row.
    return await prisma.attendanceQrConfig.findUniqueOrThrow({ where: { id: 'default' } })
  }
}

export function qrExpiresAt(config: { rotatedAt: Date; validityHours: number }): Date {
  return new Date(config.rotatedAt.getTime() + config.validityHours * 3600 * 1000)
}

export async function getAttendanceQrState() {
  const config = await getQrConfig()
  const expiresAt = qrExpiresAt(config)
  return {
    token: computeToken(config.tokenSeed),
    expiresAt,
    expired: expiresAt.getTime() <= Date.now(),
    validityHours: config.validityHours,
    rotatedAt: config.rotatedAt,
  }
}

/** True only if `token` is the current, unexpired QR token. */
export async function verifyAttendanceToken(token: string | null | undefined): Promise<boolean> {
  if (!token) return false
  const state = await getAttendanceQrState()
  if (state.expired) return false
  return timingSafeEqual(token, state.token)
}

/** Why a given token (or lack of one) is not usable — drives clearer UI messages. */
export async function diagnoseAttendanceToken(
  token: string | null | undefined,
): Promise<'ok' | 'missing' | 'expired' | 'invalid'> {
  if (!token) return 'missing'
  const state = await getAttendanceQrState()
  if (!timingSafeEqual(token, state.token)) return 'invalid'
  return state.expired ? 'expired' : 'ok'
}

/** Draws a new seed (invalidating all printed codes) and restarts the validity period. */
export async function regenerateAttendanceQr(actorId: string, validityHours?: number) {
  await getQrConfig()
  return prisma.attendanceQrConfig.update({
    where: { id: 'default' },
    data: {
      tokenSeed: crypto.randomBytes(16).toString('hex'),
      rotatedAt: new Date(),
      updatedById: actorId,
      ...(validityHours ? { validityHours } : {}),
    },
  })
}

/** Base attendance page URL, without a token — for display/informational text only. */
export function getAttendanceBaseUrl(): string {
  const base = process.env.FRONTEND_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000'
  return `${base.replace(/\/$/, '')}/admin/my-attendance`
}

/** The full check-in URL, with the current token attached. */
export async function getAttendanceCheckInUrl(): Promise<string> {
  const { token } = await getAttendanceQrState()
  return `${getAttendanceBaseUrl()}?t=${token}`
}

export async function generateAttendanceQrDataUrl(): Promise<string> {
  return QRCode.toDataURL(await getAttendanceCheckInUrl(), {
    errorCorrectionLevel: 'M',
    margin: 2,
    width: 640,
  })
}
