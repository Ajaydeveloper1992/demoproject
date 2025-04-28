import { Button } from '~/components/ui/button'
import { type ButtonProps } from '~/components/ui/button'
import { cn } from '~/lib/utils'

interface KeypadButtonProps extends ButtonProps {
  children: React.ReactNode
  disabled?: boolean
}

export function KeypadButton({
  children,
  className,
  disabled,
  ...props
}: KeypadButtonProps) {
  return (
    <Button
      disabled={disabled}
      variant="outline"
      className={cn('h-14 rounded-sm', className)}
      {...props}
    >
      {children}
    </Button>
  )
}
