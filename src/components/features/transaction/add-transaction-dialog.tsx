"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Loader2 } from "lucide-react";
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
import { getBucketsRequest } from "@/http/buckets"; 
import { Bucket } from "@/types";

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

  const currencySymbol = getCurrencySymbol(currency);

  const form = useForm<TransactionData>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: {
      type: "EXPENSE",
      amount: 0,
      description: "",
      date: new Date(),
      workspaceId: workspaceId,
    },
  });

  useEffect(() => {
    async function fetchBuckets() {
      if (open && workspaceId) {
        try {
          setIsLoadingBuckets(true);
          const data = await getBucketsRequest(workspaceId);
          setBucketsList(data);
        } catch (error) {
          console.error("Erro ao buscar buckets", error);
        } finally {
          setIsLoadingBuckets(false);
        }
      }
    }

    fetchBuckets();
  }, [open, workspaceId]);

  useEffect(() => {
    if (open) {
      form.reset({
        type: "EXPENSE",
        amount: 0,
        description: "",
        date: new Date(),
        workspaceId: workspaceId,
        bucketId: undefined,
      });
    }
  }, [open, form, workspaceId]);

  const onSubmit = async (data: TransactionData) => {
    try {
      setIsLoading(true);

      const payload = {
        ...data,
        workspaceId, 
        bucketId: data.bucketId === "none" ? undefined : data.bucketId,
      };

      await createTransactionRequest(payload);
      
      toast.success("Transação adicionada!");
      
      if (onSuccess) {
        onSuccess();
      }

      onOpenChange(false);

    } catch (error) {
      console.error(error);
      toast.error("Erro ao registrar transação.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      form.reset();
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-106.25 border-none shadow-xl [&>button]:cursor-pointer">
        <DialogHeader>
          <DialogTitle>Nova Transação</DialogTitle>
          <DialogDescription>
            Adicione uma nova receita ou despesa ao seu workspace.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 py-4" noValidate>

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo</FormLabel>
                  <FormControl>
                    <ToggleGroup
                      type="single"
                      value={field.value}
                      onValueChange={(value) => {
                        if (value) field.onChange(value);
                      }}
                      className="grid grid-cols-2 gap-2"
                    >
                      <ToggleGroupItem
                        value="INCOME"
                        className={cn(
                          "h-10 border data-[state=on]:bg-finza-success/10 data-[state=on]:text-finza-success data-[state=on]:border-finza-success transition-all cursor-pointer hover:bg-muted"
                        )}
                      >
                        Receita
                      </ToggleGroupItem>
                      <ToggleGroupItem
                        value="EXPENSE"
                        className={cn(
                          "h-10 border data-[state=on]:bg-destructive/10 data-[state=on]:text-destructive data-[state=on]:border-destructive transition-all cursor-pointer hover:bg-muted"
                        )}
                      >
                        Despesa
                      </ToggleGroupItem>
                    </ToggleGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor</FormLabel>
                  <FormControl>
                    <MoneyInput
                      placeholder="0,00"
                      currencySymbol={currencySymbol}
                      value={field.value} 
                      onValueChange={field.onChange}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: Almoço, Salário, Netflix..."
                      {...field}
                      value={field.value || ""}
                    />
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
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal cursor-pointer",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {field.value ? (
                            format(field.value, "PPP", { locale: ptBR })
                          ) : (
                            <span>Selecione uma data</span>
                          )}
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 border-none shadow-xl" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                        locale={ptBR}
                        disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="bucketId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria / Bucket</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value || "none"}
                    disabled={isLoadingBuckets} 
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={isLoadingBuckets ? "Carregando..." : "Selecione um bucket (opcional)"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="border-none shadow-xl">
                      <SelectItem value="none" className="cursor-pointer text-muted-foreground">
                        Sem categoria
                      </SelectItem>
                      {/* Usamos a bucketsList do estado interno */}
                      {bucketsList.map((bucket) => (
                        <SelectItem key={bucket.id} value={bucket.id} className="cursor-pointer">
                          {bucket.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

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
              <Button type="submit" disabled={isLoading} className="cursor-pointer min-w-35">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  "Adicionar Transação"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}