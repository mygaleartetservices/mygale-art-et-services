import { notFound } from 'next/navigation'
import Link from 'next/link'
import prisma from '@/lib/prisma'
import StatusChip from '@/components/StatusChip'
import { StatusSelect, AssigneeSelect } from '../../SubmissionRowControls'
import { getAdminT, getLocale } from '@/lib/getLocale'
import type { Lang } from '@/lib/locale'
import ReplyForm from '../../[id]/ReplyForm'

function formatDate(value: Date, lang: Lang) {
  return new Intl.DateTimeFormat(lang === 'fr' ? 'fr-FR' : 'en-GB', { dateStyle: 'medium', timeStyle: 'short' }).format(
    value,
  )
}

type TimelineItem =
  | { kind: 'submission'; id: string; at: Date; message: string; source: string | null }
  | { kind: 'reply'; id: string; at: Date; body: string; channel: string }

export default async function ContactThreadPage({
  params,
}: {
  params: Promise<{ email: string }>
}) {
  const lang = await getLocale()
  const { email: rawEmail } = await params
  // Route params come through percent-encoded here (confirmed empirically —
  // Next 16 does not auto-decode this segment), so decode explicitly.
  const email = decodeURIComponent(rawEmail)

  const [submissions, staff, adminT] = await Promise.all([
    prisma.contactSubmission.findMany({
      where: { email: { equals: email, mode: 'insensitive' } },
      orderBy: { createdAt: 'asc' },
      include: {
        replies: { orderBy: { sentAt: 'asc' } },
        assignedTo: { select: { id: true, name: true } },
      },
    }),
    prisma.user.findMany({
      where: { role: { in: ['SUPER_ADMIN', 'ADMIN', 'EDITOR', 'STAFF'] } },
      select: { id: true, name: true },
    }),
    getAdminT(),
  ])

  if (submissions.length === 0) {
    notFound()
  }
  const t = adminT.contactSubmissions
  const channelLabel = t.channelLabels as Record<string, string>

  const latest = submissions[submissions.length - 1]
  const returnTo = `/admin/contact-submissions/thread/${encodeURIComponent(email)}`

  const timeline: TimelineItem[] = []
  for (const s of submissions) {
    timeline.push({ kind: 'submission', id: s.id, at: s.createdAt, message: s.message, source: s.source })
    for (const r of s.replies) {
      timeline.push({ kind: 'reply', id: r.id, at: r.sentAt, body: r.body, channel: r.channel })
    }
  }
  timeline.sort((a, b) => a.at.getTime() - b.at.getTime())

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/contact-submissions" className="text-sm text-neutral-400 hover:underline">
          {t.backToInbox}
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">{latest.name}</h1>
        <p className="text-sm text-neutral-400">
          {latest.email}
          {latest.phone ? ` · ${latest.phone}` : ''}
          {submissions.length > 1 ? ` · ${t.messagesCount(submissions.length)}` : ''}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-[1fr_260px]">
        <div className="space-y-6">
          <div className="space-y-3">
            {timeline.map((item) =>
              item.kind === 'submission' ? (
                <div key={`s-${item.id}`} className="rounded-xl border border-neutral-800 p-4">
                  <div className="flex items-center justify-between text-xs text-neutral-500">
                    <span>{t.messageFrom(latest.name)}</span>
                    <span>{formatDate(item.at, lang)}</span>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-neutral-300">{item.message}</p>
                </div>
              ) : (
                <div
                  key={`r-${item.id}`}
                  className="ml-6 rounded-xl border border-[#003366]/40 bg-[#1f44c9] text-white hover:bg-[#1937a6]/10 p-4"
                >
                  <div className="flex items-center justify-between text-xs text-neutral-400">
                    <span>{t.replyPrefix} · {channelLabel[item.channel] || item.channel}</span>
                    <span>{formatDate(item.at, lang)}</span>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-neutral-200">{item.body}</p>
                </div>
              ),
            )}
          </div>

          <ReplyForm submissionId={latest.id} returnTo={returnTo} />
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-neutral-800 p-4 space-y-3">
            <div>
              <div className="text-xs text-neutral-500">{t.statusLabel}</div>
              <div className="mt-1 flex items-center gap-2">
                <StatusChip
                  status={latest.status}
                  label={t.statusTabs[latest.status as keyof typeof t.statusTabs]}
                />
              </div>
              <div className="mt-2">
                <StatusSelect submissionId={latest.id} status={latest.status} />
              </div>
            </div>
            <div>
              <div className="text-xs text-neutral-500">{t.assigneeLabel}</div>
              <div className="mt-1">
                <AssigneeSelect
                  submissionId={latest.id}
                  assignedToId={latest.assignedToId}
                  staff={staff}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
