"use client";

import { useState } from "react";
import { Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { deleteBucketRequest } from "@/http/buckets"; 
import { Bucket } from "@/types";
import { formatCurrency } from "@/lib/utils";

interface DeleteBucketDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bucket: Bucket | null;
  currency?: string;
  onSuccess?: () => void;
}

export function DeleteBucketDialog({
  open,
  onOpenChange,
  bucket,
  currency = "BRL",
  onSuccess,
}: DeleteBucketDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!bucket) return null;

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    try {
      setIsDeleting(true);
      await deleteBucketRequest(bucket.id);
      
      toast.success("Caixa excluído com sucesso!");
      
      if (onSuccess) onSuccess();
      onOpenChange(false);

    } catch (error) {
      console.error(error);
      toast.error("Erro ao excluir caixa", {
        description: "Verifique se existem transações vinculadas e tente novamente."
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const hasBalance = Number(bucket.current_balance) > 0;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Tem certeza absoluta?</AlertDialogTitle>
          <AlertDialogDescription>
            Essa ação não pode ser desfeita. Isso excluirá permanentemente o caixa{" "}
            <span className="font-semibold text-foreground">&quot;{bucket.name}&quot;</span>.
          </AlertDialogDescription>

          {/* Aviso Condicional de Saldo */}
          {hasBalance && (
            <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-md text-sm text-amber-600 dark:text-amber-500 flex flex-col gap-1">
              <div className="flex items-center gap-2 font-semibold">
                <AlertTriangle className="h-4 w-4" />
                Atenção: Saldo remanescente
              </div>
              <p>
                Este caixa possui saldo de <strong>{formatCurrency(Number(bucket.current_balance), currency)}</strong>.
              </p>
              <p className="text-xs opacity-90 mt-1">
                As transações associadas perderão a referência do caixa, mas não serão excluídas do histórico geral.
              </p>
            </div>
          )}
        </AlertDialogHeader>
        
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting} className="cursor-pointer">
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-destructive hover:bg-destructive/90 cursor-pointer"
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Excluindo...
              </>
            ) : (
              "Sim, excluir caixa"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}