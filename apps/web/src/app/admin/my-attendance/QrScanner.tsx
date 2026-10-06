'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import jsQR from 'jsqr'
import { useAdminT } from '@/lib/locale'
import { extractAttendanceToken } from '@/lib/qrToken'

/**
 * In-app camera QR scanner, offered as an alternative to pointing a phone's
 * own camera app at the physical QR poster — useful on a device/browser
 * where that hand-off is awkward (e.g. a shared tablet at the entrance, or a
 * desktop webcam). Opens getUserMedia, decodes frames with jsQR, and on a
 * successful scan navigates to this same page with the decoded token so the
 * normal server-side verifyAttendanceToken() check still applies — this
 * component never trusts the scan itself, only what it leads to.
 */
export default function QrScanner() {
  const t = useAdminT().myAttendance
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const rafRef = useRef<number | null>(null)

  const stopCamera = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
  }, [])

  const close = useCallback(() => {
    stopCamera()
    setOpen(false)
    setError(null)
  }, [stopCamera])

  useEffect(() => {
    if (!open) return

    let cancelled = false

    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: false,
        })
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop())
          return
        }
        streamRef.current = stream
        const video = videoRef.current
        if (!video) return
        video.srcObject = stream
        await video.play()

        const canvas = canvasRef.current
        const ctx = canvas?.getContext('2d')
        if (!canvas || !ctx) return

        const tick = () => {
          if (cancelled || video.readyState !== video.HAVE_ENOUGH_DATA) {
            rafRef.current = requestAnimationFrame(tick)
            return
          }
          canvas.width = video.videoWidth
          canvas.height = video.videoHeight
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
          const result = jsQR(imageData.data, imageData.width, imageData.height)

          if (result) {
            const token = extractAttendanceToken(result.data)
            if (token) {
              stopCamera()
              setOpen(false)
              router.push(`/admin/my-attendance?t=${token}`)
              return
            }
            setError(t.scannerNotFound)
          }
          rafRef.current = requestAnimationFrame(tick)
        }
        rafRef.current = requestAnimationFrame(tick)
      } catch {
        if (!cancelled) setError(t.scannerCameraError)
      }
    }

    start()

    return () => {
      cancelled = true
      stopCamera()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  useEffect(() => stopCamera, [stopCamera])

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-5 py-3 text-sm font-semibold text-neutral-200 hover:bg-neutral-800"
      >
        {t.openScanner}
      </button>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 p-4">
      <div className="w-full max-w-sm space-y-4">
        <div className="relative overflow-hidden rounded-xl border border-neutral-700 bg-neutral-950">
          <video ref={videoRef} className="w-full" muted playsInline />
          <canvas ref={canvasRef} className="hidden" />
        </div>

        {error ? (
          <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        ) : (
          <p className="text-center text-sm text-neutral-400">{t.scannerHint}</p>
        )}

        <button
          type="button"
          onClick={close}
          className="w-full rounded-lg border border-neutral-700 px-5 py-3 text-sm font-semibold text-neutral-200 hover:bg-neutral-800"
        >
          {t.scannerCancel}
        </button>
      </div>
    </div>
  )
}
