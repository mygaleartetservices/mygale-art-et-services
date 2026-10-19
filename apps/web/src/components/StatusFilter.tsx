'use client'
import React from 'react'

const statuses = [
  { id: 'all', label: 'All' },
  { id: 'new', label: 'New' },
  { id: 'in_review', label: 'In Review' },
  { id: 'responded', label: 'Responded' },
  { id: 'closed', label: 'Closed' },
]

export default function StatusFilter({
  active,
  onChange,
}: {
  active: string
  onChange: (s: string) => void
}) {
  return (
    <div className="flex gap-2 mb-4">
      {statuses.map((s) => (
        <button
          key={s.id}
          className={`px-3 py-1 rounded border text-sm ${
            active === s.id ? 'bg-black text-white' : 'bg-surface'
          }`}
          onClick={() => onChange(s.id)}
        >
          {s.label}
        </button>
      ))}
    </div>
  )
}
