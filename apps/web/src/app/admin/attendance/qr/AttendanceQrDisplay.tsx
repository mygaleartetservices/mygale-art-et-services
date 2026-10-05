'use client'

import { useEffect, useState } from 'react'

type QrPayload = { qrDataUrl: string; url: string; refreshMs: number }

/**
 * Keeps the on-screen QR code live: the token encoded in it rotates
 * server-side every refreshMs, so this polls for a fresh image on the same
 * cadence. Initialized from the server-rendered first paint so there's no
 * loading flash, then takes over entirely client-side.
 */
export default function AttendanceQrDisplay({ initial }: { initial: QrPayload }) {
  const [data, setData] = useState(initial)

  useEffect(() => {
    let cancelled = false

    async function refresh() {
      try {
        const res = await fetch('/api/attendance/qr', { cache: 'no-store' })
        if (!res.ok) return
        const next: QrPayload = await res.json()
        if (!cancelled) setData(next)
      } catch {
        // Transient network hiccup — the next interval tick retries.
      }
    }

    const interval = setInterval(refresh, data.refreshMs)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [data.refreshMs])

  return (
    <>
      <div className="flex flex-col items-center gap-4 rounded-xl border border-neutral-800 bg-white p-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={data.qrDataUrl} alt="Attendance check-in QR code" width={320} height={320} />
      </div>
      <p className="break-all text-center text-xs text-neutral-500">{data.url}</p>
    </>
  )
}
