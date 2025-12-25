"use client";

import { useState } from "react";
import Link from "next/link"; 
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { AuthLayout } from "@/components/layout/auth"; 
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { loginSchema, LoginData } from "@/schemas/auth";
import { useAuth } from "@/contexts/auth-context"; 

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuth(); 

  const form = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginData) => {
    setIsLoading(true);
    
    try {
      await login(data);
      
      toast.success("Login realizado com sucesso!", {
        description: "Redirecionando para seus workspaces...",
      });
      
      
    } catch (error) {
      console.error(error);

      const errorMessage = error instanceof Error 
        ? error.message 
        : "Erro desconhecido ao criar conta.";

      toast.error(errorMessage);
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="space-y-2 text-center lg:text-left">
        <h2 className="text-3xl font-bold text-foreground">Bem-vindo de volta</h2>
        <p className="text-muted-foreground">Acesse sua conta Finza</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="seu@email.com"
                    autoComplete="email"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Senha</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      className="pr-10"
                      {...field}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end">
            <Link
              href="/forgot-password"
              className="text-sm text-primary hover:underline font-medium"
            >
              Esqueci minha senha
            </Link>
          </div>

          <Button
            type="submit"
            className="w-full cursor-pointer"
            size="lg"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Entrando...
              </>
            ) : (
              "Entrar"
            )}
          </Button>
        </form>
      </Form>

      <p className="text-center text-sm text-muted-foreground">
        Não tem uma conta?{" "}
        <Link
          href="/register"
          className="font-semibold text-primary hover:underline"
        >
          Crie agora
        </Link>
      </p>
    </AuthLayout>
  );
}