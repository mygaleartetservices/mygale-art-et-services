import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import {
  ATTENDANCE_QR_WINDOW_SECONDS,
  generateAttendanceQrDataUrl,
  getAttendanceCheckInUrl,
} from '@/lib/attendanceQr'

const ROLE_RANK: Record<string, number> = {
  SUPER_ADMIN: 5,
  ADMIN: 4,
  EDITOR: 3,
  STAFF: 2,
  VIEWER: 1,
  USER: 0,
}

export const runtime = 'nodejs'

/**
 * Polled by the QR display page to keep the on-screen code live: the token
 * embedded in it rotates every ATTENDANCE_QR_WINDOW_SECONDS, so a stale
 * client-rendered image would stop working within a minute or two.
 */
export async function GET() {
  const user = await getCurrentUser()
  if (!user || !user.role || ROLE_RANK[user.role] < ROLE_RANK.ADMIN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const [qrDataUrl, url] = await Promise.all([
    generateAttendanceQrDataUrl(),
    Promise.resolve(getAttendanceCheckInUrl()),
  ])

  return NextResponse.json(
    { qrDataUrl, url, refreshMs: ATTENDANCE_QR_WINDOW_SECONDS * 1000 },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
