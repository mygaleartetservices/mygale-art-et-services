'use client'

import { useActionState, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { checkInAttendance, checkOutAttendance } from './actions'
import { formatClockTime } from '@/lib/timezone'
import { useAdminT } from '@/lib/locale'

type Recorded = { arrivalAt: string; status: 'ON_TIME' | 'LATE'; departureAt: string | null }

const checkInInitialState: {
  error?: string
  result?: { arrivalAt: string; status: 'ON_TIME' | 'LATE'; alreadyRecorded: boolean }
} = {}

const checkOutInitialState: {
  error?: string
  result?: { departureAt: string; alreadyRecorded: boolean }
} = {}

function SubmitButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      className="w-full rounded-lg bg-[#003366] px-5 py-3 text-base font-semibold text-white disabled:opacity-60"
      disabled={pending}
    >
      {pending ? pendingLabel : label}
    </button>
  )
}

/**
 * Owns the transition from "not checked in" -> "checked in" -> "checked out"
 * entirely on the client. The check-in/check-out server actions still do the
 * real work (and still can't be trusted to run twice), but display state
 * lives here instead of depending on the parent Server Component
 * re-rendering — a revalidatePath driven parent re-render can otherwise swap
 * this component out before its own confirmation ever paints.
 */
export default function AttendancePanel({ initialRecord }: { initialRecord: Recorded | null }) {
  const t = useAdminT().myAttendance
  const [record, setRecord] = useState<Recorded | null>(initialRecord)
  const [justRecorded, setJustRecorded] = useState<'in' | 'out' | null>(null)
  const [checkInState, checkInFormAction] = useActionState(checkInAttendance, checkInInitialState)
  const [checkOutState, checkOutFormAction] = useActionState(
    checkOutAttendance,
    checkOutInitialState,
  )

  if (checkInState.result && (!record || checkInState.result.arrivalAt !== record.arrivalAt)) {
    setRecord({
      arrivalAt: checkInState.result.arrivalAt,
      status: checkInState.result.status,
      departureAt: null,
    })
    setJustRecorded(checkInState.result.alreadyRecorded ? null : 'in')
  }

  if (
    checkOutState.result &&
    record &&
    checkOutState.result.departureAt !== record.departureAt
  ) {
    setRecord({ ...record, departureAt: checkOutState.result.departureAt })
    setJustRecorded(checkOutState.result.alreadyRecorded ? null : 'out')
  }

  if (record?.departureAt) {
    return (
      <div
        className={`rounded-lg border px-4 py-3 text-sm ${
          record.status === 'ON_TIME'
            ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
            : 'border-amber-500/40 bg-amber-500/10 text-amber-200'
        }`}
      >
        <p className="font-semibold">
          {justRecorded === 'out' ? t.departureRecordedNow : t.departureRecordedAlready}
        </p>
        <p className="mt-1">
          {t.arrival} {formatClockTime(new Date(record.arrivalAt))}
        </p>
        <p>
          {t.departure} {formatClockTime(new Date(record.departureAt))}
        </p>
        <p>
          {t.status} {record.status === 'ON_TIME' ? t.onTime : t.late}
        </p>
        <p className="mt-2 text-xs text-neutral-400">{t.dayComplete}</p>
      </div>
    )
  }

  if (record) {
    return (
      <div className="space-y-4">
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            record.status === 'ON_TIME'
              ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
              : 'border-amber-500/40 bg-amber-500/10 text-amber-200'
          }`}
        >
          <p className="font-semibold">{justRecorded === 'in' ? t.recordedNow : t.recordedAlready}</p>
          <p className="mt-1">
            {t.arrival} {formatClockTime(new Date(record.arrivalAt))}
          </p>
          <p>
            {t.status} {record.status === 'ON_TIME' ? t.onTime : t.late}
          </p>
        </div>

        <p className="text-sm text-neutral-400">{t.departurePrompt}</p>
        <form action={checkOutFormAction}>
          <SubmitButton label={t.signOut} pendingLabel={t.recordingOut} />
        </form>
        {checkOutState.error ? (
          <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {checkOutState.error}
          </div>
        ) : null}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-neutral-400">{t.prompt}</p>
      <form action={checkInFormAction}>
        <SubmitButton label={t.scan} pendingLabel={t.recording} />
      </form>
      {checkInState.error ? (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {checkInState.error}
        </div>
      ) : null}
    </div>
  )
}
