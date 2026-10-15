'use client'

import React, { useState } from 'react'
import { useLocale } from '@/lib/locale'
import { z } from 'zod'
import SuccessAnim from '@/components/SuccessAnim'
import confetti from 'canvas-confetti'

const schema = z.object({
  name: z.string().min(2, 'Name too short'),
  email: z.string().email('Invalid email format'),
  phone: z
    .string()
    .regex(/^\+?[0-9 ]{6,20}$/, 'Phone must contain only digits, spaces, or leading +')
    .optional()
    .or(z.literal('')),
  message: z.string().min(5, 'Message too short'),
})

export default function ContactForm() {
  const { t } = useLocale()

  const [inputs, setInputs] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle')

  function handleChange(field: string, value: string) {
    setInputs((prev) => ({ ...prev, [field]: value }))

    // Live validation
    const check = schema.safeParse({ ...inputs, [field]: value })
    if (check.success) {
      setErrors({})
    } else {
      const flattened = check.error.flatten().fieldErrors
      const message = (flattened as Record<string, string[]>)[field]?.[0] || ''
      setErrors((prev) => ({ ...prev, [field]: message }))
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const result = schema.safeParse(inputs)
    if (!result.success) {
      const flattened = result.error.flatten().fieldErrors

      const formatted: Record<string, string> = {}
      Object.entries(flattened as Record<string, string[]>).forEach(([k, v]) => {
        if (v && v.length > 0) formatted[k] = v[0]
      })

      setErrors(formatted)
      return
    }

    setStatus('sending')

    try {
      await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inputs),
      })

      setStatus('sent')
      setInputs({ name: '', email: '', phone: '', message: '' })
      setErrors({})

      confetti({ particleCount: 70, spread: 70, origin: { y: 0.65 } })
    } catch {
      alert('Network error')
      setStatus('idle')
    }
  }

  return (
    <div className="relative rounded-xl border bg-surface p-6 shadow-sm md:p-8">
      {status === 'sent' && <SuccessAnim />}

      <form onSubmit={handleSubmit} className="space-y-4">
        {(['name', 'email', 'phone', 'message'] as const).map((field) => (
          <div key={field}>
            {field === 'message' ? (
              <textarea
                value={inputs[field]}
                onChange={(e) => handleChange(field, e.target.value)}
                className={`input h-36 ${errors[field] ? 'input-error' : ''}`}
                placeholder={t[field]}
              />
            ) : (
              <input
                type={field === 'email' ? 'email' : 'text'}
                value={inputs[field]}
                onChange={(e) => handleChange(field, e.target.value)}
                className={`input ${errors[field] ? 'input-error' : ''}`}
                placeholder={t[field]}
              />
            )}

            {errors[field] && <p className="text-red-600 text-sm mt-1">{errors[field]}</p>}
          </div>
        ))}

        <button type="submit" className="btn-primary w-full" disabled={status === 'sending'}>
          {status === 'sending' ? 'Sending…' : t.send}
        </button>
      </form>
    </div>
  )
}
