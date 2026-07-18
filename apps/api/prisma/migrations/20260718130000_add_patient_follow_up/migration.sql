-- Track whether a patient is a returning follow-up patient
ALTER TABLE "Patient" ADD COLUMN "isFollowUp" BOOLEAN NOT NULL DEFAULT false;
