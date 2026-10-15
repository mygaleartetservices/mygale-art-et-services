import { notFound } from 'next/navigation'
import Link from 'next/link'
import prisma from '@/lib/prisma'
import StatusChip from '@/components/StatusChip'
import { StatusSelect, AssigneeSelect } from '../SubmissionRowControls'
import { getAdminT, getLocale } from '@/lib/getLocale'
import type { Lang } from '@/lib/locale'
import ReplyForm from './ReplyForm'

function formatDate(value: Date, lang: Lang) {
  return new Intl.DateTimeFormat(lang === 'fr' ? 'fr-FR' : 'en-GB', { dateStyle: 'medium', timeStyle: 'short' }).format(
    value,
  )
}

export default async function ContactSubmissionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const lang = await getLocale()
  const { id } = await params
  const [submission, staff, adminT] = await Promise.all([
    prisma.contactSubmission.findUnique({
      where: { id },
      include: {
        assignedTo: { select: { id: true, name: true } },
        replies: { orderBy: { sentAt: 'desc' } },
      },
    }),
    prisma.user.findMany({
      where: { role: { in: ['SUPER_ADMIN', 'ADMIN', 'EDITOR', 'STAFF'] } },
      select: { id: true, name: true },
    }),
    getAdminT(),
  ])

  if (!submission) {
    notFound()
  }
  const t = adminT.contactSubmissions
  const channelLabel = t.channelLabels as Record<string, string>

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/contact-submissions" className="text-sm text-neutral-400 hover:underline">
          {t.backToInbox}
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">{submission.name}</h1>
        <p className="text-sm text-neutral-400">
          {submission.email}
          {submission.phone ? ` · ${submission.phone}` : ''}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-[1fr_260px]">
        <div className="space-y-6">
          <div className="rounded-xl border border-neutral-800 p-4">
            <h2 className="mb-2 text-sm font-semibold text-neutral-200">{t.messageSectionTitle}</h2>
            <p className="whitespace-pre-wrap text-neutral-300">{submission.message}</p>
            <p className="mt-3 text-xs text-neutral-500">
              {t.receivedLabel} {formatDate(submission.createdAt, lang)}
              {submission.source ? ` · ${submission.source}` : ''}
            </p>
          </div>

          <ReplyForm submissionId={submission.id} />

          <div className="rounded-xl border border-neutral-800 p-4">
            <h2 className="mb-3 text-sm font-semibold text-neutral-200">{t.replyHistoryTitle}</h2>
            {submission.replies.length === 0 ? (
              <p className="text-sm text-neutral-500">{t.noReplies}</p>
            ) : (
              <ul className="space-y-3">
                {submission.replies.map((reply) => (
                  <li key={reply.id} className="rounded-lg border border-neutral-800 p-3">
                    <div className="flex items-center justify-between text-xs text-neutral-500">
                      <span>{channelLabel[reply.channel] || reply.channel}</span>
                      <span>{formatDate(reply.sentAt, lang)}</span>
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-sm text-neutral-300">{reply.body}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-neutral-800 p-4 space-y-3">
            <div>
              <div className="text-xs text-neutral-500">{t.statusLabel}</div>
              <div className="mt-1 flex items-center gap-2">
                <StatusChip
                  status={submission.status}
                  label={t.statusTabs[submission.status as keyof typeof t.statusTabs]}
                />
              </div>
              <div className="mt-2">
                <StatusSelect submissionId={submission.id} status={submission.status} />
              </div>
            </div>
            <div>
              <div className="text-xs text-neutral-500">{t.assigneeLabel}</div>
              <div className="mt-1">
                <AssigneeSelect
                  submissionId={submission.id}
                  assignedToId={submission.assignedToId}
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
