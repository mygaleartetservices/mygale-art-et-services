'use client'

import { updateSubmissionStatus, assignSubmission } from './actions'
import { useAdminT } from '@/lib/locale'

const STATUSES = ['new', 'in_review', 'responded', 'closed'] as const

export function StatusSelect({
  submissionId,
  status,
}: {
  submissionId: string
  status: string
}) {
  const adminT = useAdminT()
  const t = adminT.contactSubmissions
  // One control that is also the status badge: the table used to show a
  // coloured chip and, under it, a select repeating the same word.
  const tone: Record<string, string> = {
    new: 'border-[#1f44c9]/70 bg-[#1f44c9]/20 text-white',
    in_review: 'border-amber-500/50 bg-amber-500/10 text-amber-100',
    responded: 'border-emerald-500/50 bg-emerald-500/10 text-emerald-100',
    closed: 'border-neutral-700 bg-neutral-900 text-neutral-400',
  }
  return (
    <form action={updateSubmissionStatus}>
      <input type="hidden" name="id" value={submissionId} />
      <select
        name="status"
        aria-label={adminT.common.status}
        defaultValue={status}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className={`min-h-9 rounded-full border px-3 py-1 text-xs font-semibold ${tone[status] ?? tone.closed}`}
      >
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {t.statusTabs[s]}
          </option>
        ))}
      </select>
    </form>
  )
}

export function AssigneeSelect({
  submissionId,
  assignedToId,
  staff,
}: {
  submissionId: string
  assignedToId: string | null
  staff: { id: string; name: string }[]
}) {
  const t = useAdminT().contactSubmissions
  return (
    <form action={assignSubmission}>
      <input type="hidden" name="id" value={submissionId} />
      <select
        name="assignedToId"
        defaultValue={assignedToId || ''}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className="rounded border border-neutral-700 bg-neutral-900 px-2 py-1 text-xs"
      >
        <option value="">{t.unassigned}</option>
        {staff.map((u) => (
          <option key={u.id} value={u.id}>
            {u.name}
          </option>
        ))}
      </select>
    </form>
  )
}
