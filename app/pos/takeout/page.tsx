'use client'

import React from 'react'
import Link from 'next/link'
import { useQuery } from 'react-query'
import { useRouter, useSearchParams } from 'next/navigation'
import { iOrder } from '~/types'
// Lib
import Axios from '~/lib/axios'
import { cn } from '~/lib/utils'
import { HEADER_HEIGHT, OrderEndpoints } from '~/lib/constants'
// Hooks
import { useOrder } from '~/hooks/use-order'
// Components
import Icon from '~/components/icon'
import Header from '~/components/header'
import { Input } from '~/components/ui/input'
import { Button } from '~/components/ui/button'
import { ScrollArea } from '~/components/ui/scroll-area'
import TakeoutCard from '~/components/cards/takeout-card'
import TakeoutSwitcher from '~/components/takeout-switcher'
import OrderDetails from '~/components/modals/order-details'

export default function TakeoutPage() {
  const [filter, setFilter] = React.useState('All')
  const [searchQuery, setSearchQuery] = React.useState('')
  const [filterHeight, setFilterHeight] = React.useState(0)
  const [orderType, setOrderType] = React.useState<iOrder['origin'] | 'all'>(
    'all'
  )

  const { isOpenTakeout, setIsOpenTakeout, selectedOrder, setSelectedOrder } =
    useOrder()
  const router = useRouter()
  const searchParams = useSearchParams()
  const filterRef = React.useRef<HTMLDivElement>(null)
  const params = new URLSearchParams(searchParams.toString())

  React.useEffect(() => {
    if (params.get('search')) {
      setSearchQuery(params.get('search') as string)
    } else {
      setSearchQuery('')
    }
  }, [params.get('search')])

  React.useEffect(() => {
    if (params.get('type')) {
      setOrderType(params.get('type') as iOrder['origin'])
    }
  }, [params.get('type')])

  React.useEffect(() => {
    if (params.get('filter')) {
      setFilter(params.get('filter') as string)
    }
  }, [params.get('filter')])

  React.useEffect(() => {
    if (filterRef.current) {
      setFilterHeight(filterRef.current.clientHeight)
    }
  }, [filterRef.current])

  const { data } = useQuery({
    queryKey: ['takeouts'],
    queryFn: async () => {
      const { data } = await Axios.get(OrderEndpoints.takeouts)
      return data?.data as iOrder[]
    },
    refetchInterval: 5000, // 5 seconds
  })

  const getOrdersByType = React.useCallback(() => {
    if (!data) return []

    return data.filter(order => {
      if (orderType !== 'all' && order.origin !== orderType) {
        return false
      }
      return true
    })
  }, [data, orderType])

  const getStatusCount = React.useCallback(
    (status: string) => {
      if (status === 'All') {
        return getOrdersByType().filter(
          order =>
            order.orderstatus === 'Pending' || order.orderstatus === 'InKitchen'
        ).length
      }
      return getOrdersByType().filter(
        order =>
          order.orderstatus === status &&
          (order.orderstatus === 'Pending' || order.orderstatus === 'InKitchen')
      ).length
    },
    [getOrdersByType]
  )

  const filteredOrders = getOrdersByType().filter(order => {
    if (order.orderstatus !== 'Pending' && order.orderstatus !== 'InKitchen') {
      return false
    }
    if (filter === 'Pending' && order.orderstatus !== 'Pending') {
      return false
    }
    if (filter === 'InKitchen' && order.orderstatus !== 'InKitchen') {
      return false
    }
    if (
      searchQuery &&
      !new RegExp(searchQuery, 'i').test(
        `${order.customer?.firstName} ${order.customer?.lastName} ${order.customer?.phone} ${order.orderNumber}`
      )
    ) {
      return false
    }
    return true
  })

  const onlinePendingOrders = filteredOrders
    .filter(order => order.orderstatus === 'Pending')
    .sort(
      (a, b) =>
        new Date(b.date || '').getTime() - new Date(a.date || '').getTime()
    )

  const otherOrders = filteredOrders
    .filter(order => order.orderstatus !== 'Pending')
    .sort(
      (a, b) =>
        new Date(b.date || '').getTime() - new Date(a.date || '').getTime()
    )

  const updateQueryParams = (key: string, value: string) => {
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    router.push(`?${params.toString()}`)
  }

  return (
    <>
      <Header />
      <div
        className="flex justify-between items-center p-2 pb-0 overflow-x-hidden flex-wrap"
        ref={filterRef}
      >
        <TakeoutSwitcher
          orderType={orderType}
          setOrderType={setOrderType}
          updateQueryParams={updateQueryParams}
        />

        <div className="flex items-center gap-4">
          <div className="flex space-x-2">
            {['All', 'Pending', 'InKitchen'].map(status => (
              <Button
                key={status}
                onClick={() => {
                  setFilter(status)
                  updateQueryParams('filter', status)
                }}
                variant={filter === status ? 'default' : 'ghost'}
                className={cn(
                  status === 'Pending' && '!bg-yellow-100 text-black',
                  status === 'InKitchen' && '!bg-green-100 text-black',
                  status === 'Complete' && '!bg-blue-100 text-black',
                  filter === status && '!bg-primary text-white'
                )}
              >
                <Icon
                  name={
                    status === 'Pending'
                      ? 'Timer'
                      : status === 'Ready'
                        ? 'CheckCheck'
                        : status === 'Complete'
                          ? 'BookCheck'
                          : 'Grip'
                  }
                  size={16}
                />
                {status === 'Complete'
                  ? 'Closed'
                  : status === 'InKitchen'
                    ? 'In Kitchen'
                    : status}
                <span className="-ml-1">({getStatusCount(status)})</span>
              </Button>
            ))}
          </div>
          <div className="relative w-60">
            <Input
              type="text"
              className="h-9"
              placeholder="Search..."
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value)
                updateQueryParams('search', e.target.value)
              }}
            />
            <Icon
              name="Search"
              size={16}
              className="absolute top-1/2 transform -translate-y-1/2 right-2 w-5 text-gray-500 bg-white"
            />
          </div>

          <Link href="/pos/orders/new?type=takeout">
            <Button>
              <Icon name="Plus" size={16} />
              Add New Order
            </Button>
          </Link>
        </div>
      </div>
      <ScrollArea
        style={{ height: `calc(100vh - ${filterHeight + HEADER_HEIGHT}px)` }}
      >
        <div className="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-3 auto-rows-fr p-3 pb-0">
          {onlinePendingOrders.map((order, index) => (
            <TakeoutCard item={order} key={index} isNew />
          ))}
          {otherOrders.map((order, index) => (
            <TakeoutCard item={order} key={index} />
          ))}
        </div>
      </ScrollArea>

      <OrderDetails
        isOpen={isOpenTakeout}
        onClose={() => {
          setSelectedOrder(null)
          setIsOpenTakeout(false)
        }}
        order={selectedOrder as iOrder}
      />
    </>
  )
}
