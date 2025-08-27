/*
  Warnings:

  - You are about to drop the column `capacityGB` on the `StorageInstance` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `StorageInstance` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."StorageInstance" DROP COLUMN "capacityGB",
DROP COLUMN "type",
ADD COLUMN     "accessTier" TEXT NOT NULL DEFAULT 'Hot',
ADD COLUMN     "kind" TEXT NOT NULL DEFAULT 'StorageV2',
ADD COLUMN     "name" TEXT NOT NULL DEFAULT 'storage-instance',
ADD COLUMN     "sku" TEXT NOT NULL DEFAULT 'Standard_LRS';
