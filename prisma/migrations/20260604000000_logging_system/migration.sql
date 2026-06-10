-- CreateEnum
CREATE TYPE "LogLevel" AS ENUM ('INFO', 'WARN', 'ERROR', 'SECURITY');

-- CreateEnum
CREATE TYPE "LogCategory" AS ENUM ('AUTH', 'ACCOUNT', 'CRM', 'PROJECT', 'BILLING', 'SUPPORT', 'CUSTOMIZATION', 'SYSTEM', 'GENERAL');

-- AlterTable
ALTER TABLE "ActivityLog" ADD COLUMN "level" "LogLevel" NOT NULL DEFAULT 'INFO',
    ADD COLUMN "category" "LogCategory" NOT NULL DEFAULT 'GENERAL',
    ADD COLUMN "message" TEXT,
    ADD COLUMN "ip" TEXT,
    ADD COLUMN "userAgent" TEXT;

-- CreateIndex
CREATE INDEX "ActivityLog_category_createdAt_idx" ON "ActivityLog"("category", "createdAt");

-- CreateIndex
CREATE INDEX "ActivityLog_level_createdAt_idx" ON "ActivityLog"("level", "createdAt");

-- CreateIndex
CREATE INDEX "ActivityLog_action_idx" ON "ActivityLog"("action");
