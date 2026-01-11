"use client";

import { MoreHorizontal, Pencil, Trash2, AlertCircle, TrendingUp, Wallet, Inbox, ArrowRightLeft } from "lucide-react";
import { Bucket } from "@/types";
import { formatCurrency, cn } from "@/lib/utils";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress"; 
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SensitiveValue } from "@/components/ui/sensitive-value";

interface BucketCardProps {
  bucket: Bucket;
  currency: string;
  index: number;
  onEdit: (bucket: Bucket) => void;
  onDelete: (bucket: Bucket) => void;
  onTransfer?: (bucket: Bucket) => void;
}

const COLORS = [
  "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
  "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
  "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
  "bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400",
  "bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400",
  "bg-slate-100 text-slate-600 dark:bg-slate-900/30 dark:text-slate-400",
  "bg-sky-100 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400",
  "bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400",
];

export function BucketCard({ bucket, currency, index, onEdit, onDelete, onTransfer }: BucketCardProps) {
  
  const colorClass = COLORS[index % COLORS.length];

  const allocated = Number(bucket.total_allocated || 0);
  const spent = Number(bucket.total_spent || 0);
  const currentBalance = Number(bucket.current_balance || 0);
  
  const isInvestment = bucket.type === "INVESTMENT";
  const isInbox = bucket.type === "INBOX";
  
  let progressValue = 0;
  let isNegative = false;
  let statusMessage = "";
  let progressColorClass = "[&>*]:bg-primary";
  let iconContainerClass = colorClass;
  
  let statusIcon = isInvestment ? <TrendingUp className="h-6 w-6" /> : <Wallet className="h-6 w-6" />;
  
  let displayLabelLeft = "Disponível";
  let displayValueLeft = currentBalance;
  let displayLabelRight = "Gasto / Limite";

  if (isInbox) {
    // Inbox: área de transição, não é um bucket de planejamento
    // Não mostra barra de progresso e foca apenas no saldo pendente
    statusIcon = <Inbox className="h-6 w-6" />;
    displayLabelLeft = currentBalance > 0 ? "Saldo Pendente" : "Não Alocado";
    displayValueLeft = currentBalance;
    displayLabelRight = ""; // Não mostrar "Gasto / Limite"
    statusMessage = currentBalance > 0 
      ? "Dinheiro aguardando distribuição" 
      : "Nenhum valor pendente";
    // Para Inbox, não usamos a barra de progresso
    progressValue = 0;
    
    // Cor especial para Inbox (âmbar/amarelo se tiver saldo positivo)
    if (currentBalance > 0) {
      progressColorClass = "[&>*]:bg-amber-500";
      iconContainerClass = "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400";
    }
    
  } else if (isInvestment) {
    progressValue = allocated > 0 ? (spent / allocated) * 100 : 0;
    
    if (progressValue >= 100) {
      progressColorClass = "[&>*]:bg-finza-success"; 
      statusMessage = "Meta de aporte batida! 🚀";
    } else if (progressValue > 0) {
      progressColorClass = "[&>*]:bg-primary"; 
      statusMessage = "Em progresso...";
    } else {
      progressColorClass = "[&>*]:bg-amber-500"; 
      statusMessage = "Nenhum aporte feito ainda";
    }

    displayLabelLeft = "Falta Aportar";
    displayValueLeft = currentBalance < 0 ? 0 : currentBalance; 
    displayLabelRight = "Aportado / Meta";

  } else {
    // Caso padrão: SPENDING
    progressValue = allocated > 0 ? (spent / allocated) * 100 : 0;
    isNegative = currentBalance < 0; 

    if (isNegative) {
      progressColorClass = "[&>*]:bg-destructive"; 
      statusIcon = <AlertCircle className="h-6 w-6" />; 
      statusMessage = "Orçamento estourado!";
      iconContainerClass = "bg-destructive/10 text-destructive";
    } else if (progressValue > 85) {
      progressColorClass = "[&>*]:bg-amber-500"; 
      statusMessage = "Cuidado, perto do limite";
    } else {
      progressColorClass = "[&>*]:bg-finza-success"; 
      statusMessage = "Dentro do orçamento";
    }
  }

  const containerClass = (isNegative && !isInvestment) 
    ? "border-destructive/50 bg-destructive/5" 
    : "";

  return (
    <Card
     className={cn(
        "border-border/60 finza-card-hover animate-fade-up group relative overflow-hidden transition-all hover:shadow-md",
        bucket.is_default && "ring-2 ring-primary/20",
        containerClass
      )}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          
          <div className={cn(
            "flex h-12 w-12 items-center justify-center rounded-2xl transition-colors",
            iconContainerClass
          )}>
            {statusIcon}
          </div>

          <div className="flex items-center gap-2">
            {isInvestment && (
              <Badge variant="secondary" className="text-xs font-normal">
                Investimento
              </Badge>
            )}

            {!isInbox && (
              <Badge variant="outline" className="text-xs font-normal text-muted-foreground border-border/50">
                {Number(bucket.allocation_percentage)}%
              </Badge>
            )}

            

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 cursor-pointer text-muted-foreground hover:text-foreground"
                >
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Abrir menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuLabel>Ações</DropdownMenuLabel>
                
                <DropdownMenuItem onClick={() => onEdit(bucket)} className="cursor-pointer">
                  <Pencil className="mr-2 h-4 w-4" />
                  Editar
                </DropdownMenuItem>

                {onTransfer && (
                  <DropdownMenuItem onClick={() => onTransfer(bucket)} className="cursor-pointer">
                    <ArrowRightLeft className="mr-2 h-4 w-4" />
                    Mover Saldo
                  </DropdownMenuItem>
                )}

                {!bucket.is_default && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => onDelete(bucket)} 
                      className="text-destructive focus:text-destructive cursor-pointer"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Excluir
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-4">
        <div>
          <h3 className="font-semibold text-lg leading-none tracking-tight truncate pr-2">
            {bucket.name}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {statusMessage}
          </p>
        </div>

        <div className="space-y-2">
          {!isInbox && (
            <Progress 
              value={progressValue} 
              className={cn("h-2 w-full", progressColorClass)} 
            />
          )}
          
          <div className={cn("flex", isInbox ? "flex-col items-start" : "flex-col sm:flex-row justify-between items-start sm:items-end gap-2")}>
            <div className="flex flex-col">
               <span className="text-[10px] uppercase text-muted-foreground font-semibold">
                 {displayLabelLeft}
               </span>
               <span className={cn(
                 "text-2xl font-bold",
                 (isNegative && !isInvestment) ? "text-destructive" : "text-foreground",
                 isInbox && currentBalance > 0 && "text-amber-600 dark:text-amber-400"
               )}>
                <SensitiveValue>{formatCurrency(displayValueLeft, currency)}</SensitiveValue>
              </span>
            </div>

            {displayLabelRight && (
              <div className="text-left sm:text-right">
                 <span className="text-[10px] uppercase text-muted-foreground font-semibold">
                   {displayLabelRight}
                 </span>
                 <div className="text-xs font-medium text-muted-foreground">
                   <SensitiveValue>
                     {formatCurrency(spent, currency)} / {formatCurrency(allocated, currency)}
                   </SensitiveValue>
                 </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
