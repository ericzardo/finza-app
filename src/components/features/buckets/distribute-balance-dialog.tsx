"use client";

import { useState, useEffect } from "react";
import { Loader2, Percent, DollarSign, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { cn, formatCurrency } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch"; // Mudei para Switch (mais bonito pra toggle)
import { Label } from "@/components/ui/label";
import { MoneyInput } from "@/components/ui/money-input";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

import { distributeBalanceRequest } from "@/http/buckets";
import { Bucket, DistributionTarget, DistributeBalanceDialogProps } from "@/types";

export function DistributeBalanceDialog({
  open,
  onOpenChange,
  sourceBucket,
  workspaceId,
  buckets,
  onSuccess,
  currency = "BRL",
}: DistributeBalanceDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [useAutoMode, setUseAutoMode] = useState(false);
  const [targets, setTargets] = useState<DistributionTarget[]>([]);

  const availableBuckets = buckets.filter(
    (bucket) =>
      bucket.id !== sourceBucket.id &&
      bucket.workspace_id === workspaceId
  );

  // Resetar estados ao abrir/fechar
  useEffect(() => {
    if (open) {
      setUseAutoMode(false);
      setTargets([]);
    }
  }, [open]);

  const handleOpenChange = (isOpen: boolean) => {
    onOpenChange(isOpen);
    if (!isOpen) {
      setUseAutoMode(false);
      setTargets([]);
    }
  };

  // LÓGICA DO MODO AUTOMÁTICO (Sem useEffect para evitar loop)
  const handleAutoToggle = (checked: boolean) => {
    setUseAutoMode(checked);
    
    if (checked) {
      const autoTargets: DistributionTarget[] = availableBuckets
        .filter((b) => !b.is_default && Number(b.allocation_percentage) > 0)
        .map((bucket) => ({
          bucketId: bucket.id,
          bucketName: bucket.name,
          value: Number(bucket.allocation_percentage),
          isPercentage: true,
          inputMode: "percentage",
        }));
      setTargets(autoTargets);
    } else {
      setTargets([]);
    }
  };

  const toggleBucketSelection = (bucket: Bucket) => {
    // Se estiver em auto mode e tentar editar manual, desliga o auto mode mas mantem os dados
    if (useAutoMode) setUseAutoMode(false);

    const exists = targets.find((t) => t.bucketId === bucket.id);
    
    if (exists) {
      setTargets(targets.filter((t) => t.bucketId !== bucket.id));
    } else {
      setTargets([
        ...targets,
        {
          bucketId: bucket.id,
          bucketName: bucket.name,
          value: 0,
          isPercentage: false,
          inputMode: "amount",
        },
      ]);
    }
  };

  const updateTargetValue = (bucketId: string, value: number, isPercentage: boolean, mode: "amount" | "percentage") => {
    if (useAutoMode) setUseAutoMode(false); // Desliga auto se editar manual

    setTargets(
      targets.map((t) =>
        t.bucketId === bucketId
          ? { ...t, value, isPercentage, inputMode: mode }
          : t
      )
    );
  };

  // Cálculo em tempo real
  const calculateTotals = () => {
    const sourceBalance = Number(sourceBucket.current_balance);
    let totalDistributed = 0;

    const enrichedTargets = targets.map(target => {
      let amount = 0;
      if (target.isPercentage) {
        amount = (target.value / 100) * sourceBalance;
      } else {
        amount = target.value;
      }
      totalDistributed += amount;
      return { ...target, calculatedAmount: amount };
    });

    const remainder = sourceBalance - totalDistributed;
    const isOverLimit = remainder < 0; // Tolerância pequena para float pode ser necessária, mas < 0 resolve 99%

    return { totalDistributed, remainder, isOverLimit, enrichedTargets };
  };

  const { totalDistributed, remainder, isOverLimit } = calculateTotals();

  const handleSubmit = async () => {
    try {
      const sourceBalance = Number(sourceBucket.current_balance);

      if (targets.length === 0 && !useAutoMode) {
        toast.error("Selecione ao menos um bucket");
        return;
      }

      if (isOverLimit) {
        toast.error("Saldo insuficiente");
        return;
      }

      if (totalDistributed <= 0 && !useAutoMode) {
        toast.error("Defina valores para distribuir");
        return;
      }

      setIsLoading(true);

      const requestData = {
        sourceBucketId: sourceBucket.id,
        workspaceId,
        amount: sourceBalance,
        targets: targets.map((t) => ({
          bucketId: t.bucketId,
          value: t.value,
          isPercentage: t.isPercentage,
        })),
      };

      await distributeBalanceRequest(requestData);

      toast.success("Saldo distribuído com sucesso!");
      if (onSuccess) onSuccess();
      handleOpenChange(false);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao distribuir saldo");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden border-none shadow-xl [&>button]:cursor-pointer">
        
        {/* HEADER FIXO */}
        <div className="p-6 pb-4">
          <DialogHeader>
            <DialogTitle>Distribuir Saldo</DialogTitle>
            <DialogDescription>
              Distribua o saldo de <strong>{sourceBucket.name}</strong> entre múltiplos caixas.
            </DialogDescription>
          </DialogHeader>

          {/* CARD DE SALDO DISPONÍVEL (NOVO) */}
          <div className="mt-4 bg-secondary/50 p-4 rounded-xl border border-border/50 flex justify-between items-center">
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                Disponível para Distribuir
              </span>
              <span className={cn("text-2xl font-bold", isOverLimit ? "text-destructive" : "text-primary")}>
                {formatCurrency(Number(sourceBucket.current_balance), currency)}
              </span>
            </div>
            <div className="text-right">
               <span className="text-xs text-muted-foreground block">Restante após distribuição</span>
               <span className={cn("text-sm font-medium", isOverLimit ? "text-destructive font-bold" : "text-muted-foreground")}>
                 {formatCurrency(remainder, currency)}
               </span>
            </div>
          </div>
        </div>

        {/* CORPO COM SCROLL (Resolve o problema de layout) */}
        <div data-lenis-prevent="true" className="flex-1 overflow-y-auto px-6 py-2 space-y-6">
          
          {/* MODO AUTOMÁTICO TOGGLE */}
          <div className="flex items-center justify-between p-4 rounded-xl border bg-card">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div>
                <Label htmlFor="auto-mode" className="font-semibold cursor-pointer">Distribuição Automática</Label>
                <p className="text-xs text-muted-foreground">Usar porcentagens definidas nos caixas</p>
              </div>
            </div>
            <Switch 
              id="auto-mode"
              checked={useAutoMode}
              onCheckedChange={handleAutoToggle}
              className="cursor-pointer"
            />
          </div>

          {/* LISTA DE BUCKETS */}
          <div className="space-y-3">
            <Label className="text-base">Selecione os Destinos</Label>
            <div className="grid gap-3">
              {availableBuckets.map((bucket) => {
                const isSelected = !!targets.find((t) => t.bucketId === bucket.id);
                const target = targets.find((t) => t.bucketId === bucket.id);

                return (
                  <div
                    key={bucket.id}
                    className={cn(
                      "rounded-xl border transition-all duration-200",
                      isSelected ? "border-primary/50 bg-secondary/30" : "border-border bg-card"
                    )}
                  >
                    {/* CABEÇALHO DO CARD (CHECKBOX) */}
                    <div 
                      className="p-3 flex items-center gap-3 cursor-pointer"
                      onClick={() => toggleBucketSelection(bucket)}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleBucketSelection(bucket)}
                        className="data-[state=checked]:bg-primary data-[state=checked]:border-primary cursor-pointer"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-sm">{bucket.name}</div>
                        <div className="text-xs text-muted-foreground flex gap-2">
                           <span>Saldo atual: {formatCurrency(bucket.current_balance, currency)}</span>
                           {!bucket.is_default && Number(bucket.allocation_percentage) > 0 && (
                             <span className="bg-primary/10 text-primary px-1.5 rounded text-[10px] font-medium">
                               Meta: {bucket.allocation_percentage}%
                             </span>
                           )}
                        </div>
                      </div>
                    </div>

                    {/* ÁREA DE INPUTS (EXPANDE SE SELECIONADO) */}
                    {isSelected && target && (
                      <div className="px-3 pb-3 pt-0 pl-9 animate-in slide-in-from-top-1 duration-200">
                        <div className="flex gap-2 items-center">
                          {/* Botões de Modo */}
                          <div className="flex bg-muted rounded-md p-0.5">
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); updateTargetValue(target.bucketId, 0, false, "amount"); }}
                              className={cn(
                                "px-2.5 rounded-sm text-xs font-medium transition-all flex items-center",
                                target.inputMode === "amount" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground cursor-pointer"
                              )}
                            >
                              <DollarSign className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); updateTargetValue(target.bucketId, 0, true, "percentage"); }}
                              className={cn(
                                "px-2.5 rounded-sm text-xs font-medium transition-all flex items-center",
                                target.inputMode === "percentage" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground cursor-pointer"
                              )}
                            >
                              <Percent className="w-3 h-3" />
                            </button>
                          </div>

                          {/* Inputs */}
                          <div className="flex-1 relative">
                            {target.inputMode === "amount" ? (
                              <MoneyInput
                                value={Number(target.value)}
                                onValueChange={(val) => updateTargetValue(target.bucketId, Number(val), false, "amount")}
                                placeholder="0,00"
                                currencySymbol={currency === "BRL" ? "R$" : "$"}
                              />
                            ) : (
                              <div className="relative">
                                <Input
                                  value={target.value || ""}
                                  onChange={(e) => {
                                    const val = parseFloat(e.target.value.replace(",", ".")) || 0;
                                    updateTargetValue(target.bucketId, val, true, "percentage");
                                  }}
                                  placeholder="0"
                                  className="pr-8"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">%</span>
                              </div>
                            )}
                          </div>

                          {/* Preview do Valor Calculado (se for %) */}
                          {target.inputMode === "percentage" && (
                             <div className="text-xs text-muted-foreground min-w-20 text-right">
                               = {formatCurrency((Number(sourceBucket.current_balance) * target.value) / 100, currency)}
                             </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* FOOTER FIXO */}
        <div className="p-6 pt-4 bg-background">
          <DialogFooter>
            <div className="flex flex-col text-sm mr-auto">
              <span className="text-muted-foreground">Total a distribuir</span>
              <span className={cn("font-bold", isOverLimit ? "text-destructive" : "text-primary")}>
                {formatCurrency(totalDistributed, currency)}
              </span>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isLoading || isOverLimit || (targets.length === 0 && !useAutoMode)}
              className="min-w-32"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Processando...
                </>
              ) : (
                "Confirmar"
              )}
            </Button>
          </DialogFooter>
        </div>

      </DialogContent>
    </Dialog>
  );
}
