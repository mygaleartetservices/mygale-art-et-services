'use client'

import { useState } from 'react'
import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { updateNavigationItem } from './actions'
import { useAdminT } from '@/lib/locale'

const initialState = { error: '' as string | undefined }

type NavigationItemFormData = {
  id: string
  labelFr: string
  labelEn: string
  href: string
  linkType: string
  openInNewTab: boolean
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

export default function NavigationItemForm({ initial }: { initial: NavigationItemFormData }) {
  const [labelFr, setLabelFr] = useState(initial.labelFr)
  const [labelEn, setLabelEn] = useState(initial.labelEn)
  const [href, setHref] = useState(initial.href)
  const [openInNewTab, setOpenInNewTab] = useState(initial.openInNewTab)

  const [state, formAction] = useActionState(updateNavigationItem, initialState)
  const adminT = useAdminT()
  const t = adminT.navigation
  const common = adminT.common

  return (
    <form action={formAction} className="space-y-6">
      {state.error ? (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {state.error}
        </div>
      ) : null}

      <input type="hidden" name="id" value={initial.id} />

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="text-sm text-neutral-300">{t.labelFr}</label>
          <input
            name="labelFr"
            className="mt-1 w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2"
            value={labelFr}
            onChange={(e) => setLabelFr(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="text-sm text-neutral-300">{t.labelEn}</label>
          <input
            name="labelEn"
            className="mt-1 w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2"
            value={labelEn}
            onChange={(e) => setLabelEn(e.target.value)}
            required
          />
        </div>
      </div>

      {initial.linkType !== 'SERVICES_DROPDOWN' ? (
        <div>
          <label className="text-sm text-neutral-300">{t.linkLabel}</label>
          <input
            name="href"
            className="mt-1 w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2"
            value={href}
            onChange={(e) => setHref(e.target.value)}
          />
        </div>
      ) : (
        <p className="text-xs text-neutral-500">{t.servicesDropdownNote}</p>
      )}

      <label className="flex items-center gap-2 text-sm text-neutral-300">
        <input
          type="checkbox"
          name="openInNewTab"
          className="h-4 w-4"
          checked={openInNewTab}
          onChange={(e) => setOpenInNewTab(e.target.checked)}
        />
        {t.openInNewTab}
      </label>

      <SubmitButton label={common.saveChanges} pendingLabel={common.saving} />
    </form>
  )
}
