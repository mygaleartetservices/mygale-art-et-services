'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { regenerateQr } from './actions'
import { useAdminT, useLocale } from '@/lib/locale'
import { formatAdminDate } from '@/lib/adminFormat'
import { downloadAttendanceQrPdf } from '@/lib/attendanceQrPdf'

type Props = {
  qrDataUrl: string
  url: string
  expiresAtIso: string
  expired: boolean
  validityDays: number
  canEdit: boolean
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-[#1f44c9] text-white hover:bg-[#1937a6] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
    >
      {label}
    </button>
  )
}

/**
 * The code is static until its configured expiry, so it can be downloaded as
 * a PDF (QR + usage instructions) and posted.
 */
export default function AttendanceQrDisplay({
  qrDataUrl,
  url,
  expiresAtIso,
  expired,
  validityDays,
  canEdit,
}: Props) {
  const t = useAdminT().attendanceQr
  const { lang } = useLocale()
  const [state, formAction] = useActionState(regenerateQr, {} as { error?: string })

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center gap-4 rounded-xl border border-neutral-800 bg-white p-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={qrDataUrl} alt="Attendance check-in QR code" width={320} height={320} />
      </div>
      <p className="print:hidden break-all text-center text-xs text-neutral-500">{url}</p>

      <div className="print:hidden space-y-4">
        {expired ? (
          <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {t.expiredBanner}
          </div>
        ) : (
          <p className="text-center text-sm text-neutral-400">
            {t.validUntil} {formatAdminDate(expiresAtIso, lang)}
          </p>
        )}

        <button
          type="button"
          onClick={() =>
            downloadAttendanceQrPdf({
              qrDataUrl,
              validUntil: {
                fr: formatAdminDate(expiresAtIso, 'fr'),
                en: formatAdminDate(expiresAtIso, 'en'),
              },
              expired,
            })
          }
          className="w-full rounded-lg border border-neutral-700 px-4 py-2 text-sm font-semibold hover:bg-neutral-900"
        >
          {t.print}
        </button>

        {canEdit ? (
          <form action={formAction} className="space-y-2 rounded-xl border border-neutral-800 p-4">
            <label className="block text-xs text-neutral-400">{t.validity}</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                name="validityDays"
                min={1}
                max={365}
                step={1}
                defaultValue={validityDays}
                required
                className="w-24 rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-sm"
              />
              <span className="text-sm text-neutral-400">{t.days}</span>
              <SubmitButton label={t.saveRegenerate} />
            </div>
            <p className="text-xs text-neutral-500">{t.regenerateHelp}</p>
            {state.error ? <p className="text-xs text-red-300">{state.error}</p> : null}
          </form>
        ) : (
          <p className="text-xs text-neutral-500">{t.superAdminOnly}</p>
        )}
      </div>
    </div>
  )
}
