import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { PrismaClient, SubmissionStatus } from '@prisma/client'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables from root .env
dotenv.config({ path: path.resolve(__dirname, '../../.env') })
dotenv.config({ path: path.resolve(__dirname, '.env') })

// Use DIRECT_URL for seed (session-mode pooler supports connection pooling better)
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL || process.env.DATABASE_URL,
    },
  },
})

async function main() {
  const passwordPlainAdmin = process.env.SEED_ADMIN_PASSWORD

  if (!passwordPlainAdmin) {
    throw new Error('Missing environment variable: SEED_ADMIN_PASSWORD')
  }

  const adminPasswordHash = await bcrypt.hash(passwordPlainAdmin, 10)

  // Default attendance window (08:00-08:30), editable by an admin from
  // /admin/attendance/config. Departments without their own window fall
  // back to this one. Idempotent, so it's safe to run every seed pass.
  const existingDefaultWindow = await prisma.attendanceWindow.findFirst({
    where: { departmentId: null },
  })
  if (!existingDefaultWindow) {
    await prisma.attendanceWindow.create({
      data: { departmentId: null, windowStartMinutes: 8 * 60, windowEndMinutes: 8 * 60 + 30 },
    })
  }

  // Check if admin already exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email: 'mygaleartetservices@gmail.com' },
  })

  if (existingAdmin) {
    console.log('⚠️  Admin user already exists, skipping seed')
    return
  }

  const admin = await prisma.user.create({
    data: {
      name: 'Admin',
      passwordHash: adminPasswordHash,
      email: 'mygaleartetservices@gmail.com',
      // Matches the production account's actual role, so a fresh dev/test
      // database can exercise Super-Admin-only areas (attendance window
      // config, audit log, viewing Super Admin accounts) the same way
      // production does.
      role: 'SUPER_ADMIN',
      phone: '+237600000000',
      createdAt: new Date(),
    },
  })

  console.log('✅ Seed data inserted')
  console.log('Admin email: mygaleartetservices@gmail.com')
  console.log('Admin password:', passwordPlainAdmin)
}

main()
  .catch((error) => {
    console.error('❌ Seed failed:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

/*
async function main() {
  const admin = await prisma.user.upsert({
    where: { email: 'mygaleartetservices@gmail.com' },
    update: {},
    create: {
      name: 'Admin',
      email: 'mygaleartetservices@gmail.com',
      role: 'ADMIN',
    },
  })

  const submission = await prisma.contactSubmission.create({
    data: {
      name: 'Sample Client',
      email: 'mygaleartetservices@gmail.com',
      message: 'Interested in your art services!',
      status: SubmissionStatus.new,
      assignedTo: { connect: { id: admin.id } },
    },
  })

  await prisma.auditLog.create({
    data: {
      contactSubmissionId: submission.id,
      action: 'Submission created',
      actorId: admin.id,
    },
  })

  console.log('✅ Seed data inserted')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
*/
