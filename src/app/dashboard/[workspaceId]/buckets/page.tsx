"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Plus, Target, PiggyBank } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

// Features Components
import { AddBucketDialog } from "@/components/features/buckets/add-bucket-dialog";
import { EditBucketDialog } from "@/components/features/buckets/edit-bucket-dialog";
import { DeleteBucketDialog } from "@/components/features/buckets/delete-bucket-dialog";
import { TransferBalanceDialog } from "@/components/features/buckets/transfer-balance-dialog";
import { DistributeBalanceDialog } from "@/components/features/buckets/distribute-balance-dialog";

// Shared Components
import { BucketCard } from "@/components/bucket-card";
import { BucketCardSkeleton } from "@/components/skeletons/bucket-card";

import { getBucketsRequest } from "@/http/buckets";
import { getWorkspaceByIdRequest } from "@/http/workspaces";
import { Bucket, Workspace } from "@/types";
import { cn } from "@/lib/utils";

export default function BucketsPage() {
  const params = useParams();
  const router = useRouter();
  const workspaceId = params.workspaceId as string;

  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [buckets, setBuckets] = useState<Bucket[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  
  const [selectedBucket, setSelectedBucket] = useState<Bucket | null>(null);
  const [bucketToDelete, setBucketToDelete] = useState<Bucket | null>(null);
  const [bucketToTransfer, setBucketToTransfer] = useState<Bucket | null>(null);
  const [bucketToDistribute, setBucketToDistribute] = useState<Bucket | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [wsData, bucketsData] = await Promise.all([
        getWorkspaceByIdRequest(workspaceId),
        getBucketsRequest(workspaceId)
      ]);
      
      setWorkspace(wsData);
      setBuckets(bucketsData);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao carregar dados do workspace.");
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId]);

  const refreshBuckets = useCallback(async () => {
    try {
      const data = await getBucketsRequest(workspaceId);
      setBuckets(data);
    } catch (error) {
      console.error("Erro ao atualizar lista de buckets", error);
    }
  }, [workspaceId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const totalAllocated = useMemo(
    () => buckets.reduce((sum, b) => sum + Number(b.allocation_percentage), 0),
    [buckets]
  );

  const allocationMessage = useMemo(
    () =>
      totalAllocated < 100
        ? `${100 - totalAllocated}% ainda disponível para alocar`
        : "100% do seu orçamento está alocado",
    [totalAllocated]
  );

  const handleEditClick = (bucket: Bucket) => {
    setSelectedBucket(bucket);
    setIsEditOpen(true);
  };

  const handleDeleteClick = (bucket: Bucket) => {
    setBucketToDelete(bucket);
  };

  const handleTransferClick = (bucket: Bucket) => {
    setBucketToTransfer(bucket);
  };

  const handleDistributeClick = (bucket: Bucket) => {
    setBucketToDistribute(bucket);
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="flex justify-between items-center">
            <div className="space-y-2">
                <div className="h-8 w-48 bg-muted rounded" />
                <div className="h-4 w-64 bg-muted rounded" />
            </div>
            <div className="h-10 w-32 bg-muted rounded" />
        </div>
        <div className="h-32 bg-muted rounded-xl" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <BucketCardSkeleton key={index} index={index} />
          ))}
        </div>
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-muted-foreground space-y-4">
        <p className="text-lg">Workspace não encontrado.</p>
        <Button variant="outline" onClick={() => router.push("/dashboard")}>
          Voltar ao início
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Caixas de Propósito
          </h1>
          <p className="mt-1 text-muted-foreground">
            Organize seu dinheiro por objetivos no workspace <strong>{workspace.name}</strong>
          </p>
        </div>
        <Button className="gap-2 cursor-pointer" onClick={() => setIsCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          Novo Caixa
        </Button>
      </div>

      {/* Allocation Overview */}
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <Target className="h-5 w-5 text-primary" />
            Alocação Total
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Alocado</span>
              <span className="font-medium text-foreground">
                {totalAllocated}%
              </span>
            </div>
            {/* Progress Bar com cor dinâmica se passar de 100% */}
            <Progress 
              value={totalAllocated} 
              className={cn("h-3", totalAllocated > 100 && "bg-destructive/20 [&>div]:bg-destructive")} 
            />
            <p className={cn("text-sm", totalAllocated > 100 ? "text-destructive font-medium" : "text-muted-foreground")}>
              {totalAllocated > 100 ? "Atenção: Você alocou mais que 100%!" : allocationMessage}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Buckets Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {buckets.length === 0 ? (
          <Card className="col-span-full border-border/60 p-12 text-center border-dashed">
            <PiggyBank className="mx-auto h-12 w-12 text-muted-foreground/30" />
            <h3 className="mt-4 font-semibold text-foreground">
              Nenhum caixa criado
            </h3>
            <p className="mt-2 text-muted-foreground">
              Crie seu primeiro caixa para começar a organizar seu dinheiro
            </p>
            <Button className="mt-4 gap-2 cursor-pointer" onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-4 w-4" />
              Criar Caixa
            </Button>
          </Card>
        ) : (
          buckets
            .filter(bucket => {
              // Esconder Inbox zerado (Inbox Zero)
              if (bucket.type === 'INBOX' && Math.abs(bucket.current_balance) < 0.01) {
                return false;
              }
              return true;
            })
            .map((bucket, index) => (
            <BucketCard
              key={bucket.id}
              bucket={bucket}
              currency={workspace.currency}
              index={index}
              onEdit={handleEditClick}
              onDelete={handleDeleteClick} 
              onTransfer={handleTransferClick}
              onDistribute={handleDistributeClick}
            />
          ))
        )}
      </div>

      {/* Dialogs */}
      <AddBucketDialog 
        open={isCreateOpen} 
        onOpenChange={setIsCreateOpen} 
        workspaceId={workspace.id} 
        onSuccess={refreshBuckets} 
      />

      {selectedBucket && (
        <EditBucketDialog 
          open={isEditOpen} 
          onOpenChange={setIsEditOpen} 
          bucket={selectedBucket}
          onSuccess={refreshBuckets} 
        />
      )}

      {bucketToTransfer && (
        <TransferBalanceDialog
          open={!!bucketToTransfer}
          onOpenChange={(open: boolean) => !open && setBucketToTransfer(null)}
          sourceBucket={bucketToTransfer}
          workspaceId={workspace.id}
          buckets={buckets}
          currency={workspace.currency}
          onSuccess={refreshBuckets}
        />
      )}

      {bucketToDistribute && (
        <DistributeBalanceDialog
          open={!!bucketToDistribute}
          onOpenChange={(open: boolean) => !open && setBucketToDistribute(null)}
          sourceBucket={bucketToDistribute}
          workspaceId={workspace.id}
          buckets={buckets}
          currency={workspace.currency}
          onSuccess={refreshBuckets}
        />
      )}

      <DeleteBucketDialog
        open={!!bucketToDelete}
        onOpenChange={(open: boolean) => !open && setBucketToDelete(null)}
        bucket={bucketToDelete}
        currency={workspace.currency}
        onSuccess={refreshBuckets}
      />
    </div>
  );
}
