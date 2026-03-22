import { useState } from 'react'
import { Mail, KeyRound, Shield } from 'lucide-react'
import { Card } from '@ui/card'
import { Button } from '@ui/button'
import { Separator } from '@ui/separator'
import { useGetProfile } from '@finza/api-client/hooks'
import { ChangePasswordDialog } from './change-password-dialog'

export function SecurityCard() {
  const { data: user } = useGetProfile()
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false)

  if (!user) return null

  return (
    <>
      <Card className="border-border/50 bg-card">
        <div className="p-6">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
              <Shield className="size-5 text-primary" />
            </div>
            <h2 className="text-base font-semibold text-foreground">
              Segurança & Autenticação
            </h2>
          </div>

          <div className="mt-6 space-y-0">
            {/* Email */}
            <div className="flex items-center justify-between py-4">
              <div className="flex items-center gap-3">
                <Mail className="size-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-foreground">E-mail</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Password */}
            <div className="flex items-center justify-between py-4">
              <div className="flex items-center gap-3">
                <KeyRound className="size-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-foreground">Senha</p>
                  <p className="text-sm text-muted-foreground">••••••••</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPasswordDialogOpen(true)}
              >
                Alterar Senha
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <ChangePasswordDialog
        open={passwordDialogOpen}
        onOpenChange={setPasswordDialogOpen}
      />
    </>
  )
}
