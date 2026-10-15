'use client'

import { useState } from 'react'
import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { createSocialLink, updateSocialLink } from './actions'
import { useAdminT } from '@/lib/locale'

const initialState = { error: '' as string | undefined }

const PLATFORMS = ['FACEBOOK', 'INSTAGRAM', 'WHATSAPP', 'LINKEDIN', 'TIKTOK', 'X', 'YOUTUBE', 'OTHER']

type SocialLinkFormData = {
  id?: string
  platform: string
  label: string
  url: string
  visible: boolean
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

export default function SocialLinkForm({
  mode,
  initial,
}: {
  mode: 'create' | 'edit'
  initial?: SocialLinkFormData
}) {
  const [platform, setPlatform] = useState(initial?.platform ?? 'FACEBOOK')
  const [label, setLabel] = useState(initial?.label ?? '')
  const [url, setUrl] = useState(initial?.url ?? '')
  const [visible, setVisible] = useState(initial?.visible ?? true)

  const action = mode === 'create' ? createSocialLink : updateSocialLink
  const [state, formAction] = useActionState(action, initialState)
  const adminT = useAdminT()
  const t = adminT.socialLinks
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
          <label className="text-sm text-neutral-300">{t.platformLabel}</label>
          <select
            name="platform"
            className="mt-1 w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2"
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
            required
          >
            {PLATFORMS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm text-neutral-300">{t.labelLabel}</label>
          <input
            name="label"
            className="mt-1 w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder={t.labelPlaceholder}
          />
        </div>
      </div>

      <div>
        <label className="text-sm text-neutral-300">{t.urlLabel}</label>
        <input
          name="url"
          className="mt-1 w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          required
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-neutral-300">
        <input
          type="checkbox"
          name="visible"
          className="h-4 w-4"
          checked={visible}
          onChange={(e) => setVisible(e.target.checked)}
        />
        {t.visibleCheckbox}
      </label>

      <SubmitButton
        label={mode === 'create' ? t.addButton : common.saveChanges}
        pendingLabel={common.saving}
      />
    </form>
  )
}
