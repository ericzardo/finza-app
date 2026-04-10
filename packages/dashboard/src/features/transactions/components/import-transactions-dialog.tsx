import { Badge } from "@components/ui/badge";
import { Button } from "@components/ui/button";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@ui/responsive-dialog";
import type {
  PostTransactionsImportPreviewMutationResponse,
  PostTransactionsImportConfirmMutationRequest,
} from "@finza/api-client";
import {
  getTransactionsQueryKey,
  usePostTransactionsImportConfirm,
} from "@finza/api-client/hooks";
import { postTransactionsImportPreview } from "@finza/api-client/clients/postTransactionsImportPreview.ts";
import { cn, formatCurrency } from "@lib/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  FileUp,
  Loader2,
  CheckCircle2,
  ArrowLeft,
} from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Step = "upload" | "preview" | "importing";

type PreviewTransaction =
  PostTransactionsImportPreviewMutationResponse["transactions"][number];

interface ImportTransactionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ACCEPTED_EXTENSIONS = ".ofx,.qfx,.csv";
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ImportTransactionsDialog({
  open,
  onOpenChange,
}: ImportTransactionsDialogProps) {
  const queryClient = useQueryClient();

  // State machine
  const [step, setStep] = useState<Step>("upload");
  const [previewData, setPreviewData] =
    useState<PostTransactionsImportPreviewMutationResponse | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [dragOver, setDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Preview mutation (manual — Kubb hook não suporta FormData) ──────────
  const previewMutation = useMutation({
    mutationKey: [{ url: "/transactions/import/preview" }],
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      return postTransactionsImportPreview({
        data: formData as unknown,
        headers: { "Content-Type": "multipart/form-data" },
      });
    },
    onSuccess: (data) => {
      setPreviewData(data);
      // Selecionar todas por padrão
      setSelected(new Set(data.transactions.map((_: PreviewTransaction, i: number) => i)));
      setStep("preview");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao processar o arquivo.");
    },
  });

  // ── Confirm mutation (hook Kubb) ────────────────────────────────────────
  const confirmMutation = usePostTransactionsImportConfirm({
    mutation: {
      onSuccess: (data) => {
        const { imported, duplicates } = data;
        const parts: string[] = [];
        if (imported > 0)
          parts.push(
            `${imported} ${imported === 1 ? "transação importada" : "transações importadas"}`,
          );
        if (duplicates > 0)
          parts.push(
            `${duplicates} ${duplicates === 1 ? "duplicada ignorada" : "duplicadas ignoradas"}`,
          );
        toast.success(parts.join(". ") || "Importação concluída.");
        queryClient.invalidateQueries({
          queryKey: getTransactionsQueryKey(),
        });
        queryClient.invalidateQueries({
          queryKey: [{ url: "/workspaces/:workspaceId/summary" }],
        });
        handleClose();
      },
      onError: (error) => {
        const message =
          error.response?.data?.message ?? "Erro ao importar transações.";
        toast.error(message);
        setStep("preview");
      },
    },
  });

  // ── Handlers ────────────────────────────────────────────────────────────
  function handleClose() {
    onOpenChange(false);
    // Reset após animação de saída
    setTimeout(() => {
      setStep("upload");
      setPreviewData(null);
      setSelected(new Set());
    }, 300);
  }

  function handleFileSelect(file: File | undefined) {
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      toast.error("Arquivo excede o limite de 5 MB.");
      return;
    }

    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!ext || !["ofx", "qfx", "csv"].includes(ext)) {
      toast.error("Formato não suportado. Use arquivos .ofx, .qfx ou .csv.");
      return;
    }

    previewMutation.mutate(file);
  }

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      handleFileSelect(file);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  function handleConfirm() {
    if (!previewData) return;

    const selectedTxs = previewData.transactions.filter((_, i) =>
      selected.has(i),
    );

    const payload: PostTransactionsImportConfirmMutationRequest = {
      transactions: selectedTxs.map((tx) => ({
        date: tx.date,
        amount: tx.amount,
        description: tx.description,
        type: tx.type,
      })),
    };

    setStep("importing");
    confirmMutation.mutate({ data: payload });
  }

  function toggleItem(index: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }

  function toggleAll() {
    if (!previewData) return;
    if (selected.size === previewData.transactions.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(previewData.transactions.map((_, i) => i)));
    }
  }

  // Contagem derivada
  const selectedCount = selected.size;
  const totalCount = previewData?.transactions.length ?? 0;

  return (
    <ResponsiveDialog open={open} onOpenChange={handleClose}>
      <ResponsiveDialogContent
        className={cn(step === "preview" && "sm:max-w-2xl")}
      >
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Importar transações</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            {step === "upload" &&
              "Envie um extrato bancário para importar transações automaticamente."}
            {step === "preview" &&
              `${totalCount} transações encontradas. Revise e confirme a importação.`}
            {step === "importing" && "Importando transações selecionadas..."}
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        {/* ── Step: Upload ─────────────────────────────────────────── */}
        {step === "upload" && (
          <UploadDropzone
            dragOver={dragOver}
            isPending={previewMutation.isPending}
            fileInputRef={fileInputRef}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onFileSelect={handleFileSelect}
          />
        )}

        {/* ── Step: Preview ────────────────────────────────────────── */}
        {step === "preview" && previewData && (
          <>
            <PreviewTable
              transactions={previewData.transactions}
              format={previewData.format}
              selected={selected}
              onToggleItem={toggleItem}
              onToggleAll={toggleAll}
            />

            <ResponsiveDialogFooter className="flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">
                  {selectedCount}
                </span>{" "}
                de {totalCount} selecionadas
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setStep("upload");
                    setPreviewData(null);
                    setSelected(new Set());
                  }}
                >
                  <ArrowLeft className="size-4" />
                  Trocar arquivo
                </Button>
                <Button
                  type="button"
                  variant="accent"
                  size="sm"
                  disabled={selectedCount === 0}
                  onClick={handleConfirm}
                >
                  Importar {selectedCount} selecionadas
                </Button>
              </div>
            </ResponsiveDialogFooter>
          </>
        )}

        {/* ── Step: Importing ──────────────────────────────────────── */}
        {step === "importing" && (
          <div className="flex flex-col items-center justify-center gap-3 py-12">
            <Loader2 className="size-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              Importando {selectedCount} transações...
            </p>
          </div>
        )}
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function UploadDropzone({
  dragOver,
  isPending,
  fileInputRef,
  onDragOver,
  onDragLeave,
  onDrop,
  onFileSelect,
}: {
  dragOver: boolean;
  isPending: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  onFileSelect: (file: File | undefined) => void;
}) {
  if (isPending) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border py-16">
        <Loader2 className="size-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">
          Processando arquivo...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click();
        }}
        role="button"
        tabIndex={0}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed px-6 py-16 text-center transition-colors",
          dragOver
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/40 hover:bg-muted/50",
        )}
      >
        <div className="flex size-12 items-center justify-center rounded-full bg-muted">
          <FileUp className="size-6 text-muted-foreground" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">
            Arraste um arquivo ou clique para selecionar
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Formatos: OFX, QFX, CSV (Nubank, Inter) — máx. 5 MB
          </p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_EXTENSIONS}
          className="hidden"
          onChange={(e) => onFileSelect(e.target.files?.[0])}
        />
      </div>

      <div className="rounded-lg border border-border bg-muted/30 p-3">
        <p className="mb-2 text-xs font-medium text-muted-foreground">
          O que esperamos encontrar no arquivo:
        </p>
        <div className="overflow-hidden rounded-md border border-border text-xs">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/60">
                <th className="px-3 py-1.5 text-left font-medium text-muted-foreground">
                  Data <span className="font-normal opacity-70">(obrigatório)</span>
                </th>
                <th className="px-3 py-1.5 text-left font-medium text-muted-foreground">
                  Descrição <span className="font-normal opacity-70">(opcional)</span>
                </th>
                <th className="px-3 py-1.5 text-right font-medium text-muted-foreground">
                  Valor <span className="font-normal opacity-70">(obrigatório)</span>
                </th>
              </tr>
            </thead>
            <tbody className="text-muted-foreground/80">
              <tr className="border-b border-border/50">
                <td className="px-3 py-1.5 tabular-nums">01/04/2026</td>
                <td className="px-3 py-1.5">Supermercado XYZ</td>
                <td className="px-3 py-1.5 text-right tabular-nums">-250,50</td>
              </tr>
              <tr>
                <td className="px-3 py-1.5 tabular-nums">05/04/2026</td>
                <td className="px-3 py-1.5">Salário</td>
                <td className="px-3 py-1.5 text-right tabular-nums">5.000,00</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function PreviewTable({
  transactions,
  format,
  selected,
  onToggleItem,
  onToggleAll,
}: {
  transactions: PreviewTransaction[];
  format: string;
  selected: Set<number>;
  onToggleItem: (index: number) => void;
  onToggleAll: () => void;
}) {
  const allSelected = selected.size === transactions.length;

  const formatLabel = useMemo(() => {
    const map: Record<string, string> = {
      OFX: "OFX",
      NUBANK_CSV: "CSV Nubank",
      INTER_CSV: "CSV Inter",
    };
    return map[format] ?? format;
  }, [format]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="text-xs">
          {formatLabel}
        </Badge>
      </div>

      <div className="max-h-80 overflow-y-auto rounded-lg border border-border">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-border bg-muted/80 px-3 py-2 text-xs font-medium uppercase tracking-wider text-muted-foreground backdrop-blur-sm">
          <button
            type="button"
            onClick={onToggleAll}
            className={cn(
              "flex size-4 shrink-0 items-center justify-center rounded border transition-colors",
              allSelected
                ? "border-primary bg-primary text-primary-foreground"
                : "border-muted-foreground/30 hover:border-primary/50",
            )}
            aria-label={allSelected ? "Desmarcar todas" : "Selecionar todas"}
          >
            {allSelected && (
              <CheckCircle2 className="size-3" />
            )}
          </button>
          <span className="w-20">Data</span>
          <span className="flex-1">Descrição</span>
          <span className="w-20 text-center">Tipo</span>
          <span className="w-28 text-right">Valor</span>
        </div>

        {/* Rows */}
        {transactions.map((tx, index) => {
          const isSelected = selected.has(index);
          const isIncome = tx.type === "INCOME";
          const formattedDate = new Date(tx.date).toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
          });

          return (
            <button
              type="button"
              key={`${tx.date}-${tx.amount}-${tx.description}-${index}`}
              onClick={() => onToggleItem(index)}
              className={cn(
                "flex w-full items-center gap-3 border-b border-border px-3 py-2.5 text-left transition-colors last:border-b-0",
                isSelected
                  ? "bg-background hover:bg-muted/30"
                  : "bg-muted/10 opacity-60 hover:opacity-80",
              )}
            >
              {/* Checkbox */}
              <span
                className={cn(
                  "flex size-4 shrink-0 items-center justify-center rounded border transition-colors",
                  isSelected
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-muted-foreground/30",
                )}
              >
                {isSelected && (
                  <CheckCircle2 className="size-3" />
                )}
              </span>

              {/* Data */}
              <span className="w-20 text-sm tabular-nums text-muted-foreground">
                {formattedDate}
              </span>

              {/* Descrição */}
              <span className="flex-1 truncate text-sm text-foreground">
                {tx.description}
              </span>

              {/* Tipo */}
              <span className="w-20 text-center">
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[10px]",
                    isIncome
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400"
                      : "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-400",
                  )}
                >
                  {isIncome ? "Receita" : "Despesa"}
                </Badge>
              </span>

              {/* Valor */}
              <span
                className={cn(
                  "w-28 text-right text-sm font-semibold tabular-nums",
                  isIncome
                    ? "text-emerald-700 dark:text-emerald-400"
                    : "text-foreground",
                )}
              >
                {isIncome ? "+ " : "- "}
                {formatCurrency(tx.amount, "BRL")}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
