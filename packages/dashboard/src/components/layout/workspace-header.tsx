import type { Workspace } from "@features/workspaces/types";
import { PrivacyToggle } from "@features/user/components/privacy-toggle";
import { UserAvatarMenu } from "@features/user/components/user-avatar-menu";
import { useGetWorkspaces, useGetProfile } from "@finza/api-client/hooks";
import { useParams } from "@tanstack/react-router";
import { WorkspaceSwitcher } from "./workspace-switcher";
import { Skeleton } from "@components/ui/skeleton";

export function WorkspaceHeader() {
	const { workspaceId } = useParams({ from: "/_authenticated/$workspaceId" });
	const { data: workspaces, isLoading: isWorkspacesLoading } = useGetWorkspaces<Workspace[]>();
	const { data: user } = useGetProfile();

	return (
		<header className="sticky top-0 z-50 flex h-14 shrink-0 items-center border-b border-border/50 bg-background/80 backdrop-blur-md">
			<div className="shell-container ml-0 pl-2.5 flex items-center justify-between">
				{isWorkspacesLoading ? (
					<div className="flex items-center gap-2">
						<Skeleton className="h-6 w-6 animate-pulse rounded-full bg-muted" />
						<div className="flex flex-col gap-0.5">
							<Skeleton className="h-4 w-32 animate-pulse rounded bg-muted" />
							<Skeleton className="h-3 w-5 animate-pulse rounded bg-muted" />
						</div>
					</div>
				) : (
					<WorkspaceSwitcher
						workspaces={workspaces ?? []}
						currentWorkspaceId={workspaceId}
						className="w-56"
					/>
				)}

				<div className="flex items-center gap-2">
					<PrivacyToggle />
					{user && <UserAvatarMenu user={user} />}
				</div>
			</div>
		</header>
	);
}
