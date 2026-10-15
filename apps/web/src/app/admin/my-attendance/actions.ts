'use server'

import { revalidatePath } from 'next/cache'
import { requireRole } from '@/lib/auth'
import { recordCheckIn, recordCheckOut } from '@/lib/attendance'
import { verifyAttendanceToken } from '@/lib/attendanceQr'
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
  too_soon: {
    fr: "Vous venez de pointer votre arrivée. Vous pourrez pointer votre départ dans quelques minutes.",
    en: 'You just checked in. You can check out in a few minutes.',
  },
  not_checked_in: {
    fr: 'Vous devez pointer votre arrivée avant de pouvoir pointer votre départ.',
    en: 'You must check in before you can check out.',
  },
} as const

const SCAN_REQUIRED_MESSAGE = {
  fr: 'Code QR manquant, expiré ou remplacé. Scannez le code de présence actuel pour continuer.',
  en: 'QR code missing, expired or replaced. Scan the current attendance QR code to continue.',
} as const

/**
 * The real enforcement of "you must scan, not just be logged in" lives here,
 * not in the UI: AttendancePanel hides the button when its token looks
 * stale, but that's only ever a courtesy — a crafted POST (or a stale tab
 * left open past the token's rotation) must still be rejected server-side.
 */
async function requireScan(formData: FormData) {
  const token = formData.get('t')
  if (typeof token !== 'string' || !(await verifyAttendanceToken(token))) {
    const locale = await getLocale()
    return SCAN_REQUIRED_MESSAGE[locale]
  }
  return null
}

export async function checkInAttendance(
  _prevState: CheckInActionState,
  formData: FormData,
): Promise<CheckInActionState> {
  const user = await requireRole('USER')

  const scanError = await requireScan(formData)
  if (scanError) return { error: scanError }

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
  formData: FormData,
): Promise<CheckOutActionState> {
  const user = await requireRole('USER')

  const scanError = await requireScan(formData)
  if (scanError) return { error: scanError }

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
