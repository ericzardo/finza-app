import { Button } from "@components/ui/button";
import { DatePicker } from "@components/ui/date-picker";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/ui/select";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@ui/responsive-dialog";
import type { Bucket } from "@features/buckets/types";
import type { PostTransactionsMutationRequest } from "@finza/api-client";
import {
  getTransactionsQueryKey,
  usePostTransactions,
  useGetBuckets,
  getBucketsQueryKey,
} from "@finza/api-client/hooks";
import { postTransactionsMutationRequestSchema } from "@finza/api-client/schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { useIsMobile } from "@hooks/use-mobile";
import { NumericFormat } from "react-number-format";
import { useEffect, useMemo } from "react";
import { getWorkspaceQueryOptions } from "@lib/api-client/workspace-queries";
import { getCurrencySymbol } from "@lib/utils";

interface CreateTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateTransactionDialog({
  open,
  onOpenChange,
}: CreateTransactionDialogProps) {
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const { workspaceId } = useParams({ from: "/_authenticated/$workspaceId" });
  const { data: workspace } = useQuery(getWorkspaceQueryOptions(workspaceId));
  const currencySymbol = getCurrencySymbol(workspace?.currency ?? "BRL");

  const { data: bucketsData } = useGetBuckets<Bucket[]>();
  const buckets = useMemo(() => bucketsData ?? [], [bucketsData]);

  // Encontra o bucket INBOX real para ser o default
  const inboxBucket = useMemo(
    () => buckets.find((b) => b.type === "INBOX"),
    [buckets],
  );

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    formState: { errors },
  } = useForm<PostTransactionsMutationRequest>({
    resolver: zodResolver(postTransactionsMutationRequestSchema),
    defaultValues: {
      type: "EXPENSE",
      description: "",
      amount: undefined,
      date: new Date().toISOString().split("T")[0],
      is_paid: true,
      bucket_id: undefined,
    },
  });

  // Quando o inboxBucket carregar e bucket_id ainda for undefined, seta o default
  useEffect(() => {
    if (inboxBucket) {
      setValue("bucket_id", inboxBucket.id);
    }
  }, [inboxBucket, setValue]);

  // Observa o campo type via useWatch (memoization-safe)
  const txType = useWatch({ control, name: "type" });
  const isPaid = useWatch({ control, name: "is_paid" });
  const isIncome = txType === "INCOME";

  const { mutate, isPending } = usePostTransactions({
    mutation: {
      onSuccess: () => {
        toast.success("Transação registrada.");
        queryClient.invalidateQueries({
          queryKey: getTransactionsQueryKey(),
        });
        queryClient.invalidateQueries({
          queryKey: getBucketsQueryKey(),
        });
        queryClient.invalidateQueries({
          queryKey: [{ url: "/workspaces/:workspaceId/summary" }],
        });
        reset({
          type: "EXPENSE",
          description: "",
          amount: undefined,
          date: new Date().toISOString().split("T")[0],
          is_paid: true,
          bucket_id: inboxBucket?.id,
        });
        onOpenChange(false);
      },
      onError: (error) => {
        const message =
          error.response?.data?.message ?? "Erro ao criar transação.";
        toast.error(message);
      },
    },
  });

  function onSubmit(data: PostTransactionsMutationRequest) {
    const payload = { ...data };
    // INCOME é sempre pago
    if (payload.type === "INCOME") {
      payload.is_paid = true;
    }
    mutate({ data: payload });
  }

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent>
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Nova transação</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            Registre uma entrada ou saída para organizar seu patrimônio.
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Tipo */}
          <div className="space-y-2">
            <Label htmlFor="tx-type">Tipo</Label>
            <Controller
              name="type"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="tx-type">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INCOME">
                      <span className="font-medium text-emerald-700 dark:text-emerald-400">
                        Receita
                      </span>
                      <span className="ml-2 text-muted-foreground">
                        — dinheiro que entra
                      </span>
                    </SelectItem>
                    <SelectItem value="EXPENSE">
                      <span className="font-medium text-red-700 dark:text-red-400">
                        Despesa
                      </span>
                      <span className="ml-2 text-muted-foreground">
                        — dinheiro que sai
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

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="tx-description">Descrição</Label>
            <Input
              id="tx-description"
              placeholder="Ex: Supermercado, Salário..."
              autoFocus
              {...register("description")}
            />
            {errors.description && (
              <p className="text-xs text-destructive">
                {errors.description.message}
              </p>
            )}
          </div>

          {/* Valor — Máscara de moeda */}
          <div className="space-y-2">
            <Label htmlFor="tx-amount">Valor</Label>
            <Controller
              name="amount"
              control={control}
              render={({ field }) => (
                <NumericFormat
                  id="tx-amount"
                  customInput={Input}
                  thousandSeparator="."
                  decimalSeparator=","
                  decimalScale={2}
                  fixedDecimalScale={true}
                  prefix={`${currencySymbol} `}
                  allowNegative={false}
                  placeholder={`${currencySymbol} 0,00`}
                  value={field.value ?? ""}
                  onValueChange={({ floatValue }) => {
                    field.onChange(floatValue ?? undefined);
                  }}
                  onBlur={field.onBlur}
                  getInputRef={field.ref}
                />
              )}
            />
            {errors.amount && (
              <p className="text-xs text-destructive">
                {errors.amount.message}
              </p>
            )}
          </div>

          {/* Data */}
          <div className="space-y-2">
            <Label htmlFor="tx-date">Data</Label>
            <Controller
              name="date"
              control={control}
              render={({ field }) => (
                <DatePicker
                  value={field.value}
                  onChange={field.onChange}
                  className="w-full"
                />
              )}
            />
            {errors.date && (
              <p className="text-xs text-destructive">
                {String(errors.date.message)}
              </p>
            )}
          </div>

          {/* Pago — Oculto para INCOME (receita é sempre paga) */}
          {!isIncome && (
            <div className="flex items-center gap-3">
              <button
                type="button"
                role="switch"
                aria-checked={isPaid ?? true}
                onClick={() => setValue("is_paid", !(isPaid ?? true))}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 ${isPaid ?? true ? "bg-primary" : "bg-muted"
                  }`}
              >
                <span
                  className={`pointer-events-none inline-block size-4 rounded-full bg-white shadow-sm ring-0 transition-transform duration-200 ease-in-out ${isPaid ?? true ? "translate-x-4" : "translate-x-0"
                    }`}
                />
              </button>
              <Label
                className="cursor-pointer text-sm"
                onClick={() => setValue("is_paid", !(isPaid ?? true))}
              >
                {isPaid ?? true ? "Pago" : "Pendente"}
              </Label>
            </div>
          )}

          {/* Caixa (Bucket) — Default real do INBOX */}
          <div className="space-y-2">
            <Label htmlFor="tx-bucket">Caixa</Label>
            <Controller
              name="bucket_id"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value ?? inboxBucket?.id ?? ""}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger id="tx-bucket">
                    <SelectValue placeholder="Selecione um caixa" />
                  </SelectTrigger>
                  <SelectContent>
                    {buckets.map((bucket) => (
                      <SelectItem key={bucket.id} value={bucket.id}>
                        {bucket.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.bucket_id && (
              <p className="text-xs text-destructive">
                {errors.bucket_id.message}
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
            <Button
              type="submit"
              size={isMobile ? "lg" : "default"}
              variant="accent"
              disabled={isPending}
            >
              {isPending && <Loader2 className="size-4 animate-spin" />}
              Registrar
            </Button>
          </ResponsiveDialogFooter>
        </form>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
