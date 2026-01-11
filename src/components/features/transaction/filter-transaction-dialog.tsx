"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Filter } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

import { cn } from "@/lib/utils";
import { filterTransactionSchema, FilterTransactionData, TransactionType } from "@/schemas/transaction";
import { Bucket } from "@/types";

interface FilterTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  buckets: Bucket[];
  currency: string;
  defaultValues?: Partial<FilterTransactionData>;
  onApplyFilters: (filters: FilterTransactionData) => void;
  onClearFilters: () => void;
}

export function FilterTransactionDialog({
  open,
  onOpenChange,
  buckets,
  currency,
  defaultValues,
  onApplyFilters,
  onClearFilters,
}: FilterTransactionDialogProps) {
  const form = useForm<FilterTransactionData>({
    resolver: zodResolver(filterTransactionSchema),
    defaultValues: {
      bucketId: undefined,
      startDate: undefined,
      endDate: undefined,
      minAmount: undefined,
      maxAmount: undefined,
      type: undefined,
      ...defaultValues,
    },
  });

  const {
    handleSubmit,
    reset,
    watch,
    setValue,
  } = form;

  // eslint-disable-next-line react-hooks/incompatible-library
  const currentValues = watch();
  const hasActiveFilters = Object.values(currentValues).some(
    (value) => value !== undefined && value !== "" && value !== null && value !== "all"
  );

  const handleApply = handleSubmit((data) => {
    // Convert "all" to undefined
    const cleanedData = {
      bucketId: data.bucketId === "all" || data.bucketId === "" ? undefined : data.bucketId,
      startDate: data.startDate,
      endDate: data.endDate,
      minAmount: data.minAmount,
      maxAmount: data.maxAmount,
      type: data.type,
    };
    onApplyFilters(cleanedData);
    onOpenChange(false);
  });

  const handleClear = () => {
    reset({
      bucketId: "all",
      startDate: undefined,
      endDate: undefined,
      minAmount: undefined,
      maxAmount: undefined,
      type: undefined,
    });
    onClearFilters();
    onOpenChange(false);
  };

  // Reset form when open changes
  useEffect(() => {
    if (open) {
      reset({
        bucketId: defaultValues?.bucketId || "all",
        startDate: defaultValues?.startDate,
        endDate: defaultValues?.endDate,
        minAmount: defaultValues?.minAmount,
        maxAmount: defaultValues?.maxAmount,
        type: defaultValues?.type,
      });
    }
  }, [open, defaultValues, reset]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="h-9 border border-input bg-background rounded-md px-3 text-sm font-medium gap-2 cursor-pointer"
        >
          <Filter className="h-4 w-4 h" />
          Filtros
          {hasActiveFilters && (
            <span className="h-2 w-2 bg-primary rounded-full"></span>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-120 p-6 border-none shadow-2xl gap-0 flex flex-col">
        <DialogHeader className="pb-4 mb-4">
          <DialogTitle className="text-xl">Filtrar Transações</DialogTitle>
          <DialogDescription>
            Aplique filtros para encontrar transações específicas
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleApply} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bucket">Bucket</Label>
            <Select
              value={currentValues.bucketId || "all"}
              onValueChange={(value) => setValue("bucketId", value === "all" ? undefined : value)}
            >
              <SelectTrigger id="bucket" className="cursor-pointer">
                <SelectValue placeholder="Selecionar bucket" />
              </SelectTrigger>
              <SelectContent className="border border-border shadow-lg">
                <SelectItem value="all" className="cursor-pointer">
                  Todos os buckets
                </SelectItem>
                {buckets.map((bucket) => (
                  <SelectItem key={bucket.id} value={bucket.id} className="cursor-pointer">
                    {bucket.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="date-range">Período</Label>
            <div className="grid grid-cols-2 gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal h-9 cursor-pointer",
                      !currentValues.startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 opacity-50" />
                    {currentValues.startDate
                      ? format(currentValues.startDate, "dd/MM/yyyy", { locale: ptBR })
                      : "Data inicial"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 border border-border shadow-lg" align="start">
                  <Calendar
                    mode="single"
                    selected={currentValues.startDate}
                    onSelect={(date) => setValue("startDate", date)}
                    initialFocus
                    locale={ptBR}
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal h-9 cursor-pointer",
                      !currentValues.endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 opacity-50" />
                    {currentValues.endDate
                      ? format(currentValues.endDate, "dd/MM/yyyy", { locale: ptBR })
                      : "Data final"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 border border-border shadow-lg" align="start">
                  <Calendar
                    mode="single"
                    selected={currentValues.endDate}
                    onSelect={(date) => setValue("endDate", date)}
                    initialFocus
                    locale={ptBR}
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount-range">Valor ({currency})</Label>
            <div className="grid grid-cols-2 gap-2">
              <Input
                id="min-amount"
                type="number"
                placeholder="Mínimo"
                value={currentValues.minAmount || ""}
                onChange={(e) => setValue("minAmount", e.target.value ? parseFloat(e.target.value) : undefined)}
                step="0.01"
                className="h-9 cursor-text"
              />
              <Input
                id="max-amount"
                type="number"
                placeholder="Máximo"
                value={currentValues.maxAmount || ""}
                onChange={(e) => setValue("maxAmount", e.target.value ? parseFloat(e.target.value) : undefined)}
                step="0.01"
                className="h-9 cursor-text"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Tipo</Label>
            <Select
              value={currentValues.type || "all"}
              onValueChange={(value) => setValue("type", value === "all" ? undefined : value as TransactionType)}
            >
              <SelectTrigger id="type" className="cursor-pointer">
                <SelectValue placeholder="Todos os tipos" />
              </SelectTrigger>
              <SelectContent className="border border-border shadow-lg">
                <SelectItem value="all" className="cursor-pointer">
                  Todos os tipos
                </SelectItem>
                <SelectItem value="INCOME" className="cursor-pointer">
                  Receitas
                </SelectItem>
                <SelectItem value="EXPENSE" className="cursor-pointer">
                  Despesas
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 pt-2">
            {hasActiveFilters && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="flex-1 h-9"
              >
                Limpar filtros
              </Button>
            )}
            <Button type="submit" className="flex-1 h-9">
              Aplicar filtros
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
