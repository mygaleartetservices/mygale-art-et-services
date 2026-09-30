import { notFound } from 'next/navigation'
import prisma from '@/lib/prisma'
import { formatClockTime, formatCalendarDate } from '@/lib/timezone'
import { getAdminT } from '@/lib/getLocale'
import CorrectForm from '../CorrectForm'

export default async function CorrectAttendancePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [record, adminT] = await Promise.all([
    prisma.attendance.findUnique({
      where: { id },
      include: {
        user: { select: { name: true, email: true } },
        correctedBy: { select: { name: true } },
      },
    }),
    getAdminT(),
  ])
  if (!record) notFound()
  const t = adminT.attendanceCorrect

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{t.title}</h1>
        <p className="text-sm text-neutral-400">
          {record.user.name} ({record.user.email}) · {formatCalendarDate(record.date)} ·{' '}
          {record.departmentName ?? t.noDepartment}
          {record.jobRoleName ? ` · ${record.jobRoleName}` : ''}
        </p>
        <p className="mt-1 text-xs text-neutral-500">
          {t.currentArrival}: {formatClockTime(record.arrivalAt)} (
          {record.status === 'ON_TIME' ? t.onTime : t.late}) · {t.currentDeparture}:{' '}
          {record.departureAt ? formatClockTime(record.departureAt) : t.notRecorded}
          {record.correctedBy ? ` · ${t.lastCorrectedBy} ${record.correctedBy.name}` : ''}
        </p>
      </div>

      <CorrectForm
        id={record.id}
        arrivalTime={formatClockTime(record.arrivalAt)}
        departureTime={record.departureAt ? formatClockTime(record.departureAt) : ''}
      />
    </div>
  )
}
