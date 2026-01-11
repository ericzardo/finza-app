"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Percent, DollarSign, ArrowRight } from "lucide-react";
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
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { MoneyInput } from "@/components/ui/money-input";
import { Input } from "@/components/ui/input";

import { transferBucketSchema, TransferBucketData } from "@/schemas/bucket";
import { transferBalanceRequest } from "@/http/buckets";
import { Bucket } from "@/types";

interface TransferBalanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sourceBucket: Bucket;
  workspaceId: string;
  buckets: Bucket[];
  onSuccess?: () => void;
  currency?: string;
}

export function TransferBalanceDialog({
  open,
  onOpenChange,
  sourceBucket,
  workspaceId,
  buckets,
  onSuccess,
  currency = "BRL",
}: TransferBalanceDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [transferMode, setTransferMode] = useState<"amount" | "percentage">("amount");
  const [percentageValue, setPercentageValue] = useState<string>("");

  const form = useForm<TransferBucketData>({
    resolver: zodResolver(transferBucketSchema),
    defaultValues: {
      sourceBucketId: sourceBucket.id,
      destinationBucketId: "",
      amount: 0,
    },
  });

  const availableBuckets = buckets.filter(
    (bucket) =>
      bucket.id !== sourceBucket.id &&
      bucket.workspace_id === workspaceId &&
      bucket.type !== "INBOX"
  );

  const calculateAmountFromPercentage = (percentage: string) => {
    if (!percentage || percentage === "") return 0;
    const percent = parseFloat(percentage.replace(",", "."));
    if (isNaN(percent) || percent < 0 || percent > 100) return 0;
    return (percent / 100) * Number(sourceBucket.current_balance);
  };

  const handlePercentageChange = (value: string) => {
    setPercentageValue(value);
    const percent = parseFloat(value.replace(",", "."));
    
    if (!value || value === "" || isNaN(percent) || percent < 0 || percent > 100) {
      form.setValue("amount", 0);
      return;
    }
    
    const calculatedAmount = calculateAmountFromPercentage(value);
    form.setValue("amount", Number(calculatedAmount.toFixed(2)));
  };

  const handleModeChange = (mode: "amount" | "percentage") => {
    setTransferMode(mode);
    setPercentageValue("");
    form.setValue("amount", 0);
  };

  useEffect(() => {
    if (open) {
      form.reset({
        sourceBucketId: sourceBucket.id,
        destinationBucketId: "",
        amount: 0,
      });
      setTransferMode("amount");
      setPercentageValue("");
    }
  }, [open, sourceBucket, form]);

  const handleOpenChange = (isOpen: boolean) => {
    onOpenChange(isOpen);
    if (!isOpen) {
      form.reset();
      setTransferMode("amount");
      setPercentageValue("");
    }
  };

  const calculatedAmount = calculateAmountFromPercentage(percentageValue);
  const showPercentageConversion = transferMode === "percentage" && percentageValue && parseFloat(percentageValue.replace(",", ".")) > 0;

  const onSubmit = async (data: TransferBucketData) => {
    try {
      if (data.amount > Number(sourceBucket.current_balance)) {
        toast.error("Valor excede o saldo disponível", {
          description: `Disponível: ${formatCurrency(sourceBucket.current_balance, currency)}`,
        });
        return;
      }

      if (data.amount <= 0) {
        toast.error("Valor inválido", {
          description: "Informe um valor maior que zero",
        });
        return;
      }

      setIsLoading(true);
      await transferBalanceRequest(data);

      toast.success("Transferência realizada!", {
        description: `${formatCurrency(data.amount, currency)} transferido com sucesso.`,
      });

      if (onSuccess) onSuccess();
      handleOpenChange(false);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao transferir saldo", {
        description: error instanceof Error ? error.message : "Tente novamente mais tarde.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-106.25 border-none shadow-xl [&>button]:cursor-pointer">
        <DialogHeader>
          <DialogTitle>Transferir Saldo</DialogTitle>
          <DialogDescription>
            Mova dinheiro de <strong>{sourceBucket.name}</strong> para outro caixa.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4" noValidate>
            
            {/* SELEÇÃO DE MODO (Estilo ToggleGroup do Modal de Bucket) */}
            <div className="space-y-3">
              <FormLabel>Como definir o valor?</FormLabel>
              <ToggleGroup
                type="single"
                value={transferMode}
                onValueChange={(val) => {
                  if (val === "amount" || val === "percentage") handleModeChange(val);
                }}
                className="grid grid-cols-2 gap-4"
              >
                <ToggleGroupItem
                  value="amount"
                  className={cn(
                    "h-auto py-2.5 flex flex-col items-center justify-center gap-2 rounded-xl border-2 cursor-pointer transition-all",
                    "border-muted bg-transparent text-muted-foreground hover:border-primary/50 hover:bg-primary/5 hover:text-foreground",
                    "data-[state=on]:border-primary data-[state=on]:bg-primary/10 data-[state=on]:text-primary"
                  )}
                >
                  <DollarSign className="h-5 w-5" />
                  <span className="font-semibold text-sm">Valor Fixo</span>
                </ToggleGroupItem>

                <ToggleGroupItem
                  value="percentage"
                  className={cn(
                    "h-auto py-2.5 flex flex-col items-center justify-center gap-2 rounded-xl border-2 cursor-pointer transition-all",
                    "border-muted bg-transparent text-muted-foreground hover:border-primary/50 hover:bg-primary/5 hover:text-foreground",
                    "data-[state=on]:border-primary data-[state=on]:bg-primary/10 data-[state=on]:text-primary"
                  )}
                >
                  <Percent className="h-5 w-5" />
                  <span className="font-semibold text-sm">Porcentagem</span>
                </ToggleGroupItem>
              </ToggleGroup>
            </div>

            {/* ÁREA DE INPUT COM ANIMAÇÃO UNIFICADA */}
            <div className="space-y-4">
              {transferMode === "amount" ? (
                // Input de Valor
                <div className="animate-in fade-in zoom-in-95 duration-200">
                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valor da Transferência</FormLabel>
                        <FormControl>
                          <MoneyInput
                            value={field.value}
                            onValueChange={field.onChange}
                            placeholder="0,00"
                            currencySymbol={currency === "BRL" ? "R$" : "$"}
                            className="w-full"
                          />
                        </FormControl>
                        <FormDescription>
                          Disponível: {formatCurrency(sourceBucket.current_balance, currency)}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              ) : (
                // Input de Porcentagem
                <div className="space-y-3 animate-in fade-in zoom-in-95 duration-200">
                  <FormItem>
                    <FormLabel>Porcentagem do Saldo</FormLabel>
                    <div className="relative">
                      <Input
                        type="text"
                        value={percentageValue}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^0-9,]/g, "").slice(0, 5);
                          handlePercentageChange(value);
                        }}
                        placeholder="0"
                        className="w-full pr-8 text-left" // Tamanho padrão (h-10)
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                        %
                      </span>
                    </div>
                  </FormItem>

                  <FormDescription>
                    Disponível: {formatCurrency(sourceBucket.current_balance, currency)}
                  </FormDescription>

                  {/* Preview da Conversão (Subtil) */}
                  {showPercentageConversion && (
                    <div className="rounded-lg bg-secondary/50 p-3 border border-border/50 flex items-center justify-between gap-4 animate-in slide-in-from-top-2 fade-in duration-300">
                      <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground">
                          Valor correspondente
                        </span>
                        <span className="text-sm font-semibold text-primary">
                          {formatCurrency(calculatedAmount, currency)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <ArrowRight className="h-4 w-4" />
                        <span className="text-xs">
                          Sobrará: {formatCurrency(Number(sourceBucket.current_balance) - calculatedAmount, currency)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* BUCKET DE DESTINO */}
            <FormField
              control={form.control}
              name="destinationBucketId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Para onde vai o dinheiro?</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="h-10 cursor-pointer bg-background">
                        <SelectValue placeholder="Selecione um caixa de destino" />
                      </SelectTrigger>
                    </FormControl>
                    
                    <SelectContent 
                      className="border border-border shadow-md rounded-md bg-popover p-1 max-h-50"
                      position="popper" 
                      sideOffset={4}
                    >
                      {availableBuckets.length === 0 ? (
                        <SelectItem value="none" disabled>
                          Nenhum caixa disponível
                        </SelectItem>
                      ) : (
                        availableBuckets.map((bucket) => (
                          <SelectItem 
                            key={bucket.id} 
                            value={bucket.id} 
                            className="cursor-pointer relative flex w-full select-none items-center rounded-sm py-2 pl-3 pr-8 text-sm outline-none focus:bg-accent focus:text-accent-foreground group"
                          >
                            <div className="flex flex-col text-left gap-0.5">
                              <span className="font-medium leading-none">
                                {bucket.name}
                              </span>
                              <span className="text-xs text-muted-foreground group-focus:text-accent-foreground/90 transition-colors">
                                Saldo: {formatCurrency(bucket.current_balance, currency)}
                              </span>
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Hidden Source */}
            <FormField
              control={form.control}
              name="sourceBucketId"
              render={({ field }) => <input type="hidden" {...field} />}
            />

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => handleOpenChange(false)}
                className="cursor-pointer"
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isLoading || availableBuckets.length === 0 || form.watch("amount") <= 0}
                className="cursor-pointer min-w-32"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processando...
                  </>
                ) : (
                  "Confirmar"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}