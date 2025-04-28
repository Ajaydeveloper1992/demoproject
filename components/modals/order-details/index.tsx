'use client'

import React from 'react'
import { iOrder, iProfile, iReceiptBody } from '~/types'
// Components
import { cn } from '~/lib/utils'
import OrderStatus from '~/components/OrderStatus'
import { ScrollArea } from '~/components/ui/scroll-area'
import { Sheet, SheetContent } from '~/components/ui/sheet'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '~/components/ui/accordion'
import Icon from '~/components/icon'
import { Badge } from '~/components/ui/badge'
import PaymentStatus from '~/components/PaymentStatus'
import SuccessModal from '~/components/modals/success-modal'
import ContactModal from '~/components/modals/contact-modal'
//
import OrderAction from './OrderAction'
import PendingAction from './PendingAction'
import Link from 'next/link'
import { useMutation, useQuery } from 'react-query'
import { printKitchenReceipt } from '~/hooks/use-order'
import Axios from '~/lib/axios'
import { StaffEndpoints } from '~/lib/constants'
import { logout, useApp } from '~/hooks/use-app'
import { redirect } from 'next/navigation'

interface Props {
  order: iOrder
  isOpen: boolean
  onClose: () => void
  type?: 'takeout' | 'list'
}

const OrderDetails = ({ order, isOpen, onClose, type = 'takeout' }: Props) => {
  const { setIsAuthenticated } = useApp()

  const [reason, setReason] = React.useState('')
  const [selectedTime, setSelectedTime] = React.useState<Date | null>(null)
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = React.useState(false)
  const [isContactDialogOpen, setIsContactDialogOpen] = React.useState(false)

  // Add constant for padding and margins
  const PADDING_TOP = 16 // py-2 = 16px
  const PADDING_BOTTOM = 16
  const HEADER_HEIGHT = 40 // approx height of the header
  const FOOTER_MIN_HEIGHT = 200 // minimum height for the footer section

  const headerRef = React.useRef<HTMLDivElement>(null)
  const footerRef = React.useRef<HTMLDivElement>(null)
  const [scrollAreaHeight, setScrollAreaHeight] = React.useState(0)

  React.useEffect(() => {
    const calculateHeight = () => {
      const viewportHeight = window.innerHeight
      const headerHeight = headerRef.current?.offsetHeight || HEADER_HEIGHT
      const footerHeight = footerRef.current?.offsetHeight || FOOTER_MIN_HEIGHT
      const totalPadding = PADDING_TOP + PADDING_BOTTOM

      const available =
        viewportHeight - (headerHeight + footerHeight + totalPadding)
      setScrollAreaHeight(available)
    }

    calculateHeight()
    window.addEventListener('resize', calculateHeight)

    // Recalculate on content changes
    const timer = setTimeout(calculateHeight, 100)

    return () => {
      window.removeEventListener('resize', calculateHeight)
      clearTimeout(timer)
    }
  }, [isOpen, selectedTime, reason])

  // Reset the selected time when the modal closes
  React.useEffect(() => {
    if (!isOpen) {
      setSelectedTime(null)
      setReason('')
    }
  }, [isOpen])

  const formatTime = (date: Date | undefined) => {
    if (!date) return 'N/A'
    return new Date(date).toLocaleString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // Add formatDate function e.g. 01 Jan 2022
  const formatDate = (date: Date | undefined) => {
    if (!date) return 'N/A'
    return new Date(date).toLocaleString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

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

  // Handle print kitchen receipt with react-query
  const {
    mutate: printKitchen,
    isLoading: isKitchenPrinting,
    isError: isKitchenError,
    error: kitchenError,
    isSuccess: isKitchenPrinted,
  } = useMutation({
    mutationFn: (data: iReceiptBody) => {
      const restName = profile?.selectedRestaurants[0]?.url_slug
      if (!restName) throw new Error('Restaurant name is required')

      return printKitchenReceipt(restName, data)
    },
    onSuccess: () => {
      console.log('SUCCESSS')
    },
    onError: (err, newTodo, context) => {
      console.log(err)
    },
  })
  console.log(order)

  let order_data = ''
  if (order) {
    order_data = JSON.stringify(order)
    localStorage.setItem('order', order_data)
  } else {
    const storedOrder = localStorage.getItem('order')
    order_data = storedOrder ? storedOrder : ''
  }
  return (
    <>
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent className="w-full max-w-md sm:max-w-lg py-2 px-4 flex flex-col space-y-0">
          <div ref={headerRef} className="mb-2 flex gap-4">
            <Link
              href={`/pos/orders/${order?._id}/details`}
              className="text-lg font-bold hover:underline"
            >
              #{order?.orderNumber}
            </Link>
            <OrderStatus status={order?.orderstatus} />
          </div>
          {!order ? (
            <p className="text-center text-muted-foreground">Order not found</p>
          ) : (
            <div className="flex-1 min-h-0 flex flex-col">
              <ScrollArea
                className="pr-4 flex-1"
                style={{
                  height: `${scrollAreaHeight}px`,
                  minHeight: '300px',
                  maxHeight: `calc(100vh - ${
                    HEADER_HEIGHT +
                    FOOTER_MIN_HEIGHT +
                    PADDING_TOP +
                    PADDING_BOTTOM
                  }px)`,
                }}
              >
                <Accordion
                  type="single"
                  defaultValue="items"
                  className="space-y-4"
                  collapsible
                >
                  <div className="flex justify-between items-center bg-muted p-4 rounded-lg">
                    <div>
                      <p className="text-sm font-medium">Order Time</p>
                      <p className="text-sm mt-1">
                        {formatDate(order.date)} | {formatTime(order.date)}
                      </p>
                    </div>
                    {order?.pickupInfo?.delayTime ? (
                      <div>
                        <p className="text-sm font-medium">Delayed Time</p>
                        <p className="text-lg text-destructive">
                          {order?.pickupInfo?.delayTime?.replace('-ASAP', '')}
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm font-medium">Pickup Time</p>
                        <p className="text-lg text-destructive">
                          {order?.pickupInfo?.pickupTime?.replace(
                            '-ASAP',
                            ''
                          ) || 'N/A'}
                        </p>
                      </div>
                    )}
                    <div className="text-right">
                      <p className="text-sm font-medium">Total</p>
                      <p className="text-lg font-bold text-primary">
                        ${order?.total.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  {order?.customer && (
                    <AccordionItem value="customer">
                      <AccordionTrigger className="font-semibold py-2 capitalize">
                        <p>
                          Customer Details - {order.customer?.firstName}
                          <span className="bg-primary text-white p-1 rounded ml-1 uppercase text-[10px]">
                            {order.customer?.customertype === 'N'
                              ? 'New'
                              : 'Repeat'}
                          </span>
                        </p>
                      </AccordionTrigger>
                      <AccordionContent className="bg-muted/50 p-2 space-y-2">
                        <p>
                          <span className="font-medium">Name:</span>{' '}
                          {order.customer?.firstName} {order.customer?.lastName}
                        </p>
                        <p>
                          <span className="font-medium">Phone:</span>{' '}
                          {order?.customer?.phone}
                        </p>
                        {order?.customer?.email && (
                          <p>
                            <span className="font-medium">Email:</span>{' '}
                            {order?.customer?.email}
                          </p>
                        )}
                      </AccordionContent>
                    </AccordionItem>
                  )}

                  <AccordionItem value="items">
                    <AccordionTrigger className="font-semibold py-2">
                      Order Items
                    </AccordionTrigger>
                    <AccordionContent className="p-2">
                      {Array.isArray(order.items) &&
                        order.items.length > 0 &&
                        order.items.map(item => (
                          <div
                            key={item.id}
                            className={cn(
                              'flex justify-between items-center border-b last:border-b-0 odd:bg-muted/50 border-pink-100 py-1.5 px-0.5 gap-1 text-sm leading-normal border-l-2 border-transparent transition-colors'
                            )}
                          >
                            <div className="flex-1">
                              <div className="flex items-center justify-between gap-1 font-semibold -tracking-[0.25px] capitalize">
                                <p
                                  className={cn(
                                    (item?.itemStatus === 'Voided' ||
                                      item?.itemStatus === 'Refunded') &&
                                      'line-through text-neutral-500'
                                  )}
                                >
                                  {item.quantity} x{' '}
                                  {item?.item?.name?.toLowerCase() ??
                                    'Unknown Item'}
                                  {(item?.itemStatus === 'Voided' ||
                                    item?.itemStatus === 'Refunded' ||
                                    item?.itemStatus ===
                                      'Partially Refunded') && (
                                    <Badge
                                      variant="outline"
                                      className="text-[9px] ml-1 px-1 py-0.5 leading-none text-rose-500 border-rose-500 rounded-sm"
                                    >
                                      {item?.itemStatus}
                                      {item?.itemStatus ===
                                        'Partially Refunded' &&
                                        item?.refundQuantity}
                                    </Badge>
                                  )}
                                </p>
                                <p className="text-destructive leading-none">
                                  {(item?.itemDiscount?.value ?? 0) > 0 && (
                                    <del className="text-destructive/60 text-xs mr-0.5">
                                      ${(item.price * item.quantity).toFixed(2)}
                                    </del>
                                  )}
                                  $
                                  {(
                                    item.price * item.quantity -
                                    (item?.itemDiscount?.type === '%'
                                      ? (item.price *
                                          item.quantity *
                                          (item?.itemDiscount?.value ?? 0)) /
                                        100
                                      : (item?.itemDiscount?.value ?? 0))
                                  ).toFixed(2)}
                                </p>
                              </div>
                              {/* {item?.modifiers &&
                                Array.isArray(item.modifiers) &&
                                Object.keys(item?.modifiers).map((key) => (
                                  <p
                                    key={key}
                                    className='text-[11px] tracking-tight text-gray-500 font-light capitalize'
                                  >
                                    <strong className='text-gray-600 font-bold'>
                                      {key}:
                                    </strong>{' '}
                                    {Array.isArray(item?.modifiers[key])
                                      ? item.modifiers[key]
                                          .map(
                                            (modifier) =>
                                              `${modifier.name}${
                                                modifier.amount > 0
                                                  ? ` +($${modifier.amount})`
                                                  : ''
                                              }`
                                          )
                                          .join(', ')
                                      : ''}
                                  </p>
                                ))} */}

                              {item?.itemNote && (
                                <p className="text-[11px] tracking-tight text-gray-500 font-light capitalize">
                                  <strong className="text-gray-600 font-bold">
                                    Note:
                                  </strong>{' '}
                                  {item?.itemNote}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                    </AccordionContent>
                  </AccordionItem>

                  {/* {order?.specialInstructions && (
                    <div>
                      <h3 className='text-lg font-semibold mb-2'>Order Note</h3>
                      <p className='bg-muted p-4 rounded-lg'>
                        {order?.specialInstructions}
                      </p>
                    </div>
                  )} */}

                  <AccordionItem value="additional">
                    <AccordionTrigger className="font-semibold py-2">
                      Additional Information
                    </AccordionTrigger>
                    <AccordionContent className="bg-muted/50 p-2 space-y-1">
                      {/* <p>
                        <span className='font-medium'>Server:</span>{' '}
                        {order?.server?.name}
                      </p> */}

                      <p>
                        <span className="font-medium">Order Type:</span>{' '}
                        {order?.orderType}
                      </p>
                      <p className="flex items-center gap-2">
                        <span className="font-medium">Payment Status:</span>{' '}
                        <PaymentStatus status={order?.paymentStatus} />
                      </p>
                      <p className="flex items-center gap-2">
                        <span className="font-medium">Order Status:</span>{' '}
                        <OrderStatus status={order?.orderstatus} />
                      </p>
                      {order.origin === 'POS' && (
                        <p>
                          <span className="font-medium">Created By:</span>{' '}
                          {order?.staffid?.fname || 'N/A'}
                        </p>
                      )}
                      {order.orderstatus === 'Voided' && (
                        <p>
                          <span className="font-medium">Voided By:</span>{' '}
                          {order?.voidedby?.fname || 'N/A'}
                        </p>
                      )}
                      {(order.orderstatus === 'Refunded' ||
                        order.orderstatus === 'Partially Refunded') && (
                        <p>
                          <span className="font-medium">Refunded By:</span>{' '}
                          {order?.refundby?.fname || 'N/A'}
                        </p>
                      )}
                      {order?.orderstatus === 'Rejected' &&
                        order.origin !== 'POS' && (
                          <p>
                            <span className="font-medium">Rejected By:</span>{' '}
                            {order?.staffid?.fname} {order?.staffid?.lname}
                          </p>
                        )}
                      {order?.specialInstructions && (
                        <p>
                          <span className="font-medium">Order Note:</span>{' '}
                          {order?.specialInstructions}
                        </p>
                      )}
                      {/* <p>
                        <span className='font-medium'>Created At:</span>{' '}
                        {formatDate(order?.date)}
                      </p> */}
                      {/* <p>
                        <span className='font-medium'>Last Updated:</span>{' '}
                        {formatDate(order?.updatedAt)}
                      </p> */}
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </ScrollArea>

              <div ref={footerRef} className="mt-auto pt-4">
                {order?.orderstatus === 'Pending' ? (
                  <PendingAction
                    setConfirmDialogOpen={setIsConfirmDialogOpen}
                    onClose={onClose}
                    order={order}
                    selectedTime={selectedTime}
                    setSelectedTime={setSelectedTime}
                    reason={reason}
                    setReason={setReason}
                  />
                ) : (
                  <OrderAction
                    order={order}
                    onClose={onClose}
                    setIsContactDialogOpen={setIsContactDialogOpen}
                  />
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <SuccessModal
        isOpen={isConfirmDialogOpen}
        label={
          <>
            Kitchen Receipt{' '}
            {isKitchenPrinting ? (
              <Icon size={15} name="Loader" className="animate-spin" />
            ) : (
              <Icon size={15} name="Printer" />
            )}
          </>
        }
        onClose={() => {
          setIsConfirmDialogOpen(false)
        }}
        onConfirm={() => {
          printKitchen({
            printtype: 'kitchenall',
            printingInProgress: false,
            printarea_name: 'kitchen',
            statusCode: '200%20OK',
            Printstatus: true,
            uniqueID: JSON.parse(order_data)?._id || order?._id,
          })
        }}
        title="Order Updated"
        description="Item has been sent to the kitchen."
      />

      <ContactModal
        order={order}
        isOpen={isContactDialogOpen}
        onClose={() => {
          setIsContactDialogOpen(false)
        }}
        onConfirm={() => {
          console.log('isConfirmDialogOpen')
          setIsContactDialogOpen(false)
        }}
      />
    </>
  )
}

export default OrderDetails
