'use client'

import { useState } from 'react'
import { uploadMedia } from '@/lib/mediaClient'
import { useAdminT } from '@/lib/locale'
import AdminFileInput from '@/components/admin/AdminFileInput'

type MediaItem = {
  id: string
  key: string
  url: string
  thumbnailUrl: string | null
  folder: string
  altFr: string | null
  altEn: string | null
}

export default function MediaPicker({
  label,
  folder,
  url,
  onChange,
  compact,
}: {
  label: string
  folder: string
  url: string
  onChange: (url: string, key: string) => void
  compact?: boolean
}) {
  const t = useAdminT()
  const [uploading, setUploading] = useState(false)
  const [browsing, setBrowsing] = useState(false)
  const [items, setItems] = useState<MediaItem[]>([])
  const [loadingLibrary, setLoadingLibrary] = useState(false)
  const [query, setQuery] = useState('')

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const result = await uploadMedia(file, folder)
    setUploading(false)
    if (result.ok && result.url && result.key) {
      onChange(result.url, result.key)
    } else {
      alert(result.error || t.common.uploadFailed)
    }
  }

  async function loadLibrary(q?: string) {
    setLoadingLibrary(true)
    const params = q ? `q=${encodeURIComponent(q)}` : `folder=${encodeURIComponent(folder)}`
    const res = await fetch(`/api/media/list?${params}`)
    const data = await res.json()
    setItems(data.items || [])
    setLoadingLibrary(false)
  }

  function openLibrary() {
    setBrowsing(true)
    setQuery('')
    loadLibrary()
  }

  function search(q: string) {
    setQuery(q)
    loadLibrary(q || undefined)
  }

  function pick(item: MediaItem) {
    onChange(item.url, item.key)
    setBrowsing(false)
  }

  return (
    <div>
      <label className="text-sm text-neutral-300">{label}</label>
      <div className="mt-1 flex flex-wrap items-center gap-3">
        <AdminFileInput accept="image/*" onChange={handleUpload} disabled={uploading} />
        {uploading && <span className="text-xs text-neutral-400">{t.common.uploading}</span>}
        <button
          type="button"
          onClick={openLibrary}
          className="inline-flex min-h-10 items-center rounded-lg border border-neutral-700 px-3 text-sm text-neutral-200 hover:bg-neutral-800"
        >
          {t.common.browseLibrary}
        </button>
      </div>

      {url && (
        <div className="mt-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt=""
            className={
              compact
                ? 'h-16 rounded border border-neutral-700 object-cover'
                : 'h-32 rounded border border-neutral-700 object-cover'
            }
          />
        </div>
      )}

      {browsing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setBrowsing(false)}
        >
          <div
            className="max-h-[80vh] w-full max-w-3xl overflow-y-auto rounded-xl border border-neutral-800 bg-neutral-950 p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between gap-2">
              <input
                type="text"
                placeholder={t.common.searchMedia}
                value={query}
                onChange={(e) => search(e.target.value)}
                className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={() => setBrowsing(false)}
                className="shrink-0 rounded border border-neutral-700 px-3 py-2 text-xs"
              >
                Close
              </button>
            </div>

            {loadingLibrary ? (
              <p className="text-sm text-neutral-400">{t.common.loading}</p>
            ) : (
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                {items.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => pick(item)}
                    className="group rounded-lg border border-neutral-800 p-1 text-left hover:border-[#003366]"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.thumbnailUrl || item.url}
                      alt={item.altFr || item.key}
                      className="h-24 w-full rounded object-cover"
                    />
                    <div className="mt-1 truncate text-[10px] text-neutral-500">{item.key}</div>
                  </button>
                ))}
                {items.length === 0 ? (
                  <p className="col-span-full text-sm text-neutral-400">{t.common.noMediaFound}</p>
                ) : null}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
