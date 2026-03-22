import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { cn } from '@lib/utils'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@ui/dialog'
import { Input } from '@ui/input'
import { Label } from '@ui/label'
import { Button } from '@ui/button'
import { useGetProfile } from '@finza/api-client/hooks'

const AVATARS = Array.from({ length: 8 }, (_, i) => `/avatars/${i + 1}.webp`)

const editProfileSchema = z.object({
  name: z.string().min(3, 'Mínimo de 3 caracteres').max(120, 'Máximo de 120 caracteres'),
  email: z.string().email('E-mail inválido'),
  avatar_url: z.string().nullable(),
})

type EditProfileForm = z.infer<typeof editProfileSchema>

interface EditProfileDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditProfileDialog({ open, onOpenChange }: EditProfileDialogProps) {
  const { data: user } = useGetProfile()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<EditProfileForm>({
    resolver: zodResolver(editProfileSchema),
    values: {
      name: user?.name ?? '',
      email: user?.email ?? '',
      avatar_url: user?.avatar_url ?? null,
    },
  })

  const selectedAvatar = watch('avatar_url')

  const onSubmit = (data: EditProfileForm) => {
    toast.info('Funcionalidade em breve', {
      description: 'A edição de perfil estará disponível em uma próxima atualização.',
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Perfil</DialogTitle>
          <DialogDescription>
            Atualize suas informações pessoais e avatar.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Nome</Label>
            <Input
              id="edit-name"
              placeholder="Seu nome completo"
              {...register('name')}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-email">E-mail</Label>
            <Input
              id="edit-email"
              type="email"
              placeholder="seu@email.com"
              {...register('email')}
            />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Avatar</Label>
            <div className="grid grid-cols-4 gap-3">
              {AVATARS.map((src) => (
                <button
                  key={src}
                  type="button"
                  onClick={() => setValue('avatar_url', src, { shouldDirty: true })}
                  className={cn(
                    'relative overflow-hidden rounded-full border-2 transition-all hover:scale-105 cursor-pointer',
                    selectedAvatar === src
                      ? 'border-primary ring-2 ring-primary/30'
                      : 'border-border hover:border-muted-foreground',
                  )}
                >
                  <img
                    src={src}
                    alt="Avatar"
                    className="aspect-square w-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button variant="accent" type="submit">
              Salvar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
