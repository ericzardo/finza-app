"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import { deleteWorkspaceRequest } from "@/http/workspaces";

interface WorkspaceDeleteZoneProps {
  workspaceId: string;
  workspaceName: string;
}

export function WorkspaceDeleteZone({ workspaceId, workspaceName }: WorkspaceDeleteZoneProps) {
const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    const toastId = toast.loading("Excluindo workspace...", { id: "delete-ws" });
    setIsDeleting(true);

    try {
      await deleteWorkspaceRequest(workspaceId);
      
      toast.success("Workspace excluído com sucesso", { id: toastId });
      
      router.refresh();
      router.push("/dashboard");
      
    } catch (error) {
      console.error(error);
      toast.error("Erro ao excluir workspace.", { id: toastId });
      setIsDeleting(false);
    }
  };

  return (
    <Card className="border-destructive/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg font-semibold text-destructive">
          <Trash2 className="h-5 w-5" />
          Zona de Perigo
        </CardTitle>
        <CardDescription>
          Ações irreversíveis para este workspace
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" className="gap-2 cursor-pointer" disabled={isDeleting}>
              <Trash2 className="h-4 w-4" />
              Excluir Workspace
            </Button>
          </AlertDialogTrigger>
          
          <AlertDialogContent className="border-none shadow-xl">
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir Workspace</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir <strong>{workspaceName}</strong>? <br/>
                Esta ação é irreversível. Todos os buckets e transações serão perdidos permanentemente.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="cursor-pointer" disabled={isDeleting}>
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction 
                onClick={(e) => {
                  e.preventDefault(); 
                  handleDelete();
                }}
                className="bg-destructive hover:bg-destructive/90 cursor-pointer"
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Excluindo...
                  </>
                ) : (
                  "Sim, Excluir"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}