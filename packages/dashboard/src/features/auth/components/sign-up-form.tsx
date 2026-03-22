import type { PostUsersMutationRequest } from "@finza/api-client";
import { usePostUsers } from "@finza/api-client/hooks";
import { postUsersMutationRequestSchema } from "@finza/api-client/schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { cn } from "@lib/utils";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@ui/button";
import { Input } from "@ui/input";
import { Label } from "@ui/label";
import { PasswordInput } from "@ui/password-input";
import { Lock } from "lucide-react";
import type { ComponentProps } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

export type SignUpFormProps = ComponentProps<"form">;

export function SignUpForm({ className, ...props }: SignUpFormProps) {
	const navigate = useNavigate();
	const form = useForm<PostUsersMutationRequest>({
		resolver: zodResolver(postUsersMutationRequestSchema),
		defaultValues: {
			name: "",
			email: "",
			password: "",
		},
	});

	const { mutate, isPending } = usePostUsers({
		mutation: {
			onSuccess: () => {
				toast.success("Conta criada com sucesso!");
				navigate({ to: "/login" });
			},
			onError: (error) => {
				const message = error.response?.data?.message ?? error.message;
				toast.error(message);
			},
		},
	});

	const onSubmit = form.handleSubmit((values) => {
		mutate({ data: values });
	});

	const { errors } = form.formState;

	return (
		<form
			{...props}
			className={cn("flex w-full flex-col gap-5", className)}
			onSubmit={onSubmit}
			noValidate
		>
			<div className="grid gap-2">
				<Label htmlFor="name" className="text-sm font-medium text-foreground">
					Nome completo
				</Label>
				<Input
					id="name"
					autoComplete="name"
					readOnly={isPending}
					aria-describedby={errors.name ? "name-error" : undefined}
					aria-invalid={Boolean(errors.name)}
					placeholder="Seu nome completo"
					className="border-input bg-background placeholder:text-muted-foreground focus-visible:ring-ring"
					{...form.register("name")}
				/>
				{errors.name ? (
					<p id="name-error" className="text-xs text-destructive">
						{errors.name.message}
					</p>
				) : null}
			</div>

			<div className="grid gap-2">
				<Label htmlFor="email" className="text-sm font-medium text-foreground">
					Email
				</Label>
				<Input
					id="email"
					type="email"
					autoComplete="email"
					readOnly={isPending}
					aria-describedby={errors.email ? "email-error" : undefined}
					aria-invalid={Boolean(errors.email)}
					placeholder="voce@exemplo.com"
					className="border-input bg-background placeholder:text-muted-foreground focus-visible:ring-ring"
					{...form.register("email")}
				/>
				{errors.email ? (
					<p id="email-error" className="text-xs text-destructive">
						{errors.email.message}
					</p>
				) : null}
			</div>

			<div className="grid gap-2">
				<Label htmlFor="password" className="text-sm font-medium text-foreground">
					Senha
				</Label>
				<PasswordInput
					id="password"
					autoComplete="new-password"
					readOnly={isPending}
					aria-describedby={errors.password ? "password-error" : undefined}
					aria-invalid={Boolean(errors.password)}
					placeholder="Mínimo 8 caracteres"
					className="border-input bg-background placeholder:text-muted-foreground focus-visible:ring-ring"
					{...form.register("password")}
				/>
				{errors.password ? (
					<p id="password-error" className="text-xs text-destructive">
						{errors.password.message}
					</p>
				) : null}
			</div>

			<Button
				type="submit"
				disabled={isPending}
				variant="accent"
				size="lg"
				className="mt-1 w-full cursor-pointer transition-colors duration-200 disabled:cursor-not-allowed"
			>
				{isPending ? (
					<>
						<Lock className="size-4" />
						Criando conta...
					</>
				) : (
					"Criar conta"
				)}
			</Button>
		</form>
	);
}
