'use client'

import { useState } from 'react'
import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { createAnnouncement, updateAnnouncement } from './actions'
import { uploadMedia } from '@/lib/mediaClient'
import { useAdminT } from '@/lib/locale'
import AdminFileInput from '@/components/admin/AdminFileInput'

const initialState = { error: '' as string | undefined }

type AnnouncementFormData = {
  id?: string
  title: string
  message: string
  imageUrl?: string | null
  type: 'info' | 'warning' | 'promo'
  active: boolean
  startsAt?: Date | null
  endsAt?: Date | null
  dismissible: boolean
}

function formatDateTime(value?: Date | null) {
  if (!value) return ''
  const iso = new Date(value).toISOString()
  return iso.slice(0, 16)
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

export default function AnnouncementForm({
  mode,
  initial,
}: {
  mode: 'create' | 'edit'
  initial?: AnnouncementFormData
}) {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [message, setMessage] = useState(initial?.message ?? '')
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl ?? '')
  const [type, setType] = useState<AnnouncementFormData['type']>(initial?.type ?? 'info')
  const [active, setActive] = useState(initial?.active ?? true)
  const [startsAt, setStartsAt] = useState(formatDateTime(initial?.startsAt))
  const [endsAt, setEndsAt] = useState(formatDateTime(initial?.endsAt))
  const [dismissible, setDismissible] = useState(initial?.dismissible ?? true)
  const [uploading, setUploading] = useState(false)

  const action = mode === 'create' ? createAnnouncement : updateAnnouncement
  const [state, formAction] = useActionState(action, initialState)
  const adminT = useAdminT()
  const t = adminT.announcements
  const common = adminT.common

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const result = await uploadMedia(file, 'announcements')
    setUploading(false)
    if (result.ok && result.url) {
      setImageUrl(result.url)
    } else {
      alert(result.error || common.uploadFailed)
    }
  }

  return (
    <form action={formAction} className="space-y-6">
      {state.error ? (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {state.error}
        </div>
      ) : null}

      {mode === 'edit' && initial?.id ? <input type="hidden" name="id" value={initial.id} /> : null}

      <div>
        <label className="text-sm text-neutral-300">{t.titleLabel}</label>
        <input
          name="title"
          className="mt-1 w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>

      <div>
        <label className="text-sm text-neutral-300">{t.messageLabel}</label>
        <textarea
          name="message"
          className="mt-1 w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2"
          rows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
        />
      </div>

      {/* Banner Image Upload */}
      <div>
        <label className="text-sm text-neutral-300">{t.bannerImage}</label>
        <div className="mt-1 flex items-center gap-3">
          <AdminFileInput accept="image/*" onChange={handleFileChange} disabled={uploading} />
          {uploading && <span className="text-xs text-neutral-400">{common.uploading}</span>}
        </div>
        {imageUrl && (
          <div className="mt-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt="Banner preview"
              className="h-24 rounded border border-neutral-700 object-cover"
            />
          </div>
        )}
        <input type="hidden" name="imageUrl" value={imageUrl} />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <label className="text-sm text-neutral-300">{t.typeLabel}</label>
          <select
            name="type"
            className="mt-1 w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2"
            value={type}
            onChange={(e) => setType(e.target.value as AnnouncementFormData['type'])}
          >
            <option value="info">{t.typeInfo}</option>
            <option value="warning">{t.typeWarning}</option>
            <option value="promo">{t.typePromo}</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            name="active"
            className="h-4 w-4"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
          />
          <label className="text-sm text-neutral-300">{t.activeCheckbox}</label>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            name="dismissible"
            className="h-4 w-4"
            checked={dismissible}
            onChange={(e) => setDismissible(e.target.checked)}
          />
          <label className="text-sm text-neutral-300">{t.dismissibleCheckbox}</label>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="text-sm text-neutral-300">{t.startDate}</label>
          <input
            type="datetime-local"
            name="startsAt"
            className="mt-1 w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2"
            value={startsAt}
            onChange={(e) => setStartsAt(e.target.value)}
          />
        </div>
        <div>
          <label className="text-sm text-neutral-300">{t.endDate}</label>
          <input
            type="datetime-local"
            name="endsAt"
            className="mt-1 w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2"
            value={endsAt}
            onChange={(e) => setEndsAt(e.target.value)}
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <SubmitButton
          label={mode === 'create' ? t.createButton : common.saveChanges}
          pendingLabel={common.saving}
        />
        <span className="text-xs text-neutral-400">{common.fieldsRequired}</span>
      </div>
    </form>
  )
}
