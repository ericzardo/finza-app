import { CreateWorkspaceDialog, WorkspaceAvatar } from "@features/workspaces/components";
import type { Workspace } from "@features/workspaces/types";
import { cn } from "@lib/utils";
import { useNavigate } from "@tanstack/react-router";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@ui/popover";
import { Separator } from "@ui/separator";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { useState } from "react";

interface WorkspaceSwitcherProps {
	workspaces: Workspace[];
	currentWorkspaceId: string;
	className?: string;
}

export function WorkspaceSwitcher({
	workspaces,
	currentWorkspaceId,
	className,
}: WorkspaceSwitcherProps) {
	const [open, setOpen] = useState(false);
	const [dialogOpen, setDialogOpen] = useState(false);
	const navigate = useNavigate();

	const current = workspaces.find((w) => w.id === currentWorkspaceId);

	const handleSelect = (id: string) => {
		setOpen(false);
		navigate({ to: "/$workspaceId", params: { workspaceId: id } });
	};

	const handleCreateNew = () => {
		setOpen(false);
		setDialogOpen(true);
	};

	if (workspaces)

	return (
		<>
			<Popover open={open} onOpenChange={setOpen}>
				<PopoverTrigger asChild>
					<button
						type="button"
						className={cn(
							"flex w-full items-center gap-2.5 rounded-lg 0 px-2.5 py-2 text-left transition-colors hover:bg-muted cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
							className,
						)}
					>
						<WorkspaceAvatar
							name={current?.name ?? "W"}
							size="sm"
						/>

						<div className="min-w-0 flex-1">
							<p className="truncate text-sm font-semibold leading-tight text-foreground">
								{current?.name ?? "Workspace"}
							</p>
							<p className="text-xs leading-tight text-muted-foreground/70">
								{current?.currency ?? "BRL"}
							</p>
						</div>

						<ChevronsUpDown className="size-3.5 shrink-0 text-muted-foreground" />
					</button>
				</PopoverTrigger>

				<PopoverContent
					align="start"
					sideOffset={6}
					className="w-(--radix-popover-trigger-width) min-w-56 p-1"
				>
					<AnimatePresence>
						{workspaces.map((ws) => (
							<motion.button
								key={ws.id}
								type="button"
								onClick={() => handleSelect(ws.id)}
								initial={{ opacity: 0.8 }}
								animate={{ opacity: 1 }}
								// whileHover={{ scale: 1.01, x: 2 }}
								transition={{ duration: 0.15 }}
								className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm transition-colors hover:bg-muted cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
							>
								<WorkspaceAvatar name={ws.name} size="sm" />

								<div className="min-w-0 flex-1">
									<p className="truncate font-medium text-foreground">
										{ws.name}
									</p>
									<p className="text-xs text-muted-foreground/70">
										{ws.currency}
									</p>
								</div>

								{ws.id === currentWorkspaceId && (
									<Check className="size-4 shrink-0 text-primary" />
								)}
							</motion.button>
						))}
					</AnimatePresence>

					<Separator className="my-1" />

					<motion.button
						type="button"
						onClick={handleCreateNew}
						// whileHover={{ scale: 1.01, x: 2 }}
						transition={{ duration: 0.15 }}
						className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm transition-colors hover:bg-accent/15 group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
					>
						<div className="flex size-7 shrink-0 items-center justify-center rounded-md border border-dashed border-border group-hover:border-accent transition-colors">
							<Plus className="size-3.5 text-muted-foreground group-hover:text-accent" />
						</div>
						<span className="font-medium text-muted-foreground group-hover:text-accent">
							Criar novo workspace
						</span>
					</motion.button>
				</PopoverContent>
			</Popover>

			<CreateWorkspaceDialog
				open={dialogOpen}
				onOpenChange={setDialogOpen}
			/>
		</>
	);
}
