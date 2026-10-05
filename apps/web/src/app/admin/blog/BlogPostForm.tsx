/* eslint-disable react-hooks/set-state-in-effect */
'use client'

import { useEffect, useMemo, useState } from 'react'
import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import slugify from 'slugify'
import MarkdownPreview from '@/components/MarkdownPreview'
import { createBlogPost, updateBlogPost } from './actions'
import { uploadMedia } from '@/lib/mediaClient'
import { useAdminT } from '@/lib/locale'

const initialState = { error: '' as string | undefined }

type BlogPostFormData = {
  id?: string
  title: string
  slug: string
  excerpt: string
  content: string
  coverImage: string
  locale: 'fr' | 'en'
  published: boolean
  publishedAt?: Date | null
  seoTitle: string
  seoDescription: string
  categoryId: string
  tags: string
  translationOfId: string
}

type CategoryOption = { id: string; nameFr: string; nameEn: string }
type TranslationOption = { id: string; title: string; locale: string }

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
      className="rounded-lg bg-[#003366] px-5 py-2 text-white font-semibold disabled:opacity-60"
      disabled={pending}
    >
      {pending ? pendingLabel : label}
    </button>
  )
}

export default function BlogPostForm({
  mode,
  initial,
  categories,
  translationOptions,
}: {
  mode: 'create' | 'edit'
  initial?: BlogPostFormData
  categories: CategoryOption[]
  translationOptions: TranslationOption[]
}) {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [slug, setSlug] = useState(initial?.slug ?? '')
  const [slugTouched, setSlugTouched] = useState(mode === 'edit')
  const [excerpt, setExcerpt] = useState(initial?.excerpt ?? '')
  const [content, setContent] = useState(initial?.content ?? '')
  const [coverImage, setCoverImage] = useState(initial?.coverImage ?? '')
  const [locale, setLocale] = useState<'fr' | 'en'>(initial?.locale ?? 'fr')
  const [published, setPublished] = useState(initial?.published ?? false)
  const [publishedAt, setPublishedAt] = useState(formatDateTime(initial?.publishedAt))
  const [seoTitle, setSeoTitle] = useState(initial?.seoTitle ?? '')
  const [seoDescription, setSeoDescription] = useState(initial?.seoDescription ?? '')
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? '')
  const [tags, setTags] = useState(initial?.tags ?? '')
  const [translationOfId, setTranslationOfId] = useState(initial?.translationOfId ?? '')
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (!slugTouched) {
      setSlug(slugify(title, { lower: true, strict: true, trim: true }))
    }
  }, [title, slugTouched])

  const action = mode === 'create' ? createBlogPost : updateBlogPost
  const [state, formAction] = useActionState(action, initialState)
  const adminT = useAdminT()
  const t = adminT.blog
  const common = adminT.common

  const previewContent = useMemo(() => content || t.previewPlaceholder, [content, t.previewPlaceholder])

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const result = await uploadMedia(file, 'blog')
    setUploading(false)
    if (result.ok && result.url) {
      setCoverImage(result.url)
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

      <div className="grid gap-4 md:grid-cols-2">
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
        </div>
      </div>

      <div>
        <label className="text-sm text-neutral-300">{t.excerpt}</label>
        <textarea
          name="excerpt"
          className="mt-1 w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2"
          rows={3}
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          required
        />
      </div>

      {/* Cover Image Upload */}
      <div>
        <label className="text-sm text-neutral-300">{t.coverImage}</label>
        <div className="mt-1 flex items-center gap-3">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={uploading}
            className="block w-full text-sm text-neutral-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-neutral-800 file:text-neutral-200 hover:file:bg-neutral-700 disabled:opacity-50"
          />
          {uploading && <span className="text-xs text-neutral-400">{common.uploading}</span>}
        </div>
        {coverImage && (
          <div className="mt-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={coverImage}
              alt="Cover preview"
              className="h-32 rounded border border-neutral-700 object-cover"
            />
          </div>
        )}
        <input
          type="text"
          name="coverImage"
          className="mt-2 w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm"
          placeholder="Or paste image URL"
          value={coverImage}
          onChange={(e) => setCoverImage(e.target.value)}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="text-sm text-neutral-300">{t.localeLabel}</label>
          <select
            name="locale"
            className="mt-1 w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2"
            value={locale}
            onChange={(e) => setLocale(e.target.value as 'fr' | 'en')}
            required
          >
            <option value="fr">FR</option>
            <option value="en">EN</option>
          </select>
        </div>
        <div>
          <label className="text-sm text-neutral-300">{t.categoryLabel}</label>
          <select
            name="categoryId"
            className="mt-1 w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            <option value="">{t.categoryNone}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nameFr} / {c.nameEn}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="text-sm text-neutral-300">{t.tagsLabel}</label>
          <input
            name="tags"
            className="mt-1 w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="architecture, yaoundé, projet"
          />
        </div>
        <div>
          <label className="text-sm text-neutral-300">{t.linkedTranslation}</label>
          <select
            name="translationOfId"
            className="mt-1 w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2"
            value={translationOfId}
            onChange={(e) => setTranslationOfId(e.target.value)}
          >
            <option value="">{t.linkedTranslationNone}</option>
            {translationOptions.map((p) => (
              <option key={p.id} value={p.id}>
                [{p.locale.toUpperCase()}] {p.title}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-neutral-500">{t.linkedTranslationNote}</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="text-sm text-neutral-300">{t.seoTitle}</label>
          <input
            name="seoTitle"
            className="mt-1 w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2"
            value={seoTitle}
            onChange={(e) => setSeoTitle(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="text-sm text-neutral-300">{t.seoDescription}</label>
          <input
            name="seoDescription"
            className="mt-1 w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2"
            value={seoDescription}
            onChange={(e) => setSeoDescription(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-6">
        <label className="flex items-center gap-2 text-sm text-neutral-300">
          <input
            type="checkbox"
            name="published"
            className="h-4 w-4"
            checked={published}
            onChange={(e) => setPublished(e.target.checked)}
          />
          {t.publishedCheckbox}
        </label>

        <div className="flex items-center gap-2">
          <label className="text-sm text-neutral-300">{t.publishedAt}</label>
          <input
            type="datetime-local"
            name="publishedAt"
            className="rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2"
            value={publishedAt}
            onChange={(e) => setPublishedAt(e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <label className="text-sm text-neutral-300">{t.markdownContent}</label>
          <textarea
            name="content"
            className="mt-1 min-h-80 w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 font-mono text-sm"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
          />
          <p className="mt-1 text-xs text-neutral-500">{t.videoHint}</p>
        </div>
        <div>
          <div className="text-sm text-neutral-300">{t.livePreview}</div>
          <div className="mt-1 min-h-80 rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-3">
            <MarkdownPreview content={previewContent} />
          </div>
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
