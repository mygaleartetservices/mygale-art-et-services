'use client'

import { useEffect, useMemo, useState } from 'react'
import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import slugify from 'slugify'
import { createService, updateService } from './actions'
import MediaPicker from '@/components/admin/MediaPicker'
import RichTextEditor from '@/components/admin/RichTextEditor'
import SortableList from '@/components/admin/SortableList'
import { SortableCard, DragHandle } from '@/components/admin/SortableRow'
import { useAdminT } from '@/lib/locale'

const initialState = { error: '' as string | undefined }

type SectionFormData = {
  key: string
  type: 'BULLET_LIST' | 'RICHTEXT'
  titleFr: string
  titleEn: string
  itemsFr: string // newline-separated in the UI
  itemsEn: string
  bodyFr: string
  bodyEn: string
  mediaKey: string
  mediaUrl: string
}

type ServiceFormData = {
  id?: string
  slug: string
  titleFr: string
  titleEn: string
  summaryFr: string
  summaryEn: string
  heroImageUrl: string
  seoTitleFr: string
  seoTitleEn: string
  seoDescriptionFr: string
  seoDescriptionEn: string
  order: number
  featured: boolean
  published: boolean
  sections: SectionFormData[]
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

function newSectionKey(existing: SectionFormData[]) {
  let i = existing.length + 1
  let key = `section-${i}`
  while (existing.some((s) => s.key === key)) {
    i += 1
    key = `section-${i}`
  }
  return key
}

export default function ServiceForm({
  mode,
  initial,
}: {
  mode: 'create' | 'edit'
  initial?: ServiceFormData
}) {
  const [titleFr, setTitleFr] = useState(initial?.titleFr ?? '')
  const [titleEn, setTitleEn] = useState(initial?.titleEn ?? '')
  const [slug, setSlug] = useState(initial?.slug ?? '')
  const [slugTouched, setSlugTouched] = useState(mode === 'edit')
  const [summaryFr, setSummaryFr] = useState(initial?.summaryFr ?? '')
  const [summaryEn, setSummaryEn] = useState(initial?.summaryEn ?? '')
  const [heroImageUrl, setHeroImageUrl] = useState(initial?.heroImageUrl ?? '')
  const [heroImageKey, setHeroImageKey] = useState('')
  const [seoTitleFr, setSeoTitleFr] = useState(initial?.seoTitleFr ?? '')
  const [seoTitleEn, setSeoTitleEn] = useState(initial?.seoTitleEn ?? '')
  const [seoDescriptionFr, setSeoDescriptionFr] = useState(initial?.seoDescriptionFr ?? '')
  const [seoDescriptionEn, setSeoDescriptionEn] = useState(initial?.seoDescriptionEn ?? '')
  const [order, setOrder] = useState(initial?.order ?? 0)
  const [featured, setFeatured] = useState(initial?.featured ?? true)
  const [published, setPublished] = useState(initial?.published ?? true)
  const [sections, setSections] = useState<SectionFormData[]>(initial?.sections ?? [])
  const adminT = useAdminT()
  const t = adminT.services
  const common = adminT.common

  useEffect(() => {
    if (!slugTouched) {
      setSlug(slugify(titleEn || titleFr, { lower: true, strict: true, trim: true }))
    }
  }, [titleFr, titleEn, slugTouched])

  // Autosave: long editing sessions periodically save a local draft, so a
  // closed tab or a crash doesn't lose an in-progress edit.
  const draftKey = `service-draft-${initial?.id ?? 'new'}`
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [pendingDraft, setPendingDraft] = useState<any | null>(null)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(draftKey)
      if (!raw) return
      const draft = JSON.parse(raw)
      if (!draft?.savedAt || Date.now() - draft.savedAt > 24 * 60 * 60 * 1000) {
        localStorage.removeItem(draftKey)
        return
      }
      setPendingDraft(draft)
    } catch {
      localStorage.removeItem(draftKey)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const timeout = setTimeout(() => {
      try {
        localStorage.setItem(
          draftKey,
          JSON.stringify({
            savedAt: Date.now(),
            titleFr,
            titleEn,
            slug,
            summaryFr,
            summaryEn,
            heroImageUrl,
            heroImageKey,
            seoTitleFr,
            seoTitleEn,
            seoDescriptionFr,
            seoDescriptionEn,
            order,
            featured,
            published,
            sections,
          }),
        )
      } catch {
        // localStorage may be unavailable (e.g. private browsing) — autosave is best-effort.
      }
    }, 1500)
    return () => clearTimeout(timeout)
  }, [
    draftKey,
    titleFr,
    titleEn,
    slug,
    summaryFr,
    summaryEn,
    heroImageUrl,
    heroImageKey,
    seoTitleFr,
    seoTitleEn,
    seoDescriptionFr,
    seoDescriptionEn,
    order,
    featured,
    published,
    sections,
  ])

  function applyDraft() {
    if (!pendingDraft) return
    setTitleFr(pendingDraft.titleFr ?? '')
    setTitleEn(pendingDraft.titleEn ?? '')
    setSlug(pendingDraft.slug ?? '')
    setSlugTouched(true)
    setSummaryFr(pendingDraft.summaryFr ?? '')
    setSummaryEn(pendingDraft.summaryEn ?? '')
    setHeroImageUrl(pendingDraft.heroImageUrl ?? '')
    setHeroImageKey(pendingDraft.heroImageKey ?? '')
    setSeoTitleFr(pendingDraft.seoTitleFr ?? '')
    setSeoTitleEn(pendingDraft.seoTitleEn ?? '')
    setSeoDescriptionFr(pendingDraft.seoDescriptionFr ?? '')
    setSeoDescriptionEn(pendingDraft.seoDescriptionEn ?? '')
    setOrder(pendingDraft.order ?? 0)
    setFeatured(pendingDraft.featured ?? true)
    setPublished(pendingDraft.published ?? true)
    if (Array.isArray(pendingDraft.sections)) setSections(pendingDraft.sections)
    setPendingDraft(null)
  }

  function dismissDraft() {
    localStorage.removeItem(draftKey)
    setPendingDraft(null)
  }

  const action = mode === 'create' ? createService : updateService
  const [state, formAction] = useActionState(action, initialState)

  const sectionsJson = useMemo(() => {
    return JSON.stringify(
      sections.map((s) => ({
        key: s.key,
        type: s.type,
        titleFr: s.titleFr,
        titleEn: s.titleEn,
        itemsFr: s.itemsFr.split('\n').map((v) => v.trim()).filter(Boolean),
        itemsEn: s.itemsEn.split('\n').map((v) => v.trim()).filter(Boolean),
        bodyFr: s.bodyFr,
        bodyEn: s.bodyEn,
        mediaKey: s.mediaKey,
        mediaUrl: s.mediaUrl,
      })),
    )
  }, [sections])

  function updateSection(index: number, patch: Partial<SectionFormData>) {
    setSections((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)))
  }

  function addSection() {
    setSections((prev) => [
      ...prev,
      {
        key: newSectionKey(prev),
        type: 'BULLET_LIST',
        titleFr: '',
        titleEn: '',
        itemsFr: '',
        itemsEn: '',
        bodyFr: '',
        bodyEn: '',
        mediaKey: '',
        mediaUrl: '',
      },
    ])
  }

  function removeSection(index: number) {
    setSections((prev) => prev.filter((_, i) => i !== index))
  }

  function reorderSections(orderedKeys: string[]) {
    setSections((prev) =>
      orderedKeys
        .map((key) => prev.find((s) => s.key === key))
        .filter((s): s is SectionFormData => Boolean(s)),
    )
  }

  return (
    <form
      action={formAction}
      onSubmit={() => localStorage.removeItem(draftKey)}
      className="space-y-8"
    >
      {state.error ? (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {state.error}
        </div>
      ) : null}

      {pendingDraft ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          <span>{t.autosaveFound(new Date(pendingDraft.savedAt).toLocaleString())}</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={applyDraft}
              className="rounded border border-amber-400 px-3 py-1 text-xs"
            >
              {t.restoreDraft}
            </button>
            <button
              type="button"
              onClick={dismissDraft}
              className="rounded border border-neutral-700 px-3 py-1 text-xs"
            >
              {t.discardDraft}
            </button>
          </div>
        </div>
      ) : null}

      {mode === 'edit' && initial?.id ? <input type="hidden" name="id" value={initial.id} /> : null}
      <input type="hidden" name="heroImageKey" value={heroImageKey} />
      <input type="hidden" name="heroImageUrl" value={heroImageUrl} />
      <input type="hidden" name="sectionsJson" value={sectionsJson} />

      <div className="space-y-4 rounded-xl border border-neutral-800 p-4">
        <h2 className="text-sm font-semibold text-neutral-200">{t.basics}</h2>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm text-neutral-300">{common.titleFr}</label>
            <input
              name="titleFr"
              className="mt-1 w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2"
              value={titleFr}
              onChange={(e) => setTitleFr(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="text-sm text-neutral-300">{common.titleEn}</label>
            <input
              name="titleEn"
              className="mt-1 w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2"
              value={titleEn}
              onChange={(e) => setTitleEn(e.target.value)}
              required
            />
          </div>
        </div>

        <div>
          <label className="text-sm text-neutral-300">{common.slug} *</label>
          <input
            name="slug"
            className="mt-1 w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2"
            value={slug}
            onChange={(e) => {
              setSlugTouched(true)
              setSlug(e.target.value)
            }}
            required
          />
          <p className="mt-1 text-xs text-neutral-500">{t.slugHint(slug || '...')}</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm text-neutral-300">{t.summaryFr}</label>
            <textarea
              name="summaryFr"
              rows={3}
              className="mt-1 w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2"
              value={summaryFr}
              onChange={(e) => setSummaryFr(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="text-sm text-neutral-300">{t.summaryEn}</label>
            <textarea
              name="summaryEn"
              rows={3}
              className="mt-1 w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2"
              value={summaryEn}
              onChange={(e) => setSummaryEn(e.target.value)}
              required
            />
          </div>
        </div>

        <MediaPicker
          label={t.heroImage}
          folder="services"
          url={heroImageUrl}
          onChange={(url, key) => {
            setHeroImageUrl(url)
            setHeroImageKey(key)
          }}
        />

        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="text-sm text-neutral-300">{t.order}</label>
            <input
              type="number"
              name="order"
              className="mt-1 w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2"
              value={order}
              onChange={(e) => setOrder(Number(e.target.value))}
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-neutral-300 mt-6">
            <input
              type="checkbox"
              name="featured"
              className="h-4 w-4"
              checked={featured}
              onChange={(e) => setFeatured(e.target.checked)}
            />
            {t.featuredCheckbox}
          </label>
          <label className="flex items-center gap-2 text-sm text-neutral-300 mt-6">
            <input
              type="checkbox"
              name="published"
              className="h-4 w-4"
              checked={published}
              onChange={(e) => setPublished(e.target.checked)}
            />
            {t.publishedCheckbox}
          </label>
        </div>
      </div>

      <div className="space-y-4 rounded-xl border border-neutral-800 p-4">
        <h2 className="text-sm font-semibold text-neutral-200">{common.seoSection}</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm text-neutral-300">{common.seoTitleFr}</label>
            <input
              name="seoTitleFr"
              className="mt-1 w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2"
              value={seoTitleFr}
              onChange={(e) => setSeoTitleFr(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm text-neutral-300">{common.seoTitleEn}</label>
            <input
              name="seoTitleEn"
              className="mt-1 w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2"
              value={seoTitleEn}
              onChange={(e) => setSeoTitleEn(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm text-neutral-300">{common.seoDescriptionFr}</label>
            <textarea
              name="seoDescriptionFr"
              rows={2}
              className="mt-1 w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2"
              value={seoDescriptionFr}
              onChange={(e) => setSeoDescriptionFr(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm text-neutral-300">{common.seoDescriptionEn}</label>
            <textarea
              name="seoDescriptionEn"
              rows={2}
              className="mt-1 w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2"
              value={seoDescriptionEn}
              onChange={(e) => setSeoDescriptionEn(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="space-y-4 rounded-xl border border-neutral-800 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-neutral-200">{t.contentSections}</h2>
          <button
            type="button"
            onClick={addSection}
            className="rounded border border-neutral-700 px-3 py-1 text-xs"
          >
            {t.addSection}
          </button>
        </div>

        {sections.length === 0 ? (
          <p className="text-sm text-neutral-500">{t.noSections}</p>
        ) : null}

        <SortableList
          id="service-sections"
          items={sections.map((s) => ({ id: s.key }))}
          onReorder={reorderSections}
        >
          <div className="space-y-6">
            {sections.map((section, index) => (
              <SortableCard
                key={section.key}
                id={section.key}
                className="rounded-lg border border-neutral-800 p-4 space-y-3"
              >
                {({ dragHandleProps }) => (
                  <>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-neutral-500">{t.section} {index + 1}</span>
                <div className="flex items-center gap-2">
                  <DragHandle dragHandleProps={dragHandleProps} />
                  <button
                    type="button"
                    onClick={() => removeSection(index)}
                    className="rounded border border-red-500/60 px-2 py-1 text-xs text-red-200"
                  >
                    {t.remove}
                  </button>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="text-xs text-neutral-400">{common.titleFrOptional}</label>
                  <input
                    data-testid={`section-title-fr-${index}`}
                    className="mt-1 w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm"
                    value={section.titleFr}
                    onChange={(e) => updateSection(index, { titleFr: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs text-neutral-400">{common.titleEnOptional}</label>
                  <input
                    data-testid={`section-title-en-${index}`}
                    className="mt-1 w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm"
                    value={section.titleEn}
                    onChange={(e) => updateSection(index, { titleEn: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-neutral-400">{t.sectionType}</label>
                <select
                  className="mt-1 w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm"
                  value={section.type}
                  onChange={(e) =>
                    updateSection(index, { type: e.target.value as SectionFormData['type'] })
                  }
                >
                  <option value="BULLET_LIST">{t.bulletList}</option>
                  <option value="RICHTEXT">{t.text}</option>
                </select>
              </div>

              {section.type === 'BULLET_LIST' ? (
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <label className="text-xs text-neutral-400">{t.bulletItemsFr}</label>
                    <textarea
                      rows={4}
                      className="mt-1 w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm"
                      value={section.itemsFr}
                      onChange={(e) => updateSection(index, { itemsFr: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-neutral-400">{t.bulletItemsEn}</label>
                    <textarea
                      rows={4}
                      className="mt-1 w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm"
                      value={section.itemsEn}
                      onChange={(e) => updateSection(index, { itemsEn: e.target.value })}
                    />
                  </div>
                </div>
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <label className="text-xs text-neutral-400">{t.textFr}</label>
                    <div className="mt-1">
                      <RichTextEditor
                        value={section.bodyFr}
                        onChange={(html) => updateSection(index, { bodyFr: html })}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-neutral-400">{t.textEn}</label>
                    <div className="mt-1">
                      <RichTextEditor
                        value={section.bodyEn}
                        onChange={(html) => updateSection(index, { bodyEn: html })}
                      />
                    </div>
                  </div>
                </div>
              )}

              <MediaPicker
                label={t.sectionImage}
                folder="services"
                url={section.mediaUrl}
                compact
                onChange={(url, key) => updateSection(index, { mediaUrl: url, mediaKey: key })}
              />
                  </>
                )}
              </SortableCard>
            ))}
          </div>
        </SortableList>
      </div>

      <div className="flex items-center gap-3">
        <SubmitButton
          label={mode === 'create' ? t.createButton : common.saveChanges}
          pendingLabel={common.saving}
        />
        {mode === 'edit' && initial?.slug ? (
          <a
            href={`/services/${initial.slug}?preview=1`}
            target="_blank"
            rel="noreferrer"
            className="rounded border border-neutral-700 px-4 py-2 text-sm"
          >
            {t.previewLastSaved}
          </a>
        ) : null}
        <span className="text-xs text-neutral-400">{common.fieldsRequired}</span>
      </div>
    </form>
  )
}
