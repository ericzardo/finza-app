"use client";

import { useState } from "react"; // Removi useEffect desnecessário
import { DollarSign, Percent, Sparkles, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency, cn } from "@/lib/utils"; // Ajustei imports

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { MoneyInput } from "@/components/ui/money-input";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
// Adicionei ScrollArea que estava faltando no seu código anterior
import { ScrollArea } from "@/components/ui/scroll-area"; 

import { Bucket, DistributionTarget } from "@/types";

interface TransactionDistributionStepProps {
  totalAmount: number;
  workspaceId: string;
  buckets: Bucket[];
  currency?: string;
  onBack: () => void;
  onConfirm: (config: DistributionTarget[]) => void;
  initialConfig?: DistributionTarget[];
}

export function TransactionDistributionStep({
  totalAmount,
  workspaceId,
  buckets,
  currency = "BRL",
  onBack,
  onConfirm,
  initialConfig = []
}: TransactionDistributionStepProps) {
  // Inicializa o estado com o que veio do pai. 
  // Como o componente é desmontado ao sair da tela, isso roda toda vez que entra.
  const [targets, setTargets] = useState<DistributionTarget[]>(initialConfig);
  
  // Auto mode começa false a menos que queira persistir isso também (opcional)
  const [useAutoMode, setUseAutoMode] = useState(false);

  const availableBuckets = buckets.filter(
    (bucket) => !bucket.is_default && bucket.workspace_id === workspaceId
  );

  const handleAutoToggle = (checked: boolean) => {
    setUseAutoMode(checked);
    if (checked) {
      const autoTargets: DistributionTarget[] = availableBuckets
        .filter((b) => Number(b.allocation_percentage) > 0)
        .map((bucket) => ({
          bucketId: bucket.id,
          bucketName: bucket.name,
          value: Number(bucket.allocation_percentage),
          isPercentage: true,
          inputMode: "percentage",
        }));
      setTargets(autoTargets);
    } else {
      // Se desligar auto, mantemos ou limpamos? Geralmente limpa ou mantem como manual.
      // Vou limpar para seguir a lógica do seu outro modal.
      setTargets([]);
    }
  };

  const toggleBucketSelection = (bucket: Bucket) => {
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
    if (useAutoMode) setUseAutoMode(false);
    setTargets(
      targets.map((t) =>
        t.bucketId === bucketId
          ? { ...t, value, isPercentage, inputMode: mode }
          : t
      )
    );
  };

  const calculateTotals = () => {
    let totalDistributed = 0;
    
    targets.forEach(target => {
      let amount = 0;
      if (target.isPercentage) {
        amount = (target.value / 100) * totalAmount;
      } else {
        amount = target.value;
      }
      totalDistributed += amount;
    });

    const remainder = totalAmount - totalDistributed;
    // Tolerância de centavos para float
    const isOverLimit = remainder < -0.02; 

    return { totalDistributed, remainder, isOverLimit };
  };

  const { totalDistributed, remainder, isOverLimit } = calculateTotals();

  const handleSave = () => {
    if (targets.length === 0 && !useAutoMode) {
      toast.error("Selecione ao menos um bucket");
      return;
    }
    if (isOverLimit) {
      toast.error("O valor distribuído excede o total da transação");
      return;
    }
    
    onConfirm(targets);
  };

  return (
    <div className="flex flex-col h-full animate-in slide-in-from-right-4 duration-300">
      <DialogHeader className="pb-4 mb-4 flex-none">
        <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8 -ml-3" onClick={onBack}>
                <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
                <DialogTitle>Distribuir Transação</DialogTitle>
                <DialogDescription>
                    Total: <span className="text-primary font-bold">{formatCurrency(totalAmount, currency)}</span>
                </DialogDescription>
            </div>
        </div>

        <div className="mt-4 bg-secondary/50 p-4 rounded-xl border border-border/50 flex justify-between items-center">
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                Restante (Saldo Livre)
              </span>
              <span className={cn("text-2xl font-bold", isOverLimit ? "text-destructive" : "text-primary")}>
                {formatCurrency(remainder, currency)}
              </span>
            </div>
            <div className="text-right">
               <span className="text-xs text-muted-foreground block">Distribuído</span>
               <span className="text-sm font-medium text-muted-foreground">
                 {formatCurrency(totalDistributed, currency)}
               </span>
            </div>
        </div>
      </DialogHeader>

      <ScrollArea className="flex-1 pr-4 -mr-4 min-h-75">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-xl border bg-card">
                <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                    <Sparkles className="h-4 w-4 text-primary" />
                </div>
                <div>
                    <Label htmlFor="step-auto-mode" className="font-semibold cursor-pointer text-sm">Distribua Automaticamente</Label>
                    <p className="text-[10px] text-muted-foreground">Utilize a % predefinida nos caixas</p>
                </div>
                </div>
                <Switch 
                id="step-auto-mode"
                checked={useAutoMode}
                onCheckedChange={handleAutoToggle}
                />
            </div>

            <div className="space-y-2">
                {availableBuckets.map((bucket) => {
                    const isSelected = !!targets.find((t) => t.bucketId === bucket.id);
                    const target = targets.find((t) => t.bucketId === bucket.id);

                    return (
                    <div
                        key={bucket.id}
                        className={cn(
                        "rounded-lg border transition-all duration-200",
                        isSelected ? "border-primary/50 bg-secondary/30" : "border-border bg-card"
                        )}
                    >
                        <div 
                        className="p-3 flex items-center gap-3 cursor-pointer"
                        onClick={() => toggleBucketSelection(bucket)}
                        >
                        <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleBucketSelection(bucket)}
                        />
                        <div className="flex-1">
                            <div className="font-medium text-sm">{bucket.name}</div>
                        </div>
                        </div>

                        {isSelected && target && (
                        <div className="px-3 pb-3 pt-0 pl-9 animate-in slide-in-from-top-1">
                            <div className="flex gap-2 items-center">
                            <div className="flex bg-muted rounded-md p-0.5 shrink-0">
                                <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); updateTargetValue(target.bucketId, 0, false, "amount"); }}
                                className={cn("p-1.5 rounded-sm flex items-center justify-center", target.inputMode === "amount" && "bg-background shadow-sm")}
                                >
                                <DollarSign className="w-3 h-3" />
                                </button>
                                <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); updateTargetValue(target.bucketId, 0, true, "percentage"); }}
                                className={cn("p-1.5 rounded-sm flex items-center justify-center", target.inputMode === "percentage" && "bg-background shadow-sm")}
                                >
                                <Percent className="w-3 h-3" />
                                </button>
                            </div>

                            <div className="flex-1 relative">
                                {target.inputMode === "amount" ? (
                                <MoneyInput
                                    value={Number(target.value)}
                                    onValueChange={(val) => updateTargetValue(target.bucketId, Number(val), false, "amount")}
                                    placeholder="0,00"
                                    currencySymbol={currency === "BRL" ? "R$" : "$"}
                                    className="h-8 text-sm"
                                />
                                ) : (
                                <div className="relative">
                                    <Input
                                    value={target.value || ""}
                                    onChange={(e) => updateTargetValue(target.bucketId, Number(e.target.value), true, "percentage")}
                                    placeholder="0"
                                    className="pr-6 h-8 text-sm"
                                    type="number"
                                    />
                                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px]">%</span>
                                </div>
                                )}
                            </div>
                            
                            {target.inputMode === "percentage" && (
                                <div className="text-xs text-muted-foreground min-w-15 text-right">
                                {formatCurrency((totalAmount * target.value) / 100, currency)}
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
      </ScrollArea>

      <div className="mt-auto flex justify-end gap-2">
         <Button variant="outline" onClick={onBack}>Voltar</Button>
         <Button onClick={handleSave} disabled={isOverLimit || (targets.length === 0 && !useAutoMode)}>
            Salvar Distribuição
         </Button>
      </div>
    </div>
  );
}