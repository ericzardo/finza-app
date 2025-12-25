"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { bucketFormSchema, BucketData } from "@/schemas/bucket";
import { createBucketRequest } from "@/http/buckets"; 

interface AddBucketDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  onSuccess?: () => void;
}

export function AddBucketDialog({ open, onOpenChange, workspaceId, onSuccess }: AddBucketDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<BucketData>({
    resolver: zodResolver(bucketFormSchema),
    defaultValues: {
      name: "",
      allocationPercentage: 0, 
      isDefault: false,
    },
  });

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) form.reset();
    onOpenChange(isOpen);
  };

  const onSubmit = async (data: BucketData) => {
    try {
      setIsLoading(true);

      await createBucketRequest({
        ...data,
        workspaceId,
      });

      toast.success("Caixa criado!", {
        description: `O caixa "${data.name}" foi criado com sucesso.`,
      });

      if (onSuccess) onSuccess();
      handleOpenChange(false);

    } catch (error) {
      console.error(error);
      toast.error("Erro ao criar caixa", {
        description: "Verifique os dados e tente novamente."
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-106.25 border-none shadow-xl [&>button]:cursor-pointer">
        <DialogHeader>
          <DialogTitle>Novo Caixa</DialogTitle>
          <DialogDescription>
            Crie um novo caixa para organizar suas finanças.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4" noValidate>
            
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Emergência, Viagem..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="allocationPercentage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Alocação Automática</FormLabel>
                  <FormDescription>
                    Porcentagem das receitas que vai para este caixa.
                  </FormDescription>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        placeholder="0"
                        className="pr-8"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) => {
                           const val = e.target.value;
                           field.onChange(val === "" ? 0 : Number(val));
                        }}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                        %
                      </span>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isDefault"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border border-border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-sm font-medium">Caixa Padrão</FormLabel>
                    <FormDescription>
                      Recebe o saldo não alocado.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      className="cursor-pointer"
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button 
                type="button" 
                variant="ghost" 
                onClick={() => handleOpenChange(false)}
                className="cursor-pointer"
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading} className="cursor-pointer">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Criando...
                  </>
                ) : (
                  "Criar Caixa"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}