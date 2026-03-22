import { Eye, EyeOff } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import {
  useGetProfile,
  usePatchProfilePrivacy,
  getProfileQueryKey,
} from '@finza/api-client/hooks'
import type { GetProfileQueryResponse } from '@finza/api-client'
import { Button } from '@ui/button'

export function PrivacyToggle() {
  const queryClient = useQueryClient()
  const { data: profile } = useGetProfile()

  const { mutate } = usePatchProfilePrivacy({
    mutation: {
      onMutate: async () => {
        await queryClient.cancelQueries({ queryKey: getProfileQueryKey() })

        const previousProfile = queryClient.getQueryData<GetProfileQueryResponse>(
          getProfileQueryKey(),
        )

        queryClient.setQueryData<GetProfileQueryResponse>(
          getProfileQueryKey(),
          (old) => {
            if (!old) return old
            return {
              ...old,
              is_privacy_enabled: !old.is_privacy_enabled,
            }
          },
        )

        return { previousProfile }
      },
      onError: (_err, _newProfile, context) => {
        if (context?.previousProfile) {
          queryClient.setQueryData<GetProfileQueryResponse>(
            getProfileQueryKey(),
            context.previousProfile,
          )
        }
      },
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey: getProfileQueryKey() })
      },
    },
  })

  const isPrivate = profile?.is_privacy_enabled ?? false

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-lg"
      onClick={() => mutate()}
      aria-label={isPrivate ? 'Revelar valores' : 'Ocultar valores'}
      className="text-muted-foreground hover:text-foreground transition-colors"
    >
      {isPrivate ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
    </Button>
  )
}
