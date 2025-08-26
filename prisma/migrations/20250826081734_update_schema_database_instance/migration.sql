-- AlterTable
ALTER TABLE "public"."DatabaseInstance" ADD COLUMN     "name" TEXT NOT NULL DEFAULT 'database-instance',
ADD COLUMN     "password" TEXT NOT NULL DEFAULT 'P@ssw0rd!',
ADD COLUMN     "skuName" TEXT NOT NULL DEFAULT 'B_Standard_B1ms',
ADD COLUMN     "username" TEXT NOT NULL DEFAULT 'admin',
ALTER COLUMN "engine" SET DEFAULT 'postgresql',
ALTER COLUMN "storageGB" SET DEFAULT 2048;
