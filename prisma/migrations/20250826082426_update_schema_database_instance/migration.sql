/*
  Warnings:

  - The `engine` column on the `DatabaseInstance` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "public"."Engine" AS ENUM ('MySQL', 'PostgreSQL');

-- AlterTable
ALTER TABLE "public"."DatabaseInstance" DROP COLUMN "engine",
ADD COLUMN     "engine" "public"."Engine" NOT NULL DEFAULT 'PostgreSQL';
