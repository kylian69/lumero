-- Backfill projectId for subscriptions linked only to a user:
-- pick the user's most recent project.
UPDATE "Subscription" s
SET "projectId" = (
    SELECT p.id
    FROM "Project" p
    WHERE p."userId" = s."userId"
    ORDER BY p."createdAt" DESC
    LIMIT 1
)
WHERE s."projectId" IS NULL;

-- Drop subscriptions that still cannot be attached to any project.
DELETE FROM "Subscription" WHERE "projectId" IS NULL;

-- Drop old FK / index on userId, then drop the column.
ALTER TABLE "Subscription" DROP CONSTRAINT "Subscription_userId_fkey";
ALTER TABLE "Subscription" DROP CONSTRAINT "Subscription_projectId_fkey";
DROP INDEX "Subscription_userId_idx";
ALTER TABLE "Subscription" DROP COLUMN "userId";

-- Make projectId required and cascade on project deletion.
ALTER TABLE "Subscription" ALTER COLUMN "projectId" SET NOT NULL;
ALTER TABLE "Subscription"
    ADD CONSTRAINT "Subscription_projectId_fkey"
    FOREIGN KEY ("projectId") REFERENCES "Project"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "Subscription_projectId_idx" ON "Subscription"("projectId");
