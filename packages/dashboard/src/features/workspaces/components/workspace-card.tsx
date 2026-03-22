import { Sensitive } from "@features/user/components/sensitive-value";
import { formatCurrency } from "@lib/utils";
import { Link } from "@tanstack/react-router";
import { Card, CardDescription, CardHeader, CardTitle } from "@ui/card";
import { Briefcase, Calendar } from "lucide-react";
import type { Workspace } from "../types";

interface WorkspaceCardProps {
	workspace: Workspace;
}

const roleLabels: Record<string, string> = {
	OWNER: "Proprietário",
	EDITOR: "Editor",
	VIEWER: "Visualizador",
};

export function WorkspaceCard({ workspace }: WorkspaceCardProps) {
	const formattedDate = new Intl.DateTimeFormat("pt-BR", {
		day: "2-digit",
		month: "short",
		year: "numeric",
	}).format(new Date(workspace.created_at));

	return (
		<Link
			to="/$workspaceId"
			params={{ workspaceId: workspace.id }}
			className="group block rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-accent"
		>
			<Card className="h-full min-h-44 border-border/50 bg-card transition-all duration-200 group-hover:border-border group-hover:bg-muted/50">
				<CardHeader className="gap-3">
					<div className="flex items-center justify-between">
						<div className="flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors group-hover:bg-accent/10 group-hover:text-accent">
							<Briefcase className="size-5" />
						</div>
						<span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
							{roleLabels[workspace.role] ?? workspace.role}
						</span>
					</div>

					<div className="space-y-1">
						<CardTitle className="text-base font-semibold text-foreground transition-colors group-hover:text-accent">
							{workspace.name}
						</CardTitle>
						<CardDescription className="flex items-center gap-1.5 text-xs text-muted-foreground">
							<Calendar className="size-3" />
							{formattedDate}
							<span className="mx-1 text-border">·</span>
							{workspace.currency}
						</CardDescription>
					</div>

					<div className="pt-2">
						<p className="text-[10px] uppercase tracking-wider font-medium text-muted-foreground">
							Saldo Total
						</p>
						<Sensitive className="text-xl font-bold tracking-tight text-foreground">
							{formatCurrency(workspace.totalBalance, workspace.currency)}
						</Sensitive>
					</div>
				</CardHeader>
			</Card>
		</Link>
	);
}
