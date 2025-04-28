'use client'

import React from 'react'
import { v4 } from 'uuid'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMutation, useQueryClient } from 'react-query'
import iOrder, { iOrderBody } from '~/types/order'
// Hooks
import { useCart } from '~/hooks/use-cart'
import { createOrder } from '~/hooks/use-order'
import { useCustomer } from '~/hooks/use-customer'
import { cn, formatedModifiers } from '~/lib/utils'
import { TAX_RATE } from '~/lib/constants'
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
import { Card, CardContent } from '~/components/ui/card'
import KeypadModal from '~/components/modals/keyad-modal'
import { ScrollArea } from '~/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs'

const page = () => {
  const { selectCustomer: customer, setSelectCustomer } = useCustomer()
  const {
    splitQty,
    // total: orderTotal,
    setTotal,
    data,
    note: orderNote,
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
    splitTips,
    resetTips,
    setSplitQty,
    sendToKitchen,
    setFinalizing,
    discount,
    setHideSendToKitchen,
    splitTaxAmounts,
    setSplitTaxAmounts,
  } = useCart()

  React.useEffect(() => {
    setHideSendToKitchen(false)
    setSplitQty(1)
    resetPartialPayments()
    resetPayMethods()
    resetTips()
  }, [])

  const [isSplitOpen, setIsSplitOpen] = React.useState(false)
  const [selectedTab, setSelectedTab] = React.useState<string>(
    `split-${currentSplitIndex}`
  )

  React.useEffect(() => {
    setSplitPayments(new Array(Math.max(1, splitQty)).fill(0))
  }, [splitQty])

  const router = useRouter()
  const queryClient = useQueryClient()

  // Calculate the total including item discounts
  const subTotal = React.useMemo(() => {
    return data.reduce((acc, item) => {
      const itemTotal = item.price * item.quantity
      const itemDiscountAmount = item.itemDiscount
        ? item.itemDiscount.type === '%'
          ? itemTotal * (item.itemDiscount.value / 100)
          : item.itemDiscount.value
        : 0
      return acc + (itemTotal - itemDiscountAmount)
    }, 0)
  }, [data])

  const discountAmount = React.useMemo(() => {
    if (!discount) return 0
    return discount.type === '%'
      ? subTotal * (discount.value / 100)
      : discount.value
  }, [subTotal, discount])

  const discountedTotal = subTotal - discountAmount

  const taxAmount = React.useMemo(() => {
    if (!data.some(item => item?.item?.taxEnable)) return 0
    return (discountedTotal * TAX_RATE) / 100
  }, [discountedTotal, data])

  const orderTotal = discountedTotal + taxAmount

  React.useEffect(() => {
    setTotal(discountedTotal) // Changed from orderTotal to discountedTotal
  }, [discountedTotal, setTotal])

  // Modify splitAmounts to use discountedTotal (pre-tax) instead of orderTotal
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

  // Initialize splitTaxAmounts as early as possible
  React.useEffect(() => {
    if (!splitTaxAmounts || splitTaxAmounts.length === 0) {
      setSplitTaxAmounts([taxAmount])
    }
  }, [taxAmount])

  // Move the tax split calculation earlier in the component
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

  // Calculate totals including tax and tips
  const splitTotals = React.useMemo<number[]>(() => {
    return splitAmounts.map((amount, index) => {
      // Add proportional tax
      const withTax = amount + (splitTaxAmounts?.[index] ?? 0)
      // Add tip if exists
      const tip = splitTips[index] || { amount: 0, type: '%' }
      const tipValue =
        tip.type === '%' ? (withTax * tip.amount) / 100 : tip.amount
      return Number((withTax + tipValue).toFixed(2))
    })
  }, [splitAmounts, splitTaxAmounts, splitTips])

  // Now this useEffect can access splitTotals
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

  const { mutate, isLoading } = useMutation({
    mutationKey: ['orders'],
    mutationFn: (data: iOrderBody) => createOrder(data),
    onMutate: async newOrder => {
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
    onSuccess: async () => {
      // Update the orders list
      await queryClient.invalidateQueries(['takeouts'])

      // clear cart
      await clearCart()
      await setSelectCustomer(null)

      // Push to takeout page
      await router.push('/pos/takeout')
    },
    onError: (err, newTodo, context) => {
      // Rollback the optimistic update
      if (context?.prevData) {
        queryClient.setQueryData(['takeouts'], context.prevData)
      }
    },
  })

  // Set the loading state depanding on isLoading
  React.useEffect(() => {
    setFinalizing(isLoading)
  }, [isLoading])

  const handleNewOrder = async () => {
    const items: iOrderBody['items'] = data.map(item => ({
      item: item.item,
      quantity: item.quantity,
      price: item.price,
      itemNote: item?.itemNote,
      origin: 'POS',
      modifiers: formatedModifiers(item?.modifiers) as string[],
      itemDiscount: item?.itemDiscount,
    }))

    const finalTotal = splitTotals.reduce((acc, amount) => acc + amount, 0)

    const _orderData: iOrderBody = {
      customer: customer?._id,
      phone: customer?.phone,
      orderType: 'Pickup',
      payments: payMethods,
      paymentStatus: 'Paid',
      subtotal: discountedTotal, // Use discountedTotal instead of orderTotal
      total: finalTotal, // Use the sum of all split totals which includes tax and tips
      orderstatus: sendToKitchen ? 'InKitchen' : 'Complete',
      totalRefund: 0,
      items,
      tip: totalTip, // Include the total tip
      tax: taxAmount,
      specialInstructions: orderNote,
      orderDiscount: discount,
    }
    console.log('MUtate')
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
    handleNewOrder()
  }

  const allPaymentsCompleted = splitPayments.every(
    (payment: number, index: number) => payment >= splitTotals[index]
  )

  return (
    <>
      <div>
        <Header />
        <div className="max-w-6xl h-[calc(100vh-48px)] mx-auto px-4 border-x shadow">
          {/* Back to Orders */}
          <div className="flex justify-between items-center py-3 border-b">
            <Link href="/pos/orders/new">
              <Button variant="outline">
                <Icon name="ArrowLeft" />
                Back to Orders
              </Button>
            </Link>
            <div className="flex gap-2">
              <h4 className="text-lg">
                Order <strong>#(New)</strong>
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
                              {data.some(item => item?.item?.taxEnable) && (
                                <div className="flex justify-between">
                                  <span>Tax ({TAX_RATE}%):</span>
                                  <strong>
                                    $(+){' '}
                                    {(splitTaxAmounts?.[index] ?? 0).toFixed(2)}
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
                                      ? ((splitAmounts[index] +
                                          splitTaxAmounts[index]) *
                                          splitTips[index].amount) /
                                        100
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
                                {data.length > 0 &&
                                  data.map((item, index) => {
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
                              {data.some(item => item?.item?.taxEnable) && (
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
                <Button variant="secondary" className="w-full h-14">
                  Print Receipt
                </Button>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" className="w-full h-14">
                  Print All Receipt
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

export default page
