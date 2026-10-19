'use client'

import { useState } from 'react'
import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { sendReply } from './actions'
import { useAdminT } from '@/lib/locale'

const initialState = { error: '' as string | undefined }

function SubmitButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      className="rounded-lg bg-[#1f44c9] text-white hover:bg-[#1937a6] px-5 py-2 text-white font-semibold disabled:opacity-60"
      disabled={pending}
    >
      {pending ? pendingLabel : label}
    </button>
  )
}

export default function ReplyForm({
  submissionId,
  returnTo,
}: {
  submissionId: string
  returnTo?: string
}) {
  const [channel, setChannel] = useState<'email' | 'phone' | 'whatsapp' | 'note'>('email')
  const [body, setBody] = useState('')
  const [state, formAction] = useActionState(sendReply, initialState)
  const t = useAdminT().replyForm

  return (
    <form action={formAction} className="space-y-4 rounded-xl border border-neutral-800 p-4">
      {state.error ? (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {state.error}
        </div>
      ) : null}

      <input type="hidden" name="submissionId" value={submissionId} />
      {returnTo ? <input type="hidden" name="returnTo" value={returnTo} /> : null}

      <div>
        <label className="text-sm text-neutral-300">{t.channelLabel}</label>
        <select
          name="channel"
          className="mt-1 w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2"
          value={channel}
          onChange={(e) => setChannel(e.target.value as typeof channel)}
        >
          <option value="email">{t.channelEmail}</option>
          <option value="phone">{t.channelPhone}</option>
          <option value="whatsapp">{t.channelWhatsapp}</option>
          <option value="note">{t.channelNote}</option>
        </select>
      </div>

      <div>
        <label className="text-sm text-neutral-300">{t.messageLabel}</label>
        <textarea
          name="body"
          rows={5}
          required
          className="mt-1 w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2"
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
      </div>

      <SubmitButton label={t.sendReply} pendingLabel={t.sending} />
    </form>
  )
}
