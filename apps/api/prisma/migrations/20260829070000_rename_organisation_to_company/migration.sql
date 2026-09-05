-- RenameTable
ALTER TABLE "Organisation" RENAME TO "Company";

-- RenameConstraint
ALTER TABLE "Company" RENAME CONSTRAINT "Organisation_pkey" TO "Company_pkey";
