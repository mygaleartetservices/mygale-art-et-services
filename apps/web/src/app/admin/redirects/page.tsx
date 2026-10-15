import Link from 'next/link'
import prisma from '@/lib/prisma'
import { requireRole } from '@/lib/auth'
import { deleteRedirect, toggleRedirectActive } from './actions'
import { getAdminT } from '@/lib/getLocale'

export default async function AdminRedirectsPage() {
  await requireRole('ADMIN')
  const [redirects, adminT] = await Promise.all([
    prisma.redirect.findMany({ orderBy: { createdAt: 'desc' } }),
    getAdminT(),
  ])
  const t = adminT.redirects
  const common = adminT.common

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{t.title}</h1>
          <p className="text-sm text-neutral-400">{t.subtitle}</p>
        </div>
        <Link
          href="/admin/redirects/new"
          className="rounded-lg bg-[#1f44c9] text-white hover:bg-[#1937a6] px-4 py-2 text-sm font-semibold"
        >
          {t.newRedirect}
        </Link>
      </div>

      <div className="overflow-x-auto rounded-xl border border-neutral-800">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-neutral-900 text-neutral-300">
            <tr>
              <th className="px-4 py-3">{t.tableFrom}</th>
              <th className="px-4 py-3">{t.tableTo}</th>
              <th className="px-4 py-3">{t.tableStatus}</th>
              <th className="px-4 py-3">{t.tableActive}</th>
              <th className="px-4 py-3">{t.tableActions}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800">
            {redirects.map((r) => (
              <tr key={r.id} className="bg-neutral-950">
                <td className="px-4 py-3 text-neutral-300">{r.fromPath}</td>
                <td className="px-4 py-3 text-neutral-300">{r.toPath}</td>
                <td className="px-4 py-3 text-neutral-300">{r.statusCode}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-semibold ${
                      r.active
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-neutral-700/40 text-neutral-300'
                    }`}
                  >
                    {r.active ? common.active : common.inactive}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/admin/redirects/${r.id}/edit`}
                      className="rounded border border-neutral-700 px-3 py-1 text-xs"
                    >
                      {t.edit}
                    </Link>

                    <form action={toggleRedirectActive}>
                      <input type="hidden" name="id" value={r.id} />
                      <input type="hidden" name="active" value={(!r.active).toString()} />
                      <button
                        type="submit"
                        className="rounded border border-neutral-700 px-3 py-1 text-xs"
                      >
                        {r.active ? t.deactivate : t.activate}
                      </button>
                    </form>

                    <form action={deleteRedirect}>
                      <input type="hidden" name="id" value={r.id} />
                      <button
                        type="submit"
                        className="rounded border border-red-500/60 px-3 py-1 text-xs text-red-200"
                      >
                        {t.delete}
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {redirects.length === 0 ? (
          <div className="px-4 py-6 text-sm text-neutral-400">{t.noRedirects}</div>
        ) : null}
      </div>
    </div>
  )
}
