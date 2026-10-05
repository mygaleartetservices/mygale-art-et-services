'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import Link from 'next/link'
import { resetPassword } from './actions'

const initialState = { error: '' as string | undefined, success: '' as string | undefined }

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" className="btn-primary w-full disabled:opacity-60" disabled={pending}>
      {pending ? 'Resetting...' : 'Reset password'}
    </button>
  )
}

export default function ResetPasswordForm({ token }: { token: string }) {
  const [state, formAction] = useActionState(resetPassword, initialState)

  if (state.success) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {state.success}
        </div>
        <Link href="/login" className="btn-primary block w-full text-center">
          Go to sign in
        </Link>
      </div>
    )
  }

  if (!token) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        This password reset link is invalid or has expired.
      </div>
    )
  }

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="token" value={token} />

      {state.error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      ) : null}

      <div>
        <label htmlFor="reset-password" className="text-sm text-gray-600">
          New password
        </label>
        <input
          id="reset-password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          className="input mt-1"
        />
      </div>

      <div>
        <label htmlFor="reset-confirm-password" className="text-sm text-gray-600">
          Confirm new password
        </label>
        <input
          id="reset-confirm-password"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          className="input mt-1"
        />
      </div>

      <SubmitButton />
    </form>
  )
}
