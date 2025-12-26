"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, LogOut, User, ChevronDown } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Logo } from "@/components/ui/logo";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { WorkspaceCard } from "@/components/workspace-card";
import { CreateWorkspaceDialog } from "@/components/features/workspace/create-workspace-dialog";
import { PrivacyToggle } from "@/components/features/privacy-toggle"; 
import { useAuth } from "@/contexts/auth-context";
import { getWorkspacesRequest } from "@/http/workspaces"; 
import { Workspace } from "@/types";

export default function WorkspaceSelectorPage() {
  const router = useRouter();
  const { user, logout, isLoading: isAuthLoading } = useAuth();
  
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const fetchWorkspaces = useCallback(async () => {
    try {
      const data = await getWorkspacesRequest();
      setWorkspaces(data);
    } catch {
      toast.error("Erro ao carregar workspaces.");
    } finally {
      setIsDataLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthLoading) {
        return;
    }

    if (user) {
      fetchWorkspaces();
    } 
    else {
      setIsDataLoading(false);
    }
    
  }, [isAuthLoading, user, fetchWorkspaces]);

  const handleWorkspaceCreated = () => {
    setCreateDialogOpen(false);
    fetchWorkspaces(); 
  };

  const isLoadingTotal = isAuthLoading || isDataLoading;

  if (isLoadingTotal) {
    return <PageSkeleton />;
  }

  if (!user) return null;

  const userName = user.name || "Usuário";
  const getInitials = (name: string) => name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className="min-h-screen bg-background animate-fade-up">
      <header className="border-b border-border/60 bg-card">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
          <Logo size="md" />
          
          <div className="flex items-center gap-2">
            <PrivacyToggle showTooltip={false} className="cursor-pointer" />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-3 px-3 hover:bg-secondary cursor-pointer">
                  <Avatar className="h-8 w-8 border-2 border-secondary">
                    {user.avatar_url && (
                      <AvatarImage 
                        src={user.avatar_url} 
                        alt={userName} 
                        className="object-cover" 
                      />
                    )}
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                      {getInitials(userName)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden text-sm font-medium text-foreground sm:block">
                    {userName}
                  </span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => router.push("/profile")} className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    Perfil
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={logout} 
                  className="text-destructive cursor-pointer focus:bg-destructive/10 focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-12">
        <div>
          <div className="mb-10 text-center sm:text-left">
            <h1 className="text-3xl font-bold text-foreground">
              Olá, {userName.split(" ")[0]} 👋
            </h1>
            <p className="mt-2 text-muted-foreground text-lg">
              Selecione um workspace para começar a gerenciar suas finanças.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {workspaces.map((workspace, index) => (
              <div
                key={workspace.id}
                className="animate-fade-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <WorkspaceCard workspace={workspace} />
              </div>
            ))}

            <Button
              variant="outline"
              onClick={() => setCreateDialogOpen(true)}
              className="h-full min-h-45 w-full flex-col gap-4 border-2 border-dashed border-border/80 bg-transparent hover:border-primary/50 hover:bg-secondary/30 cursor-pointer group"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-dashed border-muted-foreground/30 group-hover:border-primary/50 group-hover:scale-110 transition-all duration-300">
                <Plus className="h-7 w-7 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <div className="flex flex-col gap-1">
                <span className="font-semibold text-foreground group-hover:text-primary transition-colors">
                    Criar Novo Workspace
                </span>
                <span className="text-xs text-muted-foreground font-normal">
                    Adicione um novo espaço
                </span>
              </div>
            </Button>
          </div>
        </div>
      </main>

      <CreateWorkspaceDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={handleWorkspaceCreated}
      />
    </div>
  );
}

function PageSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/60 bg-card">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
          <Logo size="md" />
          <div className="flex items-center gap-4">
            <Skeleton className="h-4 w-5 rounded-full" />
            <div className="flex items-center gap-2 px-3">
              <Skeleton className="h-6 w-6 rounded-full" />
              <Skeleton className="hidden h-4 w-24 sm:block" />
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-12">
        <div className="mb-10 space-y-3 text-center sm:text-left">
          <Skeleton className="h-10 w-48 mx-auto sm:mx-0" />
          <Skeleton className="h-6 w-96 mx-auto sm:mx-0" />
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 rounded-xl border border-border/50 bg-card p-6 space-y-4">
              <div className="flex justify-between">
                 <div className="flex gap-4">
                    <Skeleton className="h-10 w-10 rounded-lg" />
                    <div className="space-y-2">
                       <Skeleton className="h-4 w-24" />
                       <Skeleton className="h-3 w-12" />
                    </div>
                 </div>
              </div>
              <div className="pt-6 space-y-2">
                 <Skeleton className="h-3 w-16" />
                 <Skeleton className="h-8 w-32" />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}