'use server'

import { revalidatePath } from 'next/cache'
import { requireRole } from '@/lib/auth'
import { writeAuditLog } from '@/lib/revisions'
import {
  MAX_QR_VALIDITY_HOURS,
  MIN_QR_VALIDITY_HOURS,
  regenerateAttendanceQr,
} from '@/lib/attendanceQr'
import { getLocale } from '@/lib/getLocale'

type ActionState = { error?: string }

export async function regenerateQr(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const actor = await requireRole('SUPER_ADMIN')
  const days = Number(formData.get('validityDays'))
  const hours = Math.round(days * 24)
  if (!Number.isFinite(hours) || hours < MIN_QR_VALIDITY_HOURS || hours > MAX_QR_VALIDITY_HOURS) {
    const locale = await getLocale()
    return {
      error:
        locale === 'fr'
          ? 'Entrez une durée entre 1 et 365 jours.'
          : 'Enter a duration between 1 and 365 days.',
    }
  }

  await regenerateAttendanceQr(actor.id, hours)
  await writeAuditLog(
    'attendance.qr.regenerate',
    { entityType: 'AttendanceQrConfig', entityId: 'default', validityHours: hours },
    actor.id,
  )
  revalidatePath('/admin/attendance/qr')
  return {}
}
