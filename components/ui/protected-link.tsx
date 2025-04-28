'use client'

import { cn } from '~/lib/utils'
import { useNavigationGuard } from '~/hooks/use-navigation-guard'
import { Button } from '~/components/ui/button'

interface ProtectedLinkProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  href: string
  children: React.ReactNode
}

export const ProtectedLink = ({
  href,
  children,
  className,
  ...props
}: ProtectedLinkProps) => {
  const { guardNavigation } = useNavigationGuard()

  return (
    <Button
      variant="ghost"
      className={cn('hover:bg-transparent hover:text-primary', className)}
      onClick={() => guardNavigation(href)}
      {...props}
    >
      {children}
    </Button>
  )
}
