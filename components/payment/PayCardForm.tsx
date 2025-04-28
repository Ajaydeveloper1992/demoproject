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
import { generateFixedAmounts } from '~/lib/utils'
import { printCustomerReceipt } from '~/hooks/use-order'
import { logout } from '~/app/pos/(auth)/login/actions'
// Components
import Icon from '~/components/icon'
import { Input } from '~/components/ui/input'
import { Button } from '~/components/ui/button'
import { NumericKeypad } from '~/components/payment/NumericKeypad'
import { KeypadButton } from '~/components/payment/KeypadButton'
import KitchenSwitch from '~/components/kitchen-switch'

const PayCardForm = () => {
  // Get id from params
  const { id } = useParams<{ id: string }>()

  const {
    total,
    tendered,
    setTendered,
    sendToKitchen: checked,
    setSendToKitchen: setChecked,
    splitQty,
    currentSplitIndex,
    splitPayments,
    splitTips,
    hideSendToKitchen,
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

  // Calculate base split amount without tip first
  const baseSplitAmount = React.useMemo(() => {
    if (splitQty <= 1) return total
    const baseAmount = Math.floor((total / splitQty) * 100) / 100
    if (currentSplitIndex === splitQty - 1) {
      const totalAssigned = baseAmount * (splitQty - 1)
      return Number((total - totalAssigned).toFixed(2))
    }
    return baseAmount
  }, [total, splitQty, currentSplitIndex])

  // Calculate split amount with tip (but without re-adding tax)
  const splitAmount = React.useMemo(() => {
    const tip = splitTips[currentSplitIndex]
    if (!tip) return baseSplitAmount

    const tipAmount =
      tip.type === '%' ? (baseSplitAmount * tip.amount) / 100 : tip.amount

    return Number((baseSplitAmount + tipAmount).toFixed(2))
  }, [baseSplitAmount, splitTips, currentSplitIndex])

  const currentPayment = splitPayments[currentSplitIndex] || 0
  const totalTendered = currentPayment + parseFloat(tendered)
  const change = Math.max(0, totalTendered - splitAmount)
  // Use splitAmount which includes tip for remaining calculation
  const remainingAmount = Math.max(0, splitAmount - currentPayment)

  const handleNumberClick = (num: string) => {
    if (tendered === '0') {
      setTendered(num)
    } else {
      setTendered(tendered + num)
    }
  }

  const handleClear = () => setTendered('0')

  const handleBackspace = () => {
    if (tendered.length > 1) {
      setTendered(tendered.slice(0, -1))
    } else {
      setTendered('0')
    }
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
    <div className="p-3">
      <div className="flex flex-row items-center justify-between bg-gray-100 space-y-0 pl-2 rounded">
        <h4>
          Pay with <strong>Credit Card</strong>
        </h4>

        <Button
          variant="ghost"
          size="icon"
          disabled={isCustomerPrinting}
          onClick={() => {
            printCustomer({
              uniqueID: id || '',
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
        </Button>
      </div>

      <div className="text-center py-2">
        <div className="text-4xl font-bold flex justify-center gap-2">
          <span className="text-green-600">{currentPayment.toFixed(2)}</span>
          <span className="text-muted-foreground">/</span>
          <span>{splitAmount.toFixed(2)}</span>
        </div>
      </div>

      <div className="space-y-2">
        <div className="space-y-4">
          <div className="grid grid-cols-6 gap-2 items-center">
            <KeypadButton className="font-medium bg-gray-100 text-sm h-16 col-span-2">
              TENDERED / CHANGE
            </KeypadButton>
            <div className="col-span-2">
              <Input
                disabled
                value={tendered}
                onChange={e => {
                  let value = e.target.value.replace(/[^0-9.]/g, '')
                  if (value.split('.').length > 2) {
                    value = value.replace(/\.+$/, '')
                  }
                  if (
                    value !== '' &&
                    value !== '.' &&
                    value.startsWith('0') &&
                    !value.startsWith('0.')
                  ) {
                    value = value.replace(/^0+/, '')
                  }
                  setTendered(value === '' ? '0' : value)
                }}
                className="text-center h-16 rounded-sm"
              />
            </div>
            <KeypadButton className="!bg-red-500 !text-white h-16 col-span-2">
              {change.toFixed(2)}
            </KeypadButton>
          </div>
        </div>

        <div className="grid grid-cols-6 gap-2">
          <NumericKeypad
            onNumberClick={handleNumberClick}
            onClear={handleClear}
            onBackspace={handleBackspace}
            disabled
          />

          <div className="flex flex-col gap-2 col-span-2" key={remainingAmount}>
            {generateFixedAmounts(remainingAmount).map((amount, i) => (
              <KeypadButton
                disabled={i !== 0 && amount > remainingAmount}
                key={amount}
                className="text-sm"
                onClick={() => setTendered(amount.toString())}
              >
                {amount.toFixed(2)}
              </KeypadButton>
            ))}
          </div>
        </div>

        {!hideSendToKitchen && (
          <div>
            <KitchenSwitch checked={checked} setChecked={setChecked} />
          </div>
        )}
      </div>
    </div>
  )
}

export default PayCardForm
