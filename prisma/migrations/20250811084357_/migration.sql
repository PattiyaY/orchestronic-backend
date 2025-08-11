/*
  Warnings:

  - You are about to drop the column `cloudResourceSecretId` on the `PolicyDatabase` table. All the data in the column will be lost.
  - You are about to drop the column `cloudResourceSecretId` on the `PolicyStorage` table. All the data in the column will be lost.
  - You are about to drop the column `cloudResourceSecretId` on the `PolicyVM` table. All the data in the column will be lost.
  - Added the required column `cloudProvider` to the `PolicyDatabase` table without a default value. This is not possible if the table is not empty.
  - Added the required column `cloudProvider` to the `PolicyStorage` table without a default value. This is not possible if the table is not empty.
  - Added the required column `cloudProvider` to the `PolicyVM` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."PolicyDatabase" DROP CONSTRAINT "PolicyDatabase_cloudResourceSecretId_fkey";

-- DropForeignKey
ALTER TABLE "public"."PolicyStorage" DROP CONSTRAINT "PolicyStorage_cloudResourceSecretId_fkey";

-- DropForeignKey
ALTER TABLE "public"."PolicyVM" DROP CONSTRAINT "PolicyVM_cloudResourceSecretId_fkey";

-- AlterTable
ALTER TABLE "public"."PolicyDatabase" DROP COLUMN "cloudResourceSecretId",
ADD COLUMN     "cloudProvider" "public"."CloudProvider" NOT NULL;

-- AlterTable
ALTER TABLE "public"."PolicyStorage" DROP COLUMN "cloudResourceSecretId",
ADD COLUMN     "cloudProvider" "public"."CloudProvider" NOT NULL;

-- AlterTable
ALTER TABLE "public"."PolicyVM" DROP COLUMN "cloudResourceSecretId",
ADD COLUMN     "cloudProvider" "public"."CloudProvider" NOT NULL;
