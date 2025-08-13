/*
  Warnings:

  - Made the column `userId` on table `CloudResourceSecret` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "public"."CloudResourceSecret" DROP CONSTRAINT "CloudResourceSecret_userId_fkey";

-- AlterTable
ALTER TABLE "public"."CloudResourceSecret" ALTER COLUMN "userId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."CloudResourceSecret" ADD CONSTRAINT "CloudResourceSecret_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
