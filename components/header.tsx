'use client'

import React from 'react'
import Image from 'next/image'
import { format } from 'date-fns'
import { useQuery, useQueryClient } from 'react-query'
import { redirect, useRouter } from 'next/navigation'
import { iProfile } from '~/types'
// Libs
import Axios from '~/lib/axios'
import { StaffEndpoints } from '~/lib/constants'
// Hooks
import { logout, useApp } from '~/hooks/use-app'
import { useNavigationGuard } from '~/hooks/use-navigation-guard'
// Components
import Icon from '~/components/icon'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar'

const Header = () => {
  const [currentTime, setCurrentTime] = React.useState(
    format(new Date(), 'h:mm:ss a')
  )

  const { setIsAuthenticated } = useApp()
  const router = useRouter()
  const queryClient = useQueryClient()
  const { guardNavigation } = useNavigationGuard()

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const { data } = await Axios.get(StaffEndpoints.profile)
      return data?.data as iProfile
    },
    onError: () => {
      logout()
      setIsAuthenticated(false)
      redirect('/pos/login')
    },
    onSuccess: data => {
      setIsAuthenticated(true)
    },
  })

  const handleLogout = async () => {
    console.log('Logout')
    logout()
    setIsAuthenticated(false)
    router.replace('/pos/login')

    // Disable all queries
    await queryClient.setDefaultOptions({
      queries: {
        ...queryClient.getDefaultOptions().queries,
        enabled: false,
      },
    })

    // Reset query client
    queryClient.clear()
  }

  const handleNavigation = (path: string) => {
    guardNavigation(path)
  }

  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(format(new Date(), 'h:mm:ss a'))
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="h-12 flex justify-between items-center border-b">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          className="pl-1.5 pr-0 group/logo hover:bg-transparent"
          onClick={() => guardNavigation('/')}
        >
          <Image
            className="flex-shrink-0 group-hover/logo:scale-[103%]"
            src="/zipzappos-icon.png"
            alt="zipzappos"
            width={32}
            height={32}
          />
        </Button>

        <Button
          size="icon"
          variant="ghost"
          className="bg-primary/10 hover:bg-primary/15 hover:text-primary !ring-0"
          onClick={() => guardNavigation('/pos')}
        >
          <Icon name="House" className="!h-5 !w-5" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger>
            <Button
              size="icon"
              variant="ghost"
              className="bg-primary/10 hover:bg-primary/15 hover:text-primary !ring-0"
            >
              <Icon name="Menu" className="!h-5 !w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-44" side="left">
            <DropdownMenuItem onClick={() => handleNavigation('/pos')}>
              <Icon name="House" />
              Board
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleNavigation('/pos/orders/new')}
            >
              <Icon name="Box" />
              Products
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Icon name="Grip" />
              Categories
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleNavigation('/pos/takeout')}>
              <Icon name="Table" />
              Takeout
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Icon name="Users" />
              Customers
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleNavigation('/pos/orders/list')}
            >
              <Icon name="ShoppingCart" />
              Orders
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleNavigation('/pos/report')}>
              <Icon name="ChartPie" />
              Reports
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Icon name="User" />
              My Account
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Icon name="Settings" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleLogout}>
              <Icon name="LogOut" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <p className="text-xs font-semibold">
          {format(new Date(), 'EEEE, do MMMM yyyy')}
          <small className="block opacity-70">{currentTime}</small>
        </p>
      </div>

      <div className="relative flex-1 mx-10">
        <Input
          placeholder="Enter product barcode or name or sku"
          className="w-full h-9 pl-7 text-sm border rounded shadow-sm"
        />
        <Icon
          name="Search"
          className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground"
          size={15}
        />
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger className="flex justify-between items-center p-1 mr-2 gap-2 w-44 border rounded shadow-sm !ring-0 hover:border-primary/15">
          <div className="flex gap-2 items-center text-left">
            <Avatar className="w-7 h-7">
              <AvatarImage
                src={profile?.image?.toString()}
                alt={profile?.fname?.toString()}
              />
              <AvatarFallback className="text-xs">
                {profile?.fname?.charAt(0)}
                {profile?.lname?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <h4 className="text-xs leading-[12px]">
              {profile?.fname} {profile?.lname}
              <small className="block opacity-70 capitalize">
                {profile?.role?.name}
              </small>
            </h4>
          </div>
          <Icon name="ChevronsUpDown" size={15} />
        </DropdownMenuTrigger>

        <DropdownMenuContent className="w-48" align="end">
          <DropdownMenuItem>
            <Icon name="User" />
            Profile
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Icon name="Settings" />
            Settings
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleLogout}>
            <Icon name="LogOut" />
            Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

export default Header
