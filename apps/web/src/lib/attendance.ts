import prisma from '@/lib/prisma'
import { writeAuditLog } from '@/lib/revisions'
import { minutesOfDay, calendarDate } from '@/lib/timezone'
import type { AttendanceStatus } from '@prisma/client'

export const DEFAULT_WINDOW_START_MINUTES = 8 * 60 // 08:00
export const DEFAULT_WINDOW_END_MINUTES = 8 * 60 + 30 // 08:30

/**
 * Arrival at or before the window's end is ON_TIME (arriving early is never
 * penalized); anything after it is LATE. The window's start time is
 * informational only — it never blocks or restricts an early arrival.
 */
export function computeAttendanceStatus(
  arrivalAt: Date,
  windowEndMinutes: number,
): AttendanceStatus {
  return minutesOfDay(arrivalAt) <= windowEndMinutes ? 'ON_TIME' : 'LATE'
}

export type ResolvedWindow = { windowStartMinutes: number; windowEndMinutes: number }

/**
 * Resolves the attendance window that applies to `departmentId`: that
 * department's own configured window if it has one, else the global
 * fallback window, else a bootstrap default (08:00-08:30) that has never
 * actually been persisted — this only matters before an admin has
 * configured anything at all.
 */
export async function resolveAttendanceWindow(
  departmentId: string | null,
): Promise<ResolvedWindow> {
  const [deptWindow, defaultWindow] = await Promise.all([
    departmentId
      ? prisma.attendanceWindow.findUnique({ where: { departmentId } })
      : Promise.resolve(null),
    prisma.attendanceWindow.findFirst({ where: { departmentId: null } }),
  ])

  const resolved = deptWindow ?? defaultWindow
  if (resolved) {
    return {
      windowStartMinutes: resolved.windowStartMinutes,
      windowEndMinutes: resolved.windowEndMinutes,
    }
  }
  return {
    windowStartMinutes: DEFAULT_WINDOW_START_MINUTES,
    windowEndMinutes: DEFAULT_WINDOW_END_MINUTES,
  }
}

export type CheckInResult =
  | { outcome: 'recorded'; arrivalAt: Date; status: AttendanceStatus }
  | { outcome: 'already_recorded'; arrivalAt: Date; status: AttendanceStatus }
  | { outcome: 'error'; code: 'inactive_account' }

/**
 * Records today's attendance for `userId`. The arrival timestamp is always
 * `new Date()` taken on the server — never anything supplied by the client.
 * Duplicate scans are resolved by the DB's (userId, date) unique constraint:
 * on a race, the loser's insert fails and we re-read the winner's row
 * instead of erroring, so two near-simultaneous scans always converge on one
 * record.
 */
export async function recordCheckIn(userId: string): Promise<CheckInResult> {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user || !user.active) {
    return { outcome: 'error', code: 'inactive_account' }
  }

  const now = new Date()
  const today = calendarDate(now)

  const existing = await prisma.attendance.findUnique({
    where: { userId_date: { userId, date: today } },
  })
  if (existing) {
    return { outcome: 'already_recorded', arrivalAt: existing.arrivalAt, status: existing.status }
  }

  const [department, jobRole] = await Promise.all([
    user.departmentId ? prisma.department.findUnique({ where: { id: user.departmentId } }) : null,
    user.jobRoleId ? prisma.jobRole.findUnique({ where: { id: user.jobRoleId } }) : null,
  ])

  const { windowEndMinutes } = await resolveAttendanceWindow(user.departmentId)
  const status = computeAttendanceStatus(now, windowEndMinutes)

  try {
    const created = await prisma.attendance.create({
      data: {
        userId,
        date: today,
        arrivalAt: now,
        status,
        source: 'QR',
        departmentId: user.departmentId,
        jobRoleId: user.jobRoleId,
        departmentName: department?.name ?? null,
        jobRoleName: jobRole?.name ?? null,
      },
    })

    await writeAuditLog(
      'attendance.checkin',
      { entityType: 'Attendance', entityId: created.id, status, arrivalAt: now.toISOString() },
      userId,
    )

    return { outcome: 'recorded', arrivalAt: created.arrivalAt, status: created.status }
  } catch (err) {
    // Unique constraint race: another request for the same user/day won first.
    if (isUniqueConstraintError(err)) {
      const winner = await prisma.attendance.findUnique({
        where: { userId_date: { userId, date: today } },
      })
      if (winner) {
        return { outcome: 'already_recorded', arrivalAt: winner.arrivalAt, status: winner.status }
      }
    }
    throw err
  }
}

function isUniqueConstraintError(err: unknown): boolean {
  return typeof err === 'object' && err !== null && (err as { code?: string }).code === 'P2002'
}

export type CheckOutResult =
  | { outcome: 'recorded'; departureAt: Date }
  | { outcome: 'already_recorded'; departureAt: Date }
  | { outcome: 'error'; code: 'inactive_account' | 'not_checked_in' }

/**
 * Records today's departure for `userId`. Mirrors recordCheckIn: the
 * departure timestamp is always `new Date()` taken on the server, and an
 * existing departureAt is returned as-is rather than overwritten, so a
 * second scan/tap after signing out is a no-op instead of an error.
 */
export async function recordCheckOut(userId: string): Promise<CheckOutResult> {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user || !user.active) {
    return { outcome: 'error', code: 'inactive_account' }
  }

  const today = calendarDate(new Date())
  const existing = await prisma.attendance.findUnique({
    where: { userId_date: { userId, date: today } },
  })
  if (!existing) {
    return { outcome: 'error', code: 'not_checked_in' }
  }
  if (existing.departureAt) {
    return { outcome: 'already_recorded', departureAt: existing.departureAt }
  }

  const now = new Date()
  const updated = await prisma.attendance.update({
    where: { id: existing.id },
    data: { departureAt: now },
  })

  await writeAuditLog(
    'attendance.checkout',
    { entityType: 'Attendance', entityId: updated.id, departureAt: now.toISOString() },
    userId,
  )

  return { outcome: 'recorded', departureAt: updated.departureAt as Date }
}
