import { Button } from "@components/ui/button";
import {
	ResponsiveDialog,
	ResponsiveDialogContent,
	ResponsiveDialogDescription,
	ResponsiveDialogFooter,
	ResponsiveDialogHeader,
	ResponsiveDialogTitle,
} from "@ui/responsive-dialog";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@components/ui/select";
import type { PostBucketsMutationRequest } from "@finza/api-client";
import { getBucketsQueryKey, usePostBuckets } from "@finza/api-client/hooks";
import { postBucketsMutationRequestSchema } from "@finza/api-client/schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { useIsMobile } from "@hooks/use-mobile";

interface CreateBucketDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function CreateBucketDialog({
	open,
	onOpenChange,
}: CreateBucketDialogProps) {
	const queryClient = useQueryClient();
	const isMobile = useIsMobile();
	
	const {
		register,
		handleSubmit,
		reset,
		control,
		formState: { errors },
	} = useForm<PostBucketsMutationRequest>({
		resolver: zodResolver(postBucketsMutationRequestSchema),
		defaultValues: {
			name: "",
			type: "SPENDING",
			allocation_percentage: 0,
		},
	});

	const { mutate, isPending } = usePostBuckets({
		mutation: {
			onSuccess: (data) => {
				toast.success(`Caixa "${data.name}" criado com sucesso!`);
				queryClient.invalidateQueries({ queryKey: getBucketsQueryKey() });
				queryClient.invalidateQueries({
					queryKey: [{ url: "/workspaces/:workspaceId/summary" }],
				});
				reset();
				onOpenChange(false);
			},
			onError: (error) => {
				const message = error.response?.data?.message ?? "Erro ao criar caixa.";
				toast.error(message);
			},
		},
	});

	function onSubmit(data: PostBucketsMutationRequest) {
		mutate({ data });
	}

	return (
		<ResponsiveDialog open={open} onOpenChange={onOpenChange}>
			<ResponsiveDialogContent>
				<ResponsiveDialogHeader>
					<ResponsiveDialogTitle>Criar caixa</ResponsiveDialogTitle>
					<ResponsiveDialogDescription>
						Um caixa organiza como o dinheiro do seu workspace é alocado e
						gasto.
					</ResponsiveDialogDescription>
				</ResponsiveDialogHeader>

				<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="bucket-name">Nome</Label>
						<Input
							id="bucket-name"
							placeholder="Ex: Lazer, Alimentação, Reserva"
							autoFocus
							{...register("name")}
						/>
						{errors.name && (
							<p className="text-xs text-destructive">{errors.name.message}</p>
						)}
					</div>

					<div className="space-y-2">
						<Label htmlFor="bucket-type">Tipo</Label>
						<Controller
							name="type"
							control={control}
							render={({ field }) => (
								<Select value={field.value} onValueChange={field.onChange}>
									<SelectTrigger id="bucket-type">
										<SelectValue placeholder="Selecione o tipo" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="SPENDING">
											<span className="font-medium text-foreground">
												Gastos
											</span>
											<span className="ml-2 text-muted-foreground">
												— para despesas do cotidiano
											</span>
										</SelectItem>
										<SelectItem value="INVESTMENT">
											<span className="font-medium text-foreground">
												Investimentos
											</span>
											<span className="ml-2 text-muted-foreground">
												— para aportes e reservas
											</span>
										</SelectItem>
									</SelectContent>
								</Select>
							)}
						/>
						{errors.type && (
							<p className="text-xs text-destructive">{errors.type.message}</p>
						)}
					</div>

					<div className="space-y-2">
						<Label htmlFor="bucket-allocation">
							Alocação{" "}
							<span className="text-muted-foreground">
								(meta de próposito)
							</span>
						</Label>
						<div className="relative">
							<Input
								id="bucket-allocation"
								type="number"
								min={0}
								max={100}
								step={1}
								className="pr-8 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]"
								{...register("allocation_percentage", { valueAsNumber: true })}
							/>
							<span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
								%
							</span>
						</div>
						{errors.allocation_percentage && (
							<p className="text-xs text-destructive">
								{errors.allocation_percentage.message}
							</p>
						)}
					</div>

					<ResponsiveDialogFooter>
						<Button
							type="button"
							variant="ghost"
							size={isMobile ? "lg" : "default"}
							onClick={() => onOpenChange(false)}
							disabled={isPending}
						>
							Cancelar
						</Button>
						<Button type="submit" size={isMobile ? "lg" : "default"} variant="accent" disabled={isPending}>
							{isPending && <Loader2 className="size-4 animate-spin" />}
							Criar caixa
						</Button>
					</ResponsiveDialogFooter>
				</form>
			</ResponsiveDialogContent>
		</ResponsiveDialog>
	);
}
