'use client'

import React from 'react'
import { iOrder } from '~/types'
// Components
import Icon from '~/components/icon'
import { Button } from '~/components/ui/button'

interface Props {
  orderType: iOrder['origin'] | 'all'
  setOrderType: React.Dispatch<React.SetStateAction<iOrder['origin'] | 'all'>>
  updateQueryParams: (key: string, value: string) => void
}

const TakeoutSwitcher = ({
  orderType,
  setOrderType,
  updateQueryParams,
}: Props) => {
  return (
    <div className="flex h-9 rounded-md bg-muted text-muted-foreground">
      <Button
        variant={orderType === 'all' ? 'default' : 'ghost'}
        className="rounded-r-none h-full"
        onClick={() => {
          setOrderType('all')
          updateQueryParams('type', 'all')
        }}
      >
        All
      </Button>
      {/* <Button
        variant={orderType === 'Pickup' ? 'default' : 'ghost'}
        className='rounded-none h-full'
        onClick={() => setOrderType('delivery')}
      >
        <Icon name='Truck' />
        Delivery
      </Button> */}
      <Button
        variant={orderType === 'Online' ? 'default' : 'ghost'}
        className="rounded-none h-full"
        onClick={() => {
          setOrderType('Online')
          updateQueryParams('type', 'Online')
        }}
      >
        <Icon name="Globe" />
        Online Order
      </Button>
      <Button
        variant={orderType === 'POS' ? 'default' : 'ghost'}
        className="rounded-l-none h-full"
        onClick={() => {
          setOrderType('POS')
          updateQueryParams('type', 'POS')
        }}
      >
        <Icon name="ShoppingBag" />
        Takeout
      </Button>
    </div>
  )
}

export default TakeoutSwitcher
