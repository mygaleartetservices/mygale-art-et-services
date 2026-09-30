'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { requireRole } from '@/lib/auth'
import { writeAuditLog } from '@/lib/revisions'
import { computeAttendanceStatus, resolveAttendanceWindow } from '@/lib/attendance'
import { zonedTimeToInstant, calendarDate } from '@/lib/timezone'

type ActionState = { error?: string }

function asString(value: FormDataEntryValue | null) {
  return typeof value === 'string' ? value.trim() : ''
}

/** Corrects the arrival time of an existing attendance record — the employee, date, and status calculation stay governed by the server. */
export async function correctAttendance(_prevState: ActionState, formData: FormData) {
  const actor = await requireRole('ADMIN')

  const id = asString(formData.get('id'))
  const arrivalTime = asString(formData.get('arrivalTime'))
  const departureTime = asString(formData.get('departureTime'))
  const note = asString(formData.get('note'))

  const record = await prisma.attendance.findUnique({ where: { id } })
  if (!record) {
    return { error: 'Attendance record not found.' }
  }
  if (!note) {
    return { error: 'A note explaining the correction is required.' }
  }

  const dateStr = record.date.toISOString().slice(0, 10)
  const arrivalAt = zonedTimeToInstant(dateStr, arrivalTime)
  if (!arrivalAt) {
    return { error: 'Enter a valid time in HH:mm format.' }
  }

  let departureAt: Date | null = null
  if (departureTime) {
    departureAt = zonedTimeToInstant(dateStr, departureTime)
    if (!departureAt) {
      return { error: 'Enter a valid departure time in HH:mm format.' }
    }
  }

  const { windowEndMinutes } = await resolveAttendanceWindow(record.departmentId)
  const status = computeAttendanceStatus(arrivalAt, windowEndMinutes)

  await prisma.attendance.update({
    where: { id },
    data: {
      arrivalAt,
      departureAt,
      status,
      source: 'MANUAL',
      note,
      correctedById: actor.id,
      correctedAt: new Date(),
    },
  })

  await writeAuditLog(
    'attendance.correct',
    {
      entityType: 'Attendance',
      entityId: id,
      arrivalAt: arrivalAt.toISOString(),
      departureAt: departureAt ? departureAt.toISOString() : null,
      status,
      note,
    },
    actor.id,
  )

  revalidatePath('/admin/attendance')
  redirect('/admin/attendance')
}

/** Creates an attendance record for a day an employee forgot to scan. */
export async function createManualAttendance(_prevState: ActionState, formData: FormData) {
  const actor = await requireRole('ADMIN')

  const userId = asString(formData.get('userId'))
  const dateStr = asString(formData.get('date'))
  const arrivalTime = asString(formData.get('arrivalTime'))
  const departureTime = asString(formData.get('departureTime'))
  const note = asString(formData.get('note'))

  if (!userId || !dateStr || !arrivalTime) {
    return { error: 'Employee, date, and arrival time are required.' }
  }
  if (!note) {
    return { error: 'A note explaining why this was added manually is required.' }
  }

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) {
    return { error: 'Employee not found.' }
  }

  const arrivalAt = zonedTimeToInstant(dateStr, arrivalTime)
  if (!arrivalAt) {
    return { error: 'Enter a valid date and time.' }
  }
  const date = calendarDate(arrivalAt)

  let departureAt: Date | null = null
  if (departureTime) {
    departureAt = zonedTimeToInstant(dateStr, departureTime)
    if (!departureAt) {
      return { error: 'Enter a valid departure time.' }
    }
  }

  const existing = await prisma.attendance.findUnique({ where: { userId_date: { userId, date } } })
  if (existing) {
    return { error: 'This employee already has an attendance record for that date.' }
  }

  const [department, jobRole] = await Promise.all([
    user.departmentId ? prisma.department.findUnique({ where: { id: user.departmentId } }) : null,
    user.jobRoleId ? prisma.jobRole.findUnique({ where: { id: user.jobRoleId } }) : null,
  ])
  const { windowEndMinutes } = await resolveAttendanceWindow(user.departmentId)
  const status = computeAttendanceStatus(arrivalAt, windowEndMinutes)

  const created = await prisma.attendance.create({
    data: {
      userId,
      date,
      arrivalAt,
      departureAt,
      status,
      source: 'MANUAL',
      departmentId: user.departmentId,
      jobRoleId: user.jobRoleId,
      departmentName: department?.name ?? null,
      jobRoleName: jobRole?.name ?? null,
      note,
      correctedById: actor.id,
      correctedAt: new Date(),
    },
  })

  await writeAuditLog(
    'attendance.manual_create',
    {
      entityType: 'Attendance',
      entityId: created.id,
      userId,
      arrivalAt: arrivalAt.toISOString(),
      departureAt: departureAt ? departureAt.toISOString() : null,
      status,
      note,
    },
    actor.id,
  )

  revalidatePath('/admin/attendance')
  redirect('/admin/attendance')
}
