-- Allow projects to exist without a chosen plan.
ALTER TYPE "PlanType" ADD VALUE IF NOT EXISTS 'NONE' BEFORE 'START';
