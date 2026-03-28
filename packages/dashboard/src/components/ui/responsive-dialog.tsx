import * as React from 'react'

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@ui/dialog'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@ui/drawer'
import { useIsMobile } from '@hooks/use-mobile'
import { cn } from '@lib/utils'

interface ResponsiveDialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}

function ResponsiveDialog({ open, onOpenChange, children }: ResponsiveDialogProps) {
  const isMobile = useIsMobile()

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        {children}
      </Drawer>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {children}
    </Dialog>
  )
}

interface ResponsiveDialogContentProps extends React.ComponentProps<'div'> {
  showCloseButton?: boolean
}

function ResponsiveDialogContent({
  className,
  children,
  showCloseButton,
  ...props
}: ResponsiveDialogContentProps) {
  const isMobile = useIsMobile()

  if (isMobile) {
    return (
      <DrawerContent className={cn('px-4 pb-26', className)} {...props}>
        {children}
      </DrawerContent>
    )
  }

  return (
    <DialogContent showCloseButton={showCloseButton} className={cn('sm:max-w-md', className)} {...props}>
      {children}
    </DialogContent>
  )
}

function ResponsiveDialogHeader({ className, ...props }: React.ComponentProps<'div'>) {
  const isMobile = useIsMobile()

  if (isMobile) {
    return <DrawerHeader className={cn('px-0 mb-4 md:mb-0', className)} {...props} />
  }

  return <DialogHeader className={className} {...props} />
}

function ResponsiveDialogFooter({ className, children, ...props }: React.ComponentProps<'div'>) {
  const isMobile = useIsMobile()

  if (isMobile) {
    return (
      <DrawerFooter className={cn('flex-col-reverse px-0', className)} {...props}>
        {children}
      </DrawerFooter>
    )
  }

  return (
    <DialogFooter className={className} {...props}>
      {children}
    </DialogFooter>
  )
}

function ResponsiveDialogTitle({ className, ...props }: React.ComponentProps<'h2'>) {
  const isMobile = useIsMobile()

  if (isMobile) {
    return <DrawerTitle className={className} {...props} />
  }

  return <DialogTitle className={className} {...props} />
}

function ResponsiveDialogDescription({ className, ...props }: React.ComponentProps<'p'>) {
  const isMobile = useIsMobile()

  if (isMobile) {
    return <DrawerDescription className={className} {...props} />
  }

  return <DialogDescription className={className} {...props} />
}

function ResponsiveDialogClose({ className, ...props }: React.ComponentProps<'button'>) {
  const isMobile = useIsMobile()

  if (isMobile) {
    return <DrawerClose className={className} {...props} />
  }

  return <DialogClose className={className} {...props} />
}

export {
  ResponsiveDialog,
  ResponsiveDialogClose,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
}
