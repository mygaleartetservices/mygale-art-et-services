'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { requestPasswordReset } from './actions'

const initialState = { error: '' as string | undefined, success: '' as string | undefined }

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" className="btn-primary w-full disabled:opacity-60" disabled={pending}>
      {pending ? 'Sending...' : 'Send reset link'}
    </button>
  )
}

export default function ForgotPasswordForm() {
  const [state, formAction] = useActionState(requestPasswordReset, initialState)

  if (state.success) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
        {state.success}
      </div>
    )
  }

  return (
    <form action={formAction} className="space-y-4">
      {state.error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      ) : null}

      <div>
        <label htmlFor="forgot-email" className="text-sm text-gray-600">
          Email
        </label>
        <input
          id="forgot-email"
          name="email"
          type="email"
          autoComplete="username"
          required
          className="input mt-1"
        />
      </div>

      <SubmitButton />
    </form>
  )
}
