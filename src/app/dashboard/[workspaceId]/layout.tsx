import { ReactNode } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Sidebar } from "@/components/layout/sidebar"; 
import { Header } from "@/components/layout/header";
import { getCurrentUserId } from "@/lib/session"; 
import { getWorkspaceById } from "@/services/workspace";
import { redirect } from "next/navigation";
import Link from "next/link";

interface WorkspaceLayoutProps {
  children: ReactNode;
  params: Promise<{ workspaceId: string }>;
}

export default async function WorkspaceLayout({
  children,
  params,
}: WorkspaceLayoutProps) {
  const { workspaceId } = await params;
  
  let userId: string;

  try {
    userId = await getCurrentUserId();
  } catch {
    redirect("/login");
  }

  let workspace;
  try {
    workspace = await getWorkspaceById(workspaceId, userId);
  } catch {
    workspace = null
  }

  if (!workspace) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">
            Workspace não encontrado
          </h1>
          <p className="mt-2 text-muted-foreground">
            O workspace solicitado não existe ou você não tem acesso.
            <br/>
            <Link href="/dashboard" className="text-primary hover:underline mt-4 block">
              Voltar ao Dashboard
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <Sidebar workspaceId={workspace.id} />
      
      <div className="flex min-h-screen flex-1 flex-col transition-all duration-300 ease-in-out peer-data-[state=collapsed]:pl-0">
        <Header workspace={workspace} />
      
        <main className="flex-1 bg-background p-6">
          {children} 
        </main>
      </div>
    </SidebarProvider>
  );
}