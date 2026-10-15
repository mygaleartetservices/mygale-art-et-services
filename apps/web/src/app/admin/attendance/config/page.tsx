import prisma from '@/lib/prisma'
import { requireRole } from '@/lib/auth'
import { DEFAULT_WINDOW_START_MINUTES, DEFAULT_WINDOW_END_MINUTES } from '@/lib/attendance'
import { formatMinutesAsTime } from '@/lib/timezone'
import { getAdminT } from '@/lib/getLocale'
import { getQrConfig } from '@/lib/attendanceQr'
import WindowForm from './WindowForm'
import MinCheckoutForm from './MinCheckoutForm'

export default async function AttendanceConfigPage() {
  // Managing the attendance time window is Super-Admin-only — an Admin can
  // still view/correct attendance, just not change what counts as late.
  await requireRole('SUPER_ADMIN')
  const [departments, windows, adminT, qrConfig] = await Promise.all([
    prisma.department.findMany({ orderBy: { name: 'asc' } }),
    prisma.attendanceWindow.findMany(),
    getAdminT(),
    getQrConfig(),
  ])
  const t = adminT.attendanceConfig

  const windowByDepartmentId = new Map(
    windows.filter((w) => w.departmentId).map((w) => [w.departmentId as string, w]),
  )
  const defaultWindow = windows.find((w) => w.departmentId === null)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{t.title}</h1>
        <p className="text-sm text-neutral-400">{t.subtitle}</p>
      </div>

      <div className="rounded-xl border border-neutral-800 p-4 space-y-2">
        <div className="text-sm font-semibold">{t.defaultWindowLabel}</div>
        <WindowForm
          departmentId={null}
          windowStart={formatMinutesAsTime(
            defaultWindow?.windowStartMinutes ?? DEFAULT_WINDOW_START_MINUTES,
          )}
          windowEnd={formatMinutesAsTime(
            defaultWindow?.windowEndMinutes ?? DEFAULT_WINDOW_END_MINUTES,
          )}
        />
      </div>

      <div className="rounded-xl border border-neutral-800 p-4 space-y-2">
        <div className="text-sm font-semibold">{t.minCheckoutTitle}</div>
        <MinCheckoutForm minutes={qrConfig.minCheckoutMinutes} />
      </div>

      <div className="space-y-4">
        <div className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
          {t.departmentOverrides}
        </div>
        {departments.map((dept) => {
          const w = windowByDepartmentId.get(dept.id)
          return (
            <div key={dept.id} className="rounded-xl border border-neutral-800 p-4 space-y-2">
              <div className="text-sm font-semibold">{dept.name}</div>
              {!w ? <p className="text-xs text-neutral-500">{t.usingDefault}</p> : null}
              <WindowForm
                departmentId={dept.id}
                windowStart={formatMinutesAsTime(
                  w?.windowStartMinutes ??
                    defaultWindow?.windowStartMinutes ??
                    DEFAULT_WINDOW_START_MINUTES,
                )}
                windowEnd={formatMinutesAsTime(
                  w?.windowEndMinutes ??
                    defaultWindow?.windowEndMinutes ??
                    DEFAULT_WINDOW_END_MINUTES,
                )}
              />
            </div>
          )
        })}
        {departments.length === 0 ? (
          <p className="text-sm text-neutral-400">{t.noDepartments}</p>
        ) : null}
      </div>
    </div>
  )
}
