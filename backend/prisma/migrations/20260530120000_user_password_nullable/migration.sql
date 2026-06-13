-- Allow OAuth-only users without a local password
ALTER TABLE "User" ALTER COLUMN "password" DROP NOT NULL;
