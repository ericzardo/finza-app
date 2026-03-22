import { useState } from 'react'
import { Pencil } from 'lucide-react'
import { Card } from '@ui/card'
import { Badge } from '@ui/badge'
import { Button } from '@ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@ui/avatar'
import { useGetProfile } from '@finza/api-client/hooks'
import { EditProfileDialog } from './edit-profile-dialog'

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
}

function getPlanLabel(plan: string): string {
  const labels: Record<string, string> = {
    free: 'Free',
    pro: 'Pro',
    premium: 'Premium',
  }
  return labels[plan.toLowerCase()] ?? plan
}

export function ProfileInfoCard() {
  const { data: user } = useGetProfile()
  const [editOpen, setEditOpen] = useState(false)

  if (!user) return null

  return (
    <>
      <Card className="border-border/50 bg-card">
        <div className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="size-20 border-2 border-border">
                <AvatarImage src={user.avatar_url ?? undefined} alt={user.name} />
                <AvatarFallback className="bg-muted text-lg font-semibold text-muted-foreground">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold text-foreground">
                    {user.name}
                  </h2>
                  <Badge variant="secondary" className="text-[10px] uppercase tracking-wider">
                    {getPlanLabel(user.plan)}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditOpen(true)}
              className="gap-1.5"
            >
              <Pencil className="size-3.5" />
              Editar Perfil
            </Button>
          </div>
        </div>
      </Card>

      <EditProfileDialog open={editOpen} onOpenChange={setEditOpen} />
    </>
  )
}
