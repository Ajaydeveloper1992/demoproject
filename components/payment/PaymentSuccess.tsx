import React from 'react'
import { useMutation, useQuery } from 'react-query'
import { redirect, useParams } from 'next/navigation'
import { iProfile, iReceiptBody } from '~/types'
// Libs
import Axios from '~/lib/axios'
import { StaffEndpoints } from '~/lib/constants'
// Hooks
import { useApp } from '~/hooks/use-app'
import { useCart } from '~/hooks/use-cart'
import { emailReceipt, printCustomerReceipt } from '~/hooks/use-order'
import { logout } from '~/app/pos/(auth)/login/actions'
// Components
import Icon from '~/components/icon'
import { Label } from '~/components/ui/label'
import { Input } from '~/components/ui/input'
import { Button } from '~/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs'

const ConfirmationScreen = ({ onClose }: { onClose: () => void }) => {
  const [isSending, setIsSending] = React.useState(false)
  const [email, setEmail] = React.useState('')
  const [copies, setCopies] = React.useState(1)
  const {
    total,
    splitQty,
    currentSplitIndex,
    splitTips,
    splitPayments,
    partialPayments,
    isFinalizing,
    splitTaxAmounts,
  } = useCart()
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

  // Get id from params
  const { id } = useParams<{ id: string }>()

  // Calculate the current split amount including tip (but not re-adding tax)
  const splitAmount = React.useMemo(() => {
    // Use the pre-calculated splitTotals which already includes tax from checkout page
    const baseAmount =
      splitQty <= 1 ? total : Math.floor((total / splitQty) * 100) / 100

    // Do not re-add tax as it's already included in the total from checkout page

    // Add tip if exists
    const tip = splitTips[currentSplitIndex]
    if (!tip) return baseAmount

    const tipAmount =
      tip.type === '%' ? (baseAmount * tip.amount) / 100 : tip.amount

    return Number((baseAmount + tipAmount).toFixed(2))
  }, [total, splitQty, currentSplitIndex, splitTips])

  // Get the payments for the current split
  const currentPayments = partialPayments[currentSplitIndex] || []
  const totalPaid = splitPayments[currentSplitIndex] || 0
  const change = Math.max(0, totalPaid - splitAmount)

  const handleQuantityChange = (change: number) => {
    setCopies(Math.max(1, copies + change))
  }

  // Calculate the aggregated payments by method
  const aggregatedPayments = currentPayments.reduce((acc, payment) => {
    if (!acc[payment.method]) {
      acc[payment.method] = 0
    }
    acc[payment.method] += payment.amount
    return acc
  }, {})

  // Get the payment methods
  const paymentMethods = Object.keys(aggregatedPayments)

  const sendEmail = async () => {
    setIsSending(true)
    const { success } = await emailReceipt(id, email)
    if (success) {
      setIsSending(false)
      setEmail('')
      return onClose()
    }

    // TODO: Handle error
    setIsSending(false)
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

  return (
    <div className="p-4">
      <div className="flex flex-row items-center justify-between bg-gray-100 space-y-0 pl-2 rounded">
        <h4>Payment Successful!</h4>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            printCustomer({
              uniqueID: id,
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
          <Icon name="Printer" size={16} />
        </Button>
      </div>

      <div className="p-8">
        <Icon
          name="CircleCheck"
          className="w-16 h-16 text-green-500 mx-auto mb-4"
        />
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
          <div>
            <p className="text-sm text-muted-foreground">TENDERED</p>
            <p className="text-lg font-medium text-green-600">
              ${totalPaid.toFixed(2)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">CHANGE</p>
            <p className="text-lg font-medium text-red-600">
              ${change.toFixed(2)}
            </p>
          </div>
        </div>
        <div className="space-y-2 border-t pt-2">
          <div>
            {paymentMethods.map((method, index) => (
              <div key={index} className="flex justify-between">
                <span className="text-muted-foreground capitalize">
                  {method}
                </span>
                <span className="font-medium">
                  ${aggregatedPayments[method].toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <Label>How would you like to receive a receipt?</Label>
          <Tabs defaultValue="email" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="email">Email</TabsTrigger>
              <TabsTrigger value="print">Customer Receipt</TabsTrigger>
            </TabsList>
            <TabsContent value="email" className="space-y-4">
              <div className="flex space-x-2">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="flex-grow h-10"
                />
                <Button
                  variant="secondary"
                  onClick={sendEmail}
                  disabled={isSending}
                >
                  Send
                  {isSending ? (
                    <Icon name="Loader" size={15} className="animate-spin" />
                  ) : (
                    <Icon name="Send" size={15} />
                  )}
                </Button>
              </div>
            </TabsContent>
            <TabsContent value="print" className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-2 flex-grow">
                  <Label htmlFor="copies" className="whitespace-nowrap">
                    Copies:
                  </Label>
                  <div className="flex items-center space-x-1">
                    <Button
                      variant="outline"
                      className="scale-75"
                      size="icon"
                      onClick={() => handleQuantityChange(-1)}
                      disabled={copies === 1}
                    >
                      <Icon name="Minus" className="h-4 w-4" />
                    </Button>
                    <Input
                      id="quantity"
                      type="number"
                      autoFocus
                      value={copies}
                      onChange={e => setCopies(parseInt(e.target.value, 10))}
                      className="flex-1 max-w-[80px] text-center h-7"
                    />
                    <Button
                      variant="outline"
                      className="scale-75"
                      size="icon"
                      onClick={() => handleQuantityChange(1)}
                      disabled={copies === 99}
                    >
                      <Icon name="Plus" className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <Button
                  variant="secondary"
                  disabled={isCustomerPrinting}
                  onClick={() => {
                    printCustomer({
                      uniqueID: id || '',
                      printtype: 'customer',
                      printingInProgress: false,
                      printarea_name: 'customer-receipt',
                      statusCode: '200%20OK',
                      splitqty: splitQty,
                      printQty: copies,
                      Printstatus: true,
                    })
                  }}
                >
                  Print {copies} {copies === 1 ? 'Copy' : 'Copies'}{' '}
                  {isCustomerPrinting ? (
                    <Icon name="Loader" size={15} className="animate-spin" />
                  ) : (
                    <Icon name="Printer" size={15} />
                  )}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>
        <Button
          variant="destructive"
          className="w-full"
          size="lg"
          disabled={isFinalizing}
          onClick={onClose}
        >
          {isFinalizing ? 'Finalizing...' : 'Close'}
          <Icon name="X" />
        </Button>
      </div>
    </div>
  )
}

export default ConfirmationScreen
