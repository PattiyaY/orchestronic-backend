/*
  Warnings:

  - You are about to drop the column `userId` on the `CloudResourceSecret` table. All the data in the column will be lost.
  - Added the required column `cloudResourceSecretId` to the `PolicyDatabase` table without a default value. This is not possible if the table is not empty.
  - Added the required column `cloudResourceSecretId` to the `PolicyStorage` table without a default value. This is not possible if the table is not empty.
  - Added the required column `cloudResourceSecretId` to the `PolicyVM` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."CloudResourceSecret" DROP CONSTRAINT "CloudResourceSecret_userId_fkey";

-- AlterTable
ALTER TABLE "public"."CloudResourceSecret" DROP COLUMN "userId";

-- AlterTable
ALTER TABLE "public"."PolicyDatabase" ADD COLUMN     "cloudResourceSecretId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."PolicyStorage" ADD COLUMN     "cloudResourceSecretId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."PolicyVM" ADD COLUMN     "cloudResourceSecretId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."PolicyVM" ADD CONSTRAINT "PolicyVM_cloudResourceSecretId_fkey" FOREIGN KEY ("cloudResourceSecretId") REFERENCES "public"."CloudResourceSecret"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PolicyDatabase" ADD CONSTRAINT "PolicyDatabase_cloudResourceSecretId_fkey" FOREIGN KEY ("cloudResourceSecretId") REFERENCES "public"."CloudResourceSecret"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PolicyStorage" ADD CONSTRAINT "PolicyStorage_cloudResourceSecretId_fkey" FOREIGN KEY ("cloudResourceSecretId") REFERENCES "public"."CloudResourceSecret"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
