/*
  Warnings:

  - A unique constraint covering the columns `[cloudProvider]` on the table `PolicyDatabase` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[cloudProvider]` on the table `PolicyStorage` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[cloudProvider]` on the table `PolicyVM` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "public"."PolicyVM_name_key";

-- CreateIndex
CREATE UNIQUE INDEX "PolicyDatabase_cloudProvider_key" ON "public"."PolicyDatabase"("cloudProvider");

-- CreateIndex
CREATE UNIQUE INDEX "PolicyStorage_cloudProvider_key" ON "public"."PolicyStorage"("cloudProvider");

-- CreateIndex
CREATE UNIQUE INDEX "PolicyVM_cloudProvider_key" ON "public"."PolicyVM"("cloudProvider");
