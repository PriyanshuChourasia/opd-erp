-- RenameColumn
ALTER TABLE "Appointment" RENAME COLUMN "otherFee" TO "amountPaid";

-- DropColumn
ALTER TABLE "Appointment" DROP COLUMN "otherFeeLabel";
