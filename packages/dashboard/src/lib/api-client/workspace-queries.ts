import { client } from "@client";
import { queryOptions } from "@tanstack/react-query";

export interface WorkspaceMetadata {
	id: string;
	name: string;
	currency: string;
	role: "OWNER" | "EDITOR" | "VIEWER";
	created_at: string;
}

export const getWorkspaceQueryKey = (workspaceId: string) =>
	[{ url: "/workspaces/:workspaceId", params: { workspaceId } }] as const;

export function getWorkspaceQueryOptions(workspaceId: string) {
	return queryOptions<WorkspaceMetadata>({
		queryKey: getWorkspaceQueryKey(workspaceId),
		queryFn: () =>
			client<WorkspaceMetadata>({
				method: "GET",
				url: `/workspaces/${workspaceId}`,
				headers: { "x-workspace-id": workspaceId },
			}).then((res) => res.data),
	});
}

export interface WorkspaceSummary {
	totalBalance: number;
	currentBalance: number;
	maxBalance: number;
	totalInvested: number;
	pendingBalance: number;
	distribution: Array<{
		bucketId: string;
		bucketName: string;
		bucketType: string;
		amount: number;
		percentage: number;
	}>;
}

export const getWorkspaceSummaryQueryKey = (
	workspaceId: string,
	params?: { startDate?: string; endDate?: string },
) =>
	[
		{
			url: "/workspaces/:workspaceId/summary",
			params: { workspaceId, ...params },
		},
	] as const;

export function getWorkspaceSummaryQueryOptions(
	workspaceId: string,
	params?: { startDate?: string; endDate?: string },
) {
	const searchParams = new URLSearchParams();
	if (params?.startDate) searchParams.set("startDate", params.startDate);
	if (params?.endDate) searchParams.set("endDate", params.endDate);
	const qs = searchParams.toString();

	return queryOptions<WorkspaceSummary>({
		queryKey: getWorkspaceSummaryQueryKey(workspaceId, params),
		queryFn: () =>
			client<WorkspaceSummary>({
				method: "GET",
				url: `/workspaces/${workspaceId}/summary${qs ? `?${qs}` : ""}`,
				headers: { "x-workspace-id": workspaceId },
			}).then((res) => res.data),
	});
}
