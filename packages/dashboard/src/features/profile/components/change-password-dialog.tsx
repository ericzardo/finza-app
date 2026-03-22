import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@ui/dialog'
import { Label } from '@ui/label'
import { Button } from '@ui/button'
import { PasswordInput } from '@ui/password-input'

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

  const onSubmit = (data: ChangePasswordForm) => {
    toast.info('Funcionalidade em breve', {
      description: 'A alteração de senha estará disponível em uma próxima atualização.',
    })
    reset()
    onOpenChange(false)
  }

  const handleOpenChange = (value: boolean) => {
    if (!value) reset()
    onOpenChange(value)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Alterar Senha</DialogTitle>
          <DialogDescription>
            Digite sua senha atual e defina uma nova senha.
          </DialogDescription>
        </DialogHeader>

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

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => handleOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button variant="accent" type="submit">
              Alterar Senha
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
