'use client'

import { useNavigationGuard } from '~/hooks/use-navigation-guard'

export const NavigationGuardLayout = ({
  children,
}: {
  children: React.ReactNode
}) => {
  // Initialize the navigation guard
  useNavigationGuard()

  return <>{children}</>
}
