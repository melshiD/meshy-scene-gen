-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('pending', 'processing', 'completed', 'failed');

-- CreateTable
CREATE TABLE "Job" (
    "id" TEXT NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'pending',
    "prompt" TEXT NOT NULL,
    "objectPrompt" TEXT,
    "backgroundPrompt" TEXT,
    "mood" TEXT,
    "presetId" TEXT,
    "assets" JSONB,
    "meshUrl" TEXT,
    "backgroundUrl" TEXT,
    "manifestUrl" TEXT,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MultiObjectJob" (
    "id" TEXT NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'pending',
    "backgroundStatus" "JobStatus" NOT NULL DEFAULT 'pending',
    "backgroundUrl" TEXT,
    "backgroundError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "MultiObjectJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MultiObjectObject" (
    "id" TEXT NOT NULL,
    "objectId" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'pending',
    "progress" INTEGER,
    "meshUrl" TEXT,
    "error" TEXT,
    "jobId" TEXT NOT NULL,

    CONSTRAINT "MultiObjectObject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Asset" (
    "key" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "data" BYTEA NOT NULL,
    "size" INTEGER NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Asset_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "ScenePreset" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "object" JSONB NOT NULL,
    "camera" JSONB NOT NULL,
    "lighting" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScenePreset_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Job_createdAt_idx" ON "Job"("createdAt");

-- CreateIndex
CREATE INDEX "MultiObjectJob_createdAt_idx" ON "MultiObjectJob"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "MultiObjectObject_jobId_objectId_key" ON "MultiObjectObject"("jobId", "objectId");

-- AddForeignKey
ALTER TABLE "MultiObjectObject" ADD CONSTRAINT "MultiObjectObject_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "MultiObjectJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;

