'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { correctAttendance } from './actions'
import { useAdminT } from '@/lib/locale'

const initialState = { error: '' as string | undefined }

function SubmitButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      className="rounded-lg bg-[#003366] px-5 py-2 text-sm font-semibold disabled:opacity-60"
      disabled={pending}
    >
      {pending ? pendingLabel : label}
    </button>
  )
}

export default function CorrectForm({
  id,
  arrivalTime,
  departureTime,
}: {
  id: string
  arrivalTime: string
  departureTime: string
}) {
  const [state, formAction] = useActionState(correctAttendance, initialState)
  const adminT = useAdminT()
  const t = adminT.attendanceCorrect

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="id" value={id} />

      {state.error ? (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {state.error}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-sm text-neutral-300">{t.arrivalTime}</label>
          <input
            type="time"
            name="arrivalTime"
            defaultValue={arrivalTime}
            required
            className="mt-1 w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2"
          />
        </div>
        <div>
          <label className="text-sm text-neutral-300">{t.departureTime}</label>
          <input
            type="time"
            name="departureTime"
            defaultValue={departureTime}
            className="mt-1 w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2"
          />
        </div>
      </div>

      <div>
        <label className="text-sm text-neutral-300">{t.reason}</label>
        <textarea
          name="note"
          required
          rows={3}
          className="mt-1 w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2"
          placeholder={t.reasonPlaceholder}
        />
      </div>

      <SubmitButton label={t.saveCorrection} pendingLabel={adminT.common.saving} />
    </form>
  )
}
