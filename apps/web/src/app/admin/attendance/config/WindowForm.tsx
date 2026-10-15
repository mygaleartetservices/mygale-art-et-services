'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { setAttendanceWindow } from './actions'
import { useAdminT } from '@/lib/locale'

const initialState = { error: '' as string | undefined }

function SubmitButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      className="rounded-lg bg-[#1f44c9] text-white hover:bg-[#1937a6] px-4 py-2 text-sm font-semibold disabled:opacity-60"
      disabled={pending}
    >
      {pending ? pendingLabel : label}
    </button>
  )
}

export default function WindowForm({
  departmentId,
  windowStart,
  windowEnd,
}: {
  departmentId: string | null
  windowStart: string
  windowEnd: string
}) {
  const [state, formAction] = useActionState(setAttendanceWindow, initialState)
  const adminT = useAdminT()
  const t = adminT.attendanceConfig

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="departmentId" value={departmentId ?? ''} />
      <div>
        <label className="block text-xs text-neutral-400">{t.windowStart}</label>
        <input
          type="time"
          name="windowStart"
          defaultValue={windowStart}
          required
          className="mt-1 rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-sm"
        />
      </div>
      <div>
        <label className="block text-xs text-neutral-400">{t.windowEnd}</label>
        <input
          type="time"
          name="windowEnd"
          defaultValue={windowEnd}
          required
          className="mt-1 rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-sm"
        />
      </div>
      <SubmitButton label={t.saveWindow} pendingLabel={adminT.common.saving} />
      {state.error ? <p className="w-full text-xs text-red-300">{state.error}</p> : null}
    </form>
  )
}
