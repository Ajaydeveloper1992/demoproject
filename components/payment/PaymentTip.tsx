import React from 'react'
// Hooks
import { useCart } from '~/hooks/use-cart'
// Components
import { cn } from '~/lib/utils'
import Icon from '~/components/icon'
import { Input } from '~/components/ui/input'
import { Button } from '~/components/ui/button'
import { NumericKeypad } from '~/components/payment/NumericKeypad'
import { KeypadButton } from '~/components/payment/KeypadButton'

const PaymentTip = ({
  onNext,
  splitIndex,
}: {
  onNext: (index: number, amount: number, type: '%' | '$') => void
  splitIndex: number
}) => {
  const [tipAmount, setTipAmount] = React.useState('0')
  const [tipType, setTipType] = React.useState<'%' | '$'>('$')
  const {
    total,
    splitQty,
    currentSplitIndex,
    onPayModalClose,
    setSplitTipDetails,
  } = useCart()

  const currentSplitAmount = React.useMemo(() => {
    if (splitQty <= 1) return total
    const baseAmount = Math.floor((total / splitQty) * 100) / 100
    if (currentSplitIndex === splitQty - 1) {
      const totalAssigned = baseAmount * (splitQty - 1)
      return Number((total - totalAssigned).toFixed(2))
    }
    return baseAmount
  }, [total, splitQty, currentSplitIndex])

  const totalAfterTip =
    tipType === '$'
      ? currentSplitAmount + Number(tipAmount)
      : currentSplitAmount + (currentSplitAmount * Number(tipAmount)) / 100

  // Add this to initialize with existing tip if any
  React.useEffect(() => {
    const existingTip = useCart.getState().splitTips[splitIndex]
    if (existingTip) {
      setTipAmount(existingTip.amount.toString())
      setTipType(existingTip.type)
    }
  }, [splitIndex])

  const handleNumberClick = (num: string) => {
    if (tipAmount === '0') {
      setTipAmount(num)
    } else {
      setTipAmount(tipAmount + num)
    }
  }

  const handleClear = () => setTipAmount('0')

  const handleBackspace = () => {
    if (tipAmount.length > 1) {
      setTipAmount(tipAmount.slice(0, -1))
    } else {
      setTipAmount('0')
    }
  }

  const handleClose = () => {
    setTipAmount('0')
    setTipType('$')
    onPayModalClose()
    setSplitTipDetails(splitIndex, 0, '$')
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-bold">Add a TIP</h2>
        <h4 className="text-sm text-gray-500">
          Total After TIP:
          <strong className="text-destructive">
            ${totalAfterTip.toFixed(2)}
          </strong>
        </h4>
      </div>
      <div className="space-y-2">
        <div className="space-y-4">
          <div className="grid grid-cols-6 gap-2 items-center">
            <KeypadButton className="font-medium bg-gray-100 text-sm h-16 col-span-2">
              TIP AMOUNT
            </KeypadButton>
            <div className="col-span-2">
              <Input
                value={tipAmount}
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
                  setTipAmount(value === '' ? '0' : value)
                }}
                min={0}
                className="text-center h-16 rounded-sm"
              />
            </div>
            <div className="flex col-span-2">
              <KeypadButton
                className={cn(
                  'h-16 w-full',
                  tipType === '$' && '!bg-primary !text-white'
                )}
                onClick={() => setTipType('$')}
              >
                $
              </KeypadButton>
              <KeypadButton
                className={cn(
                  'h-16 w-full',
                  tipType === '%' && '!bg-primary !text-white'
                )}
                onClick={() => setTipType('%')}
              >
                %
              </KeypadButton>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-6 gap-2">
          <NumericKeypad
            onNumberClick={handleNumberClick}
            onClear={handleClear}
            onBackspace={handleBackspace}
          />

          <div className="flex flex-col gap-2 col-span-2">
            <KeypadButton
              className="text-sm"
              onClick={() => {
                setTipAmount('5')
                setTipType('$')
              }}
            >
              $5
            </KeypadButton>
            <KeypadButton
              className="text-sm"
              onClick={() => {
                setTipAmount('10')
                setTipType('$')
              }}
            >
              $10
            </KeypadButton>
            <KeypadButton
              className="text-sm"
              onClick={() => {
                setTipAmount('5')
                setTipType('%')
              }}
            >
              5%
            </KeypadButton>
            <KeypadButton
              className="text-sm"
              onClick={() => {
                setTipAmount('10')
                setTipType('%')
              }}
            >
              10%
            </KeypadButton>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-2 pt-4 px-0 pb-0 border-t mt-4">
        <div className="flex gap-2">
          <Button
            className="w-full h-12"
            variant="destructive"
            onClick={handleClose}
          >
            <Icon name="X" />
            Cancel
          </Button>
          <Button
            className="w-full h-12 font-bold"
            onClick={() => onNext(splitIndex, Number(tipAmount), tipType)}
          >
            Next
            <Icon name="ArrowRight" className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

export default PaymentTip
