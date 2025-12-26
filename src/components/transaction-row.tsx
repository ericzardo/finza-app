"use client";

import { useMemo } from "react";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { SensitiveValue } from "@/components/ui/sensitive-value";
import { Transaction } from "@/types";

interface TransactionRowProps {
  transaction: Transaction;
  currency: string;
}

export function TransactionRow({ transaction, currency }: TransactionRowProps) {
  const isIncome = transaction.type === "INCOME";

  const formattedAmount = useMemo(
    () => formatCurrency(transaction.amount, currency),
    [transaction.amount, currency]
  );

  const formattedDate = useMemo(
    () => formatDate(transaction.date),
    [transaction.date]
  );

  return (
    <div className="flex items-center justify-between rounded-lg border border-border/60 p-4 transition-colors hover:bg-secondary/30 group">
      <div className="flex items-center gap-4">
        <div
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-xl transition-colors",
            isIncome 
              ? "bg-finza-success/10 group-hover:bg-finza-success/20" 
              : "bg-destructive/10 group-hover:bg-destructive/20"
          )}
        >
          {isIncome ? (
            <ArrowDownLeft className="h-6 w-6 text-finza-success" />
          ) : (
            <ArrowUpRight className="h-6 w-6 text-destructive" />
          )}
        </div>
        <div>
          <p className="font-medium text-foreground">
            {transaction.description || "Sem descrição"}
          </p>
          <p className="text-sm text-muted-foreground">{formattedDate}</p>
        </div>
      </div>

      <div className="text-right">
        <p
          className={cn(
            "text-lg font-semibold",
            isIncome ? "text-finza-success" : "text-destructive"
          )}
        >
          <SensitiveValue>
            {isIncome ? "+" : "-"} {formattedAmount}
          </SensitiveValue>
        </p>
        
        {/* Lógica do Bucket / Categoria */}
        <div className="flex items-center justify-end gap-1.5 text-sm text-muted-foreground mt-0.5">
          {transaction.bucket ? (
            <>
              <span className="flex items-center gap-1">
                {transaction.bucket.name}
              </span>
              <span className="text-muted-foreground/30">•</span>
            </>
          ) : null}
          
          <span>{isIncome ? "Receita" : "Despesa"}</span>
        </div>
      </div>
    </div>
  );
}