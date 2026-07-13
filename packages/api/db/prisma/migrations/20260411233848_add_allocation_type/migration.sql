-- CreateEnum
CREATE TYPE "AllocationType" AS ENUM ('SPLIT', 'DISTRIBUTION');

-- AlterTable
ALTER TABLE "transaction_splits" ADD COLUMN     "allocation_type" "AllocationType" NOT NULL DEFAULT 'DISTRIBUTION';
