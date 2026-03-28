import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogFooter,
  ResponsiveDialogDescription,
} from '@ui/responsive-dialog'
import { Label } from '@ui/label'
import { Button } from '@ui/button'
import { PasswordInput } from '@ui/password-input'
import { usePostAuthChangePassword } from '@finza/api-client/hooks'
import { useIsMobile } from '@hooks/use-mobile'

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Campo obrigatório'),
    newPassword: z.string().min(8, 'Mínimo de 8 caracteres'),
    confirmPassword: z.string().min(1, 'Campo obrigatório'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  })

type ChangePasswordForm = z.infer<typeof changePasswordSchema>

interface ChangePasswordDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ChangePasswordDialog({ open, onOpenChange }: ChangePasswordDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordForm>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  })

  const isMobile = useIsMobile();

  const { mutate, isPending } = usePostAuthChangePassword({
    mutation: {
      onSuccess: () => {
        reset()
        onOpenChange(false)
        toast.success('Segurança atualizada com sucesso!')
      },
      onError: (error) => {
        if (error.response?.status === 403) {
          toast.error('Senha atual incorreta. Tente novamente.')
        } else {
          toast.error('Não foi possível alterar a senha.')
        }
      },
    },
  })

  const onSubmit = (data: ChangePasswordForm) => {
    mutate({
      data: {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      },
    })
  }

  const handleOpenChange = (value: boolean) => {
    if (!value) reset()
    onOpenChange(value)
  }

  return (
    <ResponsiveDialog open={open} onOpenChange={handleOpenChange}>
      <ResponsiveDialogContent>
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Alterar Senha</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            Digite sua senha atual e defina uma nova senha.
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current-password">Senha Atual</Label>
            <PasswordInput
              id="current-password"
              placeholder="Digite sua senha atual"
              {...register('currentPassword')}
            />
            {errors.currentPassword && (
              <p className="text-xs text-destructive">{errors.currentPassword.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-password">Nova Senha</Label>
            <PasswordInput
              id="new-password"
              placeholder="Mínimo de 8 caracteres"
              {...register('newPassword')}
            />
            {errors.newPassword && (
              <p className="text-xs text-destructive">{errors.newPassword.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirmar Nova Senha</Label>
            <PasswordInput
              id="confirm-password"
              placeholder="Repita a nova senha"
              {...register('confirmPassword')}
            />
            {errors.confirmPassword && (
              <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
            )}
          </div>

          <ResponsiveDialogFooter>
            <Button
              type="button"
              variant="ghost"
              size={isMobile ? "lg" : "default"}
              onClick={() => handleOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button variant="accent" size={isMobile ? "lg" : "default"} type="submit" disabled={isPending}>
              {isPending ? 'Alterando...' : 'Alterar Senha'}
            </Button>
          </ResponsiveDialogFooter>
        </form>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}
