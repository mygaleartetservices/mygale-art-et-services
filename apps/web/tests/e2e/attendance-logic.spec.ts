import { test, expect } from '@playwright/test'
import { computeAttendanceStatus, DEFAULT_WINDOW_END_MINUTES } from '@/lib/attendance'
import {
  minutesOfDay,
  calendarDate,
  formatMinutesAsTime,
  parseTimeToMinutes,
  zonedTimeToInstant,
} from '@/lib/timezone'
import { extractAttendanceToken } from '@/lib/qrToken'

// Pure domain-logic tests — no DB, no dev server, no browser page needed.
// Africa/Douala is UTC+1 year-round (no DST), so "HH:mm+01:00" is exact.

test.describe('computeAttendanceStatus', () => {
  test('arrival exactly at the window end is ON_TIME', () => {
    const arrival = new Date(`2026-01-05T07:30:00+01:00`) // 07:30 Douala
    expect(computeAttendanceStatus(arrival, 7 * 60 + 30)).toBe('ON_TIME')
  })

  test('one minute after the window end is LATE', () => {
    const arrival = new Date(`2026-01-05T07:31:00+01:00`)
    expect(computeAttendanceStatus(arrival, 7 * 60 + 30)).toBe('LATE')
  })

  test('arrival well before the window is ON_TIME (early is never penalized)', () => {
    const arrival = new Date(`2026-01-05T06:00:00+01:00`)
    expect(computeAttendanceStatus(arrival, DEFAULT_WINDOW_END_MINUTES)).toBe('ON_TIME')
  })

  test('arrival exactly at the window start is ON_TIME', () => {
    const arrival = new Date(`2026-01-05T08:00:00+01:00`)
    expect(computeAttendanceStatus(arrival, DEFAULT_WINDOW_END_MINUTES)).toBe('ON_TIME')
  })

  test('arrival well after the window is LATE', () => {
    const arrival = new Date(`2026-01-05T09:00:00+01:00`)
    expect(computeAttendanceStatus(arrival, DEFAULT_WINDOW_END_MINUTES)).toBe('LATE')
  })
})

test.describe('minutesOfDay / calendarDate (Africa/Douala)', () => {
  test('minutesOfDay reads the Douala wall-clock time, not UTC', () => {
    // 08:17 Douala (UTC+1) is 07:17 UTC.
    const instant = new Date('2026-01-05T07:17:00.000Z')
    expect(minutesOfDay(instant)).toBe(8 * 60 + 17)
  })

  test('calendarDate buckets a late-UTC-evening instant into the correct Douala day', () => {
    // 2026-01-05T23:30:00Z is 2026-01-06T00:30 in Douala (UTC+1) — already the next day.
    const instant = new Date('2026-01-05T23:30:00.000Z')
    const date = calendarDate(instant)
    expect(date.toISOString().slice(0, 10)).toBe('2026-01-06')
  })

  test('calendarDate keeps an early-UTC-morning instant on the same Douala day', () => {
    // 2026-01-05T00:30:00Z is 2026-01-05T01:30 in Douala — still the same day.
    const instant = new Date('2026-01-05T00:30:00.000Z')
    const date = calendarDate(instant)
    expect(date.toISOString().slice(0, 10)).toBe('2026-01-05')
  })
})

test.describe('time parsing/formatting round-trip', () => {
  test('parseTimeToMinutes and formatMinutesAsTime round-trip', () => {
    expect(parseTimeToMinutes('08:30')).toBe(8 * 60 + 30)
    expect(formatMinutesAsTime(8 * 60 + 30)).toBe('08:30')
    expect(parseTimeToMinutes('00:00')).toBe(0)
    expect(parseTimeToMinutes('23:59')).toBe(23 * 60 + 59)
  })

  test('parseTimeToMinutes rejects malformed input', () => {
    expect(parseTimeToMinutes('24:00')).toBeNull()
    expect(parseTimeToMinutes('9:5')).toBeNull()
    expect(parseTimeToMinutes('not-a-time')).toBeNull()
    expect(parseTimeToMinutes('')).toBeNull()
  })

  test('zonedTimeToInstant combines a date and Douala clock time into the right UTC instant', () => {
    const instant = zonedTimeToInstant('2026-01-05', '08:17')
    expect(instant).not.toBeNull()
    expect(instant!.toISOString()).toBe('2026-01-05T07:17:00.000Z')
  })

  test('zonedTimeToInstant rejects a malformed date or time', () => {
    expect(zonedTimeToInstant('01-05-2026', '08:17')).toBeNull()
    expect(zonedTimeToInstant('2026-01-05', '25:00')).toBeNull()
  })
})

test.describe('extractAttendanceToken (in-app QR scanner)', () => {
  test('pulls the t= token out of a scanned check-in URL', () => {
    expect(extractAttendanceToken('https://example.org/admin/my-attendance?t=abc123')).toBe(
      'abc123',
    )
  })

  test('returns null when the decoded QR has no t= param', () => {
    expect(extractAttendanceToken('https://example.org/admin/my-attendance')).toBeNull()
  })

  test('returns null when the decoded QR is not a URL at all', () => {
    expect(extractAttendanceToken('not a url')).toBeNull()
    expect(extractAttendanceToken('')).toBeNull()
  })
})
