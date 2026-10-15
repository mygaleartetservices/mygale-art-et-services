'use client'

import { useState } from 'react'
import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { createRedirect, updateRedirect } from './actions'
import { useAdminT } from '@/lib/locale'

const initialState = { error: '' as string | undefined }

type RedirectFormData = {
  id?: string
  fromPath: string
  toPath: string
  statusCode: number
  active: boolean
}

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

export default function RedirectForm({
  mode,
  initial,
}: {
  mode: 'create' | 'edit'
  initial?: RedirectFormData
}) {
  const [fromPath, setFromPath] = useState(initial?.fromPath ?? '')
  const [toPath, setToPath] = useState(initial?.toPath ?? '')
  const [statusCode, setStatusCode] = useState(initial?.statusCode ?? 308)
  const [active, setActive] = useState(initial?.active ?? true)

  const action = mode === 'create' ? createRedirect : updateRedirect
  const [state, formAction] = useActionState(action, initialState)
  const adminT = useAdminT()
  const t = adminT.redirects
  const common = adminT.common

  return (
    <form action={formAction} className="space-y-6">
      {state.error ? (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {state.error}
        </div>
      ) : null}

      {mode === 'edit' && initial?.id ? <input type="hidden" name="id" value={initial.id} /> : null}

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="text-sm text-neutral-300">{t.fromPathLabel}</label>
          <input
            name="fromPath"
            placeholder="/old-page"
            className="mt-1 w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2"
            value={fromPath}
            onChange={(e) => setFromPath(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="text-sm text-neutral-300">{t.toPathLabel}</label>
          <input
            name="toPath"
            placeholder="/new-page or https://..."
            className="mt-1 w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2"
            value={toPath}
            onChange={(e) => setToPath(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="text-sm text-neutral-300">{t.statusCodeLabel}</label>
          <select
            name="statusCode"
            className="mt-1 w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2"
            value={statusCode}
            onChange={(e) => setStatusCode(Number(e.target.value))}
          >
            <option value={308}>{t.statusPermanentMethod}</option>
            <option value={301}>{t.statusPermanent}</option>
            <option value={302}>{t.statusTemporary}</option>
          </select>
        </div>
        <label className="flex items-center gap-2 text-sm text-neutral-300 mt-6">
          <input
            type="checkbox"
            name="active"
            className="h-4 w-4"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
          />
          {t.activeCheckbox}
        </label>
      </div>

      <SubmitButton
        label={mode === 'create' ? t.createButton : common.saveChanges}
        pendingLabel={common.saving}
      />
    </form>
  )
}
