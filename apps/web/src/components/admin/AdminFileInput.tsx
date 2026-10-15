'use client'
import { useState, type ChangeEvent } from 'react'
import { useAdminT } from '@/lib/locale'
import AdminIcon from '@/components/admin/AdminIcon'

/**
 * File picker for admin forms. The browser's own control always reads
 * "Choose File / No file chosen" in the browser's language, so the French
 * admin showed English; this keeps the native input (keyboard, drag and drop
 * onto the label, accessibility) but renders a translated button and the
 * chosen file name.
 */
export default function AdminFileInput({
  accept,
  multiple = false,
  disabled = false,
  onChange,
}: {
  accept?: string
  multiple?: boolean
  disabled?: boolean
  onChange: (event: ChangeEvent<HTMLInputElement>) => void
}) {
  const t = useAdminT()
  const [chosen, setChosen] = useState('')

  return (
    <label
      className={`inline-flex max-w-full cursor-pointer items-center gap-3 rounded-lg has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[var(--admin-accent)] ${
        disabled ? 'pointer-events-none opacity-50' : ''
      }`}
    >
      <input
        type="file"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        className="sr-only"
        onChange={(event) => {
          const files = event.target.files
          setChosen(
            !files || files.length === 0
              ? ''
              : files.length === 1
                ? files[0].name
                : t.common.filesChosen.replace('{count}', String(files.length)),
          )
          onChange(event)
        }}
      />
      <span className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-lg bg-neutral-800 px-4 text-sm font-semibold text-neutral-100 transition-colors hover:bg-neutral-700">
        <AdminIcon name="upload" size={16} />
        {multiple ? t.common.chooseFiles : t.common.chooseImage}
      </span>
      <span className="truncate text-sm text-neutral-400">{chosen || t.common.noFileChosen}</span>
    </label>
  )
}
