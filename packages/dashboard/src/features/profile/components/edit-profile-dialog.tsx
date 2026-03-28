import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { cn } from '@lib/utils'
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogFooter,
  ResponsiveDialogDescription,
} from '@ui/responsive-dialog'
import { Input } from '@ui/input'
import { Label } from '@ui/label'
import { Button } from '@ui/button'
import { useGetProfile, usePatchProfile, getProfileQueryKey } from '@finza/api-client/hooks'
import { useIsMobile } from '@hooks/use-mobile'

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
  const queryClient = useQueryClient()
  const isMobile = useIsMobile();

  const { mutate, isPending } = usePatchProfile({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getProfileQueryKey() })
        onOpenChange(false)
        toast.success('Perfil atualizado com sucesso!')
      },
      onError: (error) => {
        if (error.response?.status === 409) {
          toast.error('E-mail já cadastrado por outro usuário.')
        } else {
          toast.error('Não foi possível atualizar o perfil.')
        }
      },
    },
  })

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
    mutate({
      data: {
        name: data.name,
        email: data.email,
        avatar_url: data.avatar_url ?? undefined,
      },
    })
  }

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent>
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Editar Perfil</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            Atualize suas informações pessoais e avatar.
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

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

          <ResponsiveDialogFooter>
            <Button
              type="button"
              variant="ghost"
              size={isMobile ? "lg" : "default"}
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button variant="accent" size={isMobile ? "lg" : "default"} type="submit" disabled={isPending}>
              {isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </ResponsiveDialogFooter>
        </form>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}
