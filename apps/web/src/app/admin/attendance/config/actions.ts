'use server'

import { revalidatePath } from 'next/cache'
import prisma from '@/lib/prisma'
import { requireRole } from '@/lib/auth'
import { writeAuditLog } from '@/lib/revisions'
import { parseTimeToMinutes } from '@/lib/timezone'
import { getQrConfig } from '@/lib/attendanceQr'

type ActionState = { error?: string }

function asString(value: FormDataEntryValue | null) {
  return typeof value === 'string' ? value.trim() : ''
}

export async function setAttendanceWindow(_prevState: ActionState, formData: FormData) {
  const actor = await requireRole('SUPER_ADMIN')

  const departmentIdRaw = asString(formData.get('departmentId'))
  const departmentId = departmentIdRaw === '' ? null : departmentIdRaw
  const startInput = asString(formData.get('windowStart'))
  const endInput = asString(formData.get('windowEnd'))

  const windowStartMinutes = parseTimeToMinutes(startInput)
  const windowEndMinutes = parseTimeToMinutes(endInput)

  if (windowStartMinutes === null || windowEndMinutes === null) {
    return { error: 'Enter valid times in HH:mm format.' }
  }
  if (windowEndMinutes <= windowStartMinutes) {
    return { error: 'The end time must be after the start time.' }
  }

  if (departmentId) {
    const department = await prisma.department.findUnique({ where: { id: departmentId } })
    if (!department) {
      return { error: 'Department not found.' }
    }

    await prisma.attendanceWindow.upsert({
      where: { departmentId },
      create: { departmentId, windowStartMinutes, windowEndMinutes, updatedById: actor.id },
      update: { windowStartMinutes, windowEndMinutes, updatedById: actor.id },
    })
  } else {
    // The global fallback row (departmentId = null) can't be targeted with
    // upsert: Postgres treats every NULL in a unique column as distinct, so
    // there's no single row a unique-on-null lookup could match. Find it (if
    // any) and update in place instead of ever creating a second one.
    const existing = await prisma.attendanceWindow.findFirst({ where: { departmentId: null } })
    if (existing) {
      await prisma.attendanceWindow.update({
        where: { id: existing.id },
        data: { windowStartMinutes, windowEndMinutes, updatedById: actor.id },
      })
    } else {
      await prisma.attendanceWindow.create({
        data: { departmentId: null, windowStartMinutes, windowEndMinutes, updatedById: actor.id },
      })
    }
  }

  await writeAuditLog(
    'attendance.config.update',
    {
      entityType: 'AttendanceWindow',
      entityId: departmentId ?? 'default',
      windowStartMinutes,
      windowEndMinutes,
    },
    actor.id,
  )

  revalidatePath('/admin/attendance/config')
  return {}
}

export async function setMinCheckoutMinutes(_prev: ActionState, formData: FormData) {
  const actor = await requireRole('SUPER_ADMIN')
  const minutes = Number(asString(formData.get('minCheckoutMinutes')))
  if (!Number.isInteger(minutes) || minutes < 0 || minutes > 240) {
    return { error: 'Enter a whole number of minutes between 0 and 240.' }
  }

  await getQrConfig()
  await prisma.attendanceQrConfig.update({
    where: { id: 'default' },
    data: { minCheckoutMinutes: minutes, updatedById: actor.id },
  })
  await writeAuditLog(
    'attendance.config.min_checkout',
    { entityType: 'AttendanceQrConfig', entityId: 'default', minCheckoutMinutes: minutes },
    actor.id,
  )
  revalidatePath('/admin/attendance/config')
  return {}
}
