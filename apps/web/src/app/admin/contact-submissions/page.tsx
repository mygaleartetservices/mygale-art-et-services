import Link from 'next/link'
import prisma from '@/lib/prisma'
import { StatusSelect, AssigneeSelect } from './SubmissionRowControls'
import { getAdminT, getLocale } from '@/lib/getLocale'
import type { Lang } from '@/lib/locale'
import type { SubmissionStatus } from '@prisma/client'

const STATUS_TAB_IDS = ['all', 'new', 'in_review', 'responded', 'closed'] as const

function formatDate(value: Date, lang: Lang) {
  return new Intl.DateTimeFormat(lang === 'fr' ? 'fr-FR' : 'en-GB', { dateStyle: 'medium', timeStyle: 'short' }).format(
    value,
  )
}

function tabHref(status: string, q?: string) {
  const params = new URLSearchParams()
  if (status !== 'all') params.set('status', status)
  if (q) params.set('q', q)
  const qs = params.toString()
  return qs ? `/admin/contact-submissions?${qs}` : '/admin/contact-submissions'
}

export default async function AdminContactSubmissionsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>
}) {
  const lang = await getLocale()
  const { status, q } = await searchParams
  const activeStatus = status && status !== 'all' ? status : 'all'

  const [submissions, staff, adminT] = await Promise.all([
    prisma.contactSubmission.findMany({
      where: {
        ...(activeStatus !== 'all' ? { status: activeStatus as SubmissionStatus } : {}),
        ...(q
          ? {
              OR: [
                { name: { contains: q, mode: 'insensitive' as const } },
                { email: { contains: q, mode: 'insensitive' as const } },
                { message: { contains: q, mode: 'insensitive' as const } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: { assignedTo: { select: { id: true, name: true } } },
    }),
    prisma.user.findMany({
      where: { role: { in: ['SUPER_ADMIN', 'ADMIN', 'EDITOR', 'STAFF'] } },
      select: { id: true, name: true },
    }),
    getAdminT(),
  ])
  const t = adminT.contactSubmissions

  // Group by sender email — submissions are already ordered newest-first, so
  // the first row seen for an email is that sender's latest message, and the
  // groups array naturally stays ordered by each sender's latest activity.
  type Submission = (typeof submissions)[number]
  type Group = { email: string; name: string; latest: Submission; count: number }

  const groups: Group[] = []
  const groupIndexByEmail = new Map<string, number>()
  for (const s of submissions) {
    const key = s.email.toLowerCase()
    const idx = groupIndexByEmail.get(key)
    if (idx === undefined) {
      groupIndexByEmail.set(key, groups.length)
      groups.push({ email: s.email, name: s.name, latest: s, count: 1 })
    } else {
      groups[idx].count += 1
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{t.inboxTitle}</h1>
        <p className="text-sm text-neutral-400">{t.inboxSubtitle}</p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2 text-sm">
          {STATUS_TAB_IDS.map((id) => (
            <Link
              key={id}
              href={tabHref(id, q)}
              className={`rounded px-3 py-1 ${
                activeStatus === id ? 'bg-neutral-800' : 'border border-neutral-800'
              }`}
            >
              {t.statusTabs[id]}
            </Link>
          ))}
        </div>

        <form className="flex items-center gap-2" action="/admin/contact-submissions" method="get">
          {activeStatus !== 'all' ? (
            <input type="hidden" name="status" value={activeStatus} />
          ) : null}
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder={t.searchPlaceholder}
            className="rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-sm"
          />
          <button type="submit" className="rounded border border-neutral-700 px-3 py-1.5 text-xs">
            {t.searchButton}
          </button>
        </form>
      </div>

      <div className="overflow-x-auto rounded-xl border border-neutral-800">
        <table className="w-full min-w-[880px] text-left text-sm">
          <thead className="bg-neutral-900 text-neutral-300">
            <tr>
              <th className="px-4 py-3">{t.tableFrom}</th>
              <th className="px-4 py-3">{t.tableMessage}</th>
              <th className="px-4 py-3">{t.tableReceived}</th>
              <th className="px-4 py-3">{t.tableStatus}</th>
              <th className="px-4 py-3">{t.tableAssignee}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800">
            {groups.map((g) => (
              <tr key={g.email} className="bg-neutral-950 align-top">
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/contact-submissions/thread/${encodeURIComponent(g.email)}`}
                    className="font-semibold hover:underline"
                  >
                    {g.name}
                  </Link>
                  {g.count > 1 ? (
                    <span className="ml-2 rounded-full bg-neutral-800 px-2 py-0.5 text-[10px] text-neutral-300">
                      {t.messagesCount(g.count)}
                    </span>
                  ) : null}
                  <div className="text-xs text-neutral-400">{g.email}</div>
                  {g.latest.phone ? <div className="text-xs text-neutral-400">{g.latest.phone}</div> : null}
                </td>
                <td className="px-4 py-3 text-neutral-300 max-w-md">
                  <p className="line-clamp-3 whitespace-pre-wrap">{g.latest.message}</p>
                </td>
                <td className="px-4 py-3 text-neutral-400 whitespace-nowrap">
                  {formatDate(g.latest.createdAt, lang)}
                </td>
                <td className="px-4 py-3">
                  <StatusSelect submissionId={g.latest.id} status={g.latest.status} />
                </td>
                <td className="px-4 py-3">
                  <AssigneeSelect
                    submissionId={g.latest.id}
                    assignedToId={g.latest.assignedToId}
                    staff={staff}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {groups.length === 0 ? (
          <div className="px-4 py-6 text-sm text-neutral-400">
            {q ? t.noResultsSearch : t.noSubmissions}
          </div>
        ) : null}
      </div>
    </div>
  )
}
