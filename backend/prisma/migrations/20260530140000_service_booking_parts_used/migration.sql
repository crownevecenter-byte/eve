-- AlterTable
ALTER TABLE "ServiceBooking" ADD COLUMN "partsUsed" JSONB;
ALTER TABLE "ServiceBooking" ADD COLUMN "stockDeducted" BOOLEAN NOT NULL DEFAULT false;
