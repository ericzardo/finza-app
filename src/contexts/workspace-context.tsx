"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { useParams } from "next/navigation";
import { getWorkspaceByIdRequest } from "@/http/workspaces";
import { Workspace } from "@/types";

interface WorkspaceContextType {
  workspace: Workspace | null;
  isLoading: boolean;
  refreshWorkspace: () => Promise<void>;
}

const WorkspaceContext = createContext({} as WorkspaceContextType);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const params = useParams();
  const workspaceId = params.workspaceId as string;

  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshWorkspace = useCallback(async () => {
    if (!workspaceId) return;
    
    try {
      const data = await getWorkspaceByIdRequest(workspaceId);
      setWorkspace(data);
    } catch (error) {
      console.error("Erro ao atualizar contexto do workspace", error);
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    refreshWorkspace();
  }, [refreshWorkspace]);

  return (
    <WorkspaceContext.Provider value={{ workspace, isLoading, refreshWorkspace }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export const useWorkspace = () => useContext(WorkspaceContext);