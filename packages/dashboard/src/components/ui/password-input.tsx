import { cn } from "@lib/utils";
import { Input } from "@ui/input";
import { Eye, EyeOff } from "lucide-react";
import * as React from "react";

export type PasswordInputProps = Omit<
	React.ComponentProps<typeof Input>,
	"type"
>;

export function PasswordInput({ className, ...props }: PasswordInputProps) {
	const [isVisible, setIsVisible] = React.useState(false);

	const toggleVisibility = React.useCallback(() => {
		setIsVisible((prev) => !prev);
	}, []);

	const Icon = isVisible ? EyeOff : Eye;

	return (
		<div className="relative">
			<Input
				type={isVisible ? "text" : "password"}
				className={cn("pr-9", className)}
				{...props}
			/>
			<button
				type="button"
				tabIndex={-1}
				aria-label={isVisible ? "Ocultar senha" : "Mostrar senha"}
				aria-pressed={isVisible}
				onClick={toggleVisibility}
				className="absolute inset-y-0 right-0 flex w-10 md:w-9 cursor-pointer items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
			>
				<Icon className="size-4" aria-hidden="true" />
			</button>
		</div>
	);
}
