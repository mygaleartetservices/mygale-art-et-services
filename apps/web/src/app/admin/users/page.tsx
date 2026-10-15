import Link from 'next/link'
import prisma from '@/lib/prisma'
import { requireRole } from '@/lib/auth'
import { getAdminT } from '@/lib/getLocale'

export default async function AdminUsersPage() {
  const currentUser = await requireRole('ADMIN')
  const [users, t] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: 'asc' },
      include: { department: { select: { name: true } }, jobRole: { select: { name: true } } },
    }),
    getAdminT(),
  ])
  const c = t.common
  // Admins can manage every non-Super-Admin account; Super Admin accounts
  // are invisible to them entirely — only a Super Admin can see/reach one.
  const visibleUsers =
    currentUser.role === 'SUPER_ADMIN' ? users : users.filter((u) => u.role !== 'SUPER_ADMIN')

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{t.users.title}</h1>
          <p className="text-sm text-neutral-400">{t.users.subtitle}</p>
        </div>
        <Link
          href="/admin/users/new"
          className="rounded-lg bg-[#1f44c9] text-white hover:bg-[#1937a6] px-4 py-2 text-sm font-semibold"
        >
          {t.users.newUser}
        </Link>
      </div>

      <div className="overflow-x-auto rounded-xl border border-neutral-800">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-neutral-900 text-neutral-300">
            <tr>
              <th className="px-4 py-3">{t.users.name}</th>
              <th className="px-4 py-3">{t.users.email}</th>
              <th className="px-4 py-3">{t.users.role}</th>
              <th className="px-4 py-3">{t.users.department}</th>
              <th className="px-4 py-3">{t.users.jobRole}</th>
              <th className="px-4 py-3">{t.users.status}</th>
              <th className="px-4 py-3">{t.users.actions}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800">
            {visibleUsers.map((u) => (
              <tr key={u.id} className="bg-neutral-950">
                <td className="px-4 py-3">
                  {u.name}
                  {u.id === currentUser.id ? (
                    <span className="ml-2 rounded-full bg-neutral-800 px-2 py-0.5 text-[10px] text-neutral-400">
                      {t.users.you}
                    </span>
                  ) : null}
                </td>
                <td className="px-4 py-3 text-neutral-300">{u.email}</td>
                <td className="px-4 py-3 text-neutral-300">{u.role}</td>
                <td className="px-4 py-3 text-neutral-300">{u.department?.name ?? '—'}</td>
                <td className="px-4 py-3 text-neutral-300">{u.jobRole?.name ?? '—'}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-semibold ${
                      u.active
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-neutral-700/40 text-neutral-300'
                    }`}
                  >
                    {u.active ? c.active : c.deactivated}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/users/${u.id}/edit`}
                    className="rounded border border-neutral-700 px-3 py-1 text-xs"
                  >
                    {t.users.edit}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
