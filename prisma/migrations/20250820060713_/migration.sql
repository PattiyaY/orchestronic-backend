-- DropForeignKey
ALTER TABLE "public"."CloudResourceSecret" DROP CONSTRAINT "CloudResourceSecret_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."DatabaseInstance" DROP CONSTRAINT "DatabaseInstance_resourceConfigId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Repository" DROP CONSTRAINT "Repository_resourcesId_fkey";

-- DropForeignKey
ALTER TABLE "public"."RepositoryCollaborators" DROP CONSTRAINT "RepositoryCollaborators_repositoryId_fkey";

-- DropForeignKey
ALTER TABLE "public"."RepositoryCollaborators" DROP CONSTRAINT "RepositoryCollaborators_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Request" DROP CONSTRAINT "Request_ownerId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Request" DROP CONSTRAINT "Request_repositoryId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Request" DROP CONSTRAINT "Request_resourcesId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Resources" DROP CONSTRAINT "Resources_resourceConfigId_fkey";

-- DropForeignKey
ALTER TABLE "public"."StorageInstance" DROP CONSTRAINT "StorageInstance_resourceConfigId_fkey";

-- DropForeignKey
ALTER TABLE "public"."VMInstance" DROP CONSTRAINT "VMInstance_resourceConfigId_fkey";

-- DropForeignKey
ALTER TABLE "public"."VMInstance" DROP CONSTRAINT "VMInstance_sizeId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ownedRepository" DROP CONSTRAINT "ownedRepository_repositoryId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ownedRepository" DROP CONSTRAINT "ownedRepository_userId_fkey";

-- AddForeignKey
ALTER TABLE "public"."Request" ADD CONSTRAINT "Request_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Request" ADD CONSTRAINT "Request_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "public"."Repository"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Request" ADD CONSTRAINT "Request_resourcesId_fkey" FOREIGN KEY ("resourcesId") REFERENCES "public"."Resources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Repository" ADD CONSTRAINT "Repository_resourcesId_fkey" FOREIGN KEY ("resourcesId") REFERENCES "public"."Resources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Resources" ADD CONSTRAINT "Resources_resourceConfigId_fkey" FOREIGN KEY ("resourceConfigId") REFERENCES "public"."ResourceConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."VMInstance" ADD CONSTRAINT "VMInstance_sizeId_fkey" FOREIGN KEY ("sizeId") REFERENCES "public"."AzureVMSize"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."VMInstance" ADD CONSTRAINT "VMInstance_resourceConfigId_fkey" FOREIGN KEY ("resourceConfigId") REFERENCES "public"."ResourceConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DatabaseInstance" ADD CONSTRAINT "DatabaseInstance_resourceConfigId_fkey" FOREIGN KEY ("resourceConfigId") REFERENCES "public"."ResourceConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StorageInstance" ADD CONSTRAINT "StorageInstance_resourceConfigId_fkey" FOREIGN KEY ("resourceConfigId") REFERENCES "public"."ResourceConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ownedRepository" ADD CONSTRAINT "ownedRepository_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ownedRepository" ADD CONSTRAINT "ownedRepository_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "public"."Repository"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RepositoryCollaborators" ADD CONSTRAINT "RepositoryCollaborators_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RepositoryCollaborators" ADD CONSTRAINT "RepositoryCollaborators_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "public"."Repository"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CloudResourceSecret" ADD CONSTRAINT "CloudResourceSecret_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
