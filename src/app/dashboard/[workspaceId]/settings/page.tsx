"use client";

import { useRouter } from "next/navigation";
import { Settings } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import { EditWorkspaceDialog } from "@/components/features/settings/edit-workspace-dialog";
import { WorkspaceDeleteZone } from "@/components/features/settings/danger-zone-workspace";

import { useWorkspace } from "@/contexts/workspace-context";
import { Button } from "@/components/ui/button";

export default function WorkspaceSettingsPage() {
  const router = useRouter();
  
  const { workspace, isLoading } = useWorkspace();

  if (isLoading) {
    return <SettingsSkeleton />;
  }

  if (!workspace) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
        <p className="text-muted-foreground">Workspace não encontrado.</p>
        <Button variant="outline" onClick={() => router.push("/dashboard")}>
          Voltar ao início
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-up">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Configurações</h1>
        <p className="mt-1 text-muted-foreground">
          Gerencie as configurações do workspace <strong>{workspace.name}</strong>
        </p>
      </div>

      <EditWorkspaceDialog workspace={workspace} />

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <Settings className="h-5 w-5 text-primary" />
            Preferências
          </CardTitle>
          <CardDescription>
            Personalize sua experiência
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground bg-secondary/20 p-4 rounded-lg border border-border/50">
            Mais opções de personalização (temas, notificações, integrações) estarão disponíveis em breve.
          </p>
        </CardContent>
      </Card>

      <WorkspaceDeleteZone 
        workspaceId={workspace.id} 
        workspaceName={workspace.name} 
      />
    </div>
  );
}

function SettingsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-96" />
      </div>
      <Skeleton className="h-64 w-full rounded-xl" />
      <Skeleton className="h-48 w-full rounded-xl" />
    </div>
  );
}