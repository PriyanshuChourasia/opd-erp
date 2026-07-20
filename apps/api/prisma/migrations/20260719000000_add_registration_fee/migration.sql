-- Clinic-configurable registration fee (charged once per patient, on their first-ever appointment)
ALTER TABLE "Organisation" ADD COLUMN "registrationFee" INTEGER NOT NULL DEFAULT 100;
ALTER TABLE "Appointment" ADD COLUMN "registrationFee" INTEGER NOT NULL DEFAULT 0;
