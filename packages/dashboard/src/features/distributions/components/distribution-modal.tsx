import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import {
	ResponsiveDialog,
	ResponsiveDialogContent,
	ResponsiveDialogDescription,
	ResponsiveDialogFooter,
	ResponsiveDialogHeader,
	ResponsiveDialogTitle,
} from "@components/ui/responsive-dialog";
import {
	type Bucket,
	bucketTypeLabels,
	isInvestmentBucket,
	isSpendingBucket,
} from "@features/buckets/types";
import { Sensitive } from "@features/user/components/sensitive-value";
import {
	getBucketsQueryKey,
	getTransactionsInternalQueryKey,
	getTransactionsQueryKey,
	getTransactionsTransactionidDistributionsQueryKey,
	useGetBuckets,
	usePostTransactionsTransactionidDistribute,
	usePostWorkspacesWorkspaceidBucketsInboxDistribute,
} from "@finza/api-client";
import { useIsMobile } from "@hooks/use-mobile";
import { getWorkspaceQueryOptions } from "@lib/api-client/workspace-queries";
import { cn, formatCurrency, getCurrencySymbol } from "@lib/utils";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useEffect, useMemo } from "react";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
import { NumericFormat } from "react-number-format";
import { toast } from "sonner";

type DistributionInputMode = "percentage" | "currency";

interface DistributionFormItem {
	bucketId: string;
	bucketName: string;
	bucketType: Bucket["type"];
	allocationPercentage: number;
	enabled: boolean;
	inputMode: DistributionInputMode;
	percentage: number;
	amount: number;
}

interface DistributionFormValues {
	items: DistributionFormItem[];
}

export interface DistributionModalProps {
	isOpen: boolean;
	onClose: () => void;
	availableAmount: number;
	transactionId?: string;
}

function roundToTwoDecimals(value: number) {
	return Math.round((value + Number.EPSILON) * 100) / 100;
}

function clamp(value: number, min: number, max: number) {
	return Math.min(Math.max(value, min), max);
}

function amountFromPercentage(percentage: number, availableAmount: number) {
	if (availableAmount <= 0) return 0;
	return roundToTwoDecimals((availableAmount * percentage) / 100);
}

function percentageFromAmount(amount: number, availableAmount: number) {
	if (availableAmount <= 0) return 0;
	return roundToTwoDecimals((amount / availableAmount) * 100);
}

function formatPercentage(value: number) {
	return new Intl.NumberFormat("pt-BR", {
		minimumFractionDigits: 0,
		maximumFractionDigits: 2,
	}).format(value);
}

function createDistributionItems(
	buckets: Array<Extract<Bucket, { type: "SPENDING" | "INVESTMENT" }>>,
	availableAmount: number,
): DistributionFormItem[] {
	return buckets.map((bucket) => {
		const enabled = bucket.allocation_percentage > 0;
		const percentage = enabled
			? roundToTwoDecimals(bucket.allocation_percentage)
			: 0;

		return {
			bucketId: bucket.id,
			bucketName: bucket.name,
			bucketType: bucket.type,
			allocationPercentage: bucket.allocation_percentage,
			enabled,
			inputMode: "percentage",
			percentage,
			amount: enabled ? amountFromPercentage(percentage, availableAmount) : 0,
		};
	});
}

export function DistributionModal({
	isOpen,
	onClose,
	availableAmount,
	transactionId,
}: DistributionModalProps) {
	const queryClient = useQueryClient();
	const isMobile = useIsMobile();
	const { workspaceId } = useParams({ from: "/_authenticated/$workspaceId" });
	const { data: workspace } = useQuery(getWorkspaceQueryOptions(workspaceId));
	const currency = workspace?.currency ?? "BRL";
	const currencySymbol = getCurrencySymbol(currency);
	const safeAvailableAmount = Math.max(0, roundToTwoDecimals(availableAmount));

	const { data: bucketsData, isLoading: isBucketsLoading } =
		useGetBuckets<Bucket[]>();

	const eligibleBuckets = useMemo(
		() =>
			(bucketsData ?? []).filter(
				(
					bucket,
				): bucket is Extract<Bucket, { type: "SPENDING" | "INVESTMENT" }> =>
					isSpendingBucket(bucket) || isInvestmentBucket(bucket),
			),
		[bucketsData],
	);

	const { control, handleSubmit, reset, setValue } =
		useForm<DistributionFormValues>({
			defaultValues: {
				items: [],
			},
		});

	const { fields } = useFieldArray({
		control,
		name: "items",
	});

	const watchedItems =
		useWatch({
			control,
			name: "items",
		}) ?? [];

	useEffect(() => {
		if (!isOpen) return;

		reset({
			items: createDistributionItems(eligibleBuckets, safeAvailableAmount),
		});
	}, [eligibleBuckets, isOpen, reset, safeAvailableAmount]);

	const distributedAmount = roundToTwoDecimals(
		watchedItems.reduce((sum, item) => {
			if (!item?.enabled) return sum;
			return sum + (item.amount || 0);
		}, 0),
	);

	const remainingAmount = roundToTwoDecimals(
		safeAvailableAmount - distributedAmount,
	);
	const isOverflowing = remainingAmount < 0;
	const hasDistribution = watchedItems.some(
		(item) => item?.enabled && (item.amount || 0) > 0,
	);

	const { mutate: distributeTransaction, isPending: isPendingTransaction } =
		usePostTransactionsTransactionidDistribute({
			mutation: {
				onSuccess: () => {
					toast.success("Distribuição da transação concluída.");
					queryClient.invalidateQueries({
						queryKey: getTransactionsQueryKey(),
					});
					queryClient.invalidateQueries({
						queryKey: getTransactionsInternalQueryKey(),
					});
					queryClient.invalidateQueries({
						queryKey: getBucketsQueryKey(),
					});
					queryClient.invalidateQueries({
						queryKey: [{ url: "/workspaces/:workspaceId/summary" }],
					});
					if (transactionId) {
						queryClient.invalidateQueries({
							queryKey:
								getTransactionsTransactionidDistributionsQueryKey(
									transactionId,
								),
						});
					}
					onClose();
				},
				onError: (error) => {
					const message =
						error.response?.data?.message ??
						"Erro ao distribuir saldo da transação.";
					toast.error(message);
				},
			},
		});

	const { mutate: distributeInboxBalance, isPending: isPendingInbox } =
		usePostWorkspacesWorkspaceidBucketsInboxDistribute({
			mutation: {
				onSuccess: () => {
					toast.success("Saldo do INBOX distribuído.");
					queryClient.invalidateQueries({
						queryKey: getTransactionsQueryKey(),
					});
					queryClient.invalidateQueries({
						queryKey: getTransactionsInternalQueryKey(),
					});
					queryClient.invalidateQueries({
						queryKey: getBucketsQueryKey(),
					});
					queryClient.invalidateQueries({
						queryKey: [{ url: "/workspaces/:workspaceId/summary" }],
					});
					onClose();
				},
				onError: (error) => {
					const message =
						error.response?.data?.message ??
						"Erro ao distribuir saldo do INBOX.";
					toast.error(message);
				},
			},
		});

	const isPending = isPendingTransaction || isPendingInbox;

	function handleToggleEnabled(index: number) {
		const item = watchedItems[index];
		if (!item) return;

		setValue(`items.${index}.enabled`, !item.enabled, {
			shouldDirty: true,
			shouldTouch: true,
		});
	}

	function handleToggleInputMode(index: number) {
		const item = watchedItems[index];
		if (!item) return;

		setValue(
			`items.${index}.inputMode`,
			item.inputMode === "percentage" ? "currency" : "percentage",
			{
				shouldDirty: true,
				shouldTouch: true,
			},
		);
	}

	function handleAmountChange(index: number, value?: number) {
		const normalizedAmount = roundToTwoDecimals(Math.max(0, value ?? 0));

		setValue(`items.${index}.amount`, normalizedAmount, {
			shouldDirty: true,
			shouldTouch: true,
		});
		setValue(
			`items.${index}.percentage`,
			percentageFromAmount(normalizedAmount, safeAvailableAmount),
			{
				shouldDirty: true,
				shouldTouch: true,
			},
		);
	}

	function handlePercentageChange(index: number, value: string) {
		const parsedValue =
			value === ""
				? 0
				: clamp(Number.parseFloat(value.replace(",", ".")), 0, 100);
		const normalizedPercentage = Number.isFinite(parsedValue)
			? roundToTwoDecimals(parsedValue)
			: 0;

		setValue(`items.${index}.percentage`, normalizedPercentage, {
			shouldDirty: true,
			shouldTouch: true,
		});
		setValue(
			`items.${index}.amount`,
			amountFromPercentage(normalizedPercentage, safeAvailableAmount),
			{
				shouldDirty: true,
				shouldTouch: true,
			},
		);
	}

	function onSubmit(values: DistributionFormValues) {
		const activeItems = values.items.filter(
			(item) => item.enabled && item.amount > 0,
		);

		if (activeItems.length === 0 || isOverflowing) return;

		if (transactionId) {
			distributeTransaction({
				transactionId,
				data: {
					distributions: activeItems.map((item) => ({
						bucketId: item.bucketId,
						amount: item.amount,
					})),
				},
			});
			return;
		}

		distributeInboxBalance({
			workspaceId,
			data: activeItems.map((item) => ({
				bucket_id: item.bucketId,
				amount: item.amount,
			})),
		});
	}

	return (
		<ResponsiveDialog
			open={isOpen}
			onOpenChange={(open) => {
				if (!open) onClose();
			}}
		>
			<ResponsiveDialogContent className="sm:max-w-2xl">
				<ResponsiveDialogHeader>
					<ResponsiveDialogTitle>Distribuir Saldo</ResponsiveDialogTitle>
					<ResponsiveDialogDescription className="space-y-1">
						<span className="block">
							Disponível para distribuir:{" "}
							<Sensitive
								className={cn(
									"font-semibold tabular-nums text-foreground",
									isOverflowing && "text-destructive",
								)}
							>
								{formatCurrency(remainingAmount, currency)}
							</Sensitive>
						</span>
						<span className="block">
							Distribuído:{" "}
							<Sensitive className="font-semibold tabular-nums text-foreground">
								{formatCurrency(distributedAmount, currency)}
							</Sensitive>
						</span>
					</ResponsiveDialogDescription>
				</ResponsiveDialogHeader>

				<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
					<div className="space-y-2">
						<div className="flex items-center justify-between">
							<Label className="text-sm">Buckets elegíveis</Label>
							<Sensitive className="text-xs tabular-nums text-muted-foreground">
								Base: {formatCurrency(safeAvailableAmount, currency)}
							</Sensitive>
						</div>

						{isBucketsLoading ? (
							<div className="flex items-center justify-center rounded-lg border border-dashed border-border px-4 py-8 text-sm text-muted-foreground">
								<Loader2 className="mr-2 size-4 animate-spin" />
								Carregando buckets...
							</div>
						) : eligibleBuckets.length === 0 ? (
							<div className="rounded-lg border border-dashed border-border px-4 py-8 text-sm text-muted-foreground">
								Crie buckets de gastos ou investimentos para distribuir saldo.
							</div>
						) : (
							<div className="max-h-[55vh] space-y-3 overflow-y-auto pr-1">
								{fields.map((field, index) => {
									const item = watchedItems[index];
									const isEnabled = item?.enabled ?? false;
									const inputMode = item?.inputMode ?? "percentage";
									const mirroredValue =
										inputMode === "percentage"
											? formatCurrency(item?.amount ?? 0, currency)
											: `${formatPercentage(item?.percentage ?? 0)}%`;

									return (
										<div
											key={field.id}
											className={cn(
												"space-y-3 rounded-lg border border-border p-3 transition-colors",
												isEnabled ? "bg-card" : "bg-muted/30",
											)}
										>
											<div className="flex items-start justify-between gap-3">
												<div className="min-w-0">
													<p className="truncate text-sm font-medium text-foreground">
														{field.bucketName}
													</p>
													<p className="text-xs text-muted-foreground">
														{bucketTypeLabels[field.bucketType]} · autopilot{" "}
														{formatPercentage(field.allocationPercentage)}%
													</p>
												</div>

												<button
													type="button"
													role="switch"
													aria-checked={isEnabled}
													onClick={() => handleToggleEnabled(index)}
													className={cn(
														"relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
														isEnabled ? "bg-primary" : "bg-muted",
													)}
												>
													<span
														className={cn(
															"pointer-events-none inline-block size-4 rounded-full bg-white shadow-sm ring-0 transition-transform duration-200 ease-in-out",
															isEnabled ? "translate-x-4" : "translate-x-0",
														)}
													/>
												</button>
											</div>

											<div className="flex flex-col gap-2 md:flex-row md:items-center">
												<Button
													type="button"
													size="xs"
													variant="outline"
													className="w-full md:w-16"
													onClick={() => handleToggleInputMode(index)}
													disabled={!isEnabled}
												>
													{inputMode === "percentage" ? "%" : currencySymbol}
												</Button>

												<div className="flex-1">
													{inputMode === "percentage" ? (
														<Controller
															name={`items.${index}.percentage`}
															control={control}
															render={({ field: percentageField }) => (
																<div className="relative">
																	<Input
																		{...percentageField}
																		type="number"
																		inputMode="decimal"
																		min={0}
																		max={100}
																		step="0.01"
																		disabled={!isEnabled}
																		aria-label={`Percentual para ${field.bucketName}`}
																		value={
																			percentageField.value > 0
																				? percentageField.value
																				: ""
																		}
																		placeholder="0"
																		className="pr-8 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]"
																		onChange={(event) => {
																			percentageField.onChange(event);
																			handlePercentageChange(
																				index,
																				event.target.value,
																			);
																		}}
																	/>
																	<span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
																		%
																	</span>
																</div>
															)}
														/>
													) : (
														<Controller
															name={`items.${index}.amount`}
															control={control}
															render={({ field: amountField }) => (
																<NumericFormat
																	customInput={Input}
																	thousandSeparator="."
																	decimalSeparator=","
																	decimalScale={2}
																	fixedDecimalScale
																	prefix={`${currencySymbol} `}
																	allowNegative={false}
																	disabled={!isEnabled}
																	aria-label={`Valor para ${field.bucketName}`}
																	placeholder={`${currencySymbol} 0,00`}
																	value={
																		amountField.value > 0
																			? amountField.value
																			: ""
																	}
																	onValueChange={({ floatValue }) => {
																		handleAmountChange(index, floatValue);
																	}}
																	onBlur={amountField.onBlur}
																	getInputRef={amountField.ref}
																/>
															)}
														/>
													)}
												</div>

												<div className="min-w-28 text-left text-xs text-muted-foreground md:text-right">
													<p>Equivalente</p>
													<Sensitive className="font-medium tabular-nums text-foreground">
														{mirroredValue}
													</Sensitive>
												</div>
											</div>
										</div>
									);
								})}
							</div>
						)}
					</div>

					<ResponsiveDialogFooter>
						<Button
							type="button"
							variant="ghost"
							size={isMobile ? "lg" : "default"}
							onClick={onClose}
							disabled={isPending}
						>
							Cancelar
						</Button>
						<Button
							type="submit"
							variant="accent"
							size={isMobile ? "lg" : "default"}
							disabled={
								isPending ||
								isBucketsLoading ||
								eligibleBuckets.length === 0 ||
								!hasDistribution ||
								isOverflowing
							}
						>
							{isPending && <Loader2 className="size-4 animate-spin" />}
							Confirmar
						</Button>
					</ResponsiveDialogFooter>
				</form>
			</ResponsiveDialogContent>
		</ResponsiveDialog>
	);
}
