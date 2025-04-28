import React from 'react'
import { v4 } from 'uuid'
import { redirect, useParams, useRouter } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from 'react-query'
import {
  iOrder,
  iOrderBody,
  iProfile,
  iReceiptBody,
  iRefundOrderBody,
  iVoidOrderBody,
} from '~/types'
// Libs
import Axios from '~/lib/axios'
import { StaffEndpoints } from '~/lib/constants'
// Hooks
import { useApp } from '~/hooks/use-app'
import { useCart } from '~/hooks/use-cart'
import {
  printCustomerReceipt,
  printKitchenReceipt,
  refundOrder,
  updateOrder,
  voidItem,
} from '~/hooks/use-order'
import { logout } from '~/app/pos/(auth)/login/actions'
// Components
import Icon from '~/components/icon'
import { Button } from '~/components/ui/button'
import ConfirmDialog from '~/components/confirm-dialog'
import RefundModal from '~/components/modals/refund-modal'
import VoidModal from '~/components/modals/void-modal'

interface Props {
  order: iOrder
  onClose: () => void
  setIsContactDialogOpen: (isOpen: boolean) => void
}

const OrderAction = ({ order, onClose, setIsContactDialogOpen }: Props) => {
  // Get id from params
  const { id } = useParams<{ id: string }>()

  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = React.useState(false)
  const [isVoidDialogOpen, setIsVoidDialogOpen] = React.useState(false)
  const [isRefundDialogOpen, setIsRefundDialogOpen] = React.useState(false)

  const { data, setData } = useCart()
  const queryClient = useQueryClient()
  const router = useRouter()
  const { setIsAuthenticated } = useApp()

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
  const { mutate: handleComplete, isLoading } = useMutation({
    mutationKey: 'orders',
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
    mutationKey: 'orders',
    mutationFn: (data: iVoidOrderBody) => {
      if (!order?._id) throw new Error('Order ID is required')
      return voidItem({ id: order._id, body: data })
    },
    onSuccess: () => {
      console.log('SUCCESSS')
      // Update the orders list
      queryClient.invalidateQueries('orders')

      id && queryClient.invalidateQueries(['order', id])

      setIsVoidDialogOpen(false)

      onClose()
    },
    onError: (err, newTodo, context) => {
      console.log(err)
    },
  })

  // Handle refund
  const {
    mutate: handleRefund,
    isLoading: isRefunding,
    isError,
    error,
  } = useMutation({
    mutationKey: 'orders',
    mutationFn: (data: iRefundOrderBody) => {
      if (!order?._id) throw new Error('Order ID is required')
      return refundOrder({ body: data })
    },
    onSuccess: () => {
      console.log('SUCCESSS')
      // Update the orders list
      queryClient.invalidateQueries('orders')

      setIsRefundDialogOpen(false)

      onClose()
    },
    onError: (err, newTodo, context) => {
      console.log(err)
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
      data.Printstatus = false
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

  // Handle print customer receipt with react-query
  const {
    mutate: printCustomer,
    isLoading: isCustomerPrinting,
    isError: isCustomerError,
    error: customerError,
    isSuccess: isCustomerPrinted,
  } = useMutation({
    mutationFn: (data: iReceiptBody) => {
      const restName = profile?.selectedRestaurants[0]?.url_slug
      if (!restName) throw new Error('Restaurant name is required')

      return printCustomerReceipt(restName, data)
    },
    onSuccess: () => {
      console.log('SUCCESSS')
    },
    onError: (err, newTodo, context) => {
      console.log(err)
    },
  })

  const handleCheckout = () => {
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
    router.push(`/pos/orders/${order._id}/checkout`)
  }

  return (
    <>
      <div className="space-y-2">
        <div className="flex space-x-2">
          <Button
            className="w-full"
            variant="outline"
            size="sm"
            disabled={isCustomerPrinting}
            onClick={() => {
              printCustomer({
                uniqueID: order?._id!!,
                printtype: 'customer',
                printingInProgress: false,
                printarea_name: 'customer-receipt',
                statusCode: '200%20OK',
                Printstatus: true,
              })
            }}
          >
            {isCustomerPrinting ? (
              <Icon name="Loader" className="animate-spin" />
            ) : (
              <Icon name="Printer" size={18} />
            )}
            Customer Receipt
          </Button>
          <Button
            className="w-full"
            variant="outline"
            size="sm"
            disabled={isKitchenPrinting}
            onClick={() =>
              printKitchen({
                uniqueID: v4(),
                printtype: 'kitchenall',
                printingInProgress: false,
                printarea_name: 'kitchen',
                statusCode: '200%20OK',
                Printstatus: false,
              })
            }
          >
            {isKitchenPrinting ? (
              <Icon name="Loader" className="animate-spin" />
            ) : (
              <Icon name="Printer" size={18} />
            )}
            Kitchen Receipt
          </Button>
          <Button
            className="w-full"
            variant="outline"
            disabled={order.origin === 'POS'}
            size="sm"
            onClick={() => setIsContactDialogOpen(true)}
          >
            <Icon name="User" />
            Contact
          </Button>
        </div>
        <div className="flex h-16 space-x-2">
          {(order.paymentStatus === 'Paid' ||
            order.paymentStatus === 'Partially Refunded') && (
            <Button
              variant="destructive"
              className="w-full h-full"
              onClick={() => setIsRefundDialogOpen(true)}
              disabled={isRefunding}
            >
              {isRefunding ? (
                <Icon name="Loader" className="animate-spin" />
              ) : (
                <Icon name="HandCoins" className="mr-2" />
              )}
              Refund Order
            </Button>
          )}

          {order.orderstatus === 'InKitchen' &&
            order.paymentStatus === 'Pending' && (
              <Button
                variant="destructive"
                className="w-full h-full"
                onClick={() => setIsVoidDialogOpen(true)}
                disabled={isVoiding}
              >
                {isVoiding ? (
                  <Icon name="Loader" className="animate-spin" />
                ) : (
                  <Icon name="Trash2" className="mr-2" />
                )}
                Void Order
              </Button>
            )}

          {order.orderstatus === 'InKitchen' &&
            order.paymentStatus === 'Pending' && (
              <Button className="w-full h-full" onClick={handleCheckout}>
                Checkout
                <Icon name="ArrowRight" />
              </Button>
            )}

          {order.orderstatus === 'InKitchen' &&
            order.paymentStatus !== 'Pending' && (
              <Button
                className="w-full h-full"
                onClick={() => setIsConfirmDialogOpen(true)}
                disabled={isLoading}
              >
                Complete Order
                {isLoading ? (
                  <Icon name="Loader" className="animate-spin" />
                ) : (
                  <Icon name="CheckCheck" />
                )}
              </Button>
            )}

          {order.orderstatus !== 'InKitchen' && (
            <Button
              variant="destructive"
              className="w-full h-full"
              onClick={onClose}
            >
              Close
              <Icon name="X" />
            </Button>
          )}
        </div>
      </div>

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
    </>
  )
}

export default OrderAction
