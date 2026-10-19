import prisma from '@/lib/prisma'
import { requireRole } from '@/lib/auth'
import { getAdminT, getLocale } from '@/lib/getLocale'
import type { Lang } from '@/lib/locale'

function formatDate(value: Date, lang: Lang) {
  return new Intl.DateTimeFormat(lang === 'fr' ? 'fr-FR' : 'en-GB', { dateStyle: 'medium', timeStyle: 'short' }).format(
    value,
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function describeMeta(meta: any) {
  if (!meta || typeof meta !== 'object') return null
  const entityType = meta.entityType
  const entityId = meta.entityId
  if (!entityType) return null
  return `${entityType}${entityId ? ` · ${String(entityId).slice(0, 12)}` : ''}`
}

export default async function AdminAuditLogPage() {
  const lang = await getLocale()
  await requireRole('SUPER_ADMIN')
  const [entries, adminT] = await Promise.all([
    prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: {
        actor: { select: { name: true, email: true } },
        contactSubmission: { select: { name: true, email: true } },
      },
    }),
    getAdminT(),
  ])
  const t = adminT.auditLog

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{t.title}</h1>
        <p className="text-sm text-neutral-400">{t.subtitle}</p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-neutral-800">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-neutral-900 text-neutral-300">
            <tr>
              <th className="px-4 py-3">{t.tableWhen}</th>
              <th className="px-4 py-3">{t.tableAction}</th>
              <th className="px-4 py-3">{t.tableTarget}</th>
              <th className="px-4 py-3">{t.tableBy}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800">
            {entries.map((entry) => (
              <tr key={entry.id} className="bg-neutral-950">
                <td className="px-4 py-3 text-neutral-400 whitespace-nowrap">
                  {formatDate(entry.createdAt, lang)}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-neutral-200">{entry.action}</td>
                <td className="px-4 py-3 text-neutral-400">
                  {describeMeta(entry.meta) ||
                    (entry.contactSubmission ? t.submissionFrom(entry.contactSubmission.name) : '—')}
                </td>
                <td className="px-4 py-3 text-neutral-300">
                  {entry.actor?.name || entry.actor?.email || t.system}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {entries.length === 0 ? (
          <div className="px-4 py-6 text-sm text-neutral-400">{t.noActivity}</div>
        ) : null}
      </div>
    </div>
  )
}
