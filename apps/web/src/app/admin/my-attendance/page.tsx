import prisma from '@/lib/prisma'
import { requireRole } from '@/lib/auth'
import { calendarDate } from '@/lib/timezone'
import { getAdminT } from '@/lib/getLocale'
import { verifyAttendanceToken } from '@/lib/attendanceQr'
import AttendancePanel from './AttendancePanel'

export default async function MyAttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ t?: string }>
}) {
  const user = await requireRole('USER')
  const { t: token } = await searchParams
  const tokenValid = verifyAttendanceToken(token)

  const [today, department, jobRole, adminT] = await Promise.all([
    prisma.attendance.findUnique({
      where: { userId_date: { userId: user.id, date: calendarDate(new Date()) } },
    }),
    user.departmentId ? prisma.department.findUnique({ where: { id: user.departmentId } }) : null,
    user.jobRoleId ? prisma.jobRole.findUnique({ where: { id: user.jobRoleId } }) : null,
    getAdminT(),
  ])

  const t = adminT.myAttendance

  return (
    <div className="max-w-md space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{t.heading}</h1>
        <p className="text-sm text-neutral-400">
          {user.name} · {department?.name ?? t.noDepartment}
          {jobRole ? ` · ${jobRole.name}` : ''}
        </p>
      </div>

      <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-5">
        <AttendancePanel
          initialRecord={
            today
              ? {
                  arrivalAt: today.arrivalAt.toISOString(),
                  status: today.status,
                  departureAt: today.departureAt ? today.departureAt.toISOString() : null,
                }
              : null
          }
          token={token ?? null}
          tokenValid={tokenValid}
        />
      </div>
    </div>
  )
}
