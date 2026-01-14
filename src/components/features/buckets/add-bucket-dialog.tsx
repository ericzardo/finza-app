"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Wallet, TrendingUp } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NumericFormat } from "react-number-format";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
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

import { bucketFormSchema, BucketData } from "@/schemas/bucket";
import { createBucketRequest } from "@/http/buckets"; 
import { cn } from "@/lib/utils";
import { MoneyInput } from "@/components/ui/money-input";

interface AddBucketDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  onSuccess?: () => void;
}

export function AddBucketDialog({ open, onOpenChange, workspaceId, onSuccess }: AddBucketDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm({
    resolver: zodResolver(bucketFormSchema),
    defaultValues: {
      name: "",
      allocationPercentage: 0, 
      isDefault: false,
      type: "SPENDING",
      initialBalance: 0
    },
  });

  const selectedType = useWatch({ control: form.control, name: "type" });

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) form.reset();
    onOpenChange(isOpen);
  };

  const onSubmit = async (data: BucketData) => {
    try {
      setIsLoading(true);

      await createBucketRequest({
        ...data,
        workspaceId,
      });

      toast.success("Caixa criado!", {
        description: `O caixa "${data.name}" foi criado com sucesso.`,
      });

      if (onSuccess) onSuccess();
      handleOpenChange(false);

    } catch (error) {
      console.error(error);
      toast.error("Erro ao criar caixa", {
        description: "Verifique os dados e tente novamente."
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-106.25 border-none shadow-xl [&>button]:cursor-pointer">
        <DialogHeader>
          <DialogTitle>Novo Caixa</DialogTitle>
          <DialogDescription>
            Defina o objetivo deste caixa para organizar seu dinheiro.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4" noValidate>
            
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Qual o propósito deste caixa?</FormLabel>
                  <FormControl>
                    <ToggleGroup
                      type="single"
                      value={field.value}
                      onValueChange={(val) => {
                        if (val) field.onChange(val);
                      }}
                      className="grid grid-cols-2 gap-4"
                    >
                      <ToggleGroupItem
                        value="SPENDING"
                        className={cn(
                          "h-auto py-2 flex flex-col items-center justify-center gap-3 rounded-xl border-2 cursor-pointer",

                          "border-muted bg-transparent text-muted-foreground hover:border-primary/50 hover:bg-primary/5 hover:text-foreground",
                          

                          "data-[state=on]:border-primary data-[state=on]:bg-primary/10 data-[state=on]:text-primary"
                        )}
                      >
                        <Wallet className="h-6 w-6" /> 
                        <span className="font-semibold text-sm">Gastos & Contas</span>
                      </ToggleGroupItem>

                      <ToggleGroupItem
                        value="INVESTMENT"
                        className={cn(
                          "h-auto py-2 flex flex-col items-center justify-center gap-3 rounded-xl border-2 cursor-pointer",

                          "border-muted bg-transparent text-muted-foreground hover:border-blue-500/50 hover:bg-blue-50 hover:text-foreground",

                          "data-[state=on]:border-blue-500 data-[state=on]:bg-blue-50 data-[state=on]:text-blue-700"
                        )}
                      >
                        <TrendingUp className="h-6 w-6" />
                        <span className="font-semibold text-sm">Investimento</span>
                      </ToggleGroupItem>
                    </ToggleGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Caixa</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder={selectedType === "INVESTMENT" ? "Ex: Reserva de Emergência, Ações..." : "Ex: Mercado, Lazer, Custos Fixos..."} 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="allocationPercentage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {selectedType === "INVESTMENT" ? "Meta de Aporte Mensal" : "Orçamento Mensal"}
                  </FormLabel>
                  <FormDescription>
                    {selectedType === "INVESTMENT" 
                      ? "Porcentagem da sua renda destinada a este investimento."
                      : "Porcentagem da sua renda destinada a estes gastos."}
                  </FormDescription>
                  <FormControl>
                    <div className="relative">
                      <NumericFormat
                        value={field.value === 0 ? "" : field.value} 
                        onValueChange={(values) => {
                          field.onChange(values.floatValue || 0);
                        }}
                        decimalScale={0} 
                        allowNegative={false}
                        isAllowed={(values) => {
                          const { floatValue } = values;
                          return floatValue === undefined || (floatValue >= 0 && floatValue <= 100);
                        }}
                        customInput={Input}
                        placeholder="0" 
                        className="text-left pr-8" 
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                        %
                      </span>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedType === "INVESTMENT" && (
              <FormField
                control={form.control}
                name="initialBalance"
                render={({ field }) => (
                  <FormItem className="group bg-secondary/30 hover:bg-secondary/50 border border-border/50 rounded-xl p-4 transition-all duration-200">
                    
                    {/* HEADER DO CARD: Ícone + Título + Badge */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        
                        {/* Textos alinhados */}
                        <div className="flex flex-col gap-0.5">
                          <FormLabel className="text-sm font-semibold text-foreground m-0 leading-none">
                            Saldo Acumulado
                          </FormLabel>
                          <span className="text-[11px] text-muted-foreground leading-tight">
                            Quanto você já tem investido aqui?
                          </span>
                        </div>
                      </div>

                      {/* Badge sutil no topo direito */}
                      <span className="text-[10px] font-bold text-primary/70 bg-transparent border px-2 py-0.5 rounded-full uppercase tracking-wide">
                        Opcional
                      </span>
                    </div>

                    {/* INPUT */}
                    <FormControl>
                      <MoneyInput 
                        placeholder="R$ 0,00" 
                        value={field?.value || 0} 
                        onValueChange={(val) => field.onChange(val)} 
                        currencySymbol="R$"
                        className="bg-background border-border/80 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all h-10 font-medium text-base"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <DialogFooter>
              <Button 
                type="button" 
                variant="ghost" 
                onClick={() => handleOpenChange(false)}
                className="cursor-pointer"
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading} className="cursor-pointer min-w-32">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Criando...
                  </>
                ) : (
                  "Criar Caixa"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
