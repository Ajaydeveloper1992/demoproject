import React from 'react'
import { LAYOUT } from '~/lib/constants'
import { cn } from '~/lib/utils'

interface Props extends React.HTMLAttributes<HTMLElement> {
  title?: string
  BreadCrumb?: React.ElementType
  actionEl?: React.ReactNode
}

const Layout = ({
  title,
  BreadCrumb,
  actionEl,
  className,
  children,
  ...props
}: Props) => {
  return (
    <div
      className={cn(
        'py-6 px-6 w-full mx-auto',
        LAYOUT === 'BOXED' && `container xl:max-w-[1200px]`,
        className
      )}
      {...props}
    >
      <div className="flex justify-between items-center">
        <div className="flex flex-col gap-2">
          {title && (
            <h2 className="text-xl font-bold tracking-wide">{title}</h2>
          )}
          {BreadCrumb && <BreadCrumb />}
        </div>

        {actionEl && <div>{actionEl}</div>}
      </div>
      <div className="mt-6">{children}</div>
    </div>
  )
}

export default Layout
Layout.displayName = 'Layout'
