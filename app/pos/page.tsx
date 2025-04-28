'use client'
import React from 'react'
import {
  Box,
  Users,
  ShoppingBag,
  FileText,
  Settings,
  User,
  List,
  ShoppingCart,
  Plus,
} from 'lucide-react'
import Link from 'next/link'
import { useQuery } from 'react-query'
import { iCategory, iCustomer, iOrder, iProduct } from '~/types'
// Libs
import Axios from '~/lib/axios'
import { cn } from '~/lib/utils'
import {
  CategoryEndpoints,
  CustomerEndpoints,
  OrderEndpoints,
  ProductEndpoints,
} from '~/lib/constants'
// Hooks
import { useCart } from '~/hooks/use-cart'
import { useCustomer } from '~/hooks/use-customer'
// Components
import Header from '~/components/header'
import RestaurantSwitch from '~/components/RestaurantSwitch'
import { Card, CardContent, CardFooter } from '~/components/ui/card'
import { GuardedLink } from '~/components/layouts/guarded-link'

const Dashboard = () => {
  const { clearCart } = useCart()
  const { setSelectCustomer } = useCustomer()
  React.useEffect(() => {
    // clear cart
    clearCart()
    setSelectCustomer(null)
  }, [])

  const { data: orders } = useQuery({
    queryKey: ['takeouts'],
    queryFn: async () => {
      const { data } = await Axios.get(OrderEndpoints.takeouts)
      return data?.data as iOrder[]
    },
    refetchInterval: 5000, // 5 seconds
  })

  const { data: products } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data } = await Axios.get(ProductEndpoints.getAll())
      return data?.data as iProduct[]
    },
  })

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await Axios.get(CategoryEndpoints.getAll())
      return data?.data as iCategory[]
    },
    cacheTime: 1000 * 60 * 60, // 1 hour in milliseconds
  })

  const { data: customers } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const { data } = await Axios.get(CustomerEndpoints.getAll())
      return data?.data as iCustomer[]
    },
    cacheTime: 1000 * 60 * 60, // 1 hour in milliseconds
  })
  const dashboardItems = [
    {
      title: 'Products',
      icon: Box,
      color: 'bg-blue-100 border-blue-100',
      count: products?.length || 0,
      href: '/pos/orders/new',
    },
    {
      title: 'Categories',
      icon: List,
      color: 'bg-green-100 border-green-100',
      count: categories?.length || 0,
      href: '#',
    },
    {
      title: 'Takeout',
      icon: ShoppingBag,
      color: 'bg-yellow-100 border-yellow-100',
      count: (orders && orders.length) || 0,
      href: '/pos/takeout',
    },
    {
      title: 'Customers',
      icon: Users,
      color: 'bg-purple-100 border-purple-100',
      count: customers?.length || 0,
      href: '#',
    },
    {
      title: 'All Orders',
      icon: ShoppingCart,
      color: 'bg-red-100 border-red-100',
      count: undefined,
      href: '/pos/orders/list',
    },
    {
      title: 'Report',
      icon: FileText,
      color: 'bg-indigo-100 border-indigo-100',
      href: '/pos/report',
    },
    {
      title: 'Settings',
      icon: Settings,
      color: 'bg-gray-100 border-gray-100',
      href: '#',
    },
    {
      title: 'My Account',
      icon: User,
      color: 'bg-pink-100 border-pink-100',
      href: '#',
    },
    {
      title: 'New Tile',
      icon: Plus,
      color: 'bg-gray-200 border-gray-200',
      href: '#',
    },
  ]

  return (
    <div>
      {(!products || !categories || !orders || !customers) && (
        <div className="flex items-center justify-center fixed left-0 top-0 w-full h-full z-50 bg-white/50">
          <div className="bg-white p-8 rounded-lg shadow-lg flex flex-col items-center">
            <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-primary" />
            <h4 className="text-center font-bold mt-4">Preparing...</h4>
            <p className="text-center text-gray-500">
              This will only take a moment! 🚀
            </p>
          </div>
        </div>
      )}

      <Header />
      <div className="container relative mx-auto h-full min-h-[calc(100vh-48px)] p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {dashboardItems.map((item, index) => (
            <GuardedLink
              href={item.href}
              key={index}
              className={cn(
                'block group',
                item.href === '#' &&
                  'opacity-70 cursor-default pointer-events-none'
              )}
            >
              <Card
                className={`${item.color} hover:shadow-lg transition-shadow cursor-pointer relative`}
              >
                {/* Coming Soon */}
                {item.href === '#' && (
                  <div className="absolute bg-black/50 bottom-2 right-2 rounded-md px-1">
                    <span className="text-white font-semibold text-xs">
                      Coming Soon
                    </span>
                  </div>
                )}

                <CardContent className="p-6">
                  <div className="flex justify-between items-center">
                    <item.icon className="h-8 w-8 text-gray-600" />
                    {item.count !== undefined && (
                      <span className="text-sm font-semibold bg-white px-2 py-1 rounded-full">
                        {item.count}
                      </span>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="p-6 pt-0">
                  <h2 className="font-semibold text-lg text-gray-700">
                    {item.title}
                  </h2>
                </CardFooter>
              </Card>
            </GuardedLink>
          ))}
        </div>

        <RestaurantSwitch />
      </div>
    </div>
  )
}

export default Dashboard
