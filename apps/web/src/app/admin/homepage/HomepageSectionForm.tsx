'use client'

import { useState } from 'react'
import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { updateHomepageSection } from './actions'
import MediaPicker from '@/components/admin/MediaPicker'
import { useAdminT } from '@/lib/locale'

const initialState = { error: '' as string | undefined }

type HomepageSectionFormData = {
  id: string
  type: 'HERO' | 'SERVICES_GRID' | 'ABOUT' | 'MAP' | 'STATS' | 'PARTNERS' | 'TESTIMONIALS'
  titleFr: string
  titleEn: string
  subtitleFr: string
  subtitleEn: string
  bodyFr: string
  bodyEn: string
  ctaLabelFr: string
  ctaLabelEn: string
  ctaHref: string
  mediaUrl: string
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

export default function HomepageSectionForm({ initial }: { initial: HomepageSectionFormData }) {
  const [titleFr, setTitleFr] = useState(initial.titleFr)
  const [titleEn, setTitleEn] = useState(initial.titleEn)
  const [subtitleFr, setSubtitleFr] = useState(initial.subtitleFr)
  const [subtitleEn, setSubtitleEn] = useState(initial.subtitleEn)
  const [bodyFr, setBodyFr] = useState(initial.bodyFr)
  const [bodyEn, setBodyEn] = useState(initial.bodyEn)
  const [ctaLabelFr, setCtaLabelFr] = useState(initial.ctaLabelFr)
  const [ctaLabelEn, setCtaLabelEn] = useState(initial.ctaLabelEn)
  const [ctaHref, setCtaHref] = useState(initial.ctaHref)
  const [mediaUrl, setMediaUrl] = useState(initial.mediaUrl)
  const [mediaKey, setMediaKey] = useState('')

  const [state, formAction] = useActionState(updateHomepageSection, initialState)
  const adminT = useAdminT()
  const t = adminT.homepage
  const common = adminT.common

  return (
    <form action={formAction} className="space-y-6">
      {state.error ? (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {state.error}
        </div>
      ) : null}

      <input type="hidden" name="id" value={initial.id} />
      <input type="hidden" name="mediaKey" value={mediaKey} />
      <input type="hidden" name="mediaUrl" value={mediaUrl} />

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="text-sm text-neutral-300">{t.titleFr}</label>
          <input
            name="titleFr"
            className="mt-1 w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2"
            value={titleFr}
            onChange={(e) => setTitleFr(e.target.value)}
          />
        </div>
        <div>
          <label className="text-sm text-neutral-300">{t.titleEn}</label>
          <input
            name="titleEn"
            className="mt-1 w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2"
            value={titleEn}
            onChange={(e) => setTitleEn(e.target.value)}
          />
        </div>
      </div>

      {initial.type === 'HERO' ? (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm text-neutral-300">{t.subtitleFr}</label>
              <textarea
                name="subtitleFr"
                rows={3}
                className="mt-1 w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2"
                value={subtitleFr}
                onChange={(e) => setSubtitleFr(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm text-neutral-300">{t.subtitleEn}</label>
              <textarea
                name="subtitleEn"
                rows={3}
                className="mt-1 w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2"
                value={subtitleEn}
                onChange={(e) => setSubtitleEn(e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="text-sm text-neutral-300">{t.ctaLabelFr}</label>
              <input
                name="ctaLabelFr"
                className="mt-1 w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2"
                value={ctaLabelFr}
                onChange={(e) => setCtaLabelFr(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm text-neutral-300">{t.ctaLabelEn}</label>
              <input
                name="ctaLabelEn"
                className="mt-1 w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2"
                value={ctaLabelEn}
                onChange={(e) => setCtaLabelEn(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm text-neutral-300">{t.ctaLink}</label>
              <input
                name="ctaHref"
                className="mt-1 w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2"
                value={ctaHref}
                onChange={(e) => setCtaHref(e.target.value)}
              />
            </div>
          </div>

          <MediaPicker
            label={t.backgroundImage}
            folder="homepage"
            url={mediaUrl}
            onChange={(url, key) => {
              setMediaUrl(url)
              setMediaKey(key)
            }}
          />
        </>
      ) : null}

      {initial.type === 'ABOUT' ? (
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm text-neutral-300">{t.bodyFr}</label>
            <textarea
              name="bodyFr"
              rows={5}
              className="mt-1 w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2"
              value={bodyFr}
              onChange={(e) => setBodyFr(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm text-neutral-300">{t.bodyEn}</label>
            <textarea
              name="bodyEn"
              rows={5}
              className="mt-1 w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2"
              value={bodyEn}
              onChange={(e) => setBodyEn(e.target.value)}
            />
          </div>
        </div>
      ) : null}

      {initial.type === 'MAP' ? (
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm text-neutral-300">{t.mapButtonLabelFr}</label>
            <input
              name="ctaLabelFr"
              className="mt-1 w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2"
              value={ctaLabelFr}
              onChange={(e) => setCtaLabelFr(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm text-neutral-300">{t.mapButtonLabelEn}</label>
            <input
              name="ctaLabelEn"
              className="mt-1 w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2"
              value={ctaLabelEn}
              onChange={(e) => setCtaLabelEn(e.target.value)}
            />
          </div>
          <p className="text-xs text-neutral-500 md:col-span-2">{t.mapNote}</p>
        </div>
      ) : null}

      {initial.type === 'SERVICES_GRID' ? (
        <p className="text-xs text-neutral-500">{t.servicesGridNote}</p>
      ) : null}

      <SubmitButton label={t.saveChanges} pendingLabel={common.saving} />
    </form>
  )
}
