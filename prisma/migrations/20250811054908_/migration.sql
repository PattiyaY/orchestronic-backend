-- CreateTable
CREATE TABLE "public"."PolicyVM" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "noOfCores" INTEGER NOT NULL,
    "memory" INTEGER NOT NULL,

    CONSTRAINT "PolicyVM_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PolicyDatabase" (
    "id" TEXT NOT NULL,
    "maxStorage" INTEGER NOT NULL,

    CONSTRAINT "PolicyDatabase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PolicyStorage" (
    "id" TEXT NOT NULL,
    "maxStorage" INTEGER NOT NULL,

    CONSTRAINT "PolicyStorage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PolicyVM_name_key" ON "public"."PolicyVM"("name");
