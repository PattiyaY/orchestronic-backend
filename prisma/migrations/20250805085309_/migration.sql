/*
  Warnings:

  - You are about to drop the column `memory` on the `VMInstance` table. All the data in the column will be lost.
  - You are about to drop the column `numberOfCores` on the `VMInstance` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."VMInstance" DROP COLUMN "memory",
DROP COLUMN "numberOfCores";
