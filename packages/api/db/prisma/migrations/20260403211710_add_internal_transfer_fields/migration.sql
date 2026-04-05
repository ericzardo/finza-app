-- AlterTable
ALTER TABLE "transactions" ADD COLUMN     "is_internal" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "source_transaction_id" TEXT,
ADD COLUMN     "transfer_pair_id" TEXT;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_source_transaction_id_fkey" FOREIGN KEY ("source_transaction_id") REFERENCES "transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
