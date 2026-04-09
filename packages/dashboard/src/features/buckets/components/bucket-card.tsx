import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@components/ui/alert-dialog";
import { Button } from "@components/ui/button";
import type { Bucket } from "@features/buckets/types";
import { bucketTypeLabels } from "@features/buckets/types";
import { Sensitive } from "@features/user/components/sensitive-value";
import { formatCurrency } from "@lib/utils";
import {
  getBucketsQueryKey,
  useDeleteBucketsBucketid,
} from "@finza/api-client/hooks";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Inbox, Loader2, MoreHorizontal, Pencil, TrendingDown, TrendingUp, Trash2 } from "lucide-react";
import { cn } from "@lib/utils";
import { UpdateBucketDialog } from "./update-bucket-dialog";

// ── Variações visuais por tipo ─────────────────────────────────────────

interface BucketVariant {
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  glow: string | null;
  subtitle: (bucket: Bucket) => string;
  mainLabel: string;
  mainValue: (bucket: Bucket, currency: string) => string;
  row1Label: string;
  row1Value: (bucket: Bucket, currency: string) => string;
  row1Sensitive: boolean;
  row2Label: string;
  row2Value: (bucket: Bucket, currency: string) => string;
  progressLabel: string;
  progressCalc: (bucket: Bucket) => { ratio: number; isHighlight: boolean };
  progressColor: (isHighlight: boolean) => string;
  progressTextColor: (isHighlight: boolean) => string;
}

function getVariant(type: Bucket["type"]): BucketVariant {
  switch (type) {
    case "INBOX":
      return {
        icon: Inbox,
        iconBg: "bg-amber-100 dark:bg-amber-900/40",
        iconColor: "text-amber-600 dark:text-amber-400",
        glow: "pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-amber-500/10 blur-3xl",
        subtitle: () => "Dinheiro aguardando destinação",
        mainLabel: "Saldo Atual",
        mainValue: (b, c) => formatCurrency(b.current_amount, c),
        row1Label: "Entradas",
        row1Value: (b, c) => formatCurrency(b.period_income, c),
        row1Sensitive: true,
        row2Label: "Saídas",
        row2Value: (b, c) => formatCurrency(b.period_spent, c),
        progressLabel: "Distribuído no período",
        progressCalc: (b) => {
          const ratio =
            b.period_income > 0
              ? Math.min(b.period_spent / b.period_income, 1)
              : 0;
          return { ratio, isHighlight: false };
        },
        progressColor: () =>
          "bg-amber-500 dark:bg-amber-400",
        progressTextColor: () => "text-muted-foreground",
      };

    case "SPENDING":
      return {
        icon: TrendingDown,
        iconBg: "bg-muted",
        iconColor: "text-muted-foreground",
        glow: null,
        subtitle: (b) =>
          `${bucketTypeLabels.SPENDING} · ${b.allocation_percentage}% da receita`,
        mainLabel: "Saldo Atual",
        mainValue: (b, c) => formatCurrency(b.current_amount, c),
        row1Label: "Gasto",
        row1Value: (b, c) => formatCurrency(b.period_spent, c),
        row1Sensitive: false,
        row2Label: "Limite",
        row2Value: (b, c) => formatCurrency(b.period_allocated, c),
        progressLabel: "Uso do período",
        progressCalc: (b) => {
          const isOver =
            b.period_spent > b.period_allocated &&
            b.period_allocated > 0;
          const ratio =
            b.period_allocated > 0
              ? Math.min(b.period_spent / b.period_allocated, 1)
              : 0;
          return { ratio, isHighlight: isOver };
        },
        progressColor: (isOver) =>
          isOver ? "bg-destructive" : "bg-primary",
        progressTextColor: (isOver) =>
          isOver ? "text-destructive" : "text-muted-foreground",
      };

    case "INVESTMENT":
      return {
        icon: TrendingUp,
        iconBg: "bg-emerald-50 dark:bg-emerald-950/40",
        iconColor: "text-emerald-600 dark:text-emerald-400",
        glow: null,
        subtitle: (b) =>
          `${bucketTypeLabels.INVESTMENT} · ${b.allocation_percentage}% da receita`,
        mainLabel: "Total Aportado",
        mainValue: (b, c) => formatCurrency(b.current_invested, c),
        row1Label: "Aportado",
        row1Value: (b, c) => formatCurrency(b.period_invested, c),
        row1Sensitive: true,
        row2Label: "Meta",
        row2Value: (b, c) => formatCurrency(b.period_target, c),
        progressLabel: "Meta do período",
        progressCalc: (b) => {
          const ratio =
            b.period_target > 0
              ? Math.min(b.period_invested / b.period_target, 1)
              : 0;
          const isGoal = Math.round(ratio * 100) >= 100;
          return { ratio, isHighlight: isGoal };
        },
        progressColor: (isGoal) =>
          isGoal
            ? "bg-emerald-500 dark:bg-emerald-400"
            : "bg-emerald-600/70 dark:bg-emerald-500/70",
        progressTextColor: (isGoal) =>
          isGoal
            ? "text-emerald-600 dark:text-emerald-400"
            : "text-muted-foreground",
      };
  }
}

// ── Componente Principal ───────────────────────────────────────────────

interface BucketCardProps {
  bucket: Bucket;
  currency: string;
}

export function BucketCard({ bucket, currency }: BucketCardProps) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const queryClient = useQueryClient();
  const variant = getVariant(bucket.type);
  const Icon = variant.icon;
  const { ratio, isHighlight } = variant.progressCalc(bucket);
  const pct = Math.round(ratio * 100);

  const showActions = !bucket.is_default;

  const { mutate: deleteBucket, isPending: isDeleting } =
    useDeleteBucketsBucketid({
      mutation: {
        onSuccess: () => {
          toast.success(`Caixa "${bucket.name}" excluído com sucesso!`);
          queryClient.invalidateQueries({
            queryKey: getBucketsQueryKey(),
          });
          queryClient.invalidateQueries({
            queryKey: [{ url: "/workspaces/:workspaceId/summary" }],
          });
          setDeleteOpen(false);
        },
        onError: (error) => {
          const message =
            error.response?.data?.message ?? "Erro ao excluir caixa.";
          toast.error(message);
        },
      },
    });

  return (
    <>
      <Card className="min-w-0 relative overflow-hidden">
        {variant.glow && <div className={variant.glow} />}

        <CardHeader className="pb-3">
          <div className="flex items-start gap-3">
            <div
              className={cn(
                "flex size-9 shrink-0 items-center justify-center rounded-lg",
                variant.iconBg,
              )}
            >
              <Icon className={cn("size-4", variant.iconColor)} />
            </div>
            <div className="min-w-0 flex-1">
              <CardTitle className="truncate text-base">
                {bucket.name}
              </CardTitle>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {variant.subtitle(bucket)}
              </p>
            </div>

            {showActions && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 shrink-0 text-muted-foreground"
                  >
                    <MoreHorizontal className="size-4" />
                    <span className="sr-only">Ações</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onSelect={() => setEditOpen(true)}
                  >
                    <Pencil className="size-4" />
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    variant="destructive"
                    onSelect={() => setDeleteOpen(true)}
                  >
                    <Trash2 className="size-4" />
                    Excluir
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          {/* Saldo / Valor Principal */}
          <div className="flex flex-col justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                {variant.mainLabel}
              </p>
              <Sensitive className="mt-1 block truncate text-2xl font-bold tracking-tight tabular-nums text-foreground sm:text-3xl">
                {variant.mainValue(bucket, currency)}
              </Sensitive>
            </div>

            {/* Tabela Secundária */}
            <div className="shrink-0 space-y-1.5">
              <div className="flex items-center justify-between gap-6">
                <span className="text-xs text-muted-foreground">
                  {variant.row1Label}
                </span>
                {variant.row1Sensitive ? (
                  <Sensitive
                    className={cn(
                      "text-xs font-medium tabular-nums",
                      variant.progressTextColor(isHighlight) === "text-muted-foreground"
                        ? "text-foreground"
                        : variant.progressTextColor(isHighlight),
                    )}
                  >
                    {variant.row1Value(bucket, currency)}
                  </Sensitive>
                ) : (
                  <span
                    className={cn(
                      "text-xs font-medium tabular-nums",
                      isHighlight ? "text-destructive" : "text-foreground",
                    )}
                  >
                    {variant.row1Value(bucket, currency)}
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between gap-6">
                <span className="text-xs text-muted-foreground">
                  {variant.row2Label}
                </span>
                <Sensitive className="text-xs font-medium tabular-nums text-foreground">
                  {variant.row2Value(bucket, currency)}
                </Sensitive>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {variant.progressLabel}
              </span>
              <span
                className={cn(
                  "text-xs font-medium tabular-nums",
                  variant.progressTextColor(isHighlight),
                )}
              >
                {pct}%
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  variant.progressColor(isHighlight),
                )}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AlertDialog de Exclusão */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir "{bucket.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação é irreversível. Todos os dados vinculados a este
              caixa serão perdidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={isDeleting}
              onClick={(e) => {
                e.preventDefault();
                deleteBucket({ bucketId: bucket.id });
              }}
            >
              {isDeleting && <Loader2 className="size-4 animate-spin" />}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal de Edição */}
      <UpdateBucketDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        bucket={bucket}
      />
    </>
  );
}
