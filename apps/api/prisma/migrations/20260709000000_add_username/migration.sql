-- Add username column (initially nullable), backfill existing users, then make it NOT NULL + UNIQUE
ALTER TABLE "User" ADD COLUMN "username" TEXT;

-- Backfill existing users with a username derived from their email
UPDATE "User" SET "username" = LOWER(SPLIT_PART("email", '@', 1)) WHERE "username" IS NULL;

-- Handle any potential duplicate usernames by appending a random suffix
UPDATE "User" u1 SET "username" = u1."username" || '_' || SUBSTRING(MD5(u1."id")::text, 1, 4)
WHERE EXISTS (
  SELECT 1 FROM "User" u2 WHERE u2."username" = u1."username" AND u2."id" != u1."id"
);

-- Now make it NOT NULL and add UNIQUE constraint
ALTER TABLE "User" ALTER COLUMN "username" SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "User_username_key" ON "User"("username");

-- Update _prisma_migrations table so Prisma knows this migration was applied
