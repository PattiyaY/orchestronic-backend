/*
  Warnings:

  - Added the required column `sizeId` to the `VMInstance` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."VMInstance" ADD COLUMN     "sizeId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."VMInstance" ADD CONSTRAINT "VMInstance_sizeId_fkey" FOREIGN KEY ("sizeId") REFERENCES "public"."AzureVMSize"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
