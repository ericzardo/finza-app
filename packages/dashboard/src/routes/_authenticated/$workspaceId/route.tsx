import { WorkspaceHeader } from "@components/layout/workspace-header";
import { Sidebar } from "@components/layout/sidebar";
import { MobileHeader } from "@components/layout/mobile-header";
import { setWorkspaceId } from "@lib/api-client/workspace-interceptor";
import { getWorkspaceQueryOptions } from "@lib/api-client/workspace-queries";
import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect } from "react";
import "@lib/api-client/workspace-interceptor";
import { AppLoader } from "@components/shared/app-loader";

export const Route = createFileRoute("/_authenticated/$workspaceId")({
	loader: async ({ context, params }) => {
		try {
			return await context.queryClient.ensureQueryData(
				getWorkspaceQueryOptions(params.workspaceId),
			);
		} catch (error: unknown) {
			const status = (error as { response?: { status?: number } }).response
				?.status;
			if (status === 403 || status === 404) {
				throw redirect({ to: "/dashboard" });
			}
			throw error;
		}
	},
	pendingComponent: AppLoader,
	component: WorkspaceLayout,
});

function WorkspaceLayout() {
	const { workspaceId } = Route.useParams();

	useEffect(() => {
		setWorkspaceId(workspaceId);
		return () => {
			setWorkspaceId(null);
		};
	}, [workspaceId]);

	return (
		<div className="flex min-h-screen flex-col overflow-hidden bg-background md:flex-row">
			<Sidebar />
			<MobileHeader />
			<div className="flex min-w-0 flex-1 flex-col">
				<WorkspaceHeader />
				<main className="flex-1 overflow-y-auto pb-20">
					<Outlet />
				</main>
			</div>
		</div>
	);
}
