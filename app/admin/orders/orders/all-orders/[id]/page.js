'use client'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { format } from 'date-fns'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '~/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from '~/components/ui/table'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { ShieldQuestion } from 'lucide-react'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '~/components/ui/sheet'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '~/components/ui/accordion'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { ArrowLeft } from 'lucide-react'
import { Tooltip } from 'react-tooltip'
export default function OrderView({ params }) {
  const { data: session } = useSession()
  const router = useRouter()
  const { id } = params
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [userdata, setUserdata] = useState({})
  const [productsWithTax, setProductsWithTax] = useState([])
  const [isOpen, setIsOpen] = useState(false)
  const [orderHistory, setOrderHistory] = useState([])
  const phone = order?.customer?.phone

  useEffect(() => {
    if (session) {
      setUserdata(session)
    }
  }, [session])
  console.log('Tax Data', productsWithTax)
  useEffect(() => {
    const fetchOrder = async () => {
      if (userdata?.user && id) {
        // Ensure orderId is available
        try {
          const token = userdata?.user?.name?.token
          const response = await axios.get(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/orders/getorders/${id}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          )

          if (response.data.success) {
            setOrder(response.data.data)
          } else {
            setError('Failed to fetch order data')
            setOrder(response.data.data)
          }
        } catch (error) {
          console.error('Error fetching order:', error)
          setError('An error occurred while fetching the order')
        } finally {
          setLoading(false)
        }
      }
    }

    fetchOrder()
  }, [userdata, id]) // Ensure the effect re-runs when orderId changes

  //console.log("Order Details 111",order?.nuviepaymentinfo?.response?.paymentOption?.card?.ccCardNumber);

  // Fetch product tax data (tax rules, tax rate, etc.)
  useEffect(() => {
    const fetchProductDetails = async () => {
      if (order) {
        const productIds = order.items.map(item => item?.item?._id) // Extract product IDs from order items
        try {
          const productDetails = await Promise.all(
            productIds.map(id =>
              axios.get(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}/product/getproducts/${id}`
              )
            )
          )

          const productTaxData = productDetails.map(response => {
            const product = response.data.data
            return {
              id: product._id,
              taxEnabled: product.taxEnable ?? false,
              taxRate: product.taxRule,
              webPrice: product.webprice || 0,
            }
          })

          setProductsWithTax(productTaxData)
        } catch (error) {
          console.error('Error fetching product details:', error)
        }
      }
    }

    fetchProductDetails()
  }, [order])
  //console.log("Order Details",order);
  // Fetch order history when opening the sheet
  useEffect(() => {
    const fetchOrderHistory = async () => {
      if (isOpen && phone) {
        try {
          const response = await axios.get(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/orders/orderhistory?phone=${phone}`
          )
          setOrderHistory(response.data?.data || [])
        } catch (err) {
          console.error('Error fetching order history:', err)
        }
      }
    }
    fetchOrderHistory()
  }, [isOpen, phone])

  console.log('Order History', orderHistory)

  if (loading) return <div className="text-center p-4">Loading...</div>
  if (error) return <div className="text-center p-4 text-red-500">{error}</div>
  if (!order) return <div className="text-center p-4">No order found</div>

  // Helper function to calculate total without voided items
  // const calculateTotal = () => {
  //   let subtotal = 0;
  //   let tax = 0;
  //   let tip = 0;

  //   order.items.forEach(item => {
  //     if (item.voidstatus !== 'Voided') {
  //       subtotal += item.quantity * item.price;
  //       tax += item.quantity * item.price * 0.08;  // assuming 8% tax rate
  //       tip += item.quantity * item.price * 0.1;  // assuming 10% tip rate
  //     }
  //   });

  //   return { subtotal, tax, tip, total: subtotal + tax + tip };
  // };
  // Helper function to calculate total, tax, and tip
  const calculateTotal = () => {
    let subtotal = 0
    let totalTax = 0
    let totalTip = 0

    // Iterate over items in the order
    order.items.forEach(item => {
      // Skip voided items
      if (item.itemStatus === 'Refunded' || item.itemStatus === 'Voided') {
      } else {
        const productWithTax = productsWithTax.find(
          product => product.id === item.item._id
        )
        // Get the product price, default to 0 if not found
        let basePrice = item.price //productWithTax?.webPrice || 0;
        // if(item.salePrice){
        //   basePrice = item.salePrice;
        // }else{
        //   basePrice = item.price;
        // }
        // const originalPrice = item?.price ?? 0;
        // let discountedPrice = originalPrice;

        // // Apply discount if available
        // if (item?.itemDiscount) {
        //   const { type, value } = item.itemDiscount;

        //   if (type === '%') {
        //     discountedPrice = originalPrice - (originalPrice * value) / 100;
        //   } else if (type === '$') {
        //     discountedPrice = originalPrice - value;
        //   }

        //   // Ensure price doesn't go negative
        //   discountedPrice = Math.max(discountedPrice, 0);
        // }

        //basePrice = discountedPrice; //((item?.quantity - (item?.refundQuantity ?? 0)) * discountedPrice).toFixed(2);

        const quantity = item.quantity
        const refund_quantity = item.quantity - item.refundQuantity
        // Subtotal calculation (quantity * price)
        let productTotal = 0
        if (refund_quantity) {
          productTotal = basePrice * refund_quantity
        } else {
          productTotal = basePrice * quantity
        }
        subtotal += productTotal //order.subtotal;

        // Tax calculation: Check if tax is enabled and apply tax rate or amount
        if (productWithTax?.taxEnabled) {
          const taxRule = productWithTax.taxRate
          if (taxRule?.tax_type === 'percentage' && taxRule.amount) {
            // Apply percentage tax
            const taxAmount = productTotal * (taxRule.amount / 100)
            totalTax += taxAmount
          } else if (taxRule?.amount) {
            // Apply fixed tax amount
            totalTax += taxRule.amount
          }
        }
        // Tip calculation (assuming 10% of the product total price)
        // const tipAmount = productTotal * 0.1;  // Assuming 10% tip
        // totalTip += tipAmount;
      }
    })
    // tip
    if (order.orderstatus === 'Refunded' || order.orderstatus === 'Voided') {
    } else {
      totalTip += order.tip
    }
    // Return calculated totals
    totalTax = order?.tax
    return {
      subtotal: subtotal,
      tax: totalTax,
      tip: totalTip,
      total: subtotal + totalTax + totalTip, // Subtotal + Tax + Tip
    }
  }

  //Date Format Funtion
  const formatDate = dateString => {
    if (!dateString) return ''
    const date = new Date(dateString)

    // Extract month, day, and year components
    const month = String(date.getMonth() + 1).padStart(2, '0') // Months are zero-based
    const day = String(date.getDate()).padStart(2, '0')
    const year = date.getFullYear()

    return `${month}/${day}/${year}`
  }

  const { subtotal, tax, tip, total } = calculateTotal()

  // Mock order data
  // Calculate total orders, total revenue, and average order value
  // const totalOrders = orderHistory.length;
  // const totalRevenue = orderHistory.reduce((acc, order) => acc + order.total, 0);
  // const averageOrderValue = totalRevenue / totalOrders;
  const validOrders = orderHistory.filter(
    order => !['Voided', 'Refunded', 'Rejected'].includes(order.orderstatus)
  )
  const totalOrders = validOrders.length
  const totalRevenue = validOrders.reduce((acc, order) => acc + order.total, 0)
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0
  console.log('Total Orders (excluding voided/refunded/rejected):', totalOrders)
  console.log('Total Revenue:', totalRevenue)
  console.log('Average Order Value:', averageOrderValue)
  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Order Details</h1>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Orders
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Order Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm font-medium">Order Number</p>
              <p>{order.orderNumber}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Date</p>
              <p>{format(new Date(order.date), 'PPP')}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Order Type</p>
              <p>{order.orderType}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Order Origin</p>
              <p>{order?.origin}</p>
            </div>
            {/* <div>
              <p className="text-sm font-medium">Order Status</p>
              <Badge variant={order.orderstatus === 'Void' ? 'destructive' : 'default'}>
                {order.orderstatus}
              </Badge>
            </div> */}
            <div>
              <p className="text-sm font-medium">Order Status</p>
              <Badge
                style={{
                  backgroundColor:
                    order.orderstatus === 'Paid'
                      ? 'greenyellow'
                      : order.orderstatus === 'Pending'
                        ? 'aliceblue'
                        : order.orderstatus === 'Void'
                          ? '#FFCDD2' // Optional: Add a color for 'Void'
                          : 'default',
                  color:
                    order.orderstatus === 'Paid'
                      ? '#000'
                      : order.orderstatus === 'Pending'
                        ? '#000'
                        : order.orderstatus === 'Void'
                          ? '#FFCDD2' // Optional: Add a color for 'Void'
                          : 'default',
                }}
                variant={
                  order.orderstatus === 'Void' ? 'destructive' : 'default'
                }
              >
                {order.orderstatus}
              </Badge>
            </div>
            <div>
              <p className="text-sm font-medium">Payment Status</p>
              <Badge
                variant={
                  order.paymentStatus === 'Pending' ? 'warning' : 'success'
                }
              >
                {order.paymentStatus}
              </Badge>
            </div>
            {/* {order.paymentMethod && (
              <div>
                <p className="text-sm font-medium">Payment Method</p>
                <p>{order.paymentMethod}</p>
              </div>
            )} */}
            {order.paymentMethod !== 'Pending' && (
              <div>
                <p className="text-sm font-medium">Payment Method</p>
                {(() => {
                  const hasCash = order?.payments?.some(
                    payment => payment.method === 'Cash' && payment.amount > 0
                  )
                  const hasCard = order?.payments?.some(
                    payment => payment.method === 'Card' && payment.amount > 0
                  )

                  if (hasCash && hasCard) {
                    return <span>Cash & Card</span>
                  } else if (hasCash) {
                    return order.paymentStatus === 'Pending' ? (
                      <p>{order?.paymentMethod}</p>
                    ) : (
                      <p>
                        {order?.payments[1]?.method ||
                          order?.payments[0]?.method}
                      </p>
                    )
                  } else if (hasCard) {
                    return <p>{order?.payments[0]?.method}</p>
                  } else {
                    return <p>{order?.paymentMethod}</p>
                  }
                })()}

                {order.paymentMethod === 'Card' &&
                  (order?.nuviepaymentinfo?.response?.paymentOption?.card
                    ?.ccCardNumber ? (
                    <p>
                      Nuvie{' '}
                      {
                        order?.nuviepaymentinfo?.response?.paymentOption?.card
                          ?.ccCardNumber
                      }
                    </p>
                  ) : (
                    <p>
                      Stripe{' '}
                      {
                        order?.stripepaymentinfo?.response?.paymentOption?.card
                          ?.last4Digits
                      }
                    </p>
                  ))}
              </div>
            )}
            {/** Cash & Card */}
            {order.voidstatus && (
              <div>
                <p className="text-sm font-medium">Status</p>
                <Badge
                  variant={
                    order.voidstatus === 'Voided' ? 'destructive' : 'default'
                  }
                >
                  {order?.voidstatus}
                </Badge>
              </div>
            )}
            {order.ordervoidreason && (
              <div>
                <p className="text-sm font-medium">Reason</p>
                {order?.ordervoidreason}
              </div>
            )}
            {/* Display Staff Name */}
            <div>
              <p className="text-sm font-medium">Created by</p>
              {order.origin === 'Online' ? (
                <p>Customer</p>
              ) : order?.staffid ? (
                <p>
                  {order?.staffid?.fname} {order?.staffid?.lname}
                </p>
              ) : (
                <p>Customer</p>
              )}
            </div>
            {/* Display Voided By Name */}
            <div>
              <p className="text-sm font-medium">Voided By</p>
              {order?.voidedby ? (
                <p>
                  {order?.voidedby?.fname} {order?.voidedby?.lname}
                </p>
              ) : (
                <p>N/A</p>
              )}
            </div>
            <div>
              <p className="text-sm font-medium">Rejected by</p>
              {order?.rejectedby ? (
                <p>
                  {order?.rejectedby?.fname} {order?.rejectedby?.lname}
                </p>
              ) : (
                <p>N/A</p>
              )}
            </div>
            <div>
              <p className="text-sm font-medium">Refund by</p>
              {order?.refundby ? (
                <p>
                  {order?.refundby?.fname} {order?.refundby?.lname}
                </p>
              ) : (
                <p>N/A</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      <div className="flex flex-wrap">
        <div className="w-full sm:w-1/2 lg:w-1/3 p-2">
          <Card>
            <CardHeader>
              <CardTitle>
                Customer Information{' '}
                <Button variant="outline" onClick={() => setIsOpen(true)}>
                  Order History
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>
                <strong>Name:</strong> {order?.customer?.firstName}{' '}
                {order?.customer?.lastName}
              </p>
              <p>
                <strong>Email:</strong> {order?.customer?.email}
              </p>
              <p>
                <strong>Phone:</strong> {order?.customer?.phone}
              </p>
              {order?.customer?.note && (
                <p>
                  <strong>Note:</strong> {order?.customer?.note}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Special Instructions Section */}
        {(order.specialInstructions || order.orderNote) && (
          <div className="w-full sm:w-1/2 lg:w-1/3 p-2">
            <Card>
              <CardHeader>
                <CardTitle>Customer Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p>{order.specialInstructions || order.orderNote}</p>
              </CardContent>
            </Card>
          </div>
        )}
        {/* Pickup Information Section */}
        {order.pickupInfo && (
          <div className="w-full sm:w-1/2 lg:w-1/3 p-2">
            <Card>
              <CardHeader>
                <CardTitle>Pickup Information</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Order Type : {order?.pickupInfo?.orderType}</p>
                {/* <p>Pickup Time : {order?.pickupInfo?.pickupTime}</p> */}
                <p>
                  Pickup Time:{' '}
                  {order?.pickupInfo?.pickupTime?.replace('-ASAP', '')}
                </p>
                <p>
                  Date :{' '}
                  {format(new Date(order?.pickupInfo?.selectedDate), 'PPP')}
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
      {/* Item Details Section */}
      <Card>
        <CardHeader>
          <CardTitle>Item Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead className="text-right">Modifiers</TableHead>
                <TableHead className="text-right">Status</TableHead>
                {/* <TableHead className="text-right">Reason</TableHead> */}
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">Void/Refund</TableHead>
                <TableHead className="text-right">Tax</TableHead>
                {/* <TableHead className="text-right">Discount</TableHead> */}
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.items.map((item, index) => (
                <TableRow
                  key={index}
                  className={
                    item?.itemStatus === 'Voided' ||
                    item?.itemStatus === 'Refunded'
                      ? 'bg-red-100'
                      : ''
                  }
                >
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {item?.item?.name && item?.item?.name?.length > 0
                            ? item?.item?.name
                            : item?.itemcustomname}
                        </span>
                        {item?.itemStatus && item?.itemStatus.length > 0 ? (
                          <Badge
                            variant="secondary"
                            className="bg-orange-100 text-orange-700 hover:bg-orange-100"
                          >
                            {item?.itemStatus}
                          </Badge>
                        ) : (
                          <span></span>
                        )}
                      </div>
                      {/* {item.details && (
                        <>
                          <span className="text-sm text-muted-foreground">Spice Level: {item.details.spiceLevel}</span>
                          <span className="text-sm text-muted-foreground">Size: {item.details.size}</span>
                        </>
                      )} */}
                      {item?.itemReason && item?.itemReason.length > 0 ? (
                        <span className="text-sm text-muted-foreground">
                          Refund Reason: {item?.itemReason}
                        </span>
                      ) : (
                        <span></span>
                      )}
                    </div>
                  </TableCell>
                  {/* Display modifiers for each item */}
                  <TableCell className="text-right">
                    {item.modifiers && item.modifiers.length > 0 ? (
                      <ul>
                        {item.modifiers.map((modifier, modifierIndex) => (
                          <li key={modifierIndex}>
                            {modifier?.name} - $
                            {isNaN(modifier?.priceAdjustment)
                              ? '0.00'
                              : modifier?.priceAdjustment.toFixed(2)}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span>No modifiers</span>
                    )}
                    {item?.itemNote && <p>Note: {item?.itemNote}</p>}
                  </TableCell>
                  <TableCell className="text-right">
                    {item?.itemStatus}
                  </TableCell>
                  {/* <TableCell className="text-right">{item?.itemReason}</TableCell> */}
                  <TableCell className="text-right">{item?.quantity}</TableCell>
                  <TableCell className="text-right">
                    {item?.refundQuantity ?? ''}
                  </TableCell>
                  {/* <TableCell className="text-right">
                    {item?.itemDiscount?.value && (
                      item?.itemDiscount?.type === '%' ? (
                        <span>{item?.itemDiscount?.value}%</span>
                      ) : (
                        <span>${item?.itemDiscount?.value}</span>
                      )
                    )}
                  </TableCell> */}
                  <TableCell className="text-right">
                    {(() => {
                      const itemtax = productsWithTax.find(
                        product => product.id === item.item._id
                      )
                      let taxAmount = 0

                      if (itemtax?.taxEnabled) {
                        const taxRule = itemtax.taxRate
                        if (
                          taxRule?.tax_type === 'percentage' &&
                          taxRule.amount
                        ) {
                          // Apply percentage tax
                          taxAmount = item?.price * (taxRule.amount / 100)
                        } else if (taxRule?.amount) {
                          // Apply fixed tax amount
                          taxAmount = taxRule.amount
                        }
                      }

                      return taxAmount.toFixed(2) // Display tax amount properly formatted
                    })()}
                  </TableCell>
                  <TableCell className="text-right">
                    {(() => {
                      const originalPrice = item?.price ?? 0
                      let discountedPrice = originalPrice

                      // Apply discount if available
                      if (item?.itemDiscount) {
                        const { type, value } = item.itemDiscount

                        if (type === '%') {
                          discountedPrice =
                            originalPrice - (originalPrice * value) / 100
                        } else if (type === '$') {
                          discountedPrice = originalPrice - value
                        }

                        // Ensure price doesn't go negative
                        discountedPrice = Math.max(discountedPrice, 0)
                      }

                      const totalPrice = (
                        (item?.quantity - (item?.refundQuantity ?? 0)) *
                        discountedPrice
                      ).toFixed(2)

                      return (
                        <>
                          {item?.itemDiscount?.value ? (
                            <>
                              <s className="text-gray-500">
                                ${originalPrice.toFixed(2)}
                              </s>{' '}
                              ${discountedPrice.toFixed(2)}
                            </>
                          ) : (
                            `$${discountedPrice.toFixed(2)}`
                          )}
                        </>
                      )
                    })()}
                  </TableCell>
                  {/* <TableCell className="text-right">
                    {item?.itemStatus === 'Voided' 
                      ? '$0.00' 
                      : ((item?.quantity - (item?.refundQuantity ?? 0)) * item?.price).toFixed(2)}
                  </TableCell>  */}
                  <TableCell className="text-right">
                    {(() => {
                      if (item?.itemStatus === 'Voided') {
                        return '$0.00'
                      }
                      const originalPrice = item?.price ?? 0
                      let discountedPrice = originalPrice
                      // Apply discount if available
                      if (item?.itemDiscount) {
                        const { type, value } = item.itemDiscount
                        if (type === '%') {
                          discountedPrice =
                            originalPrice - (originalPrice * value) / 100
                        } else if (type === '$') {
                          discountedPrice = originalPrice - value
                        }
                        // Ensure price doesn't go negative
                        discountedPrice = Math.max(discountedPrice, 0)
                      }
                      const totalPrice = (
                        (item?.quantity - (item?.refundQuantity ?? 0)) *
                        discountedPrice
                      ).toFixed(2)

                      return (
                        <>
                          {item?.itemDiscount?.value ? (
                            <>
                              {/* <s className="text-gray-500">${originalPrice.toFixed(2)}</s>{' '} */}
                              ${totalPrice}
                            </>
                          ) : (
                            `$${totalPrice}`
                          )}
                        </>
                      )
                    })()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow className="font-bold">
                <TableCell colSpan={6}>Subtotal</TableCell>
                <TableCell colSpan={2} className="text-right">
                  ${order?.subtotal.toFixed(2)}
                </TableCell>
              </TableRow>
              <TableRow className="font-bold">
                <TableCell colSpan={6}>Tax</TableCell>
                <TableCell colSpan={2} className="text-right">
                  +${tax.toFixed(2)}
                </TableCell>
              </TableRow>
              <TableRow className="font-bold">
                <TableCell colSpan={6} className="font-medium text-green-600">
                  Tip
                </TableCell>
                <TableCell colSpan={2} className="text-right text-green-600">
                  +${tip?.toFixed(2)}
                </TableCell>
              </TableRow>
              {order?.orderDiscount?.value > 0 && (
                <TableRow className="font-bold">
                  <TableCell colSpan={6} className="text-red-500">
                    Discount
                  </TableCell>
                  <TableCell colSpan={2} className="text-right text-red-500">
                    -$
                    {order?.orderDiscount?.type === '%'
                      ? (
                          (order?.subtotal * order?.orderDiscount?.value) /
                          100
                        ).toFixed(2)
                      : order?.orderDiscount?.value.toFixed(2)}
                  </TableCell>
                </TableRow>
              )}
              <TableRow className="font-bold text-lg">
                <TableCell colSpan={6}>Total</TableCell>
                <TableCell colSpan={2} className="text-right">
                  {/* ${(
                  (Number(subtotal) || 0) +
                  (Number(tax) || 0) + (Number(tip) || 0)-
                  (order?.orderDiscount?.type === '%'
                    ? ((Number(subtotal) || 0) * (Number(order?.orderDiscount?.value) || 0)) / 100
                    : Number(order?.orderDiscount?.value) || 0)
                ).toFixed(2)} */}
                  ${order?.total.toFixed(2)}
                </TableCell>
              </TableRow>
              {order?.totalRefund > 0 && (
                <TableRow className="font-bold text-red-500">
                  <TableCell colSpan={6}>Refunded Amount</TableCell>
                  <TableCell colSpan={2} className="text-right">
                    -${order?.totalRefund.toFixed(2)}
                  </TableCell>
                </TableRow>
              )}
              {/** Order React  */}
              {order?.payments?.map(payment => (
                <>
                  {payment?.amount > 0 && (
                    <TableRow
                      key={`payment-${payment._id}`}
                      className="font-bold"
                    >
                      <TableCell colSpan={6}>
                        Paid by {payment?.method}
                      </TableCell>
                      <TableCell colSpan={2} className="text-right">
                        ${payment?.amount.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  )}
                  {payment?.change > 0 && (
                    <TableRow
                      key={`change-${payment._id}`}
                      className="font-bold text-red-500"
                    >
                      <TableCell colSpan={6}>Change</TableCell>
                      <TableCell colSpan={2} className="text-right">
                        -${payment?.change.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  )}
                </>
              ))}
            </TableFooter>
          </Table>
        </CardContent>
      </Card>
      {/* Order Totals Section */}
      {/* <Card>
        <CardHeader>
          <CardTitle>Order Totals</CardTitle>
        </CardHeader>
        <CardContent> */}
      {/* <div className="space-y-2">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax</span>
              <span>${tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Tip</span>
              <span>${tip.toFixed(2)}</span>
            </div>
            {order?.orderDiscount?.value && (
              <div className="flex justify-between">
                <span>Discount</span>
                {order?.orderDiscount?.type?.type === '%' ? (
                  <span>{order?.orderDiscount?.value}%</span>
                ) : (
                  <span>${order?.orderDiscount?.value}</span>
                )}
              </div>
            )}
            {order?.totalRefund && (
              <div className="flex justify-between font-bold">
                <span>Refunded Amount</span>
                <span>${order?.totalRefund?.toFixed(2)}</span>
              </div>
            )} */}
      {/** Cash & Card */}
      {/* {order?.payments?.map((payment, index) => (
              <div key={payment._id} className="flex justify-between font-bold">
                <span>{`${payment.method} Payment`}</span>
                <span>${payment.amount.toFixed(2)}</span>
              </div>
            ))}
            <div className="flex justify-between font-bold">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div> */}
      {/* </CardContent>
        <CardContent>
        <div className="space-y-2">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>${subtotal?.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span>Tax</span>
          <span>${tax?.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span>Tip</span>
          <span>${tip?.toFixed(2)}</span>
        </div>
        {/* Discount Calculation */}
      {/* {order?.orderDiscount?.value > 0 && (
          <div className="flex justify-between">
            <span>Discount</span>
            {order?.orderDiscount?.type === '%' ? (
              <span>
                {order?.orderDiscount?.value}% (-$
                {((subtotal * order?.orderDiscount?.value) / 100).toFixed(2)})
              </span>
            ) : (
              <span>-${order?.orderDiscount?.value.toFixed(2)}</span>
            )}
          </div>
        )} */}
      {/* Total Calculation */}
      {/* <div className="flex justify-between font-bold">
          <span>Total</span>
          <span>
            ${(
              (Number(subtotal) || 0) +
              (Number(tax) || 0) +
              (Number(tip) || 0) -
              (order?.orderDiscount?.type === '%'
                ? ((Number(subtotal) || 0) * (Number(order?.orderDiscount?.value) || 0)) / 100
                : Number(order?.orderDiscount?.value) || 0)
            ).toFixed(2)}
          </span>
        </div>  */}
      {/* Refunded Amount */}
      {/* {order?.totalRefund > 0 && (
          <div className="flex justify-between font-bold">
            <span>Refunded Amount</span>
            <span>-${order?.totalRefund.toFixed(2)}</span>
          </div>
        )} */}
      {/* Cash & Card Payments */}
      {/* {order?.payments?.map((payment, index) => (
          <div key={payment._id} className="font-bold">
            <div className="flex justify-between">
              <span>{payment?.method}</span>
              <span>${payment?.amount.toFixed(2)}</span>
            </div>
            {payment?.change > 0 && (
              <div className="flex justify-between text-red-500">
                <span>Change</span>
                <span>${payment?.change.toFixed(2)}</span>
              </div>
            )}
          </div>
        ))} */}
      {/* </div>
      </CardContent>
      </Card> */}
      {/** Customer History */}
      <div className="grid grid-cols-2 gap-2 ">
        <Sheet key="right" open={isOpen} onOpenChange={setIsOpen}>
          <SheetContent side="right" className="w-[700px] sm:max-w-[500px]">
            {/* Header */}
            <SheetHeader className="text-white">
              <SheetTitle className="text-lg font-bold">
                Customer Order History
              </SheetTitle>
            </SheetHeader>
            <Tabs defaultValue="order_revenue" className="w-[500px]">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="order_revenue">Order Revenue</TabsTrigger>
                <TabsTrigger value="order_history">Order History</TabsTrigger>
              </TabsList>
              <TabsContent value="order_revenue">
                <Card>
                  <CardHeader>
                    <CardTitle>
                      Order Revenue
                      {/* <ShieldQuestion size={20} className="ml-2" data-tooltip-id="orderInfoTip" />
                      <Tooltip id="orderInfoTip" content="Overview of customer order details" /> */}
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="space-y-2">
                    {/* Total Orders Section */}
                    <div className="space-y-1">
                      <Label className="flex" htmlFor="total_orders">
                        Total Orders{' '}
                        <ShieldQuestion
                          size={20}
                          className="ml-2"
                          data-tooltip-id="totalOrdersTip"
                        />
                      </Label>
                      <p>{totalOrders}</p>
                      <Tooltip
                        id="totalOrdersTip"
                        content="Total number of non-cancelled, non-failed orders for this customer, including the current one."
                      />
                    </div>

                    {/* Total Revenue Section */}
                    <div className="space-y-1">
                      <Label className="flex" htmlFor="total_revenue">
                        Total Revenue{' '}
                        <ShieldQuestion
                          size={20}
                          className="ml-2"
                          data-tooltip-id="totalRevenueTip"
                        />
                      </Label>
                      <p>${totalRevenue.toFixed(2)}</p>
                      <Tooltip
                        id="totalRevenueTip"
                        content="This is the Customer Lifetime Value, or the total amount you have earned from this customer's orders."
                      />
                    </div>

                    {/* Average Order Value Section */}
                    <div className="space-y-1">
                      <Label className="flex" htmlFor="average_order_value">
                        Average Order Value{' '}
                      </Label>
                      <p>${averageOrderValue.toFixed(2)}</p>
                      {/* <ShieldQuestion size={20} className="ml-2" data-tooltip-id="averageOrderValueTip" /><Tooltip id="averageOrderValueTip" content="The average value per order" /> */}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="order_history">
                <Accordion
                  type="single"
                  collapsible
                  className="w-full max-h-[100vh] overflow-y-auto"
                >
                  {orderHistory.map((history, index) => (
                    <AccordionItem value={`item-${index}`} key={index}>
                      <AccordionTrigger>
                        Order Number: {history.orderNumber}
                      </AccordionTrigger>
                      <AccordionContent>
                        <p>Order Date: {formatDate(history?.date)}</p>
                        <p>
                          Pickup Time:{' '}
                          {history?.pickupInfo?.pickupTime?.replace(
                            '-ASAP',
                            ''
                          )}
                        </p>
                        <p>Payment Status: {history?.paymentStatus}</p>
                        <p>
                          Special Instructions: {history?.specialInstructions}
                        </p>
                        <p>Total: ${history?.total}</p>
                        <div className="mt-2">
                          <strong>Items:</strong>
                          <ul>
                            {history?.items.map((item, itemIndex) => {
                              console.log(item) // Log the item to the console for debugging
                              return (
                                <li key={itemIndex}>
                                  {item?.quantity} x {item?.item?.name} ($
                                  {item?.price.toFixed(2)}) <br />- Modifiers:{' '}
                                  {item?.modifiers
                                    .map(
                                      modifier =>
                                        `${modifier?.name} (+${modifier?.priceAdjustment})`
                                    )
                                    .join(', ')}
                                </li>
                              )
                            })}
                          </ul>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </TabsContent>
            </Tabs>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  )
}
