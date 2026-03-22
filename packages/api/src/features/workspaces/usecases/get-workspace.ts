import type { PrismaClient, WorkspaceRole } from "@prisma/client";

export interface GetWorkspaceResult {
	id: string;
	name: string;
	currency: string;
	role: WorkspaceRole;
	created_at: string;
}

export async function getWorkspace(
	db: PrismaClient,
	workspaceId: string,
	userId: string,
): Promise<GetWorkspaceResult | null> {
	const member = await db.workspaceMember.findUnique({
		where: {
			workspace_id_user_id: {
				workspace_id: workspaceId,
				user_id: userId,
			},
		},
		include: { workspace: true },
	});

	if (!member) return null;

	return {
		id: member.workspace.id,
		name: member.workspace.name,
		currency: member.workspace.currency,
		role: member.role,
		created_at: member.workspace.created_at.toISOString(),
	};
}
