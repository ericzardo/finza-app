import { cn } from "@lib/utils";

const sizeMap = {
	sm: "size-7 text-xs",
	md: "size-9 text-sm",
} as const;

interface WorkspaceAvatarProps {
	name: string;
	size?: keyof typeof sizeMap;
	className?: string;
}

export function WorkspaceAvatar({
	name,
	size = "md",
	className,
}: WorkspaceAvatarProps) {
	const initial = name.charAt(0).toUpperCase();

	return (
		<div
			className={cn(
				"flex shrink-0 items-center justify-center rounded-md bg-primary/10 font-semibold text-primary",
				sizeMap[size],
				className,
			)}
		>
			{initial}
		</div>
	);
}
