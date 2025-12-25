"use client";

import { useState, useCallback, useEffect, use } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PieChart, Plus } from "lucide-react";
import { toast } from "sonner";

import { MonthYearFilter } from "@/components/features/dashboard/month-year-filter";
import { AllocationChart } from "@/components/features/dashboard/allocation-chart";
import { SafeToSpendCard } from "@/components/features/dashboard/safe-to-spend-card";
import { AddTransactionDialog } from "@/components/features/transaction/add-transaction-dialog";

import { getWorkspaceByIdRequest } from "@/http/workspaces";
import { Bucket, Workspace } from "@/types";

interface PageProps {
  params: Promise<{
    workspaceId: string;
  }>;
}

export default function DashboardPage({ params }: PageProps) {
  const { workspaceId } = use(params);

  const [isLoading, setIsLoading] = useState(true);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [buckets, setBuckets] = useState<Bucket[]>([]);

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const wsData = await getWorkspaceByIdRequest(workspaceId);
        setWorkspace(wsData);
        
      } catch (error) {
        console.error(error);
        toast.error("Erro ao carregar dashboard");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [workspaceId]);

  const handlePreviousMonth = useCallback(() => {
    setMonth((prev) => (prev === 0 ? 11 : prev - 1));
    if (month === 0) setYear((y) => y - 1);
  }, [month]);

  const handleNextMonth = useCallback(() => {
    setMonth((prev) => (prev === 11 ? 0 : prev + 1));
    if (month === 11) setYear((y) => y + 1);
  }, [month]);

  const handleOpenDialog = useCallback(() => setIsDialogOpen(true), []);
  const handleCloseDialog = useCallback((open: boolean) => setIsDialogOpen(open), []);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (!workspace) {
    return (
       <div className="flex h-[80vh] flex-col items-center justify-center gap-4 text-center">
        <h1 className="text-2xl font-bold">Workspace não encontrado</h1>
        <Button onClick={() => window.location.href = '/dashboard'}>Voltar</Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-up">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Visão Geral</h1>
          <p className="mt-1 text-muted-foreground">
            Acompanhe a alocação do seu dinheiro
          </p>
        </div>
        <div className="flex items-center gap-3">
          <MonthYearFilter
            month={month}
            year={year}
            onPrevious={handlePreviousMonth}
            onNext={handleNextMonth}
          />
          <Button onClick={handleOpenDialog} className="gap-2 cursor-pointer">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Transação</span>
          </Button>
        </div>
      </div>

      <SafeToSpendCard buckets={buckets} currency={workspace.currency} />

      {/* Allocation Chart */}
      <Card className="border-border/60">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="text-lg font-semibold">
            Distribuição por Caixas
          </CardTitle>
          <PieChart className="h-5 w-5 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {buckets.length > 0 ? (
            <AllocationChart buckets={buckets} currency={workspace.currency} />
          ) : (
            <div className="flex h-64 items-center justify-center text-muted-foreground text-sm">
              Nenhum dado para exibir neste período.
            </div>
          )}
        </CardContent>
      </Card>

      <AddTransactionDialog
        open={isDialogOpen}
        onOpenChange={handleCloseDialog}
        workspaceId={workspace.id}
        currency={workspace.currency}
      />
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <div className="flex justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
      </div>
      <Skeleton className="h-96 rounded-xl" />
    </div>
  )
}