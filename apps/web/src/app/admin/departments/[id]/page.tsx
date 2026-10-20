import Link from 'next/link'
import { notFound } from 'next/navigation'
import prisma from '@/lib/prisma'
import { getAdminT } from '@/lib/getLocale'
import { updateDepartment, updateJobRole } from '../actions'

export default async function EditDepartmentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [department, adminT] = await Promise.all([
    prisma.department.findUnique({
      where: { id },
      include: { jobRoles: { orderBy: { name: 'asc' } } },
    }),
    getAdminT(),
  ])
  if (!department) notFound()
  const t = adminT.departments

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/departments" className="text-xs text-neutral-400 hover:text-neutral-200">
          ← {t.back}
        </Link>
        <h1 className="mt-1 text-2xl font-semibold">{t.editDepartment}</h1>
      </div>

      <form
        action={updateDepartment}
        className="flex flex-wrap items-center gap-3 rounded-xl border border-neutral-800 p-4"
      >
        <input type="hidden" name="id" value={department.id} />
        <input
          name="name"
          defaultValue={department.name}
          aria-label={t.departmentName}
          required
          className="flex-1 min-w-[200px] rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm"
        />
        <button type="submit" className="rounded-lg bg-[#1f44c9] text-white hover:bg-[#1937a6] px-4 py-2 text-sm font-semibold">
          {t.save}
        </button>
      </form>

      <div className="space-y-3 rounded-xl border border-neutral-800 p-4">
        <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{t.jobRolesLabel}</div>
        {department.jobRoles.map((role) => (
          <form key={role.id} action={updateJobRole} className="flex flex-wrap items-center gap-2">
            <input type="hidden" name="id" value={role.id} />
            <input
              name="name"
              defaultValue={role.name}
              aria-label={t.roleName}
              required
              className="flex-1 min-w-[160px] rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-sm"
            />
            <button type="submit" className="rounded border border-neutral-700 px-3 py-1.5 text-xs">
              {t.save}
            </button>
          </form>
        ))}
        {department.jobRoles.length === 0 ? <p className="text-xs text-neutral-500">{t.noJobRoles}</p> : null}
      </div>
    </div>
  )
}
