import React from 'react'
import { iOrder } from '~/types'
//
import { cn } from '~/lib/utils'
import { Badge } from './ui/badge'
import Icon from './icon'

interface Props extends React.HTMLProps<HTMLDivElement> {
  status: iOrder['orderstatus']
}

const OrderStatus = ({ status, className }: Props) => {
  switch (status) {
    case 'Pending':
      return (
        <Badge className="bg-yellow-500 px-1">
          <Icon name="Timer" size={16} className="mr-1" />
          Pending
        </Badge>
      )
    case 'InKitchen':
      return (
        <Badge className="bg-green-500 px-1">
          <Icon name="CheckCheck" size={16} className="mr-1" />
          In Kitchen
        </Badge>
      )
    case 'Rejected':
      return (
        <Badge className="bg-destructive px-1">
          <Icon name="BookX" size={16} className="mr-1" />
          Rejected
        </Badge>
      )
    case 'Refunded':
      return (
        <Badge className="bg-rose-500 px-1">
          <Icon name="BookX" size={16} className="mr-1" />
          Refunded
        </Badge>
      )
    case 'Complete':
      return (
        <Badge className="bg-blue-500 px-1">
          <Icon name="BookCheck" size={16} className="mr-1" /> Completed
        </Badge>
      )
    case 'Voided':
      return (
        <Badge className="bg-destructive px-1">
          <Icon name="Trash2" size={16} className="mr-1" />
          Voided
        </Badge>
      )
    case 'Partially Refunded':
      return (
        <Badge className="bg-yellow-500 px-1">
          <Icon name="BookMinus" size={16} className="mr-1" />
          Partially Refunded
        </Badge>
      )
    default:
      return <Badge>Unknown</Badge>
  }
}

export default OrderStatus
