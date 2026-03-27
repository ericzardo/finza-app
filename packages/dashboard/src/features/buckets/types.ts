import type { getBuckets200Schema } from "@finza/api-client";
import type { z } from "zod/v4";

export type Bucket = z.infer<typeof getBuckets200Schema>[number];

export type BucketType = Bucket["type"];

export type InboxBucket = Extract<Bucket, { type: "INBOX" }>;
export type SpendingBucket = Extract<Bucket, { type: "SPENDING" }>;
export type InvestmentBucket = Extract<Bucket, { type: "INVESTMENT" }>;

export function isInboxBucket(bucket: Bucket): bucket is InboxBucket {
	return bucket.type === "INBOX";
}

export function isSpendingBucket(bucket: Bucket): bucket is SpendingBucket {
	return bucket.type === "SPENDING";
}

export function isInvestmentBucket(bucket: Bucket): bucket is InvestmentBucket {
	return bucket.type === "INVESTMENT";
}

export const bucketTypeLabels: Record<BucketType, string> = {
	SPENDING: "Gastos",
	INVESTMENT: "Investimentos",
	INBOX: "Entrada",
};
