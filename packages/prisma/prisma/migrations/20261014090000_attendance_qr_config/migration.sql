-- CreateTable
CREATE TABLE "AttendanceQrConfig" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "tokenSeed" TEXT NOT NULL,
    "validityHours" INTEGER NOT NULL DEFAULT 168,
    "rotatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedById" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AttendanceQrConfig_pkey" PRIMARY KEY ("id")
);
