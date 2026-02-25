/*
  Warnings:

  - The values [ACTIVE] on the enum `ProjectStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- CreateEnum
CREATE TYPE "AlertType" AS ENUM ('MILESTONE_OVERDUE', 'CONTRACT_EXPIRY', 'WORKFLOW_TIMEOUT', 'LOW_STOCK');

-- CreateEnum
CREATE TYPE "MaterialAction" AS ENUM ('IN', 'OUT', 'RETURN');

-- AlterEnum（先迁移数据，再转换类型）
BEGIN;
-- 将 ACTIVE 映射到 EXECUTING（数据迁移）
ALTER TABLE "projects" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "projects" ALTER COLUMN "status" TYPE TEXT;
UPDATE "projects" SET "status" = 'EXECUTING' WHERE "status" = 'ACTIVE';

-- 创建新枚举并应用
CREATE TYPE "ProjectStatus_new" AS ENUM ('INIT', 'REVIEW', 'EXECUTING', 'CHANGE', 'ACCEPTANCE', 'COMPLETED', 'SUSPENDED');
ALTER TABLE "projects" ALTER COLUMN "status" TYPE "ProjectStatus_new" USING ("status"::"ProjectStatus_new");
ALTER TYPE "ProjectStatus" RENAME TO "ProjectStatus_old";
ALTER TYPE "ProjectStatus_new" RENAME TO "ProjectStatus";
DROP TYPE "ProjectStatus_old";
ALTER TABLE "projects" ALTER COLUMN "status" SET DEFAULT 'INIT';
COMMIT;

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "TemplateType" ADD VALUE 'PROJECT_APPROVAL';
ALTER TYPE "TemplateType" ADD VALUE 'CHANGE_REQUEST';
ALTER TYPE "TemplateType" ADD VALUE 'ACCEPTANCE';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "WorkflowType" ADD VALUE 'PROJECT_APPROVAL';
ALTER TYPE "WorkflowType" ADD VALUE 'CHANGE_REQUEST';
ALTER TYPE "WorkflowType" ADD VALUE 'ACCEPTANCE';

-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "budget" DECIMAL(12,2),
ADD COLUMN     "cost" DECIMAL(12,2),
ALTER COLUMN "status" SET DEFAULT 'INIT';

-- CreateTable
CREATE TABLE "milestones" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "due_date" TIMESTAMP(3) NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "project_id" INTEGER NOT NULL,

    CONSTRAINT "milestones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_versions" (
    "id" SERIAL NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" INTEGER NOT NULL,
    "version" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "diff" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "operator_id" INTEGER NOT NULL,

    CONSTRAINT "document_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alerts" (
    "id" SERIAL NOT NULL,
    "type" "AlertType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "target_id" INTEGER,
    "target_type" TEXT,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" INTEGER NOT NULL,

    CONSTRAINT "alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "materials" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "min_stock" INTEGER NOT NULL DEFAULT 0,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "materials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "material_records" (
    "id" SERIAL NOT NULL,
    "type" "MaterialAction" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "remark" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "material_id" INTEGER NOT NULL,
    "project_id" INTEGER,
    "operator_id" INTEGER NOT NULL,

    CONSTRAINT "material_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "milestones_project_id_idx" ON "milestones"("project_id");

-- CreateIndex
CREATE INDEX "milestones_due_date_completed_idx" ON "milestones"("due_date", "completed");

-- CreateIndex
CREATE INDEX "document_versions_entity_type_entity_id_idx" ON "document_versions"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "alerts_user_id_is_read_idx" ON "alerts"("user_id", "is_read");

-- CreateIndex
CREATE UNIQUE INDEX "materials_code_key" ON "materials"("code");

-- CreateIndex
CREATE INDEX "material_records_material_id_idx" ON "material_records"("material_id");

-- CreateIndex
CREATE INDEX "material_records_project_id_idx" ON "material_records"("project_id");

-- CreateIndex
CREATE INDEX "approval_nodes_approver_id_status_idx" ON "approval_nodes"("approver_id", "status");

-- CreateIndex
CREATE INDEX "projects_status_idx" ON "projects"("status");

-- CreateIndex
CREATE INDEX "projects_pm_id_idx" ON "projects"("pm_id");

-- CreateIndex
CREATE INDEX "workflow_instances_status_idx" ON "workflow_instances"("status");

-- CreateIndex
CREATE INDEX "workflow_instances_applicant_id_idx" ON "workflow_instances"("applicant_id");

-- AddForeignKey
ALTER TABLE "milestones" ADD CONSTRAINT "milestones_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_versions" ADD CONSTRAINT "document_versions_operator_id_fkey" FOREIGN KEY ("operator_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_records" ADD CONSTRAINT "material_records_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "materials"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_records" ADD CONSTRAINT "material_records_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_records" ADD CONSTRAINT "material_records_operator_id_fkey" FOREIGN KEY ("operator_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
