-- Add the PREVIEW_ACCESS ticket category.
ALTER TYPE "TicketCategory" ADD VALUE IF NOT EXISTS 'PREVIEW_ACCESS' BEFORE 'AUTRE';

-- Explicit preview access grants (owner + admins are implicit, not stored here).
CREATE TABLE "PreviewAccess" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "grantedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PreviewAccess_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PreviewAccess_projectId_userId_key" ON "PreviewAccess"("projectId", "userId");

CREATE INDEX "PreviewAccess_userId_idx" ON "PreviewAccess"("userId");

ALTER TABLE "PreviewAccess" ADD CONSTRAINT "PreviewAccess_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PreviewAccess" ADD CONSTRAINT "PreviewAccess_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PreviewAccess" ADD CONSTRAINT "PreviewAccess_grantedById_fkey" FOREIGN KEY ("grantedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
