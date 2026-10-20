import Link from 'next/link'
import prisma from '@/lib/prisma'
import { createDepartment, deleteDepartment, createJobRole, deleteJobRole } from './actions'
import { getAdminT } from '@/lib/getLocale'

export default async function AdminDepartmentsPage() {
  const [departments, adminT] = await Promise.all([
    prisma.department.findMany({
      orderBy: { name: 'asc' },
      include: {
        jobRoles: { orderBy: { name: 'asc' }, include: { _count: { select: { employees: true } } } },
        _count: { select: { employees: true } },
      },
    }),
    getAdminT(),
  ])
  const t = adminT.departments

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{t.title}</h1>
        <p className="text-sm text-neutral-400">{t.subtitle}</p>
      </div>

      <form
        action={createDepartment}
        className="flex flex-wrap items-center gap-3 rounded-xl border border-neutral-800 p-4"
      >
        <input
          name="name"
          placeholder={t.newDepartmentPlaceholder}
          required
          className="flex-1 min-w-[200px] rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm"
        />
        <button type="submit" className="rounded-lg bg-[#1f44c9] text-white hover:bg-[#1937a6] px-4 py-2 text-sm font-semibold">
          {t.addDepartment}
        </button>
      </form>

      <div className="space-y-4">
        {departments.map((dept) => (
          <div key={dept.id} className="rounded-xl border border-neutral-800">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-800 bg-neutral-900 px-4 py-3">
              <div>
                <div className="font-semibold">{dept.name}</div>
                <div className="text-xs text-neutral-400">{t.employeesCount(dept._count.employees)}</div>
              </div>
              <Link
                href={`/admin/departments/${dept.id}`}
                className="rounded border border-neutral-700 px-3 py-1 text-xs"
              >
                {t.edit}
              </Link>
              <form action={deleteDepartment}>
                <input type="hidden" name="id" value={dept.id} />
                <button
                  type="submit"
                  className="rounded border border-red-500/60 px-3 py-1 text-xs text-red-200"
                >
                  {t.deleteDepartment}
                </button>
              </form>
            </div>

            <div className="p-4 space-y-3">
              <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                {t.jobRolesLabel}
              </div>
              <ul className="space-y-2">
                {dept.jobRoles.map((role) => (
                  <li
                    key={role.id}
                    className="flex items-center justify-between rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm"
                  >
                    <span>
                      {role.name}{' '}
                      <span className="text-xs text-neutral-500">
                        ({t.employeesCount(role._count.employees)})
                      </span>
                    </span>
                    <form action={deleteJobRole}>
                      <input type="hidden" name="id" value={role.id} />
                      <button
                        type="submit"
                        className="rounded border border-red-500/60 px-2 py-0.5 text-xs text-red-200"
                      >
                        {t.delete}
                      </button>
                    </form>
                  </li>
                ))}
                {dept.jobRoles.length === 0 ? (
                  <li className="text-xs text-neutral-500">{t.noJobRoles}</li>
                ) : null}
              </ul>

              <form action={createJobRole} className="flex flex-wrap items-center gap-2">
                <input type="hidden" name="departmentId" value={dept.id} />
                <input
                  name="name"
                  placeholder={t.newJobRolePlaceholder}
                  required
                  className="flex-1 min-w-[160px] rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-sm"
                />
                <button
                  type="submit"
                  className="rounded border border-neutral-700 px-3 py-1.5 text-xs"
                >
                  {t.addRole}
                </button>
              </form>
            </div>
          </div>
        ))}
        {departments.length === 0 ? (
          <div className="rounded-xl border border-neutral-800 px-4 py-6 text-sm text-neutral-400">
            {t.noDepartments}
          </div>
        ) : null}
      </div>
    </div>
  )
}
