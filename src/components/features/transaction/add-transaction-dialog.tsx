"use client";

import { useState, useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Loader2, Settings2, Trash2, Sparkles } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MoneyInput } from "@/components/ui/money-input";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { formatCurrency } from "@/lib/utils";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { cn, getCurrencySymbol } from "@/lib/utils";
import { transactionFormSchema, TransactionData } from "@/schemas/transaction";
import { createTransactionRequest } from "@/http/transactions";
import { getBucketsRequest, distributeBalanceRequest } from "@/http/buckets"; 
import { Bucket, DistributionTarget } from "@/types";

import { TransactionDistributionStep } from "./distribute-transaction-dialog";

interface AddTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  currency?: string;
  buckets?: Bucket[]; 
  onSuccess?: () => void;
}

export function AddTransactionDialog({ 
  open, 
  onOpenChange, 
  workspaceId, 
  currency = "BRL",
  buckets: initialBuckets = [],
  onSuccess
}: AddTransactionDialogProps) {
  
  const [isLoading, setIsLoading] = useState(false);
  const [bucketsList, setBucketsList] = useState<Bucket[]>(initialBuckets);
  const [isLoadingBuckets, setIsLoadingBuckets] = useState(false);

  // ETAPAS DO MODAL
  const [step, setStep] = useState<'form' | 'distribution'>('form');
  // CONFIGURAÇÃO DA DISTRIBUIÇÃO (LOCAL)
  const [distributionConfig, setDistributionConfig] = useState<DistributionTarget[]>([]);

  const currencySymbol = getCurrencySymbol(currency);

  const form = useForm<TransactionData>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: {
      type: "EXPENSE",
      amount: 0,
      description: "",
      date: new Date(),
      workspaceId: workspaceId,
      isAllocated: false, 
    },
  });

  const selectedType = useWatch({ control: form.control, name: "type" });
  const currentAmount = useWatch({ control: form.control, name: "amount" });

  const selectableBuckets = bucketsList.filter(b => !b.is_default);

  useEffect(() => {
    async function fetchBuckets() {
      if (open && workspaceId) {
        try {
          setIsLoadingBuckets(true);
          const data = await getBucketsRequest(workspaceId);
          setBucketsList(data);
        } catch (error) {
          console.error("Erro ao buscar caixas", error);
        } finally {
          setIsLoadingBuckets(false);
        }
      }
    }
    fetchBuckets();
  }, [open, workspaceId]);

  // RESET AO ABRIR
  useEffect(() => {
    if (open) {
      form.reset({
        type: "EXPENSE",
        amount: 0,
        description: "",
        date: new Date(),
        workspaceId: workspaceId,
        bucketId: undefined,
        isAllocated: false,
      });
      setStep('form');
      setDistributionConfig([]);
    }
  }, [open, form, workspaceId]);

  const onSubmit = async (data: TransactionData) => {
    try {
      setIsLoading(true);

      const payload = {
        ...data,
        workspaceId,
        bucketId: (data.type === "INCOME" && distributionConfig.length > 0) 
          ? undefined 
          : (data.bucketId === "none" ? undefined : data.bucketId),
        isAllocated: false, // Inicialmente false pois será distribuído depois ou é livre
      };

      // Se for Income com bucket direto (sem distribuição complexa), marcamos allocated
      if (data.type === "INCOME" && distributionConfig.length === 0 && data.bucketId && data.bucketId !== "none") {
         payload.isAllocated = true;
      }

      // 1. CRIAR TRANSAÇÃO
      await createTransactionRequest(payload);
      
      // 2. SE TIVER DISTRIBUIÇÃO CONFIGURADA, EXECUTAR AGORA
      if (data.type === "INCOME" && distributionConfig.length > 0) {
         // Precisamos achar o bucket padrão (Inbox) para tirar o dinheiro de lá
         const sourceBucket = bucketsList.find(b => b.is_default);
         
         if (sourceBucket) {
            const distRequest = {
                sourceBucketId: sourceBucket.id,
                workspaceId,
                amount: data.amount,
                targets: distributionConfig
            };
            await distributeBalanceRequest(distRequest);
         } else {
            console.error("Caixa padrão não encontrado para distribuição");
            toast.error("Transação criada, mas erro ao distribuir: Caixa padrão não encontrado.");
         }
      }

      toast.success("Transação registrada!");
      
      if (onSuccess) onSuccess();
      onOpenChange(false);

    } catch (error) {
      console.error(error);
      toast.error("Erro ao registrar transação.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) form.reset();
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-xl p-6 border-none shadow-2xl gap-0 max-h-[90vh] overflow-hidden flex flex-col">
        
        {/* --- STEP 1: FORMULÁRIO PADRÃO --- */}
        {step === 'form' && (
          <>
            <DialogHeader className="pb-4 mb-4 flex-none">
              <DialogTitle className="text-xl">Nova Transação</DialogTitle>
              <DialogDescription>
                Registre entradas ou saídas para manter seu controle em dia.
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>

                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel>Tipo</FormLabel>
                      <FormControl>
                        <ToggleGroup
                          type="single"
                          value={field.value}
                          onValueChange={(value) => {
                            if (value) {
                              field.onChange(value);
                              if (value === "EXPENSE") {
                                 // Limpa configs de income se trocar pra despesa
                                 form.setValue("isAllocated", false);
                                 setDistributionConfig([]);
                              } else {
                                 form.setValue("bucketId", undefined);
                              }
                            }
                          }}
                          className="grid grid-cols-2 gap-2"
                        >
                          <ToggleGroupItem value="INCOME" className="h-9 border border-input data-[state=on]:bg-finza-success/10 data-[state=on]:text-finza-success data-[state=on]:border-finza-success cursor-pointer">Receita</ToggleGroupItem>
                          <ToggleGroupItem value="EXPENSE" className="h-9 border border-input data-[state=on]:bg-destructive/10 data-[state=on]:text-destructive data-[state=on]:border-destructive cursor-pointer">Despesa</ToggleGroupItem>
                        </ToggleGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valor</FormLabel>
                        <FormControl>
                          <MoneyInput placeholder="0,00" currencySymbol={currencySymbol} value={field.value} onValueChange={field.onChange} disabled={isLoading} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button variant="outline" className={cn("w-full justify-start text-left font-normal pl-3 border-input shadow-xs transition-none", !field.value && "text-muted-foreground")}>
                                <CalendarIcon className="mr-2 h-4 w-4 opacity-50" />
                                {field.value ? format(field.value, "dd/MM/yyyy", { locale: ptBR }) : <span>Selecione</span>}
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0 border-none shadow-xl" align="start">
                            <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus locale={ptBR} disabled={(date) => date > new Date() || date < new Date("1900-01-01")} className="p-3" />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição</FormLabel>
                      <FormControl><Input placeholder={selectedType === "INCOME" ? "Ex: Salário..." : "Ex: Mercado..."} {...field} value={field.value || ""} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* AREA DE DESTINO / DISTRIBUIÇÃO */}
                {selectedType === "INCOME" ? (
                   <div className="pt-1">
                      <FormLabel className="text-sm font-medium flex items-center gap-2">
                        Destino do Valor
                      </FormLabel>

                      {distributionConfig.length > 0 ? (
                        // ESTADO: CONFIGURADO (DESIGN CLEAN COM TAGS)
                        <div className="group relative rounded-lg border border-border bg-background p-3 shadow-sm transition-all hover:border-primary/30 hover:shadow-md">
                        
                        {/* Cabeçalho do Card */}
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                                    <Sparkles className="h-4 w-4" />
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground">Distribuição Ativa</p>
                                    <p className="text-sm font-bold text-foreground">
                                        {distributionConfig.length} {distributionConfig.length === 1 ? 'caixa' : 'caixas'} selecionados
                                    </p>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-1">
                                <Button 
                                    type="button" 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-7 w-7 text-muted-foreground" 
                                    onClick={() => setStep('distribution')}
                                    title="Editar"
                                >
                                    <Settings2 className="h-4 w-4" />
                                </Button>
                                <Button 
                                    type="button" 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10" 
                                    onClick={(e) => { e.stopPropagation(); setDistributionConfig([]); }}
                                    title="Remover"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        {/* Lista de Tags (Chips) */}
                        <div className="flex flex-wrap gap-2">
                            {distributionConfig.slice(0, 4).map((item) => (
                                <div 
                                    key={item.bucketId} 
                                    className="inline-flex items-center rounded-md border bg-secondary/50 px-2 py-1 text-xs font-medium text-secondary-foreground"
                                >
                                    <span className="mr-1.5 opacity-70">{item.bucketName}</span>
                                    <span className="font-bold text-primary">
                                        {item.isPercentage ? `${item.value}%` : formatCurrency(item.value, currency)}
                                    </span>
                                </div>
                            ))}
                            {distributionConfig.length > 4 && (
                                <div className="inline-flex items-center rounded-md border border-dashed px-2 py-1 text-xs text-muted-foreground">
                                    +{distributionConfig.length - 4} outros
                                </div>
                            )}
                        </div>
                        
                        {/* Opcional: Feedback do valor restante se quiser ser muito detalhista */}
                        {/* <div className="mt-2 text-[10px] text-muted-foreground text-right">
                            Total: {formatCurrency(currentAmount, currency)}
                        </div> */}
                        </div>
                    ) : (
                         // ESTADO: NÃO CONFIGURADO (GRID DE OPÇÕES)
                         <div className="flex gap-3 items-center">
                             {/* OPÇÃO 1: SELECT SIMPLES */}

                              <FormField control={form.control} name="bucketId" render={({ field }) => (
                              <FormItem className="space-y-0">
                                  <Select onValueChange={field.onChange} value={field.value || "none"} disabled={isLoadingBuckets}>
                                  <FormControl>
                                      <SelectTrigger className="border-dashed border-2 hover:border-primary/50 hover:bg-accent/50 transition-colors">
                                          <SelectValue placeholder="Escolher Caixa" />
                                      </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                      <SelectItem value="none">Sem destino</SelectItem>
                                      {selectableBuckets.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                                  </SelectContent>
                                  </Select>
                              </FormItem>
                              )} />


                             <div className="text-xs text-muted-foreground font-medium text-center">OU</div>

                             {/* OPÇÃO 2: BOTÃO HERO DE DISTRIBUIÇÃO */}
                             <div className="col-span-3 sm:col-span-1">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className={cn(
                                        "w-full py-2 border border-primary/20 bg-primary/5 text-primary hover:bg-finza-highlight hover:border-primary/40 justify-start px-3",
                                    )}
                                    onClick={() => {
                                        if (currentAmount > 0) setStep('distribution');
                                        else toast.error("Defina um valor para distribuir");
                                    }}
                                >
                                    <div className="flex items-center gap-3 w-full">
                                        <div className="p-1 bg-primary/20 rounded-full"><Settings2 className="w-3.5 h-3.5" /></div>
                                        <div className="flex flex-col items-start text-left">
                                            <span className="text-xs font-bold leading-none">Distribuir</span>
                                            <span className="text-[10px] opacity-80 font-normal leading-none mt-0.5">Em vários caixas</span>
                                        </div>
                                    </div>
                                </Button>
                             </div>
                         </div>
                      )}
                   </div>
                ) : (
                   /* DESPESA (Mantido igual, mas filtrando buckets default) */
                   <FormField control={form.control} name="bucketId" render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center gap-2"><FormLabel>Categoria / Caixa</FormLabel></div>
                        <Select onValueChange={field.onChange} value={field.value || "none"} disabled={isLoadingBuckets}>
                          <FormControl><SelectTrigger className="h-10"><SelectValue placeholder="Selecione a categoria" /></SelectTrigger></FormControl>
                          <SelectContent>
                            <SelectItem value="none">Sem categoria</SelectItem>
                            {selectableBuckets.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                   )} />
                )}

                <DialogFooter className="pt-4 mt-auto">
                  <Button type="button" variant="ghost" onClick={() => handleOpenChange(false)} disabled={isLoading}>Cancelar</Button>
                  <Button type="submit" disabled={isLoading} className="min-w-32 h-10 text-base">
                    {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...</> : (selectedType === "INCOME" ? "Receber" : "Pagar")}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </>
        )}

        {/* --- STEP 2: DISTRIBUTION --- */}
        {step === 'distribution' && (
          <TransactionDistributionStep 
              totalAmount={currentAmount}
              workspaceId={workspaceId}
              buckets={bucketsList}
              currency={currency}
              initialConfig={distributionConfig}
              onBack={() => setStep('form')}
              onConfirm={(config) => {
                setDistributionConfig(config);
                setStep('form');
                toast.success("Distribuição configurada!");
              }}
          />
        )}

      </DialogContent>
    </Dialog>
  );
}