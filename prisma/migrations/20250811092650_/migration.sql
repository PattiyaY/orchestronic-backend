-- AlterTable
ALTER TABLE "public"."CloudResourceSecret" ADD COLUMN     "userId" TEXT;

-- AddForeignKey
ALTER TABLE "public"."CloudResourceSecret" ADD CONSTRAINT "CloudResourceSecret_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
