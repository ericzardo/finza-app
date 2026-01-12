"use client";

import { useState, useEffect } from "react"; 
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ChevronDown, LogOut, User, Wallet } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PrivacyToggle } from "@/components/features/privacy-toggle";
import { useAuth } from "@/contexts/auth-context";

import { getWorkspacesRequest } from "@/http/workspaces";
import { Workspace } from "@/types";

interface HeaderProps {
  workspace: { 
    id: string;
    name: string; 
    currency: string; 
    total_balance?: number 
  };
}

export function Header({ workspace }: HeaderProps) {
  const router = useRouter();
  const { user, logout, isLoading: isAuthLoading } = useAuth();
  
  const [workspacesList, setWorkspacesList] = useState<Workspace[]>([]);

  useEffect(() => {
    const loadWorkspaces = async () => {
      try {
        const data = await getWorkspacesRequest();
        setWorkspacesList(data);
      } catch (error) {
        console.error("Erro ao carregar lista de workspaces no header:", error);
      }
    };

    loadWorkspaces();
  }, []);

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  return (
    <header className="flex h-16 items-center justify-between border-b border-border/60 bg-card px-4 lg:px-6 sticky top-0 z-10 shadow-sm">
      
      {/* --- SELETOR DE WORKSPACE --- */}
      <div className="flex items-center gap-4">
        <SidebarTrigger className="lg:hidden" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="h-auto gap-3 px-3 py-2 cursor-pointer hover:bg-secondary data-[state=open]:bg-secondary"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <Wallet className="h-4 w-4 text-primary" />
              </div>
              <div className="hidden text-left sm:block">
                <p className="text-sm font-semibold text-foreground">
                  {workspace.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {workspace.currency}
                </p>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          
          <DropdownMenuContent align="start" className="w-56">
            {workspacesList.length > 0 ? (
              workspacesList.map((ws) => (
                <DropdownMenuItem
                  key={ws.id}
                  onClick={() => router.push(`/dashboard/${ws.id}`)}
                  className={`cursor-pointer ${ws.id === workspace.id ? "bg-secondary" : ""}`}
                >
                  <Wallet className="mr-2 h-4 w-4" />
                  {ws.name}
                </DropdownMenuItem>
              ))
            ) : (
              <div className="p-2 text-xs text-center text-muted-foreground">
                Carregando...
              </div>
            )}
            
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="cursor-pointer">
              <Link href="/dashboard">Ver todos os workspaces</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* --- PERFIL DO USUÁRIO --- */}
      <div className="flex items-center gap-2">
        <PrivacyToggle className="h-9 w-9 cursor-pointer" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-3 px-3 cursor-pointer hover:bg-secondary">
              {isAuthLoading ? (
                <>
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="hidden h-4 w-24 md:block" />
                </>
              ) : (
                <>
                  <Avatar className="h-8 w-8 border-2 border-secondary">
                    {user?.avatar_url && (
                      <AvatarImage 
                        src={user.avatar_url} 
                        alt={user.name} 
                        className="object-cover" 
                      />
                    )}
                    {/* O Fallback continua aqui para garantir */}
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs font-medium">
                      {getInitials(user?.name || "U")}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden text-sm font-medium text-foreground md:block">
                    {user?.name} 
                  </span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem 
              onClick={() => router.push("/profile")}
              className="cursor-pointer"
            >
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
    </header>
  );
}