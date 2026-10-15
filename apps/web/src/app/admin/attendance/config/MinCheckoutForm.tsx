'use client'

import { useActionState } from 'react'
import { setMinCheckoutMinutes } from './actions'
import { useAdminT } from '@/lib/locale'

export default function MinCheckoutForm({ minutes }: { minutes: number }) {
  const [state, formAction, pending] = useActionState(setMinCheckoutMinutes, {
    error: '' as string | undefined,
  })
  const adminT = useAdminT()
  const t = adminT.attendanceConfig

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <div>
        <label className="block text-xs text-neutral-400">{t.minCheckoutLabel}</label>
        <input
          type="number"
          name="minCheckoutMinutes"
          min={0}
          max={240}
          step={1}
          defaultValue={minutes}
          required
          className="mt-1 w-24 rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-sm"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-[#1f44c9] text-white hover:bg-[#1937a6] px-4 py-2 text-sm font-semibold disabled:opacity-60"
      >
        {pending ? adminT.common.saving : t.saveMinCheckout}
      </button>
      <p className="w-full text-xs text-neutral-500">{t.minCheckoutHelp}</p>
      {state.error ? <p className="w-full text-xs text-red-300">{state.error}</p> : null}
    </form>
  )
}
