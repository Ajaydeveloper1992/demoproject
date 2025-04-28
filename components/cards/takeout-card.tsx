'use client'

import { cn } from '~/lib/utils'
import Icon from '~/components/icon'
import { Select, SelectTrigger } from '~/components/ui/select'
import { Card, CardContent, CardHeader } from '~/components/ui/card'
import { iOrder } from '~/types'
import { useOrder } from '~/hooks/use-order'
import { useRouter } from 'next/navigation'

interface Props extends React.HTMLProps<HTMLDivElement> {
  item: iOrder
  isNew?: boolean
}

const TakeoutCard = ({ item, isNew, className }: Props) => {
  const { setSelectedOrder, setIsOpenTakeout } = useOrder()
  const router = useRouter()

  const getStatusColor = (status: iOrder['orderstatus']) => {
    switch (status) {
      case 'Pending':
        return 'bg-yellow-100'
      case 'InKitchen':
        return 'bg-green-100'
      case 'Complete':
        return 'bg-blue-100'
      default:
        return 'bg-gray-100'
    }
  }

  const handleClick = () => {
    if (!item._id) return
    setSelectedOrder(item)
    if (
      item.orderType === 'Pickup' &&
      item.paymentStatus === 'Pending' &&
      item.orderstatus === 'InKitchen'
    ) {
      router.push(`/pos/orders/${item._id}`)
    } else {
      setIsOpenTakeout(true)
    }
  }

  return (
    <div
      className={cn(
        'relative transform rotate-0 mt-2 w-full mx-0.5 hover:rotate-[0.5deg] hover:scale-[102%] transition-all',
        isNew && 'animate-alarm'
      )}
    >
      {/* Pin */}
      <svg
        className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-4 h-4 z-10"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="12" cy="12" r="10" fill="#000" />
        <circle cx="12" cy="12" r="3" fill="#FFF" />
      </svg>

      {/* Sticky Note */}
      <Card
        onClick={handleClick}
        className={cn(
          'rounded-none shadow-lg border-0 cursor-pointer select-none relative overflow-hidden h-full',
          getStatusColor(item.orderstatus),
          !item._id && 'animate-pulse opacity-60',
          // isNew && 'bg-rose-200',
          className
        )}
      >
        {item._id === undefined && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Icon name="Loader" size={24} className="animate-spin" />
          </div>
        )}
        {item.paymentStatus == 'Paid' && (
          <span className="absolute z-30 top-0 left-0 w-20 translate-y-1.5 -translate-x-6 tracking-widest -rotate-45 bg-primary text-center text-[9px] pt-[1px] text-white">
            PAID
          </span>
        )}
        <Select defaultValue={item.orderstatus}>
          <SelectTrigger
            className={cn(
              'absolute bottom-3 z-20 right-2.5 w-8 h-8 !ring-0 border-0 !p-0 [&>svg+svg]:hidden justify-center shadow-none transition',
              item.orderstatus === 'InKitchen'
                ? '!text-green-500 hover:!text-green-700'
                : item.orderstatus === 'Pending'
                  ? '!text-yellow-500 hover:!text-yellow-700'
                  : '!text-blue-400 hover:!text-blue-500'
            )}
            // disabled={item.orderstatus === 'Complete'}
          >
            <Icon
              size={24}
              name={
                item.orderstatus === 'Pending'
                  ? 'Timer'
                  : item.orderstatus === 'InKitchen'
                    ? 'CheckCheck'
                    : 'BookCheck'
              }
            />
          </SelectTrigger>
          {/* <SelectContent className='w-40'>
            <SelectItem value='In Progress'>
              <div className='flex items-center gap-1'>
                <Icon name='Timer' size={16} />
                In Progress
              </div>
            </SelectItem>
            <SelectItem value='Ready'>
              <div className='flex items-center gap-1'>
                <Icon name='CheckCheck' size={16} />
                Ready
              </div>
            </SelectItem>
            {item._id == '2' && (
              <SelectItem value='Completed'>
                <div className='flex items-center gap-1'>
                  <Icon name='BookCheck' size={16} />
                  Completed
                </div>
              </SelectItem>
            )}
          </SelectContent> */}
        </Select>
        <Icon
          className={cn(
            'absolute top-3 right-3 opacity-70',
            item.orderstatus === 'InKitchen'
              ? '!text-green-700'
              : item.orderstatus === 'Pending'
                ? '!text-yellow-700'
                : '!text-blue-700'
          )}
          name={
            item.origin === 'POS'
              ? 'ShoppingBag'
              : item.origin === 'Online'
                ? 'Globe'
                : 'Soup'
          }
          size={24}
        />
        <CardHeader className="flex flex-col items-start relative px-4 pb-2">
          <small className="-mb-2 opacity-70">#{item.orderNumber}</small>
          <h2 className="text-sm font-bold font-handwriting capitalize truncate">
            {item.customer?.firstName} {item.customer?.lastName}
          </h2>
        </CardHeader>
        <CardContent className="px-4">
          <div className="grid gap-2 font-handwriting text-xs">
            <div className="flex items-center gap-2">
              <Icon name="ShoppingCart" size={15} className="text-gray-600" />
              <p>
                ({item.items.reduce((acc, item) => acc + item.quantity, 0)})
                <strong className="ml-0.5">${item.total.toFixed(2)}</strong>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Icon name="Phone" size={15} className="text-gray-600" />
              <p>{item.customer?.phone}</p>
            </div>
            <div className="flex items-center gap-2">
              <Icon name="Clock" size={15} className="text-gray-600" />
              <p>{item.pickupInfo?.pickupTime?.replace('-ASAP', '')}</p>
            </div>
            <div className="flex gap-2">
              <Icon name="FileText" size={15} className="text-gray-600" />
              {item?.specialInstructions ? (
                <p className="flex-1 -mt-0.5">{item?.specialInstructions}</p>
              ) : (
                <p className="flex-1 -mt-0.5 opacity-50">______________</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Shadow effect */}
      <div className="absolute inset-0 bg-black opacity-5 transform skew-y-2 translate-y-1 -z-10"></div>
    </div>
  )
}

export default TakeoutCard
