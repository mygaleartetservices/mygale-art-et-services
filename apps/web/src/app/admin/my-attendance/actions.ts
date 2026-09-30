'use server'

import { revalidatePath } from 'next/cache'
import { requireRole } from '@/lib/auth'
import { recordCheckIn, recordCheckOut } from '@/lib/attendance'
import { getLocale } from '@/lib/getLocale'

type CheckInActionState = {
  error?: string
  result?: { arrivalAt: string; status: 'ON_TIME' | 'LATE'; alreadyRecorded: boolean }
}

type CheckOutActionState = {
  error?: string
  result?: { departureAt: string; alreadyRecorded: boolean }
}

const ERROR_MESSAGES = {
  inactive_account: {
    fr: 'Votre compte est inactif. Contactez un administrateur.',
    en: 'Your account is not active. Contact an administrator.',
  },
  not_checked_in: {
    fr: 'Vous devez pointer votre arrivée avant de pouvoir pointer votre départ.',
    en: 'You must check in before you can check out.',
  },
} as const

export async function checkInAttendance(_prevState: CheckInActionState): Promise<CheckInActionState> {
  const user = await requireRole('USER')

  const result = await recordCheckIn(user.id)

  if (result.outcome === 'error') {
    const locale = await getLocale()
    return { error: ERROR_MESSAGES[result.code][locale] }
  }

  revalidatePath('/admin/my-attendance')

  return {
    result: {
      arrivalAt: result.arrivalAt.toISOString(),
      status: result.status,
      alreadyRecorded: result.outcome === 'already_recorded',
    },
  }
}

export async function checkOutAttendance(
  _prevState: CheckOutActionState,
): Promise<CheckOutActionState> {
  const user = await requireRole('USER')

  const result = await recordCheckOut(user.id)

  if (result.outcome === 'error') {
    const locale = await getLocale()
    return { error: ERROR_MESSAGES[result.code][locale] }
  }

  revalidatePath('/admin/my-attendance')

  return {
    result: {
      departureAt: result.departureAt.toISOString(),
      alreadyRecorded: result.outcome === 'already_recorded',
    },
  }
}
