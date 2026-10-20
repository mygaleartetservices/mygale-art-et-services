'use server'

import { revalidatePath } from 'next/cache'
import prisma from '@/lib/prisma'
import { requireRole } from '@/lib/auth'
import { writeAuditLog } from '@/lib/revisions'

function asString(value: FormDataEntryValue | null) {
  return typeof value === 'string' ? value.trim() : ''
}

export async function createDepartment(formData: FormData) {
  const actor = await requireRole('ADMIN')

  const name = asString(formData.get('name'))
  if (!name) return

  const existing = await prisma.department.findUnique({ where: { name } })
  if (existing) return

  const department = await prisma.department.create({ data: { name } })

  await writeAuditLog(
    'department.create',
    { entityType: 'Department', entityId: department.id, name },
    actor.id,
  )

  revalidatePath('/admin/departments')
}

export async function deleteDepartment(formData: FormData) {
  const actor = await requireRole('ADMIN')
  const id = asString(formData.get('id'))
  if (!id) return

  const department = await prisma.department.findUnique({ where: { id } })
  if (!department) return

  // Deleting a department clears the department/role assignment on any
  // employees still in it (onDelete: SetNull) rather than blocking — an
  // admin cleaning up an old department shouldn't have to unassign everyone
  // first. Historical attendance rows keep their departmentName snapshot.
  await prisma.department.delete({ where: { id } })

  await writeAuditLog(
    'department.delete',
    { entityType: 'Department', entityId: id, name: department.name },
    actor.id,
  )

  revalidatePath('/admin/departments')
  revalidatePath('/admin/users')
}

export async function createJobRole(formData: FormData) {
  const actor = await requireRole('ADMIN')

  const departmentId = asString(formData.get('departmentId'))
  const name = asString(formData.get('name'))
  if (!departmentId || !name) return

  const existing = await prisma.jobRole.findUnique({
    where: { departmentId_name: { departmentId, name } },
  })
  if (existing) return

  const jobRole = await prisma.jobRole.create({ data: { departmentId, name } })

  await writeAuditLog(
    'jobRole.create',
    { entityType: 'JobRole', entityId: jobRole.id, departmentId, name },
    actor.id,
  )

  revalidatePath('/admin/departments')
}

export async function deleteJobRole(formData: FormData) {
  const actor = await requireRole('ADMIN')
  const id = asString(formData.get('id'))
  if (!id) return

  const jobRole = await prisma.jobRole.findUnique({ where: { id } })
  if (!jobRole) return

  await prisma.jobRole.delete({ where: { id } })

  await writeAuditLog(
    'jobRole.delete',
    { entityType: 'JobRole', entityId: id, name: jobRole.name, departmentId: jobRole.departmentId },
    actor.id,
  )

  revalidatePath('/admin/departments')
  revalidatePath('/admin/users')
}

export async function updateDepartment(formData: FormData) {
  const actor = await requireRole('ADMIN')
  const id = asString(formData.get('id'))
  const name = asString(formData.get('name'))
  if (!id || !name) return

  const department = await prisma.department.findUnique({ where: { id } })
  if (!department || department.name === name) return

  const clash = await prisma.department.findUnique({ where: { name } })
  if (clash) return

  await prisma.department.update({ where: { id }, data: { name } })

  await writeAuditLog(
    'department.update',
    { entityType: 'Department', entityId: id, from: department.name, to: name },
    actor.id,
  )

  revalidatePath('/admin/departments')
  revalidatePath(`/admin/departments/${id}`)
  revalidatePath('/admin/users')
}

export async function updateJobRole(formData: FormData) {
  const actor = await requireRole('ADMIN')
  const id = asString(formData.get('id'))
  const name = asString(formData.get('name'))
  if (!id || !name) return

  const jobRole = await prisma.jobRole.findUnique({ where: { id } })
  if (!jobRole || jobRole.name === name) return

  const clash = await prisma.jobRole.findUnique({
    where: { departmentId_name: { departmentId: jobRole.departmentId, name } },
  })
  if (clash) return

  await prisma.jobRole.update({ where: { id }, data: { name } })

  await writeAuditLog(
    'jobRole.update',
    { entityType: 'JobRole', entityId: id, departmentId: jobRole.departmentId, from: jobRole.name, to: name },
    actor.id,
  )

  revalidatePath('/admin/departments')
  revalidatePath(`/admin/departments/${jobRole.departmentId}`)
  revalidatePath('/admin/users')
}
