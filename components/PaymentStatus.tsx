import React from 'react'
import { iOrder } from '~/types'
//
import { cn } from '~/lib/utils'
import { Badge } from './ui/badge'
import Icon from './icon'

interface Props extends React.HTMLProps<HTMLDivElement> {
  status: iOrder['paymentStatus']
}

const PaymentStatus = ({ status, className }: Props) => {
  switch (status) {
    case 'Pending':
      return (
        <Badge
          variant="outline"
          className="px-0.5 w-20 flex justify-center gap-1 border-yellow-500 text-yellow-500"
        >
          Pending
          <Icon name="Timer" size={15} />
        </Badge>
      )
    case 'Paid':
      return (
        <Badge
          variant="outline"
          className="px-0.5 w-20 flex justify-center gap-1 border-blue-500 text-blue-500"
        >
          Paid
          <Icon name="CheckCheck" size={15} />
        </Badge>
      )
    case 'Refunded':
      return (
        <Badge
          variant="outline"
          className="px-0.5 w-20 flex justify-center gap-1 border-rose-500 text-rose-500"
        >
          Refunded
          <Icon name="BookX" size={15} />
        </Badge>
      )
    case 'Partially Refunded':
      return (
        <Badge
          variant="outline"
          className="px-0.5 w-fit flex justify-center border-yellow-500 text-yellow-600"
        >
          Partially Refunded
          <Icon name="BookMinus" size={16} className="mr-1" />
        </Badge>
      )
    case 'Failed':
      return (
        <Badge
          variant="outline"
          className="px-0.5 w-20 flex justify-center gap-1 border-red-500 text-red-500"
        >
          Failed
          <Icon name="X" size={15} />
        </Badge>
      )
    default:
      return <Badge className=" w-20">Unknown</Badge>
  }
}

export default PaymentStatus
