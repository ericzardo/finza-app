import type { getBuckets200Schema } from "@finza/api-client";
import type { z } from "zod/v4";

export type Bucket = z.infer<typeof getBuckets200Schema>[number];

export type BucketType = Bucket["type"];

export const bucketTypeLabels: Record<BucketType, string> = {
	SPENDING: "Gastos",
	INVESTMENT: "Investimentos",
	INBOX: "Entrada",
};

export const bucketTypeBadgeVariant: Record<
	BucketType,
	"secondary" | "outline" | "default"
> = {
	SPENDING: "secondary",
	INVESTMENT: "outline",
	INBOX: "default",
};
