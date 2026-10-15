import { notFound } from 'next/navigation'
import prisma from '@/lib/prisma'
import { restoreServiceRevision } from '../../actions'
import { getAdminT, getLocale } from '@/lib/getLocale'
import type { Lang } from '@/lib/locale'

function formatDate(value: Date, lang: Lang) {
  return new Intl.DateTimeFormat(lang === 'fr' ? 'fr-FR' : 'en-GB', { dateStyle: 'medium', timeStyle: 'short' }).format(
    value,
  )
}

export default async function ServiceRevisionsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const lang = await getLocale()
  const { id } = await params
  const [service, adminT] = await Promise.all([
    prisma.service.findUnique({ where: { id } }),
    getAdminT(),
  ])
  if (!service) {
    notFound()
  }
  const t = adminT.services

  const revisions = await prisma.revision.findMany({
    where: { entityType: 'Service', entityId: id },
    orderBy: { createdAt: 'desc' },
    include: { createdBy: { select: { name: true, email: true } } },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{t.historyTitle(service.titleFr)}</h1>
        <p className="text-sm text-neutral-400">{t.historySubtitle}</p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-neutral-800">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-neutral-900 text-neutral-300">
            <tr>
              <th className="px-4 py-3">{t.historyWhen}</th>
              <th className="px-4 py-3">{t.historyAction}</th>
              <th className="px-4 py-3">{t.historyBy}</th>
              <th className="px-4 py-3">{t.tableActions}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800">
            {revisions.map((rev) => (
              <tr key={rev.id} className="bg-neutral-950">
                <td className="px-4 py-3 text-neutral-300">{formatDate(rev.createdAt, lang)}</td>
                <td className="px-4 py-3 uppercase text-xs text-neutral-300">{rev.action}</td>
                <td className="px-4 py-3 text-neutral-300">
                  {rev.createdBy?.name || rev.createdBy?.email || '—'}
                </td>
                <td className="px-4 py-3">
                  <form action={restoreServiceRevision}>
                    <input type="hidden" name="revisionId" value={rev.id} />
                    <input type="hidden" name="serviceId" value={id} />
                    <button
                      type="submit"
                      className="rounded border border-neutral-700 px-3 py-1 text-xs"
                    >
                      {t.restoreVersion}
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {revisions.length === 0 ? (
          <div className="px-4 py-6 text-sm text-neutral-400">{t.noHistory}</div>
        ) : null}
      </div>
    </div>
  )
}
