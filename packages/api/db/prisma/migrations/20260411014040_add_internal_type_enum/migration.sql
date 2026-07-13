-- CreateEnum
CREATE TYPE "InternalType" AS ENUM ('CASCADE', 'DISTRIBUTION', 'BALANCE_ADJUSTMENT');

-- AddColumn
ALTER TABLE "transactions" ADD COLUMN "internal_type" "InternalType";

-- MigrateData: is_internal = true → CASCADE
UPDATE "transactions" SET "internal_type" = 'CASCADE' WHERE "is_internal" = true;

-- DropColumn
ALTER TABLE "transactions" DROP COLUMN "is_internal";
