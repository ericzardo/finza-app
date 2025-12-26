"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
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

import { cn } from "@/lib/utils";
import { updateUserSchema, UpdateUserData } from "@/schemas/user";
import { updateUserRequest } from "@/http/users"; 
import { useAuth } from "@/contexts/auth-context";

export const AVATAR_OPTIONS = Array.from({ length: 8 }, (_, i) => `/avatars/${i + 1}.webp`);

interface EditProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData: {
    name: string;
    avatarUrl?: string | null;
  };
  onSuccess: (data: UpdateUserData) => void;
}

export function EditProfileDialog({ 
  open, 
  onOpenChange, 
  initialData, 
  onSuccess 
}: EditProfileDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<UpdateUserData>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      name: initialData.name,
      avatarUrl: initialData.avatarUrl || AVATAR_OPTIONS[0], 
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        name: initialData.name,
        avatarUrl: initialData.avatarUrl || AVATAR_OPTIONS[0],
      });
    }
  }, [open, initialData, reset]);

  const selectedAvatarUrl = watch("avatarUrl");

  const onSubmit = async (data: UpdateUserData) => {
    if (!user) return;

    try {
      setIsSubmitting(true);
      
      await updateUserRequest(user.id, data);
      
      onSuccess(data);
      
      toast.success("Perfil atualizado!", {
        description: "Suas informações foram salvas com sucesso.",
      });

      onOpenChange(false);

    } catch (error) {
      console.error(error);
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Erro desconhecido ao atualizar perfil.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg border-none shadow-xl [&>button]:cursor-pointer">
        <DialogHeader>
          <DialogTitle>Editar Perfil</DialogTitle>
          <DialogDescription>
            Atualize seu avatar e nome de exibição
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-6 py-4">
            
            <div className="space-y-3">
              <Label>Escolha seu avatar</Label>
              <div className="grid grid-cols-4 gap-4">
                {AVATAR_OPTIONS.map((avatarPath) => (
                  <div
                    key={avatarPath}
                    onClick={() => setValue("avatarUrl", avatarPath)}
                    className={cn(
                      "cursor-pointer relative aspect-square rounded-full border-4 overflow-hidden transition-all",
                      selectedAvatarUrl === avatarPath
                        ? "border-primary ring-2 ring-primary/20 scale-105"
                        : "border-transparent hover:scale-105 opacity-70 hover:opacity-100"
                    )}
                  >
                    <Image 
                      src={avatarPath} 
                      alt="Avatar Option" 
                      className="h-full w-full object-cover bg-muted"
                      width={120}
                      height={120}
                    />
                  </div>
                ))}
              </div>
              {errors.avatarUrl && (
                <p className="text-sm text-destructive font-medium animate-pulse">
                  {errors.avatarUrl.message}
                </p>
              )}
            </div>
            
            {/* Input de Nome */}
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nome</Label>
              <Input
                id="edit-name"
                {...register("name")}
                placeholder="Seu nome"
                className={errors.name ? "border-destructive focus-visible:ring-destructive" : ""}
              />
              {errors.name && (
                <p className="text-sm text-destructive font-medium animate-pulse">
                  {errors.name.message}
                </p>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="ghost" 
              onClick={() => onOpenChange(false)} 
              disabled={isSubmitting}
              className="cursor-pointer"
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting} className="cursor-pointer">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}