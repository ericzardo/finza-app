import { useState } from 'react'
import { Mail, KeyRound, Shield, CheckCircle2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Card } from '@ui/card'
import { Badge } from '@ui/badge'
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
            <div className="flex flex-col items-start gap-3 py-4 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-row justify-between w-full">
                <div className="flex flex-1 items-center gap-3">
                  <Mail className="size-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-foreground">E-mail</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                </div>
                <div className="flex flex-col gap-2 md:w-auto md:flex-row md:items-center">
                  {user.email_verified_at ? (
                    <Badge className="gap-1.5 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 dark:text-emerald-400">
                      <CheckCircle2 className="size-3" />
                      Confirmado
                    </Badge>
                  ) : (
                    <Badge className="gap-1.5 bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 dark:text-amber-400">
                      <AlertCircle className="size-3" />
                      Pendente
                    </Badge>

                  )}
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                className="w-full md:w-auto"
                onClick={() => toast.info('Serviço de e-mail em fase de homologação.')}
              >
                Verificar e-mail
              </Button>
            </div>

            <Separator />

            {/* Password */}
            <div className="flex flex-col items-start gap-3 py-4 md:flex-row md:items-center md:justify-between">
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
                className="w-full md:w-auto"
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
