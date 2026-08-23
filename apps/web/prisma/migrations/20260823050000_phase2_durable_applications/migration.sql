-- CreateEnum
CREATE TYPE "ServiceKey" AS ENUM ('LEARNER_LICENCE', 'PERMANENT_DRIVING_LICENCE');
CREATE TYPE "ApplicationStatus" AS ENUM ('DRAFT', 'IN_PROGRESS', 'READY_FOR_IDENTITY');
CREATE TYPE "ApplicationSectionKey" AS ENUM ('PERSONAL_DETAILS', 'ADDRESS', 'SERVICE_DETAILS', 'DECLARATION');
CREATE TYPE "ApplicationEventType" AS ENUM ('APPLICATION_CREATED', 'SECTION_SAVED', 'SECTION_COMPLETED', 'WORKFLOW_ADVANCED');

-- CreateTable
CREATE TABLE "Application" (
  "id" UUID NOT NULL,
  "applicantId" UUID NOT NULL,
  "serviceKey" "ServiceKey" NOT NULL,
  "status" "ApplicationStatus" NOT NULL DEFAULT 'DRAFT',
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "Application_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ApplicationSection" (
  "id" UUID NOT NULL,
  "applicationId" UUID NOT NULL,
  "sectionKey" "ApplicationSectionKey" NOT NULL,
  "data" JSONB NOT NULL,
  "revision" INTEGER NOT NULL DEFAULT 1,
  "completedAt" TIMESTAMPTZ(3),
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "ApplicationSection_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ApplicationSection_revision_check" CHECK ("revision" >= 1)
);

CREATE TABLE "ApplicationEvent" (
  "id" UUID NOT NULL,
  "applicationId" UUID NOT NULL,
  "actorApplicantId" UUID NOT NULL,
  "eventType" "ApplicationEventType" NOT NULL,
  "sectionKey" "ApplicationSectionKey",
  "correlationId" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ApplicationEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Application_applicantId_serviceKey_key" ON "Application"("applicantId", "serviceKey");
CREATE INDEX "Application_applicantId_updatedAt_idx" ON "Application"("applicantId", "updatedAt");
CREATE UNIQUE INDEX "ApplicationSection_applicationId_sectionKey_key" ON "ApplicationSection"("applicationId", "sectionKey");
CREATE INDEX "ApplicationSection_applicationId_completedAt_idx" ON "ApplicationSection"("applicationId", "completedAt");
CREATE INDEX "ApplicationEvent_applicationId_createdAt_id_idx" ON "ApplicationEvent"("applicationId", "createdAt", "id");
CREATE INDEX "ApplicationEvent_actorApplicantId_createdAt_idx" ON "ApplicationEvent"("actorApplicantId", "createdAt");

ALTER TABLE "Application" ADD CONSTRAINT "Application_applicantId_fkey" FOREIGN KEY ("applicantId") REFERENCES "Applicant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ApplicationSection" ADD CONSTRAINT "ApplicationSection_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ApplicationEvent" ADD CONSTRAINT "ApplicationEvent_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ApplicationEvent" ADD CONSTRAINT "ApplicationEvent_actorApplicantId_fkey" FOREIGN KEY ("actorApplicantId") REFERENCES "Applicant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
