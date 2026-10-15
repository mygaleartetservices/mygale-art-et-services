'use client'

import { useState } from 'react'
import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { createUser, updateUser } from './actions'
import { ADMIN_PAGES, NAV_TRANSLATION_KEY } from '@/lib/adminPages'
import { useAdminT } from '@/lib/locale'

const initialState = { error: '' as string | undefined }

const ALL_ROLES = ['SUPER_ADMIN', 'ADMIN', 'EDITOR', 'STAFF', 'VIEWER', 'USER'] as const

type UserFormData = {
  id?: string
  name: string
  email: string
  role: (typeof ALL_ROLES)[number]
  active: boolean
  pagesRestricted: boolean
  allowedPages: string[]
  departmentId?: string | null
  jobRoleId?: string | null
}

type DepartmentOption = { id: string; name: string; jobRoles: { id: string; name: string }[] }

function SubmitButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      className="rounded-lg bg-[#1f44c9] text-white hover:bg-[#1937a6] px-5 py-2 text-white font-semibold disabled:opacity-60"
      disabled={pending}
    >
      {pending ? pendingLabel : label}
    </button>
  )
}

export default function UserForm({
  mode,
  initial,
  canGrantAdmin,
  isSelf,
  departments,
}: {
  mode: 'create' | 'edit'
  initial?: UserFormData
  canGrantAdmin: boolean
  isSelf?: boolean
  departments: DepartmentOption[]
}) {
  const [name, setName] = useState(initial?.name ?? '')
  const [email, setEmail] = useState(initial?.email ?? '')
  const [role, setRole] = useState<UserFormData['role']>(initial?.role ?? 'EDITOR')
  const [active, setActive] = useState(initial?.active ?? true)
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [pagesRestricted, setPagesRestricted] = useState(initial?.pagesRestricted ?? false)
  const [allowedPages, setAllowedPages] = useState<string[]>(
    initial?.allowedPages ?? ADMIN_PAGES.map((p) => p.key),
  )
  const [departmentId, setDepartmentId] = useState(initial?.departmentId ?? '')
  const [jobRoleId, setJobRoleId] = useState(initial?.jobRoleId ?? '')
  const jobRolesForDepartment = departments.find((d) => d.id === departmentId)?.jobRoles ?? []
  const adminT = useAdminT()
  const t = adminT.userForm

  const action = mode === 'create' ? createUser : updateUser
  const [state, formAction] = useActionState(action, initialState)

  const availableRoles = ALL_ROLES.filter(
    (r) => canGrantAdmin || (r !== 'SUPER_ADMIN' && r !== 'ADMIN'),
  )
  const isAdminRole = role === 'SUPER_ADMIN' || role === 'ADMIN'

  function toggleAllowedPage(key: string) {
    setAllowedPages((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]))
  }

  return (
    <form action={formAction} className="space-y-6">
      {state.error ? (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {state.error}
        </div>
      ) : null}

      {mode === 'edit' && initial?.id ? <input type="hidden" name="id" value={initial.id} /> : null}

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="text-sm text-neutral-300">{t.nameLabel}</label>
          <input
            name="name"
            className="mt-1 w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="text-sm text-neutral-300">{t.emailLabel}</label>
          <input
            name="email"
            type="email"
            className="mt-1 w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 disabled:opacity-50"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={mode === 'edit'}
          />
        </div>
        <div>
          <label className="text-sm text-neutral-300">
            {mode === 'create' ? t.passwordCreate : t.passwordEdit}
          </label>
          <div className="relative">
            <input
              name="password"
              type={showPassword ? 'text' : 'password'}
              className="mt-1 w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 pr-10"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required={mode === 'create'}
              minLength={8}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 mt-0.5 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 transition-colors"
              aria-label={showPassword ? t.hidePassword : t.showPassword}
            >
              {showPassword ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-4.803m5.596-3.856a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0M15 12a3 3 0 11-6 0 3 3 0 016 0z M6.75 6.75l10.5 10.5"
                  />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
        <div>
          <label className="text-sm text-neutral-300">{t.roleLabel}</label>
          <select
            name="role"
            className="mt-1 w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 disabled:opacity-50"
            value={role}
            onChange={(e) => setRole(e.target.value as UserFormData['role'])}
            disabled={isSelf}
          >
            {availableRoles.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          {!canGrantAdmin ? (
            <p className="mt-1 text-xs text-neutral-500">{t.onlySuperAdminGrant}</p>
          ) : null}
        </div>
        <div>
          <label className="text-sm text-neutral-300">{t.departmentLabel}</label>
          <select
            name="departmentId"
            className="mt-1 w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2"
            value={departmentId}
            onChange={(e) => {
              setDepartmentId(e.target.value)
              setJobRoleId('')
            }}
          >
            <option value="">{t.noDepartmentOption}</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm text-neutral-300">{t.jobRoleLabel}</label>
          <select
            name="jobRoleId"
            className="mt-1 w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 disabled:opacity-50"
            value={jobRoleId}
            onChange={(e) => setJobRoleId(e.target.value)}
            disabled={!departmentId}
          >
            <option value="">{t.noJobRoleOption}</option>
            {jobRolesForDepartment.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {mode === 'edit' ? (
        <label className="flex items-center gap-2 text-sm text-neutral-300">
          <input
            type="checkbox"
            name="active"
            className="h-4 w-4"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
            disabled={isSelf}
          />
          {t.activeCheckbox}
        </label>
      ) : null}

      <div className="space-y-3 rounded-lg border border-neutral-800 p-4">
        <div className="text-sm font-semibold text-neutral-200">{t.pageAccessTitle}</div>

        {isAdminRole ? (
          <p className="text-sm text-neutral-400">
            {role === 'SUPER_ADMIN' ? t.fullAccessSuperAdmins : t.fullAccessAdmins}
            {t.fullAccessSuffix}
          </p>
        ) : (
          <>
            <label className="flex items-center gap-2 text-sm text-neutral-300">
              <input
                type="checkbox"
                name="pagesRestricted"
                className="h-4 w-4"
                checked={pagesRestricted}
                onChange={(e) => setPagesRestricted(e.target.checked)}
              />
              {t.restrictCheckbox}
            </label>

            {pagesRestricted ? (
              <div className="grid gap-2 sm:grid-cols-2">
                {ADMIN_PAGES.map((page) => {
                  // Admin-tier pages (Users, Settings, Navigation, ...) stay
                  // off-limits below Admin rank no matter what's granted —
                  // mirrors the server-side check in hasPageAccess().
                  const reachable = page.minRole !== 'ADMIN'
                  return (
                    <label
                      key={page.key}
                      className={`flex items-center gap-2 text-sm ${
                        reachable ? 'text-neutral-300' : 'text-neutral-600'
                      }`}
                    >
                      <input
                        type="checkbox"
                        name="allowedPages"
                        value={page.key}
                        className="h-4 w-4"
                        checked={allowedPages.includes(page.key)}
                        onChange={() => toggleAllowedPage(page.key)}
                        disabled={!reachable}
                      />
                      {adminT.nav[NAV_TRANSLATION_KEY[page.key] as keyof typeof adminT.nav] ?? page.label}
                      {!reachable ? <span className="text-xs text-neutral-600">{t.adminOnly}</span> : null}
                    </label>
                  )
                })}
              </div>
            ) : (
              <p className="text-xs text-neutral-500">{t.unrestrictedNote}</p>
            )}
          </>
        )}
      </div>

      <SubmitButton
        label={mode === 'create' ? t.createUser : t.saveChanges}
        pendingLabel={adminT.common.saving}
      />
    </form>
  )
}
