"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { 
  createWorkspaceSchema, 
  CreateWorkspaceData,
} from "@/schemas/workspace";

import { createWorkspaceRequest } from "@/http/workspaces";

interface CreateWorkspaceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateWorkspaceDialog({ open, onOpenChange, onSuccess }: CreateWorkspaceDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CreateWorkspaceData>({
    resolver: zodResolver(createWorkspaceSchema),
    defaultValues: {
      name: "",
      currency: "BRL",
    },
  });

  const onSubmit = async (data: CreateWorkspaceData) => {
    setIsSubmitting(true);
    
    try {
      await createWorkspaceRequest(data);
      
      toast.success("Workspace criado!", {
        description: `${data.name} foi configurado com sucesso.`,
      });

      if (onSuccess) {
        onSuccess();
      }

      onOpenChange(false);
      reset();

    } catch (error) {
      console.error(error);
      toast.error("Erro ao criar workspace", {
        description: "Tente novamente mais tarde."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-106.25 border-none shadow-xl [&>button]:cursor-pointer">
        <DialogHeader>
          <DialogTitle>Criar Novo Workspace</DialogTitle>
          <DialogDescription>
            Crie um espaço separado para organizar suas finanças.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="ws-name">Nome do Workspace</Label>
            <Input
              id="ws-name"
              placeholder="Ex: Finanças Pessoais, Empresa..."
              {...register("name")}
              className={errors.name ? "border-destructive" : ""}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="ws-currency">Moeda Principal</Label>
            <Select 
              onValueChange={(value) => setValue("currency", value as "BRL" | "USD" | "EUR")} 
              defaultValue="BRL"  
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a moeda" />
              </SelectTrigger>
              <SelectContent className="border-none shadow-xl">
                <SelectItem value="BRL" className="cursor-pointer">Real Brasileiro (BRL)</SelectItem>
                <SelectItem value="USD" className="cursor-pointer">Dólar Americano (USD)</SelectItem>
                <SelectItem value="EUR" className="cursor-pointer">Euro (EUR)</SelectItem>
              </SelectContent>
            </Select>
            {errors.currency && (
              <p className="text-sm text-destructive">{errors.currency.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="ghost" 
              onClick={() => onOpenChange(false)}
              className="cursor-pointer"
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting} className="cursor-pointer">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Criar Workspace
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}