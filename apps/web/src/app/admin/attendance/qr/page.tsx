import { requireRole } from '@/lib/auth'
import { generateAttendanceQrDataUrl, getAttendanceCheckInUrl, getAttendanceQrState } from '@/lib/attendanceQr'
import { getAdminT } from '@/lib/getLocale'
import AttendanceQrDisplay from './AttendanceQrDisplay'

export default async function AttendanceQrPage() {
  const user = await requireRole('ADMIN')
  const [qrDataUrl, url, state, adminT] = await Promise.all([
    generateAttendanceQrDataUrl(),
    getAttendanceCheckInUrl(),
    getAttendanceQrState(),
    getAdminT(),
  ])
  const t = adminT.attendanceQr

  return (
    <div className="max-w-md space-y-6">
      <div className="print:hidden">
        <h1 className="text-2xl font-semibold">{t.title}</h1>
        <p className="text-sm text-neutral-400">{t.body}</p>
      </div>

      <AttendanceQrDisplay
        qrDataUrl={qrDataUrl}
        url={url}
        expiresAtIso={state.expiresAt.toISOString()}
        expired={state.expired}
        validityDays={Math.max(1, Math.round(state.validityHours / 24))}
        canEdit={user.role === 'SUPER_ADMIN'}
      />
    </div>
  )
}
