/*
  Warnings:

  - You are about to drop the `transaction_splits` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "transaction_splits" DROP CONSTRAINT "transaction_splits_bucket_id_fkey";

-- DropForeignKey
ALTER TABLE "transaction_splits" DROP CONSTRAINT "transaction_splits_transaction_id_fkey";

-- DropTable
DROP TABLE "transaction_splits";

-- CreateTable
CREATE TABLE "transaction_allocations" (
    "id" TEXT NOT NULL,
    "transaction_id" TEXT NOT NULL,
    "bucket_id" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "allocation_type" "AllocationType" NOT NULL DEFAULT 'DISTRIBUTION',
    "transfer_pair_id" TEXT,

    CONSTRAINT "transaction_allocations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "transaction_allocations_transaction_id_idx" ON "transaction_allocations"("transaction_id");

-- CreateIndex
CREATE INDEX "transaction_allocations_bucket_id_idx" ON "transaction_allocations"("bucket_id");

-- AddForeignKey
ALTER TABLE "transaction_allocations" ADD CONSTRAINT "transaction_allocations_bucket_id_fkey" FOREIGN KEY ("bucket_id") REFERENCES "buckets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_allocations" ADD CONSTRAINT "transaction_allocations_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
