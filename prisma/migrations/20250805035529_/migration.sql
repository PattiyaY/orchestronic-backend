-- CreateTable
CREATE TABLE "public"."AzureVMSize" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "numberOfCores" INTEGER NOT NULL,
    "maxDataDiskCount" INTEGER NOT NULL,
    "memoryInMB" INTEGER NOT NULL,
    "osDiskSizeInMB" INTEGER NOT NULL,
    "resourceDiskSizeInMB" INTEGER NOT NULL,

    CONSTRAINT "AzureVMSize_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AzureVMSize_name_key" ON "public"."AzureVMSize"("name");
