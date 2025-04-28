'use client'

import React from 'react'
import Link, { LinkProps } from 'next/link'
import { useNavigationGuard } from '~/hooks/use-navigation-guard'

interface GuardedLinkProps extends LinkProps {
  children: React.ReactNode
  className?: string
  onClick?: (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => void
}

export const GuardedLink: React.FC<GuardedLinkProps> = ({
  href,
  children,
  className,
  onClick,
  ...rest
}) => {
  const { guardNavigation } = useNavigationGuard()

  const handleClick = async (
    e: React.MouseEvent<HTMLAnchorElement, MouseEvent>
  ) => {
    e.preventDefault()

    // If onClick prop is provided, call it
    if (onClick) {
      onClick(e)
    }

    // Use the guardNavigation function to handle the navigation
    await guardNavigation(href.toString())
  }

  return (
    <Link href={href} {...rest} className={className} onClick={handleClick}>
      {children}
    </Link>
  )
}
