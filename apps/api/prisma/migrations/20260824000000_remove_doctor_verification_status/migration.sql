-- DropIndex
DROP INDEX "public"."Doctor_verificationStatus_idx";

-- AlterTable
ALTER TABLE "Doctor" DROP COLUMN "verificationStatus";
