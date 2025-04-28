'use client'

import React from 'react'
import { redirect, useParams, useRouter } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from 'react-query'
import iOrder, { iOrderBody, iReceiptBody } from '~/types/order'
// Libs
import Axios from '~/lib/axios'
import { cn, formatedModifiers } from '~/lib/utils'
import { OrderEndpoints, StaffEndpoints, TAX_RATE } from '~/lib/constants'
import { iProfile } from '~/types'
// Hooks
import { useApp } from '~/hooks/use-app'
import { useCart } from '~/hooks/use-cart'
import { useCustomer } from '~/hooks/use-customer'
import { printCustomerReceipt, updateOrder } from '~/hooks/use-order'
import { logout } from '~/app/pos/(auth)/login/actions'
// Components
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table'
import Icon from '~/components/icon'
import Header from '~/components/header'
import { Button } from '~/components/ui/button'
import PaidStamp from '~/components/paid-stamp'
import PayModal from '~/components/modals/pay-modal'
import { ScrollArea } from '~/components/ui/scroll-area'
import { Card, CardContent } from '~/components/ui/card'
import KeypadModal from '~/components/modals/keyad-modal'
import { ProtectedLink } from '~/components/ui/protected-link'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs'

const Checkout = () => {
  // Get id from params
  const { id } = useParams<{ id: string }>()

  if (!id) {
    return <h1>No Order Found!</h1>
  }

  const {
    splitQty,
    // total: orderTotal,
    // data,
    // note: specialInstructions,
    setTotal,
    clearCart,
    payMethods,
    resetPayMethods,
    splitPayments,
    setSplitPayments,
    currentSplitIndex,
    setCurrentSplitIndex,
    setTendered,
    partialPayments,
    resetPartialPayments,
    setRemainingAmount,
    isPayModalOpen,
    onPayModalClose,
    openPayModal,
    note,
    splitTips,
    resetTips,
    setSplitQty,
    sendToKitchen,
    setFinalizing,
    setDiscount,
    discount,
    setHideSendToKitchen,
    splitTaxAmounts,
    setSplitTaxAmounts,
  } = useCart()

  const [orderData, setOrderData] = React.useState<iOrder>()
  const [isSplitOpen, setIsSplitOpen] = React.useState(false)
  const [selectedTab, setSelectedTab] = React.useState<string>(
    `split-${currentSplitIndex}`
  )
  const cartData = orderData?.items || []

  React.useEffect(() => {
    setSplitPayments(new Array(Math.max(1, splitQty)).fill(0))
  }, [splitQty])

  const router = useRouter()
  const queryClient = useQueryClient()
  const { selectCustomer: customer, setSelectCustomer } = useCustomer()
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

  const { data: fetchedOrder, isFetching } = useQuery({
    queryKey: ['order', id],
    queryFn: async () => {
      const response = await Axios.get(OrderEndpoints.getById(id))
      return response.data
    },
    refetchOnMount: true,
  })

  React.useEffect(() => {
    setHideSendToKitchen(true)
    resetPartialPayments()
    resetPayMethods()
    resetTips()
    setSplitQty(1)
    if (fetchedOrder) {
      setOrderData(fetchedOrder?.data)
      // Calculate the total including item discounts
      const items = fetchedOrder?.data?.items || []
      const validItems = items.filter(
        item => item.itemStatus !== 'Voided' && item.itemStatus !== 'Refunded'
      )

      const itemsSubtotal = validItems.reduce((acc, item) => {
        const itemTotal = item.price * item.quantity
        const itemDiscountAmount = item.itemDiscount
          ? item.itemDiscount.type === '%'
            ? itemTotal * (item.itemDiscount.value / 100)
            : item.itemDiscount.value
          : 0
        return acc + (itemTotal - itemDiscountAmount)
      }, 0)

      // Only calculate tax for non-voided, non-refunded items with taxEnable
      const taxableItems = validItems.filter(item => item?.item?.taxEnable)
      const hasTaxableItems = taxableItems.length > 0

      const _discount = fetchedOrder?.data?.orderDiscount
      if (_discount && _discount.value > 0) {
        const discountAmount =
          _discount.type === '%'
            ? itemsSubtotal * (_discount.value / 100)
            : _discount.value
        const discountedTotal = itemsSubtotal - discountAmount

        const taxAmount = hasTaxableItems
          ? (discountedTotal * TAX_RATE) / 100
          : 0
        const total = discountedTotal + taxAmount

        setDiscount(_discount)
        setTotal(total)

        return
      } else {
        setDiscount({ type: '%', value: 0 })
        const taxAmount = hasTaxableItems ? (itemsSubtotal * TAX_RATE) / 100 : 0
        setTotal(itemsSubtotal + taxAmount)
      }

      if (discount && discount.value > 0) {
        const discountAmount =
          discount.type === '%'
            ? itemsSubtotal * (discount.value / 100)
            : discount.value
        const discountedTotal = itemsSubtotal - discountAmount

        const taxAmount = hasTaxableItems
          ? (discountedTotal * TAX_RATE) / 100
          : 0
        setTotal(discountedTotal + taxAmount)

        return
      }

      const taxAmount = hasTaxableItems ? (itemsSubtotal * TAX_RATE) / 100 : 0
      setTotal(itemsSubtotal + taxAmount)
    }
  }, [id, fetchedOrder])

  // Update calculations for item discount, subtotal, tax and total
  const subTotal = React.useMemo(() => {
    return (orderData?.items || [])
      .filter(item => item.itemStatus !== 'Voided') // Filter out voided items
      .reduce((acc, item) => {
        // Original price for the item quantity
        const itemTotal = item.price * item.quantity
        // Calculate item discount if it exists
        const itemDiscountAmount = item.itemDiscount
          ? item.itemDiscount.type === '%'
            ? itemTotal * (item.itemDiscount.value / 100)
            : item.itemDiscount.value
          : 0
        // Add the discounted amount to accumulator
        return acc + (itemTotal - itemDiscountAmount)
      }, 0)
  }, [orderData?.items])

  const discountAmount = React.useMemo(() => {
    if (!discount) return 0
    return discount.type === '%'
      ? subTotal * (discount.value / 100)
      : discount.value
  }, [subTotal, discount])

  const discountedTotal = subTotal - discountAmount

  const taxAmount = React.useMemo(() => {
    const nonVoidedItems =
      orderData?.items?.filter(item => item.itemStatus !== 'Voided') || []
    if (!nonVoidedItems.some(item => item?.item?.taxEnable)) return 0
    return (discountedTotal * TAX_RATE) / 100
  }, [discountedTotal, orderData?.items])

  const orderTotal = discountedTotal + taxAmount

  // Replace the splitAmounts calculation with this version that uses discountedTotal
  const splitAmounts = React.useMemo<number[]>(() => {
    if (splitQty <= 1) {
      return [discountedTotal]
    }
    const amounts: number[] = []
    const baseAmount = Math.floor((discountedTotal / splitQty) * 100) / 100
    let totalAssigned = 0
    for (let i = 0; i < splitQty - 1; i++) {
      amounts.push(baseAmount)
      totalAssigned += baseAmount
    }
    amounts.push(Number((discountedTotal - totalAssigned).toFixed(2)))
    return amounts
  }, [discountedTotal, splitQty])

  // Update splitTaxAmounts in Zustand whenever tax splits are recalculated
  React.useEffect(() => {
    if (splitQty <= 1) {
      setSplitTaxAmounts([taxAmount])
      return
    }
    const amounts: number[] = []
    const baseTaxAmount = Math.floor((taxAmount / splitQty) * 100) / 100
    let totalAssigned = 0
    for (let i = 0; i < splitQty - 1; i++) {
      amounts.push(baseTaxAmount)
      totalAssigned += baseTaxAmount
    }
    amounts.push(Number((taxAmount - totalAssigned).toFixed(2)))
    setSplitTaxAmounts(amounts)
  }, [taxAmount, splitQty, setSplitTaxAmounts])

  // Replace splitAmountsWithTip with splitTotals
  const splitTotals = React.useMemo<number[]>(() => {
    return splitAmounts.map((amount, index) => {
      // Add proportional tax
      const withTax = amount + splitTaxAmounts[index]
      // Add tip if exists
      const tip = splitTips[index] || { amount: 0, type: '%' }
      const tipValue =
        tip.type === '%' ? (withTax * tip.amount) / 100 : tip.amount
      return Number((withTax + tipValue).toFixed(2))
    })
  }, [splitAmounts, splitTaxAmounts, splitTips])

  // Update useEffect to use splitTotals
  React.useEffect(() => {
    const initialAmount = splitTotals[currentSplitIndex] || 0
    setRemainingAmount(initialAmount)
  }, [currentSplitIndex, splitTotals])

  // Function to calculate the total tip
  const totalTip = React.useMemo(() => {
    return splitTips.reduce((acc, tip, index) => {
      const baseAmount = splitAmounts[index]
      const tipValue =
        tip.type === '%' ? (baseAmount * tip.amount) / 100 : tip.amount
      return acc + tipValue
    }, 0)
  }, [splitTips, splitAmounts])

  // Update the order data
  const { mutate, isLoading } = useMutation({
    mutationKey: ['orders'],
    mutationFn: (data: iOrderBody) => {
      if (!orderData?._id) throw new Error('Order ID is required')
      return updateOrder({
        id: orderData._id,
        orderData: data,
      })
    },
    onMutate: async newOrder => {
      if (!orderData) return
      await queryClient.cancelQueries(['takeouts'])
      await queryClient.cancelQueries(['order', id])
      const prevData: iOrder[] = queryClient.getQueryData(['takeouts']) ?? []

      // Optimistically update the order data
      queryClient.setQueryData(['takeouts'], (old: any) => {
        if (!old) return []
        return old.map(order =>
          order._id === orderData._id ? { ...order, ...newOrder } : order
        )
      })

      // Optimistically update the order data for queryKey: ['order', id],
      queryClient.setQueryData(['order', id], (old: any) => {
        if (!old) return []
        return { ...old, ...newOrder }
      })

      return { prevData }
    },
    onSuccess: async () => {
      // Update the orders list
      queryClient.invalidateQueries('orders')
      queryClient.invalidateQueries(['order', id])
      // clear cart
      await clearCart()
      await setSelectCustomer(null)

      // Push to takeout page
      await router.push('/pos/takeout')
    },
    onError: (err, newTodo, context) => {
      // Rollback to the previous data
      if (context?.prevData) {
        queryClient.setQueryData(['takeouts'], context.prevData)
      }
    },
  })

  // console.log(orderData)

  // Set the loading state depanding on isLoading
  React.useEffect(() => {
    setFinalizing(isLoading)
  }, [isLoading])

  const handleUpdateOrder = async () => {
    const items: iOrderBody['items'] = cartData.map(({ _id, ...item }) => ({
      ...item,
      item: item.item,
      quantity: item.quantity,
      price: item.price,
      itemNote: item?.itemNote,
      origin: 'POS',
      modifiers: formatedModifiers(item?.modifiers) as string[],
      itemDiscount: item?.itemDiscount,
      itemStatus: item.itemStatus, // Preserve item status
    }))

    const _orderData: iOrderBody = {
      customer: customer?._id,
      phone: customer?.phone,
      orderType: 'Pickup',
      payments: payMethods,
      paymentStatus: 'Paid',
      subtotal: orderTotal - totalTip, // Exclude the total tip
      total: orderTotal,
      orderstatus: sendToKitchen ? 'InKitchen' : 'Complete',
      totalRefund: 0,
      items,
      tip: totalTip, // Include the total tip
      tax: taxAmount,
      orderDiscount:
        discount && discount?.value > 0 ? discount : orderData?.orderDiscount,
      specialInstructions: note !== '' ? note : orderData?.specialInstructions,
    }

    mutate(_orderData)
  }

  const handleNextPayment = (amount: number) => {
    setTendered('0') // Reset tendered amount for next payment
  }

  const handleTabChange = (value: string) => {
    const index = parseInt(value.split('-')[1], 10)
    if (!isNaN(index)) {
      setSelectedTab(value)
      setCurrentSplitIndex(index)
    }
  }

  const handleFinalize = () => {
    handleUpdateOrder()
  }

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
      console.log('SUCCESSS')
    },
    onError: (err, newTodo, context) => {
      console.log(err)
    },
  })

  // Handle print customer Allreceipt with react-query with the same function
  const {
    mutate: printAllCustomer,
    isLoading: isAllCustomerPrinting,
    isError: isAllCustomerError,
    error: allCustomerError,
    isSuccess: isAllCustomerPrinted,
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

  const allPaymentsCompleted = splitPayments.every(
    (payment: number, index: number) => payment >= splitTotals[index]
  )

  if (!orderData || isFetching) {
    return (
      <div className="flex items-center justify-center fixed left-0 top-0 w-full h-full z-50 bg-white/50">
        <div className="bg-white p-8 rounded-lg shadow-lg flex flex-col items-center">
          <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-primary" />
          <h4 className="text-center font-bold mt-4">Preparing...</h4>
          <p className="text-center text-gray-500">
            This will only take a moment! 🚀
          </p>
        </div>
      </div>
    )
  }

  console.log(splitTotals)

  return (
    <>
      <div>
        <Header />
        <div className="max-w-6xl h-[calc(100vh-48px)] mx-auto px-4 border-x shadow">
          <div className="flex justify-between items-center py-3 border-b">
            <ProtectedLink href={`/pos/orders/${id}`}>
              <Icon name="ArrowLeft" />
              Back to Orders
            </ProtectedLink>
            <div className="flex gap-2">
              <h4 className="text-lg">
                Order <strong>#{orderData.orderNumber}</strong>
              </h4>
            </div>
          </div>
          <div className="flex py-3">
            <div className="px-3 flex-1">
              <Tabs value={selectedTab} onValueChange={handleTabChange}>
                <TabsList className="h-auto p-0 m-0 bg-transparent grid gap-2 grid-cols-[repeat(auto-fill,minmax(160px,1fr))]">
                  {splitQty > 0 &&
                    Array.from({ length: splitQty }, (_, index) => (
                      <TabsTrigger
                        key={index}
                        className="p-0 !shadow-none group"
                        value={`split-${index}`}
                      >
                        <Card className="relative bg-gray-100 group-data-[state=active]:bg-blue-200 border-none rounded-sm text-black text-xs w-full">
                          <CardContent
                            className={cn(
                              'p-2.5',
                              splitPayments[index] >= splitTotals[index] &&
                                'opacity-65'
                            )}
                          >
                            {/* <div className='font-semibold text-left'>
                              Order #{orderData.orderNumber}
                            </div> */}
                            {splitQty > 1 && (
                              <div className="font-semibold text-left">
                                {index + 1} of {splitQty}
                              </div>
                            )}
                            <div className="space-y-1 mt-2">
                              <div className="flex justify-between">
                                <span>Subtotal:</span>
                                <strong>
                                  ${splitAmounts[index].toFixed(2)}
                                </strong>
                              </div>
                              {orderData?.items?.some(
                                item => item?.item?.taxEnable
                              ) && (
                                <div className="flex justify-between">
                                  <span>Tax ({TAX_RATE}%):</span>
                                  <strong>
                                    $(+){' '}
                                    {(splitTaxAmounts?.[index] || 0).toFixed(2)}
                                  </strong>
                                </div>
                              )}
                              {splitTips[index] && (
                                <div className="flex justify-between">
                                  <span>
                                    Tip (
                                    {splitTips[index].type === '%'
                                      ? splitTips[index].amount + '%'
                                      : '$' + splitTips[index].amount}
                                    ):
                                  </span>
                                  <strong>
                                    $
                                    {(splitTips[index].type === '%'
                                      ? (splitAmounts[index] +
                                          splitTaxAmounts[index]) *
                                        (splitTips[index].amount / 100)
                                      : splitTips[index].amount
                                    ).toFixed(2)}
                                  </strong>
                                </div>
                              )}
                              <div className="flex justify-between">
                                <span>Total:</span>
                                <strong>
                                  ${splitTotals[index].toFixed(2)}
                                </strong>
                              </div>
                              <div className="flex justify-between">
                                <span>Paid:</span>
                                <strong>
                                  ${(splitPayments[index] || 0).toFixed(2)}
                                </strong>
                              </div>
                              <div className="flex justify-between">
                                <span>Outstanding:</span>
                                <strong>
                                  $
                                  {Math.max(
                                    splitTotals[index] -
                                      (splitPayments[index] || 0),
                                    0
                                  ).toFixed(2)}
                                </strong>
                              </div>
                            </div>
                          </CardContent>
                          {splitPayments[index] >= splitTotals[index] && (
                            <PaidStamp className="w-full scale-90 h-full absolute inset-0" />
                          )}
                        </Card>
                      </TabsTrigger>
                    ))}
                </TabsList>
                {splitQty > 0 &&
                  Array.from({ length: splitQty }).map((_, index) => (
                    <TabsContent key={index} value={`split-${index}`}>
                      <div className="flex-grow rounded-md border">
                        <div className="p-0 text-base">
                          <ScrollArea>
                            <Table className="max-h-[500px]">
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Items</TableHead>
                                  <TableHead className="text-right">
                                    Amount
                                  </TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {cartData
                                  .filter(item => item.itemStatus !== 'Voided') // Filter voided items
                                  .map((item, index) => {
                                    const itemTotal = item.price * item.quantity
                                    const itemDiscountAmount = item.itemDiscount
                                      ? item.itemDiscount.type === '%'
                                        ? itemTotal *
                                          (item.itemDiscount.value / 100)
                                        : item.itemDiscount.value
                                      : 0
                                    const finalItemPrice =
                                      itemTotal - itemDiscountAmount

                                    return (
                                      <TableRow key={index}>
                                        <TableCell className="capitalize">
                                          {(item?.item?.name
                                            ? item?.item?.name
                                            : item?.item?.itemcustomname
                                          )?.toLowerCase() ?? 'Unknown Item'}
                                          <span className="mx-2">x</span>
                                          {item.quantity}
                                        </TableCell>
                                        <TableCell className="text-right">
                                          <p className="leading-none">
                                            {(item?.itemDiscount?.value ?? 0) >
                                              0 && (
                                              <del className="text-destructive/60 text-xs mr-1">
                                                $
                                                {(
                                                  item.price * item.quantity
                                                ).toFixed(2)}
                                              </del>
                                            )}
                                            ${(finalItemPrice || 0).toFixed(2)}
                                          </p>
                                        </TableCell>
                                      </TableRow>
                                    )
                                  })}
                              </TableBody>
                            </Table>
                          </ScrollArea>
                          <Table className="bg-gray-100 text-sm">
                            <TableBody>
                              <TableRow>
                                <TableCell className="font-bold">
                                  Subtotal:
                                </TableCell>
                                <TableCell className="font-bold text-right">
                                  ${subTotal.toFixed(2)}
                                </TableCell>
                              </TableRow>
                              {discount && discount.value > 0 && (
                                <TableRow>
                                  <TableCell className="font-bold text-primary">
                                    Discount (
                                    {discount.type === '%'
                                      ? `${discount.value}%`
                                      : '$' + discount.value}
                                    ):
                                  </TableCell>
                                  <TableCell className="font-bold text-right text-primary">
                                    (-) ${discountAmount.toFixed(2)}
                                  </TableCell>
                                </TableRow>
                              )}
                              {orderData?.items?.some(
                                item => item?.item?.taxEnable
                              ) && (
                                <TableRow>
                                  <TableCell className="font-bold">
                                    Tax ({TAX_RATE}%):
                                  </TableCell>
                                  <TableCell className="font-bold text-right">
                                    (+) ${taxAmount.toFixed(2)}
                                  </TableCell>
                                </TableRow>
                              )}
                              {splitTips[currentSplitIndex] && (
                                <TableRow>
                                  <TableCell className="font-bold text-green-600">
                                    Tip (
                                    {splitTips[currentSplitIndex].type === '%'
                                      ? splitTips[currentSplitIndex].amount +
                                        '%'
                                      : '$' +
                                        splitTips[currentSplitIndex].amount}
                                    ):
                                  </TableCell>
                                  <TableCell className="font-bold text-right text-green-600">
                                    (+) $
                                    {(splitTips[currentSplitIndex].type === '%'
                                      ? (splitAmounts[currentSplitIndex] *
                                          splitTips[currentSplitIndex].amount) /
                                        100
                                      : splitTips[currentSplitIndex].amount
                                    ).toFixed(2)}
                                  </TableCell>
                                </TableRow>
                              )}
                              <TableRow>
                                <TableCell className="font-bold">
                                  Total:
                                </TableCell>
                                <TableCell className="font-bold text-right">
                                  ${splitTotals[currentSplitIndex].toFixed(2)}
                                  {splitQty > 1 &&
                                    ` / $${(orderTotal + totalTip).toFixed(2)}`}
                                </TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell className="font-bold">
                                  {splitQty > 1 ? (
                                    <>
                                      Part {currentSplitIndex + 1}/{splitQty}{' '}
                                      Outstanding:
                                    </>
                                  ) : (
                                    <>Outstanding: </>
                                  )}
                                </TableCell>
                                <TableCell className="font-bold text-right">
                                  $
                                  {Math.max(
                                    splitTotals[currentSplitIndex] -
                                      (splitPayments[currentSplitIndex] || 0),
                                    0
                                  ).toFixed(2)}
                                </TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    </TabsContent>
                  ))}
              </Tabs>
            </div>

            <div className="w-72 flex flex-col gap-3">
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  className="w-full h-14"
                  onClick={() => setIsSplitOpen(true)}
                >
                  Split Bill
                  <Icon name="Split" />
                </Button>
                <Button
                  variant="secondary"
                  className="w-full h-14"
                  disabled={isCustomerPrinting}
                  onClick={() => {
                    printCustomer({
                      uniqueID: orderData?._id!!,
                      printtype: 'customer',
                      printingInProgress: false,
                      printarea_name: 'customer-receipt',
                      statusCode: '200%20OK',
                      splitqty: splitQty,
                      printQty: 1,
                      Printstatus: true,
                    })
                  }}
                >
                  {isCustomerPrinting ? (
                    <Icon name="Loader" className="animate-spin" />
                  ) : (
                    <Icon name="Printer" size={18} />
                  )}
                  Receipt
                </Button>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  className="w-full h-14"
                  disabled={isAllCustomerPrinting || isAllCustomerPrinted}
                  onClick={() => {
                    printAllCustomer({
                      uniqueID: orderData?._id!!,
                      printtype: 'customer',
                      printingInProgress: false,
                      printarea_name: 'customer-receipt',
                      statusCode: '200%20OK',
                      splitqty: splitQty,
                      printQty: splitQty,
                      Printstatus: false,
                    })
                  }}
                >
                  {isAllCustomerPrinting ? (
                    <Icon name="Loader" className="animate-spin" />
                  ) : (
                    <Icon
                      name={isAllCustomerPrinted ? 'PrinterCheck' : 'Printer'}
                      size={18}
                    />
                  )}
                  All Receipt
                </Button>
                <Button variant="secondary" className="w-full h-14">
                  Email Receipt
                </Button>
              </div>

              <Button
                className="h-24"
                disabled={isLoading}
                onClick={
                  splitPayments[currentSplitIndex] >=
                  splitTotals[currentSplitIndex]
                    ? currentSplitIndex < splitQty - 1
                      ? () => {
                          setCurrentSplitIndex(currentSplitIndex + 1)
                          setSelectedTab(`split-${currentSplitIndex + 1}`)
                        }
                      : handleFinalize
                    : () => openPayModal()
                }
              >
                {splitPayments[currentSplitIndex] >=
                splitTotals[currentSplitIndex]
                  ? currentSplitIndex < splitQty - 1
                    ? 'Next'
                    : 'Finalize'
                  : 'Pay Now'}
                <Icon name="CheckCheck" />
              </Button>
            </div>
          </div>
        </div>
      </div>
      <KeypadModal
        title="Split into how many portions?"
        isOpen={isSplitOpen}
        onClose={() => setIsSplitOpen(false)}
      />
      <PayModal
        handleFinalize={handleFinalize}
        isOpen={isPayModalOpen}
        onClose={onPayModalClose}
        onConfirm={handleNextPayment}
      />
    </>
  )
}

export default Checkout
