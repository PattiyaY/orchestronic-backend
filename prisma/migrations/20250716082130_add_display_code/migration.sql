/*
  Warnings:

  - You are about to drop the `UserRepository` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[displayCode]` on the table `Request` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `displayCode` to the `Request` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Request` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "UserRepository" DROP CONSTRAINT "UserRepository_repositoryId_fkey";

-- DropForeignKey
ALTER TABLE "UserRepository" DROP CONSTRAINT "UserRepository_userId_fkey";

-- AlterTable
ALTER TABLE "Request" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "displayCode" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- DropTable
DROP TABLE "UserRepository";

-- CreateTable
CREATE TABLE "ownedRepository" (
    "userId" TEXT NOT NULL,
    "repositoryId" TEXT NOT NULL,

    CONSTRAINT "ownedRepository_pkey" PRIMARY KEY ("userId","repositoryId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Request_displayCode_key" ON "Request"("displayCode");

-- AddForeignKey
ALTER TABLE "ownedRepository" ADD CONSTRAINT "ownedRepository_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ownedRepository" ADD CONSTRAINT "ownedRepository_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "Repository"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
