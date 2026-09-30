-- AlterTable
ALTER TABLE "Attendance" ADD COLUMN     "departureAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "updatedAt" DROP DEFAULT;
