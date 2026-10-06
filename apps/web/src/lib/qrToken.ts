/**
 * Pulls the rotating check-in token out of whatever a QR scan decoded. The
 * QR poster encodes a full URL (getAttendanceCheckInUrl() in
 * lib/attendanceQr.ts, e.g. "https://.../admin/my-attendance?t=<token>") —
 * this parses the token out so the in-app scanner (QrScanner.tsx) can
 * navigate to it client-side instead of doing a full page load.
 */
export function extractAttendanceToken(decodedText: string): string | null {
  try {
    const url = new URL(decodedText)
    return url.searchParams.get('t')
  } catch {
    return null
  }
}
