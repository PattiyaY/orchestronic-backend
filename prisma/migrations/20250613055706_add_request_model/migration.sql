-- CreateEnum
CREATE TYPE "Status" AS ENUM ('Pending', 'Approved', 'Rejected');

-- CreateTable
CREATE TABLE "Request" (
    "id" TEXT NOT NULL,
    "team" TEXT,
    "repository" TEXT,
    "resourceGroup" TEXT,
    "region" TEXT,
    "cloudProvider" TEXT,
    "status" "Status" DEFAULT 'Pending',
    "userId" TEXT,
    "userName" TEXT,
    "description" TEXT,
    "resourcesId" TEXT,

    CONSTRAINT "Request_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Resources" (
    "id" TEXT NOT NULL,
    "VM" INTEGER NOT NULL,
    "DB" INTEGER NOT NULL,
    "ST" INTEGER NOT NULL,

    CONSTRAINT "Resources_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Request_resourcesId_key" ON "Request"("resourcesId");

-- AddForeignKey
ALTER TABLE "Request" ADD CONSTRAINT "Request_resourcesId_fkey" FOREIGN KEY ("resourcesId") REFERENCES "Resources"("id") ON DELETE SET NULL ON UPDATE CASCADE;
