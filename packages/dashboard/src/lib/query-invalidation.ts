import {
	getTransactionsInternalQueryKey,
	getTransactionsTransactionidDistributionsQueryKey,
} from "@finza/api-client";
import type { QueryClient, QueryKey } from "@tanstack/react-query";

export const bucketsInvalidationQueryKey = ["buckets"] as const;
export const workspaceSummaryInvalidationQueryKey = ["workspace-summary"] as const;
export const transactionsInvalidationQueryKey = ["transactions"] as const;

function matchesUrlQueryKey(queryKey: QueryKey, url: string) {
	const [firstItem] = queryKey;

	if (!firstItem || typeof firstItem !== "object" || Array.isArray(firstItem)) {
		return false;
	}

	return "url" in firstItem && firstItem.url === url;
}

async function invalidateByDomainKey(
	queryClient: QueryClient,
	queryKey: readonly string[],
	url: string,
) {
	await queryClient.invalidateQueries({ queryKey });
	await queryClient.invalidateQueries({
		predicate: (query) => matchesUrlQueryKey(query.queryKey, url),
	});
}

export async function invalidateDistributionQueries(
	queryClient: QueryClient,
	options: { transactionId?: string } = {},
) {
	await Promise.all([
		invalidateByDomainKey(queryClient, bucketsInvalidationQueryKey, "/buckets"),
		invalidateByDomainKey(
			queryClient,
			workspaceSummaryInvalidationQueryKey,
			"/workspaces/:workspaceId/summary",
		),
		invalidateByDomainKey(
			queryClient,
			transactionsInvalidationQueryKey,
			"/transactions",
		),
		queryClient.invalidateQueries({
			queryKey: getTransactionsInternalQueryKey(),
		}),
		options.transactionId
			? queryClient.invalidateQueries({
					queryKey: getTransactionsTransactionidDistributionsQueryKey(
						options.transactionId,
					),
				})
			: Promise.resolve(),
	]);
}
