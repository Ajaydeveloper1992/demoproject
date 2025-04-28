'use client'

import React from 'react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { redirect, useParams, useRouter } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from 'react-query'
import {
  iModifier,
  iOrder,
  iOrderBody,
  iProfile,
  iReceiptBody,
  iRefundOrderBody,
  iVoidOrderBody,
} from '~/types'
// Hooks
import Axios from '~/lib/axios'
import { cn, populateModifiers, transformModifiers } from '~/lib/utils'
import { useCart } from '~/hooks/use-cart'
import { useProduct } from '~/hooks/use-product'
import OrderStatus from '~/components/OrderStatus'
import ConfirmDialog from '~/components/confirm-dialog'
import { OrderEndpoints, StaffEndpoints, TAX_RATE } from '~/lib/constants'
import {
  emailReceipt,
  printCustomerReceipt,
  refundOrder,
  updateOrder,
  useOrder,
  voidItem,
} from '~/hooks/use-order'
// Components
import { Card } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableHeader,
  TableFooter,
} from '~/components/ui/table'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '~/components/ui/breadcrumb'
import Icon from '~/components/icon'
import Layout from '~/components/layout'
import Header from '~/components/header'
import VoidModal from '~/components/modals/void-modal'
import RefundModal from '~/components/modals/refund-modal'
import ContactModal from '~/components/modals/contact-modal'
import SuccessModal from '~/components/modals/success-modal'
import { toast } from 'sonner'
import { logout, useApp } from '~/hooks/use-app'
import ReceiptModal from '~/components/modals/receipt-modal'

export default function OrderDetailsPage() {
  const { id } = useParams<{ id: string }>()

  if (!id) {
    return <h1>No Order Found!</h1>
  }

  const [isContactDialogOpen, setIsContactDialogOpen] = React.useState(false)
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = React.useState(false)
  const [isVoidDialogOpen, setIsVoidDialogOpen] = React.useState(false)
  const [isSuccessDialogOpen, setIsSuccessDialogOpen] = React.useState(false)
  const [isRefundDialogOpen, setIsRefundDialogOpen] = React.useState(false)
  const [isReceiptDialogOpen, setIsReceiptDialogOpen] = React.useState(false)

  const { setSelectedOrder, setIsOpenTakeout } = useOrder()
  const { data, setData } = useCart()
  const { modifiers } = useProduct()

  const { setIsAuthenticated } = useApp()
  const queryClient = useQueryClient()
  const router = useRouter()

  const onClose = () => {
    setSelectedOrder(null)
    setIsOpenTakeout(false)
  }

  const { data: order, isLoading: isFetching } = useQuery({
    queryKey: ['order', id],
    queryFn: async () => {
      const { data } = await Axios.get(OrderEndpoints.getById(id))
      return data?.data as iOrder
    },
    refetchOnMount: true,
  })

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

  // Handle complete
  const {
    mutate: handleComplete,
    isLoading: isCompleting,
    isSuccess: isCompleted,
  } = useMutation({
    mutationKey: ['order', id],
    mutationFn: () => {
      setIsConfirmDialogOpen(false)
      if (!order?._id) throw new Error('Order ID is required')
      return updateOrder({
        id: order._id,
        // @ts-ignore: tax is not required
        orderData: { orderstatus: 'Complete' as iOrderBody['orderstatus'] },
      })
    },
    onSuccess: () => {
      // Update the orders list
      queryClient.invalidateQueries('orders')

      onClose()
    },
    onError: (err, newTodo, context) => {
      // TODO: Handle error
    },
  })

  // Handle void
  const {
    mutate: handleVoid,
    isLoading: isVoiding,
    isError: isVoidError,
    error: voidError,
  } = useMutation({
    mutationKey: ['order', id],
    mutationFn: (data: iVoidOrderBody) => {
      if (!order?._id) throw new Error('Order ID is required')
      return voidItem({ id: order._id, body: data })
    },
    onMutate: async newOrder => {
      await queryClient.cancelQueries(['takeouts'])
      await queryClient.cancelQueries(['order', id])
      const prevData =
        queryClient.getQueryData<iOrder>(['order', id]) || ({} as iOrder)

      // Optimistically update the order data for queryKey: ['order', id],
      queryClient.setQueryData(['order', id], (old: any) => {
        // Find the item from old.items and update the refundQuantity and refundReason
        const updatedItems = newOrder.itemsToVoid?.map(item => {
          const oldItem = old.items.find((i: any) => i._id === item.itemId)
          return {
            ...oldItem,
            itemStatus: 'Voided',
            itemReason: item.itemVoidReason,
          }
        })

        return {
          ...old,
          items: old.items.map(
            (item: any) =>
              updatedItems?.find((i: any) => i._id === item._id) || item
          ),
        }
      })

      return { prevData }
    },
    onSuccess: () => {
      console.log('SUCCESSS')
      // Update the orders list
      queryClient.invalidateQueries('orders')
      queryClient.invalidateQueries(['order', id])
      setIsVoidDialogOpen(false)

      onClose()
    },
    onError: (err, newTodo, context) => {
      // Rollback to the previous data
      if (context?.prevData) {
        queryClient.setQueryData(['order', id], context.prevData)
      }
    },
  })

  // Handle refund
  const {
    mutate: handleRefund,
    isLoading: isRefunding,
    isError,
    error,
  } = useMutation({
    mutationKey: ['order', id],
    mutationFn: (data: iRefundOrderBody) => {
      if (!order?._id) throw new Error('Order ID is required')
      return refundOrder({ body: data })
    },
    onMutate: async newOrder => {
      await queryClient.cancelQueries(['takeouts'])
      await queryClient.cancelQueries(['order', id])
      const prevData =
        queryClient.getQueryData<iOrder>(['order', id]) || ({} as iOrder)

      // Optimistically update the order data for queryKey: ['order', id],
      queryClient.setQueryData(['order', id], (old: any) => {
        // Find the item from old.items and update the refundQuantity and refundReason
        const updatedItems = newOrder.itemsToRefund?.map(item => {
          const oldItem = old.items.find((i: any) => i._id === item.itemId)
          return {
            ...oldItem,
            itemStatus: 'Refunded',
            refundQuantity: item.refundQuantity,
            itemReason: item.refundReason,
          }
        })

        return {
          ...old,
          items: old.items.map(
            (item: any) =>
              updatedItems?.find((i: any) => i._id === item._id) || item
          ),
          paymentStatus: 'Partially Refunded',
        }
      })

      // Optimistically update the orderlist data for queryKey: ['orders']
      queryClient.setQueryData(['takeouts'], (old: any) => {
        console.log(old)
        const updatedOrder = old.find((o: any) => o._id === id)
        return old.map((o: any) =>
          o._id === id
            ? { ...updatedOrder, paymentStatus: 'Partially Refunded' }
            : old
        )
      })

      return { prevData }
    },
    onSuccess: () => {
      // Update the orders list
      queryClient.invalidateQueries('orders')
      queryClient.invalidateQueries(['order', id])

      setIsRefundDialogOpen(false)
      onClose()
    },
    onError: (err, newTodo, context) => {
      // Rollback to the previous data
      if (context?.prevData) {
        queryClient.setQueryData(['order', id], context.prevData)
      }
    },
  })

  // Handle print customer receipt with react-query
  const {
    mutate: printCustomer,
    isLoading: isCustomerPrinting,
    isError: isCustomerError,
    error: customerError,
  } = useMutation({
    mutationFn: (data: iReceiptBody) => {
      const restName = profile?.selectedRestaurants[0]?.url_slug
      if (!restName) throw new Error('Restaurant name is required')

      return printCustomerReceipt(restName, data)
    },
    onSuccess: () => {
      toast.success('Success', {
        description: 'Customer receipt printed',
      })
    },
    onError: (err, newTodo, context) => {
      console.log(err)
    },
  })

  const handleCheckout = () => {
    if (!order?._id) return
    // setData({ ...data, order: order })
    const cartData = order.items.map(item => {
      return {
        id: item.item._id,
        _id: item.item._id,
        name: item.item.name,
        price: item.price,
        quantity: item.quantity,
        modifiers: {},
        timestamp: new Date(),
        item: item.item,
        calculatedTotal: item.price * item.quantity,
        subTotal: item.price * item.quantity,
        note: item.itemNote,
      }
    })
    setData(cartData)
    console.log(order.items)
    console.log(cartData)
    console.log(data)

    // Push to checkout page
    router.push(`/orders/${order._id}/checkout`)
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

  const formatTime = (date: Date | undefined) => {
    if (!date) return 'N/A'
    return new Date(date).toLocaleString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const renderModifiers = (_modifiers: any) => {
    if (!_modifiers) return []
    const transformedModifiers = transformModifiers(_modifiers)
    return Object.keys(transformedModifiers).map(key => (
      <p
        key={key}
        className="text-[11px] tracking-tight text-gray-500 font-light capitalize"
      >
        <strong className="text-gray-600 font-bold">{key}:</strong>{' '}
        {populateModifiers(transformedModifiers, modifiers)
          [key].map(
            (modifier: iModifier) =>
              `${modifier?.name}${
                modifier?.priceAdjustment && modifier.priceAdjustment > 0
                  ? ` +($${modifier.priceAdjustment})`
                  : ''
              }`
          )
          .join(', ')}
      </p>
    ))
  }

  if (isFetching || !order) {
    return (
      <div className="flex items-center justify-center fixed left-0 top-0 w-full h-full z-50 bg-white/50">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-primary" />
      </div>
    )
  }

  const subtotal = order.items.reduce(
    (acc, item) =>
      acc +
      (item.price *
        (item.quantity -
          (item.refundQuantity || (item.itemStatus ? item.quantity : 0))) -
        (item.itemDiscount?.type === '%'
          ? (item.price * item.quantity * item.itemDiscount.value) / 100
          : item.itemDiscount?.value || 0)),
    0
  )

  const taxAmount = (subtotal * TAX_RATE) / 100

  const totalWithTax = (subtotal + taxAmount).toFixed(2)
  const totalWithTip = (Number(totalWithTax) + Number(order.tip || 0)).toFixed(
    2
  )
  const totalAfterDiscount = (
    Number(totalWithTip) -
    (order?.orderDiscount?.type === '%'
      ? (Number(totalWithTip) * order.orderDiscount.value) / 100
      : order.orderDiscount?.value || 0)
  ).toFixed(2)

  return (
    <>
      <Header />
      <Layout
        title={`Order #${order.orderNumber}`}
        BreadCrumb={OrderDetailsBreadcrumb}
        actionEl={
          <div className="flex gap-2">
            {order.origin !== 'POS' && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsContactDialogOpen(true)}
              >
                <Icon name="PhoneCall" size={15} />
                Contact Customer
              </Button>
            )}
            {order.orderstatus === 'InKitchen' &&
              order.paymentStatus !== 'Paid' &&
              order.paymentStatus !== 'Partially Refunded' && (
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={isVoiding}
                  onClick={() => setIsVoidDialogOpen(true)}
                >
                  <Icon name="Trash2" size={15} />
                  Void Order
                </Button>
              )}
            {(order?.paymentStatus === 'Paid' ||
              order?.paymentStatus === 'Partially Refunded') && (
              <Button
                size="sm"
                variant="destructive"
                disabled={isRefunding}
                onClick={() => setIsRefundDialogOpen(true)}
              >
                <Icon name="HandCoins" size={15} />
                Refund Order
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                printCustomer({
                  uniqueID: order?._id!!,
                  printtype: 'customer',
                  printingInProgress: false,
                  printarea_name: 'customer-receipt',
                  statusCode: '200%20OK',
                  Printstatus: true,
                })
              }
              disabled={isCustomerPrinting}
            >
              {isCustomerPrinting ? (
                <Icon name="Loader" className="animate-spin" />
              ) : (
                <Icon name="Printer" size={15} />
              )}
              Print Receipt
            </Button>
            {/* Email Receipt */}
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsReceiptDialogOpen(true)}
              disabled={isReceiptDialogOpen}
            >
              <Icon name="Mail" size={15} />
              Send Receipt
            </Button>
            {!isCompleted &&
              order?.paymentStatus === 'Paid' &&
              order.orderstatus !== 'Complete' && (
                <Button
                  size="sm"
                  disabled={isCompleting}
                  onClick={() => setIsConfirmDialogOpen(true)}
                >
                  {isCompleting ? (
                    <Icon name="Loader" className="animate-spin" />
                  ) : (
                    <Icon name="CheckCheck" size={15} />
                  )}
                  Complete Order
                </Button>
              )}
            {order.orderstatus === 'InKitchen' &&
              order.paymentStatus === 'Pending' && (
                <Button size="sm" onClick={handleCheckout}>
                  Checkout
                  <Icon name="ArrowRight" />
                </Button>
              )}
          </div>
        }
      >
        <div className="space-y-6 mt-6">
          {/* Order Status Banner */}
          <div className="flex justify-between items-center bg-muted p-4 rounded-lg">
            <div>
              <p className="text-sm text-gray-500">Order Time</p>
              <p className="font-medium">
                {formatDate(order.date)} | {formatTime(order.date)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Order Status</p>
              <OrderStatus
                className="mt-0.5"
                status={isCompleted ? 'Complete' : order?.orderstatus}
              />
            </div>
            {order?.pickupInfo?.delayTime ? (
              <div>
                <p className="text-sm text-gray-500">Delayed Time</p>
                <p className="text-destructive font-medium">
                  {order?.pickupInfo?.delayTime?.replace('-ASAP', '')}
                </p>
              </div>
            ) : (
              <div>
                <p className="text-sm text-gray-500">Pickup Time</p>
                <p className="font-medium text-destructive">
                  {order?.pickupInfo?.pickupTime?.replace('-ASAP', '') || 'N/A'}
                </p>
              </div>
            )}
            <div className="text-right">
              <p className="text-sm text-gray-500">Total</p>
              <p className="font-bold text-primary">
                ${order?.total.toFixed(2)}
              </p>
            </div>
          </div>

          {/* 2-Column Layout */}
          <div className="grid grid-cols-2 gap-4">
            {/* Order Information Card */}
            <Card className="p-6">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-sm font-semibold">Order Information</h3>
                  <p className="text-sm text-gray-500">
                    Created{' '}
                    {formatDistanceToNow(new Date(order.date), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-sm text-gray-500">Order Number</p>
                    <p className="font-medium">{order.orderNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Order Type</p>
                    <p className="font-medium">{order.orderType}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Origin</p>
                    <p className="font-medium">{order.origin}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Payment Status</p>
                    <Badge
                      variant={
                        order.paymentStatus === 'Paid'
                          ? 'default'
                          : 'destructive'
                      }
                    >
                      {order.paymentStatus}
                    </Badge>
                  </div>
                </div>

                {/* Additional Order Info */}
                <div className="grid grid-cols-2 gap-2">
                  {order.origin === 'POS' && (
                    <div className="col-span-2">
                      <p className="text-sm text-gray-500">Created By</p>
                      <p className="font-medium">
                        {order?.staffid?.fname || 'N/A'} {order?.staffid?.lname}
                      </p>
                    </div>
                  )}
                  {order.orderstatus === 'Voided' && (
                    <div className="col-span-2">
                      <p className="text-sm text-gray-500">Voided By</p>
                      <p className="font-medium">
                        {order?.voidedby?.fname || 'N/A'}{' '}
                        {order?.voidedby?.lname}
                      </p>
                    </div>
                  )}
                  {(order.orderstatus === 'Refunded' ||
                    order.orderstatus === 'Partially Refunded') && (
                    <div className="col-span-2">
                      <p className="text-sm text-gray-500">Refunded By</p>
                      <p className="font-medium">
                        {order?.refundby?.fname || 'N/A'}{' '}
                        {order?.refundby?.lname}
                      </p>
                    </div>
                  )}

                  {/* Special Instructions */}
                  {order.specialInstructions && (
                    <div className="border-t pt-2">
                      <h3 className="text-sm font-semibold">
                        Special Instructions
                      </h3>
                      <p className="text-gray-700">
                        {order.specialInstructions}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* Customer & Payment Details Card */}
            <Card className="p-6 space-y-2">
              {/* Customer Details */}
              <div>
                <h3 className="text-sm font-semibold mb-2">Customer Details</h3>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-sm text-gray-500">Name</p>
                      <p className="font-medium">
                        {order.customer?.firstName} {order.customer?.lastName}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Phone</p>
                      <p className="font-medium">{order.phone}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium">
                        {order?.customer?.email || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Special Instructions */}
              {order?.customer?.note && (
                <div className="border-t pt-2">
                  <h3 className="text-sm text-gray-500">Customer Note</h3>
                  <p className="font-medium">{order.customer.note}</p>
                </div>
              )}
            </Card>
          </div>

          {/* Order Items Section - Full width */}
          <Card className="p-4">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[200px]">
                      Item Details
                    </TableHead>
                    <TableHead className="text-center">Quantity</TableHead>
                    <TableHead className="text-center">Void/Refund</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Subtotal</TableHead>
                    <TableHead className="text-right">Discount</TableHead>
                    <TableHead className="text-right">Final Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.items.map(item => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="space-y-1">
                          {/* Item Name and Status */}
                          <div className="flex items-center gap-2">
                            <span className="font-medium capitalize">
                              {item?.item?.name?.toLowerCase()}
                            </span>
                            {item.itemStatus && (
                              <Badge
                                className={cn(
                                  item.itemStatus === 'Voided'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-orange-100 text-orange-800'
                                )}
                              >
                                {item.itemStatus}
                              </Badge>
                            )}
                          </div>

                          {/* Modifiers */}
                          <div>
                            {item.modifiers && renderModifiers(item.modifiers)}
                          </div>

                          {/* Item Note */}
                          {item.itemNote && (
                            <div className="text-sm text-gray-600">
                              <span className="font-medium">Note:</span>{' '}
                              {item.itemNote}
                            </div>
                          )}

                          {/* Void/Refund Reason */}
                          {item.itemReason && (
                            <div className="text-sm text-gray-600">
                              <span className="font-medium">
                                {item.itemStatus === 'Voided'
                                  ? 'Void Reason:'
                                  : 'Refund Reason:'}
                              </span>{' '}
                              {item.itemReason}
                            </div>
                          )}
                          {item.itemStatus === 'Voided' && (
                            <div className="text-sm text-gray-600">
                              <span className="font-medium">Voided By:</span>{' '}
                              {order?.voidedby?.fname || 'N/A'}{' '}
                              {order?.voidedby?.lname}
                            </div>
                          )}
                          {item.itemStatus === 'Refunded' && (
                            <div className="text-sm text-gray-600">
                              <span className="font-medium">Refunded By:</span>{' '}
                              {order?.refundby?.fname || 'N/A'}{' '}
                              {order?.refundby?.lname}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {item.quantity}
                      </TableCell>
                      <TableCell className="text-center">
                        {item.refundQuantity || item.itemStatus === 'Voided'
                          ? item.quantity
                          : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        ${item.price.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        ${(item.price * item.quantity).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        {item.itemDiscount && item.itemDiscount.value > 0 ? (
                          <span className="text-red-600">
                            -$
                            {(
                              (item.itemDiscount.type === '%'
                                ? (item.price *
                                    item.quantity *
                                    item.itemDiscount.value) /
                                  100
                                : item.itemDiscount.value) || 0
                            ).toFixed(2)}
                          </span>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        $
                        {(
                          item.price *
                            (item.quantity -
                              (item.refundQuantity ||
                                (item.itemStatus ? item.quantity : 0))) -
                          (item.itemDiscount?.type === '%'
                            ? (item.price *
                                item.quantity *
                                item.itemDiscount.value) /
                              100
                            : item.itemDiscount?.value || 0)
                        ).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={6}>Subtotal</TableCell>
                    <TableCell className="text-right">
                      ${(subtotal || 0).toFixed(2)}
                    </TableCell>
                  </TableRow>
                  {order.orderDiscount && order.orderDiscount.value > 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-destructive">
                        Discount{' '}
                        {order.orderDiscount.type === '%'
                          ? `(${order.orderDiscount.value}%)`
                          : ''}
                      </TableCell>
                      <TableCell className="text-right text-destructive">
                        -$
                        {(order.orderDiscount.type === '%'
                          ? (order.subtotal * order.orderDiscount.value) / 100
                          : order.orderDiscount.value
                        ).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  )}
                  {order.items?.some(item => item?.item?.taxEnable) && (
                    <TableRow>
                      <TableCell colSpan={6}>Tax ({TAX_RATE}%)</TableCell>
                      <TableCell className="text-right">
                        +$
                        {(taxAmount || 0).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  )}
                  {order.tip && order.tip > 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-green-600">
                        Tip
                      </TableCell>
                      <TableCell className="text-right text-green-600">
                        +${order.tip.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ) : null}
                  <TableRow className="border-t-2">
                    <TableCell colSpan={6} className="font-bold">
                      Total
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      ${totalAfterDiscount}
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>
          </Card>
        </div>
      </Layout>

      <ContactModal
        order={order}
        isOpen={isContactDialogOpen}
        onClose={() => setIsContactDialogOpen(false)}
        onConfirm={() => setIsContactDialogOpen(false)}
      />

      <VoidModal
        order={order}
        isOpen={isVoidDialogOpen}
        onClose={() => setIsVoidDialogOpen(false)}
        onConfirm={data => handleVoid(data)}
        loading={isVoiding}
        error={
          isVoidError
            ? (voidError as any)?.message || 'Something went wrong!'
            : ''
        }
      />

      <RefundModal
        order={order}
        isOpen={isRefundDialogOpen}
        onClose={() => setIsRefundDialogOpen(false)}
        onConfirm={data => handleRefund(data)}
        loading={isRefunding}
        error={
          isError ? (error as any)?.message || 'Something went wrong!' : ''
        }
      />

      <SuccessModal
        isOpen={isSuccessDialogOpen}
        onClose={() => setIsSuccessDialogOpen(false)}
        onConfirm={() => handleComplete()}
        title="Order Updated"
        description="Order has been updated successfully."
        label={
          <>
            Print Receipt <Icon name="Printer" size={15} />
          </>
        }
      />

      <ConfirmDialog
        isOpen={isConfirmDialogOpen}
        onClose={() => setIsConfirmDialogOpen(false)}
        onConfirm={handleComplete}
        title="Confirm Completion"
        description={
          <p>
            Are you sure want to complete this order?
            <br />
            This action cannot be undone!
          </p>
        }
      />

      <ReceiptModal
        id={id}
        order={order}
        isOpen={isReceiptDialogOpen}
        onClose={() => setIsReceiptDialogOpen(false)}
      />
    </>
  )
}

const OrderDetailsBreadcrumb = () => {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="/pos">Dashboard</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator>
          <Icon name="ChevronRight" />
        </BreadcrumbSeparator>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="/pos/orders/list">Orders</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator>
          <Icon name="ChevronRight" />
        </BreadcrumbSeparator>
        <BreadcrumbItem>
          <BreadcrumbPage>Details</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  )
}
