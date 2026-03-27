-- Add REQUIRES_REVIEW to VerificationStatus enum
ALTER TYPE "VerificationStatus" ADD VALUE IF NOT EXISTS 'REQUIRES_REVIEW';

-- Add new verification fields to User
ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "verificationProvider" TEXT,
  ADD COLUMN IF NOT EXISTS "verificationRefId"    TEXT,
  ADD COLUMN IF NOT EXISTS "verifiedAt"           TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "verifiedName"         TEXT;

-- CreateTable VerificationEvent
CREATE TABLE IF NOT EXISTS "VerificationEvent" (
    "id"        TEXT NOT NULL,
    "userId"    TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "provider"  TEXT NOT NULL,
    "refId"     TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VerificationEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "VerificationEvent_userId_idx" ON "VerificationEvent"("userId");
CREATE INDEX IF NOT EXISTS "VerificationEvent_userId_createdAt_idx" ON "VerificationEvent"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "VerificationEvent"
  ADD CONSTRAINT "VerificationEvent_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
