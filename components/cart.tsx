'use client'

import React from 'react'
import Image from 'next/image'
import { v4 } from 'uuid'
import { redirect, useRouter } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from 'react-query'
import {
  iModifier,
  iOrder,
  iOrderBody,
  iProfile,
  iReceiptBody,
  iVoidOrderBody,
} from '~/types'
// Libs
import Axios from '~/lib/axios'
import { cn, formatedModifiers, populateModifiers } from '~/lib/utils'
// Hooks
import { useApp } from '~/hooks/use-app'
import { useProduct } from '~/hooks/use-product'
import { useCustomer } from '~/hooks/use-customer'
import { OrderEndpoints, StaffEndpoints, TAX_RATE } from '~/lib/constants'
import { sendToKitchen, useCart } from '~/hooks/use-cart'
import { logout } from '~/app/pos/(auth)/login/actions'
import {
  createOrder,
  printCustomerReceipt,
  printKitchenReceipt,
  updateOrder,
  useOrder,
  voidItem,
} from '~/hooks/use-order'
// Components
import Icon from '~/components/icon'
import { Button } from '~/components/ui/button'
import { ScrollArea } from '~/components/ui/scroll-area'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '~/components/ui/tooltip'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import ContactModal from '~/components/modals/contact-modal'
import VoidModal from '~/components/modals/void-modal'
import { toast } from 'sonner'

interface Props {
  type: 'takeout' | 'delivery'
  id?: string
}

const Cart = ({ type, id }: Props) => {
  const [bottomHeight, setBottomHeight] = React.useState(150)
  const [isContactDialogOpen, setIsContactDialogOpen] = React.useState(false)
  const [isVoidDialogOpen, setIsVoidDialogOpen] = React.useState(false)
  const [currentItem, setCurrentItem] = React.useState<iOrder['items'][0]>()

  const {
    onOpen: onCustomerOpen,
    selectCustomer: customer,
    setSelectCustomer,
  } = useCustomer()
  const { modifiers } = useProduct()
  const cart = useCart(s => s)
  const { setIsAuthenticated } = useApp()
  const queryClient = useQueryClient()

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

  const { data: orders } = useQuery({
    queryKey: ['takeouts'],
    queryFn: async () => {
      const { data } = await Axios.get(OrderEndpoints.takeouts)
      return data?.data as iOrder[]
    },
    refetchInterval: 5000, // 5 seconds
  })

  // Create new order
  const { mutateAsync, isLoading } = useMutation({
    mutationKey: ['orders'],
    mutationFn: (data: iOrderBody) => createOrder(data),
    onMutate: async newOrder => {
      toast.success('Success', {
        description: 'Order created successfully',
      })

      await queryClient.cancelQueries(['takeouts'])
      const prevData: iOrder[] = queryClient.getQueryData(['takeouts']) ?? []

      // Optimistically update the orders list - add to beginning
      queryClient.setQueryData(['takeouts'], (old: any) => {
        return old
          ? [
              {
                id: v4(),
                orderNumber: '_ORD-' + (prevData.length + 1),
                ...newOrder,
                customer,
              },
              ...old,
            ]
          : [newOrder]
      })

      return { prevData }
    },
    onSuccess: async res => {
      // clear cart
      await cart.clearCart()
      await setSelectCustomer(null)

      // Push to takeout page
      if (type === 'delivery') {
        // Push to checkout page
        return router.push(`/pos/orders/${res.data._id}/checkout`)
      } else {
        // Push to takeout page
        await router.push('/pos/takeout')
      }

      // Update the orders list
      await queryClient.invalidateQueries(['takeouts'])
    },
    onError: (err, newTodo, context) => {
      // Rollback the optimistic update
      if (context?.prevData) {
        queryClient.setQueryData(['takeouts'], context.prevData)
      }
    },
  })

  console.log(customer)

  // Update the order data
  const {
    mutate: update,
    isLoading: isSending,
    isSuccess: isUpdated,
  } = useMutation({
    mutationKey: ['orders'],
    mutationFn: (data: iOrderBody) => {
      if (!id) throw new Error('Order ID is required')
      return updateOrder({
        id,
        orderData: data,
      })
    },
    onSuccess: () => {
      // Update the orders list
      queryClient.invalidateQueries(['orders'])

      sendToKitchen()

      // Update printstatus for all items in the cart
      const updatedCartItems = cart.data.map(item => ({
        ...item,
        printstatus: true, // Set printstatus to true
      }))
      cart.setData(updatedCartItems) // Update the cart state

      toast.success('Success', {
        description: 'Sent to kitchen successfully',
      })
    },
    onError: (err, newTodo, context) => {
      // TODO: Handle error
    },
  })

  const router = useRouter()
  const cartBottomRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (cartBottomRef.current) {
      setBottomHeight(cartBottomRef.current.offsetHeight)
    }
  }, [cart])

  const handleSubmit = type => {
    console.log(type)

    if (type === 'delivery') {
      // Push to checkout page
      return router.push(`/pos/orders/checkout`)
    }

    const items: iOrderBody['items'] = cart.data.map(item => ({
      item: item.item,
      quantity: item.quantity,
      price: item.price,
      itemNote: item?.itemNote,
      modifiers: formatedModifiers(item?.modifiers) as string[],
      itemDiscount: item?.itemDiscount,
    }))

    const orderData: iOrderBody = {
      customer: customer?._id,
      phone: customer?.phone,
      orderType: 'Pickup',
      // payments: cart.payMethods,
      paymentStatus: 'Pending',
      subtotal: cart.total,
      total: Number(orderTotal),
      orderstatus: 'InKitchen',
      items,
      totalRefund: 0,
      tax: orderTax,
      specialInstructions: cart?.note,
      orderDiscount: cart?.discount,
    }

    console.log(orderData)

    mutateAsync(orderData)
  }

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
      toast.success('Success', {
        description: 'Kitchen receipt printed',
      })
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

  const currentOrder = orders && orders.find(order => order._id === id)

  // Handle Print Quote
  const handlePrintQuote = () => {
    printKitchen({
      uniqueID: currentOrder?._id || v4(),
      printtype: 'quote',
      printingInProgress: false,
      printarea_name: 'customer-receipt',
      statusCode: '200%20OK',
      Printstatus: true,
      // Required fields for quote type
      orderNumber: currentOrder?.orderNumber || `QUOTE-${v4().slice(0, 8)}`,
      createdAt: new Date(),
      subtotal: subTotal,
      tax: orderTax,
      tip: 0,
      total: Number(orderTotal),
      storedetails: {
        name: profile?.selectedRestaurants[0]?.name || '',
        businessPhone: profile?.selectedRestaurants[0]?.businessPhone || '',
        ownerEmail: profile?.selectedRestaurants[0]?.ownerEmail || '',
        address: profile?.selectedRestaurants[0]?.address || '',
        receiptForExistingCustomer: !!customer,
      },
      customer: {
        customertype: customer?.customertype || 'guest',
        name: customer
          ? `${customer.firstName || ''} ${customer.lastName || ''}`.trim()
          : 'Guest Customer',
        phone: customer?.phone || '',
      },
      items: cart.data
        .filter(item => item.itemStatus !== 'Voided')
        .map(item => ({
          item: {
            name: item?.item?.name || item?.itemcustomname || 'Unknown Item',
            webprice: item?.item?.webprice || item.price,
          },
          quantity: item.quantity,
          price: item.price,
          itemNote: item.itemNote || '',
          itemDiscount: item.itemDiscount || {
            type: '$',
            value: 0,
          },
          modifiers: Object.keys(item?.modifiers || {}).flatMap(key => {
            return populateModifiers(item?.modifiers, modifiers)[key].map(
              (modifier: iModifier) => ({
                name: modifier.name,
                priceAdjustment: modifier.priceAdjustment || 0,
                modifiersgroup: {
                  pos: {
                    name: key,
                  },
                  modifiers: [
                    {
                      name: modifier.name,
                      priceAdjustment: modifier.priceAdjustment || 0,
                    },
                  ],
                },
              })
            )
          }),
        })),
      nuviepaymentinfo: {
        method: 'Quote',
        status: 'Pending',
      },
    })
  }

  React.useEffect(() => {
    if (currentOrder && currentOrder.orderstatus === 'Voided') {
      cart.clearCart()
      setSelectCustomer(null)
      router.push('/pos/orders/new')
    }
  }, [currentOrder])

  // Handle void item
  const {
    mutate: handleVoid,
    isLoading: isVoiding,
    isError: isVoidError,
    error: voidError,
  } = useMutation({
    mutationKey: 'orders',
    mutationFn: (data: iVoidOrderBody) => {
      if (!id) throw new Error('Order ID is required')
      return voidItem({ id, body: data })
    },
    onSuccess: () => {
      toast.success('Success', {
        description: 'Item voided successfully',
      })

      // Update the orders list
      queryClient.invalidateQueries('orders')
      queryClient.invalidateQueries(['order', id])
      setIsVoidDialogOpen(false)

      cart.removeCart(currentItem?.id!!)
    },
    onError: (err, newTodo, context) => {
      console.log(err)
    },
  })

  const handleCheckout = async () => {
    if (cart.data.some(item => !item.inKitchen)) {
      // @ts-ignore
      const _orderBody: iOrderBody = {
        ...currentOrder,
        orderType: currentOrder?.orderType || 'Pickup',
        subtotal: cart.total,
        total: Number(orderTotal),
        totalRefund: 0,
        items: cart.data.map(({ _id, ...item }) => ({
          ...item,
          item: item.item,
          quantity: item.quantity,
          price: item.price,
          modifiers: formatedModifiers(item?.modifiers) as string[],
          itemNote: item?.itemNote,
          itemDiscount: item?.itemDiscount,
        })),
        tax: orderTax,
        orderDiscount: cart?.discount,
      }

      return update(_orderBody)
    }

    // clear cart
    // cart.clearCart()
    // setSelectCustomer(null)

    // Push to checkout page
    router.push(`/pos/orders/${id}/checkout`)
  }

  // Calculate orderTax after applying discounts and coupon discounts
  const subTotal = React.useMemo(() => {
    return cart.data
      .filter(item => item.itemStatus !== 'Voided') // Filter out voided items
      .reduce((acc, item) => {
        const itemTotal = item.price * item.quantity
        const itemDiscountAmount = item.itemDiscount
          ? item.itemDiscount.type === '%'
            ? itemTotal * (item.itemDiscount.value / 100)
            : item.itemDiscount.value
          : 0
        return acc + (itemTotal - itemDiscountAmount)
      }, 0)
  }, [cart.data])

  const discountAmount = React.useMemo(() => {
    return (
      (cart?.discount?.type === '%'
        ? subTotal * (cart?.discount?.value / 100)
        : (cart?.discount?.value ?? 0)) +
      (cart?.coupon?.code !== ''
        ? cart.coupon?.type === '%'
          ? subTotal * (cart.coupon?.discount / 100)
          : (cart.coupon?.discount ?? 0)
        : 0)
    )
  }, [subTotal, cart?.discount, cart?.coupon])

  const discountedTotal = subTotal - discountAmount

  const orderTax = React.useMemo(() => {
    const nonVoidedItems = cart.data.filter(
      item => item.itemStatus !== 'Voided'
    )
    return (
      ((discountedTotal * TAX_RATE) / 100) *
      (Array.isArray(nonVoidedItems) &&
      nonVoidedItems.some(item => item?.item?.taxEnable)
        ? 1
        : 0)
    )
  }, [discountedTotal, cart.data])

  const orderTotal = React.useMemo(() => {
    return (discountedTotal + orderTax).toFixed(2)
  }, [discountedTotal, orderTax])

  console.log(cart?.data)

  return (
    <>
      <div className="bg-white shadow-md w-[450px] flex flex-col justify-between">
        <div className="relative flex justify-between items-center bg-primary text-white text-sm h-12">
          <Button
            size="icon"
            variant="ringHover"
            className="ml-2 size-8"
            disabled={isKitchenPrinting}
            onClick={() =>
              printKitchen({
                uniqueID: currentOrder?._id!!,
                printtype: 'kitchenall',
                printingInProgress: false,
                printarea_name: 'kitchen',
                statusCode: '200%20OK',
                Printstatus: true,
              })
            }
          >
            {isKitchenPrinting ? (
              <Icon name="Loader" className="animate-spin" />
            ) : (
              <Icon name="Printer" size={18} />
            )}
          </Button>
          <h4 className="truncate pl-3 pr-6 font-semibold capitalize flex gap-2 items-center">
            Takeout ({id ? currentOrder?.orderNumber : 'new'}) -
            {!customer || customer === null ? (
              <Button
                variant="link"
                size="sm"
                className="text-white px-0"
                onClick={onCustomerOpen}
              >
                Add Customer <Icon name="UserPlus" className="!w-4 !h-4" />
              </Button>
            ) : (
              <Button
                variant="link"
                size="sm"
                className="text-white px-0 capitalize"
                onClick={onCustomerOpen}
              >
                {(customer?.firstName + ' ' + customer?.lastName).toLowerCase()}
              </Button>
            )}
          </h4>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="secondary"
                className="!p-2 rounded-full !bg-transparent !text-white hover:!text-white/70"
              >
                <Icon name="EllipsisVertical" className="!w-6 !h-6" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[120px]">
              <DropdownMenuItem onClick={onCustomerOpen}>
                <Icon name="Users" />
                Customer
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Icon name="UserCog" />
                Staff
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handlePrintQuote}>
                <Icon name="Printer" />
                Print Quote
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {id ? (
                <DropdownMenuItem
                  className="bg-rose-100 !text-rose-900 hover:!bg-rose-200"
                  onClick={() => setIsVoidDialogOpen(true)}
                  disabled={isVoiding}
                >
                  {isVoiding ? (
                    <Icon name="Loader" className="animate-spin" />
                  ) : (
                    <Icon name="Trash2" className="mr-2" />
                  )}
                  Void Order
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  className="bg-rose-100 !text-rose-900 hover:!bg-rose-200"
                  onClick={() => cart.clearCart()}
                >
                  <Icon name="Trash2" />
                  Clear
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <ScrollArea
          className="pr-1"
          style={{
            height: `calc(100vh - ${48 + bottomHeight}px)`,
          }}
        >
          {Array.isArray(cart.data) &&
            cart.data
              .filter(item => item.itemStatus !== 'Voided') // Only filter during rendering
              .map(item => (
                <div
                  key={item.id}
                  className={cn(
                    'flex justify-between items-center border-b last:border-b-0 border-pink-100 bg-slate-50 py-1.5 px-0.5 gap-1 even:bg-blue-50 select-none cursor-pointer text-sm leading-normal border-l-2 border-transparent hover:border-l-primary transition-colors',
                    item.inKitchen &&
                      'border-l-primary bg-primary/10 opacity-75 cursor-default'
                  )}
                  onClick={e => {
                    e.stopPropagation()
                    if (item.inKitchen) return
                    cart.setModalType('cart')
                    cart.onOpen()
                    cart.setSelectCart({
                      ...item,
                      quantity: item.quantity,
                      itemNote: item.itemNote,
                      itemDiscount: item.itemDiscount,
                      modifiers: item.modifiers,
                    })
                  }}
                >
                  <Button
                    size="icon"
                    variant="ghost"
                    className="rounded-full w-6 h-6"
                    onClick={e => e.stopPropagation()}
                  >
                    <Icon name="Check" />
                  </Button>
                  <div className="flex-1">
                    <div className="flex items-center gap-1 font-semibold -tracking-[0.25px] capitalize">
                      <p className="">
                        {item.quantity} x{' '}
                        {(item?.item?.name
                          ? item?.item?.name
                          : item?.itemcustomname
                        )?.toLowerCase() ?? 'Unknown Item'}
                      </p>
                      <p className="text-destructive leading-none">
                        (
                        {(item?.itemDiscount?.value ?? 0) > 0 && (
                          <del className="text-destructive/60 text-xs mr-0.5">
                            ${(item.price * item.quantity).toFixed(2)}
                          </del>
                        )}
                        ${(item?.subTotal || 0).toFixed(2)})
                      </p>
                    </div>
                    {item?.modifiers &&
                      Object.keys(item?.modifiers).map(key => (
                        <p
                          key={key}
                          className="text-[11px] tracking-tight text-gray-500 font-light capitalize"
                        >
                          <strong className="text-gray-600 font-bold">
                            {key}:
                          </strong>{' '}
                          {populateModifiers(item?.modifiers, modifiers)
                            [key].map(
                              (modifier: iModifier) =>
                                `${modifier?.name}${
                                  modifier?.priceAdjustment &&
                                  modifier.priceAdjustment > 0
                                    ? ` +($${modifier.priceAdjustment})`
                                    : ''
                                }`
                            )
                            .join(', ')}
                        </p>
                      ))}

                    {item?.itemNote && (
                      <p className="text-[11px] tracking-tight text-gray-500 font-light capitalize">
                        <strong className="text-gray-600 font-bold">
                          Note:
                        </strong>{' '}
                        {item?.itemNote}
                      </p>
                    )}
                  </div>
                  <p className="text-xs tracking-tighter font-semibold">
                    {new Date(item.timestamp).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </p>
                  {item._id === '6714dd1f6f8b783f8987af3e' ? (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="rounded-full"
                    >
                      <Image
                        src="/restaurant.svg"
                        alt="Soup"
                        width={22}
                        height={22}
                        className="rounded-full"
                      />
                    </Button>
                  ) : (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="rounded-full"
                    >
                      <Image
                        src="/walk.svg"
                        alt="Soup"
                        width={22}
                        height={22}
                        className="rounded-full"
                      />
                    </Button>
                  )}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="icon"
                        variant="ghost"
                        disabled={item.inKitchen}
                        className="rounded-full text-destructive hover:text-rose-700 hover:bg-rose-100 -ml-2 w-7 h-7"
                        onClick={e => {
                          e.stopPropagation()
                          if (item.inKitchen) {
                            setCurrentItem(item)
                            setIsVoidDialogOpen(true)
                          } else {
                            cart.removeCart(item.id)
                          }
                        }}
                      >
                        <Icon name="X" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="left" className="bg-destructive">
                      {item.inKitchen ? 'Void Item' : 'Remove Item'}
                    </TooltipContent>
                  </Tooltip>
                </div>
              ))}
        </ScrollArea>
        <div ref={cartBottomRef}>
          <div className="flex justify-between items-center px-3 py-1 border-t tracking-wider text-sm">
            <span className="font-semibold">Add:</span>
            <div className="space-x-1">
              <Button
                variant={cart?.note !== '' ? 'destructive' : 'link'}
                size="sm"
                className="rounded-full px-2 h-6"
                onClick={() => cart.openNoteModal()}
              >
                Note
              </Button>
              <Button
                variant={cart?.discount?.value !== 0 ? 'destructive' : 'link'}
                size="sm"
                className="rounded-full px-2 h-6"
                onClick={() => cart.openDiscountModal()}
              >
                Discount
              </Button>
              <Button
                variant={cart?.coupon?.code !== '' ? 'destructive' : 'link'}
                size="sm"
                className="rounded-full px-2 h-6"
                onClick={() => cart.openCouponModal()}
              >
                Coupon
              </Button>
              {currentOrder?.origin === 'POS' ? (
                <Button
                  variant="link"
                  size="sm"
                  className="rounded-full px-2 h-6"
                  onClick={() => console.log('Select Seller')}
                >
                  Seller
                </Button>
              ) : (
                <Button
                  variant="link"
                  size="sm"
                  className="rounded-full px-2 h-6 gap-0.5"
                  onClick={() => setIsContactDialogOpen(true)}
                >
                  Contact
                </Button>
              )}
              <Button
                variant={cart?.fee?.length !== 0 ? 'destructive' : 'link'}
                size="sm"
                className="rounded-full px-2 h-6"
                onClick={() => cart.openItemModal()}
              >
                Add Item
              </Button>
            </div>
          </div>
          <div className="flex justify-between items-center px-6 py-1.5 border-t tracking-wider text-sm">
            <span className="font-semibold">Sub Total:</span>
            <span className="font-bold text-destructive">
              ${subTotal.toFixed(2)}
            </span>
          </div>
          {cart?.fee?.length !== 0 && (
            <div
              className="relative flex justify-between items-center px-6 py-1.5 border-t tracking-wider text-xs cursor-pointer hover:bg-slate-50"
              onClick={e => {
                e.stopPropagation()
                cart.openItemModal()
              }}
            >
              <div className="flex gap-1 items-center">
                <span className="font-semibold">Fee:</span>
                {cart?.fee?.map(fee => (
                  <p
                    key={fee.title}
                    className="text-[10px] px-1 !bg-black/15 rounded-sm max-w-[100px] truncate"
                  >
                    {fee.title}
                  </p>
                ))}
              </div>
              <span className="font-bold text-destructive">
                + $
                {(
                  cart.fee.reduce((acc, fee) => {
                    if (fee.type === '%') {
                      return acc + (subTotal * fee.value) / 100
                    }
                    return acc + fee.value
                  }, 0) || 0
                ).toFixed(2)}
              </span>
            </div>
          )}
          {cart?.discount?.value !== 0 && (
            <div
              className="relative flex justify-between items-center px-6 py-1.5 border-t tracking-wider text-xs cursor-pointer hover:bg-slate-50"
              onClick={e => {
                e.stopPropagation()
                cart.openDiscountModal()
              }}
            >
              <span className="font-semibold">
                Discount
                {cart?.discount?.type === '%' && (
                  <span className="text-primary mx-0.5">
                    ({cart?.discount?.value}%)
                  </span>
                )}
                :
              </span>
              <span className="font-bold text-primary">
                - ${discountAmount.toFixed(2)}
              </span>
              <Button
                size="icon"
                variant="ghost"
                className="rounded-full ml-1 w-6 h-6 hover:bg-destructive/30 hover:text-destructive absolute right-0"
                onClick={async e => {
                  e.stopPropagation()
                  if (id) {
                    // @ts-ignore
                    update({ orderDiscount: { type: '$', value: 0 } })
                  }
                  cart.setDiscount({ type: '$', value: 0 })
                }}
              >
                <Icon name="Trash2" />
              </Button>
            </div>
          )}
          {cart?.coupon?.code !== '' && (
            <div
              className="relative flex justify-between items-center px-6 py-1.5 border-t tracking-wider text-xs cursor-pointer hover:bg-slate-50"
              onClick={e => {
                e.stopPropagation()
                cart.openCouponModal()
              }}
            >
              <div className="flex gap-1 items-center">
                <span className="font-semibold">Coupon:</span>
                <p className="text-[10px] px-1 !bg-black/15 rounded-sm max-w-[100px] truncate">
                  {cart?.coupon?.code}
                </p>
              </div>
              <span className="font-bold text-primary">
                - {cart?.coupon?.type === '$' && '$'}
                {(cart?.coupon?.discount || 0).toFixed(2)}
                {cart?.coupon?.type === '%' && '%'}
              </span>
              <Button
                size="icon"
                variant="ghost"
                className="rounded-full ml-1 w-6 h-6 hover:bg-destructive/30 hover:text-destructive absolute right-0"
                onClick={e => {
                  e.stopPropagation()
                  cart.setCoupon({ code: '', discount: 0, type: '%' })
                }}
              >
                <Icon name="Trash2" />
              </Button>
            </div>
          )}
          {Array.isArray(cart.data) &&
            cart.data.some(item => item?.item?.taxEnable) && (
              <div className="flex justify-between items-center px-6 py-1.5 border-t tracking-wider text-xs">
                <span className="font-semibold">
                  Tax <span className="text-destructive">({TAX_RATE}%)</span>:
                </span>
                <span className="font-bold text-destructive">
                  + ${orderTax.toFixed(2)}
                </span>
              </div>
            )}
          <div className="flex justify-between h-14 border-y border-primary">
            <Button
              variant="secondary"
              className="rounded-none h-full w-16 border-x border-primary"
            >
              <Icon name="FileText" className="!w-5 !h-5" />
            </Button>
            <Button
              variant="secondary"
              className="rounded-none h-full w-16"
              onClick={() => {
                printCustomer({
                  uniqueID: currentOrder?._id!!,
                  printtype: 'customer',
                  printingInProgress: false,
                  printarea_name: 'customer-receipt',
                  statusCode: '200%20OK',
                  Printstatus: true,
                })
              }}
              disabled={isCustomerPrinting}
            >
              {isCustomerPrinting ? (
                <Icon name="Loader" className="animate-spin" />
              ) : (
                <Icon name="Printer" size={18} />
              )}
            </Button>
            {type === 'takeout' ? (
              <Button
                className="w-full h-full rounded-none font-semibold text-base"
                disabled={(cart.data && cart.data.length === 0) || isLoading}
                onClick={() => handleSubmit('takeout')}
              >
                {isLoading ? (
                  <Icon name="Loader" className="ml-2 !h-6 !w-6 animate-spin" />
                ) : (
                  <Icon name="Soup" className="ml-2 !h-6 !w-6" />
                )}
                Send to Kitchen
                <span>(${orderTotal})</span>
              </Button>
            ) : id ? (
              <Button
                className="w-full h-full rounded-none font-semibold text-base"
                disabled={
                  (cart.data && cart.data.length === 0) ||
                  isLoading ||
                  isSending
                }
                onClick={handleCheckout}
              >
                {/* Send to Kitchen if any item left with InKitchen status false */}
                {cart.data.some(item => !item.inKitchen) ? (
                  <>
                    Send to Kitchen
                    <Icon name="Soup" />
                  </>
                ) : (
                  <>
                    Checkout
                    <span>(${orderTotal})</span>
                  </>
                )}
              </Button>
            ) : (
              <Button
                className="w-full h-full rounded-none font-semibold text-base"
                disabled={(cart.data && cart.data.length === 0) || isLoading}
                // onClick={() => router.push('/pos/orders/checkout')}
                onClick={() => handleSubmit('delivery')}
              >
                Confirm Order
                <span>(${orderTotal})</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      <ContactModal
        order={currentOrder!!}
        isOpen={isContactDialogOpen}
        onClose={() => {
          setIsContactDialogOpen(false)
        }}
        onConfirm={() => {
          console.log('isConfirmDialogOpen')
          setIsContactDialogOpen(false)
        }}
      />

      <VoidModal
        order={currentOrder!!}
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
    </>
  )
}
export default Cart
