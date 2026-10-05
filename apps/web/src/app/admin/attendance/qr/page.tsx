import {
  ATTENDANCE_QR_WINDOW_SECONDS,
  generateAttendanceQrDataUrl,
  getAttendanceCheckInUrl,
} from '@/lib/attendanceQr'
import { getAdminT } from '@/lib/getLocale'
import AttendanceQrDisplay from './AttendanceQrDisplay'

export default async function AttendanceQrPage() {
  const [qrDataUrl, adminT] = await Promise.all([generateAttendanceQrDataUrl(), getAdminT()])
  const url = getAttendanceCheckInUrl()
  const t = adminT.attendanceQr

  return (
    <div className="max-w-md space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{t.title}</h1>
        <p className="text-sm text-neutral-400">{t.body}</p>
      </div>

      <AttendanceQrDisplay
        initial={{ qrDataUrl, url, refreshMs: ATTENDANCE_QR_WINDOW_SECONDS * 1000 }}
      />
    </div>
  )
}
