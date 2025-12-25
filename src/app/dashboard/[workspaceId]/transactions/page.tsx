"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useParams } from "next/navigation";
import { Plus, Search } from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { TransactionRow } from "@/components/transaction-row";
import { TransactionRowSkeleton } from "@/components/skeletons/transaction-row";
import { AddTransactionDialog } from "@/components/features/transaction/add-transaction-dialog";

import { getTransactionsRequest } from "@/http/transactions";
import { getWorkspaceByIdRequest } from "@/http/workspaces";
import { Transaction, Workspace } from "@/types";

type FilterType = "ALL" | "INCOME" | "EXPENSE";

export default function TransactionsPage() {
  const params = useParams();
  const workspaceId = params.workspaceId as string;

  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [filter, setFilter] = useState<FilterType>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const fetchData = useCallback(async (signal?: AbortSignal) => {
    try {
      setIsLoading(true);
      
      const [wsData, txData] = await Promise.all([
        getWorkspaceByIdRequest(workspaceId, signal),
        getTransactionsRequest(workspaceId, signal)
      ]);
      
      setWorkspace(wsData);
      setTransactions(txData);
    } catch (error) { 
      if (error instanceof Error && error.name === 'AbortError') return;
      
      console.error(error);
      toast.error("Erro ao carregar dados.");
    } finally {
      if (!signal?.aborted) {
        setIsLoading(false);
      }
    }
  }, [workspaceId]);

  useEffect(() => {
    const controller = new AbortController();
    
    fetchData(controller.signal);

    return () => {
      controller.abort();
    };
  }, [fetchData]);

  const filteredTransactions = useMemo(() => {
    const searchLower = searchQuery.toLowerCase();
    return transactions.filter((t) => {
      const matchesFilter = filter === "ALL" || t.type === filter;
      const matchesSearch =
        !searchQuery ||
        (t.description && t.description.toLowerCase().includes(searchLower));
      return matchesFilter && matchesSearch;
    });
  }, [transactions, filter, searchQuery]);

  const handleOpenDialog = useCallback(() => setIsDialogOpen(true), []);
  
  const handleCloseDialog = useCallback((open: boolean) => {
    setIsDialogOpen(open);
  }, []);

  const handleTransactionCreated = useCallback(() => {
    fetchData();
  }, [fetchData]);

  const handleFilterChange = useCallback((v: string) => setFilter(v as FilterType), []);
  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value),
    []
  );

  const listTitle = useMemo(() => {
    if (filter === "ALL") return "Todas as Transações";
    return filter === "INCOME" ? "Receitas" : "Despesas";
  }, [filter]);

  if (isLoading) {
     return (
       <div className="space-y-6 animate-pulse">
         <div className="flex justify-between">
            <div className="space-y-2">
                <div className="h-8 w-48 bg-muted rounded" />
                <div className="h-4 w-64 bg-muted rounded" />
            </div>
            <div className="h-10 w-32 bg-muted rounded" />
         </div>
         <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => <TransactionRowSkeleton key={i} />)}
         </div>
       </div>
     )
  }

  if (!workspace) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center gap-4">
        <h2 className="text-xl font-semibold">Workspace não encontrado</h2>
        <Button variant="outline" onClick={() => window.location.reload()}>
            Tentar novamente
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Transações</h1>
          <p className="mt-1 text-muted-foreground">
            Gerencie suas receitas e despesas do workspace <strong>{workspace.name}</strong>
          </p>
        </div>
        <Button className="gap-2 cursor-pointer" onClick={handleOpenDialog}>
          <Plus className="h-4 w-4" />
          Nova Transação
        </Button>
      </div>

      <Card className="border-border/60">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar transações..."
                className="pl-10"
                value={searchQuery}
                onChange={handleSearchChange}
              />
            </div>

            <Tabs value={filter} onValueChange={handleFilterChange}>
              <TabsList className="grid w-full grid-cols-3 sm:w-auto">
                <TabsTrigger value="ALL" className="cursor-pointer">Todas</TabsTrigger>
                <TabsTrigger value="INCOME" className="data-[state=active]:text-finza-success cursor-pointer">Receitas</TabsTrigger>
                <TabsTrigger value="EXPENSE" className="data-[state=active]:text-destructive cursor-pointer">Despesas</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">
            {listTitle}
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              ({filteredTransactions.length})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {filteredTransactions.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-muted-foreground">
                {searchQuery
                  ? "Nenhuma transação encontrada para sua busca"
                  : "Nenhuma transação registrada neste período"}
              </p>
              <Button
                variant="outline"
                className="mt-4 gap-2 cursor-pointer"
                onClick={handleOpenDialog}
              >
                <Plus className="h-4 w-4" />
                Adicionar primeira transação
              </Button>
            </div>
          ) : (
            filteredTransactions.map((transaction) => (
              <TransactionRow
                key={transaction.id}
                transaction={transaction}
                currency={workspace.currency}
              />
            ))
          )}
        </CardContent>
      </Card>

      <AddTransactionDialog
        open={isDialogOpen}
        onOpenChange={handleCloseDialog}
        workspaceId={workspace.id}
        currency={workspace.currency}
        onSuccess={handleTransactionCreated}
      />
    </div>
  );
}