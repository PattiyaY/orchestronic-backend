/*
  Warnings:

  - You are about to drop the column `memory` on the `PolicyVM` table. All the data in the column will be lost.
  - You are about to drop the column `noOfCores` on the `PolicyVM` table. All the data in the column will be lost.
  - Added the required column `memoryInMB` to the `PolicyVM` table without a default value. This is not possible if the table is not empty.
  - Added the required column `numberOfCores` to the `PolicyVM` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."PolicyVM" DROP COLUMN "memory",
DROP COLUMN "noOfCores",
ADD COLUMN     "memoryInMB" INTEGER NOT NULL,
ADD COLUMN     "numberOfCores" INTEGER NOT NULL;
