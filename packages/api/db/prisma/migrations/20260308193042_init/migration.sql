-- CreateEnum
CREATE TYPE "WorkspaceRole" AS ENUM ('OWNER', 'EDITOR', 'VIEWER');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('OPEN', 'CLOSED', 'PAID');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('INCOME', 'EXPENSE', 'TRANSFER');

-- CreateEnum
CREATE TYPE "PatternType" AS ENUM ('INSTALLMENT', 'RECURRING');

-- CreateEnum
CREATE TYPE "BucketType" AS ENUM ('SPENDING', 'INVESTMENT', 'INBOX');

-- CreateEnum
CREATE TYPE "TokenType" AS ENUM ('PASSWORD_RESET', 'EMAIL_VERIFICATION');

-- CreateTable
CREATE TABLE "plans" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" DECIMAL(12,2) NOT NULL,
    "features" JSONB NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "avatar_url" TEXT DEFAULT '/avatars/1.webp',
    "is_privacy_enabled" BOOLEAN NOT NULL DEFAULT false,
    "email_verified_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "plan_id" TEXT,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tokens" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "type" "TokenType" NOT NULL,
    "user_id" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workspaces" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'BRL',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workspaces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workspace_members" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" "WorkspaceRole" NOT NULL DEFAULT 'EDITOR',
    "invited_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "accepted_at" TIMESTAMP(3),

    CONSTRAINT "workspace_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bank_accounts" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "provider" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bank_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "buckets" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "BucketType" NOT NULL DEFAULT 'SPENDING',
    "allocation_percentage" DECIMAL(5,2) NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "buckets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "icon" TEXT,
    "color" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credit_cards" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "bank_account_id" TEXT,
    "name" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "last_digits" TEXT,
    "limit" DECIMAL(12,2) NOT NULL,
    "closing_day" INTEGER NOT NULL,
    "due_day" INTEGER NOT NULL,
    "interest_rate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "late_fee_rate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "credit_cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "credit_card_id" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'OPEN',
    "due_date" TIMESTAMP(3) NOT NULL,
    "paid_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transaction_patterns" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "bucket_id" TEXT,
    "category_id" TEXT,
    "description" TEXT NOT NULL,
    "type" "PatternType" NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "installments_count" INTEGER,
    "paid_installments" INTEGER DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transaction_patterns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "bank_account_id" TEXT,
    "credit_card_id" TEXT,
    "invoice_id" TEXT,
    "bucket_id" TEXT,
    "category_id" TEXT,
    "transaction_pattern_id" TEXT,
    "type" "TransactionType" NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "description" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "is_paid" BOOLEAN NOT NULL DEFAULT true,
    "installment_number" INTEGER,
    "canceled_at" TIMESTAMP(3),
    "canceled_by" TEXT,
    "cancellation_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transaction_splits" (
    "id" TEXT NOT NULL,
    "transaction_id" TEXT NOT NULL,
    "bucket_id" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "transaction_splits_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "plans_slug_key" ON "plans"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "tokens_token_key" ON "tokens"("token");

-- CreateIndex
CREATE INDEX "tokens_user_id_idx" ON "tokens"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "workspace_members_workspace_id_user_id_key" ON "workspace_members"("workspace_id", "user_id");

-- CreateIndex
CREATE INDEX "bank_accounts_workspace_id_idx" ON "bank_accounts"("workspace_id");

-- CreateIndex
CREATE INDEX "buckets_workspace_id_idx" ON "buckets"("workspace_id");

-- CreateIndex
CREATE INDEX "categories_workspace_id_idx" ON "categories"("workspace_id");

-- CreateIndex
CREATE INDEX "credit_cards_workspace_id_idx" ON "credit_cards"("workspace_id");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_credit_card_id_month_year_key" ON "invoices"("credit_card_id", "month", "year");

-- CreateIndex
CREATE INDEX "transaction_patterns_workspace_id_idx" ON "transaction_patterns"("workspace_id");

-- CreateIndex
CREATE INDEX "transactions_workspace_id_idx" ON "transactions"("workspace_id");

-- CreateIndex
CREATE INDEX "transactions_date_idx" ON "transactions"("date");

-- CreateIndex
CREATE INDEX "transaction_splits_transaction_id_idx" ON "transaction_splits"("transaction_id");

-- CreateIndex
CREATE INDEX "transaction_splits_bucket_id_idx" ON "transaction_splits"("bucket_id");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tokens" ADD CONSTRAINT "tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_accounts" ADD CONSTRAINT "bank_accounts_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "buckets" ADD CONSTRAINT "buckets_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_cards" ADD CONSTRAINT "credit_cards_bank_account_id_fkey" FOREIGN KEY ("bank_account_id") REFERENCES "bank_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_cards" ADD CONSTRAINT "credit_cards_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_credit_card_id_fkey" FOREIGN KEY ("credit_card_id") REFERENCES "credit_cards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_patterns" ADD CONSTRAINT "transaction_patterns_bucket_id_fkey" FOREIGN KEY ("bucket_id") REFERENCES "buckets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_patterns" ADD CONSTRAINT "transaction_patterns_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_patterns" ADD CONSTRAINT "transaction_patterns_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_bank_account_id_fkey" FOREIGN KEY ("bank_account_id") REFERENCES "bank_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_bucket_id_fkey" FOREIGN KEY ("bucket_id") REFERENCES "buckets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_credit_card_id_fkey" FOREIGN KEY ("credit_card_id") REFERENCES "credit_cards"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_transaction_pattern_id_fkey" FOREIGN KEY ("transaction_pattern_id") REFERENCES "transaction_patterns"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_splits" ADD CONSTRAINT "transaction_splits_bucket_id_fkey" FOREIGN KEY ("bucket_id") REFERENCES "buckets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_splits" ADD CONSTRAINT "transaction_splits_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
