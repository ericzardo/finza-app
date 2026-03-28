import type { PostWorkspacesMutationRequest } from '@finza/api-client'
import { usePostWorkspaces, getWorkspacesQueryKey } from '@finza/api-client/hooks'
import { postWorkspacesMutationRequestSchema } from '@finza/api-client/schemas'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@ui/button'
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from '@ui/responsive-dialog'
import { Label } from '@ui/label'
import { Input } from '@ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@ui/select'
import { Loader2 } from 'lucide-react'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { useIsMobile } from '@hooks/use-mobile'

const CURRENCIES = [
  { code: 'BRL', symbol: 'R$', label: 'Real Brasileiro' },
  { code: 'USD', symbol: '$', label: 'Dólar Americano' },
  { code: 'EUR', symbol: '€', label: 'Euro' },
] as const

interface CreateWorkspaceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateWorkspaceDialog({ open, onOpenChange }: CreateWorkspaceDialogProps) {
  const queryClient = useQueryClient()
  const isMobile = useIsMobile();

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<PostWorkspacesMutationRequest>({
    resolver: zodResolver(postWorkspacesMutationRequestSchema),
    defaultValues: {
      name: '',
      currency: 'BRL',
    },
  })

  const { mutate, isPending } = usePostWorkspaces({
    mutation: {
      onSuccess: (data) => {
        toast.success(`Workspace "${data.name}" criado com sucesso!`)
        queryClient.invalidateQueries({ queryKey: getWorkspacesQueryKey() })
        reset()
        onOpenChange(false)
      },
      onError: (error) => {
        const message = error.response?.data?.message ?? 'Erro ao criar workspace.'
        toast.error(message)
      },
    },
  })

  function onSubmit(data: PostWorkspacesMutationRequest) {
    mutate({ data })
  }

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent>
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Criar workspace</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            Um workspace serve para organizar suas finanças por áreas.
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="workspace-name">Nome</Label>
            <Input
              id="workspace-name"
              placeholder="Ex: Pessoal, Empresa, Investimentos"
              autoFocus
              {...register('name')}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="workspace-currency">Moeda</Label>
            <Controller
              name="currency"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="workspace-currency">
                    <SelectValue placeholder="Selecione a moeda" />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map(({ code, symbol, label }) => (
                      <SelectItem key={code} value={code}>
                        <span className="font-mono text-foreground">{symbol}</span>
                        <span className="ml-2 text-muted-foreground">{label}</span>
                        <span className="ml-1.5 text-xs text-muted-foreground/60">{code}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.currency && (
              <p className="text-xs text-destructive">{errors.currency.message}</p>
            )}
          </div>

          <ResponsiveDialogFooter>
            <Button
              type="button"
              variant="ghost"
              size={isMobile ? "lg" : "default"}
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" size={isMobile ? "lg" : "default"} variant="accent" disabled={isPending}>
              {isPending && <Loader2 className="size-4 animate-spin" />}
              Criar workspace
            </Button>
          </ResponsiveDialogFooter>
        </form>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}
