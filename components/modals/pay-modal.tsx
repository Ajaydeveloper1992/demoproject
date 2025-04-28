'use client'

import React from 'react'
import { useCart } from '~/hooks/use-cart'
// Hooks
// Components
import { Dialog, DialogContent } from '~/components/ui/dialog'
import Icon from '~/components/icon'
import { Button } from '~/components/ui/button'
//
import PaymentTip from '~/components/payment/PaymentTip'
import { PaymentDialog } from '~/components/payment/PaymentDialog'
import ConfirmationScreen from '~/components/payment/PaymentSuccess'
import { cn } from '~/lib/utils'

interface Props {
  isOpen: boolean
  onClose: () => void
  onConfirm: (amount: number) => void
  handleFinalize?: () => void
}

const PayModal = ({
  isOpen,
  onClose,
  onConfirm,
  handleFinalize = () => {},
}: Props) => {
  const [step, setStep] = React.useState<'tip' | 'payment' | 'confirmation'>(
    'tip'
  )
  const {
    tendered,
    paymentMethod,
    splitPayments,
    currentSplitIndex,
    total,
    splitQty,
    addPartialPayment,
    setTendered,
    splitTips,
    setSplitTipDetails,
  } = useCart()

  console.log(total)

  // Calculate base split amount with tip only (no tax)
  const currentSplitAmount = React.useMemo(() => {
    const baseAmount =
      splitQty <= 1 ? total : Math.floor((total / splitQty) * 100) / 100
    const currentAmount =
      currentSplitIndex === splitQty - 1 && splitQty > 1
        ? total - baseAmount * (splitQty - 1)
        : baseAmount

    // Add tip to the split amount
    const tip = splitTips[currentSplitIndex]
    if (!tip) return currentAmount

    const tipAmount =
      tip.type === '%' ? (currentAmount * tip.amount) / 100 : tip.amount

    return Number((currentAmount + tipAmount).toFixed(2))
  }, [total, splitQty, splitTips, currentSplitIndex]) // Removed splitTaxAmounts from dependencies

  const handleTipConfirm = (index: number, amount: number, type: '%' | '$') => {
    // Store tip amount and type in state for current split
    setSplitTipDetails(index, amount, type)
    setStep('payment')
  }

  const handlePay = (method: 'Cash' | 'Card') => {
    const tenderedAmount = parseFloat(tendered)
    if (tenderedAmount <= 0) return

    // Add the full tendered amount to splitPayments for the current split
    addPartialPayment(currentSplitIndex, tenderedAmount, method)
    onConfirm(tenderedAmount)
    setTendered('0')

    // Check if this split is fully paid (removed tax from calculation)
    const newRemainingAmount = Math.max(
      0,
      currentSplitAmount -
        ((splitPayments[currentSplitIndex] || 0) + tenderedAmount)
    )

    console.log(newRemainingAmount)

    if (newRemainingAmount <= 0) {
      const audio = new Audio('/audio/checkout_done.mp3')
      audio.play()
      setStep('confirmation')
    }
  }

  const handleClose = () => {
    setStep('tip')
    onClose()
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={open => {
        // Only allow closing through the Cancel button
        if (!open) {
          return
        }
      }}
    >
      <DialogContent
        className={cn(
          'max-w-4xl gap-0 p-0',
          step === 'confirmation' && 'max-w-lg'
        )}
      >
        {step === 'tip' && (
          <PaymentTip
            onNext={handleTipConfirm}
            splitIndex={currentSplitIndex}
          />
        )}
        {step === 'payment' && (
          <>
            <PaymentDialog />
            <div className="flex flex-col gap-2 p-4 border-t">
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
                  disabled={parseFloat(tendered) === 0}
                  onClick={() => handlePay(paymentMethod)}
                >
                  Pay ${parseFloat(tendered).toFixed(2)}
                  <Icon name="CheckCheck" className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
        {step === 'confirmation' && (
          <ConfirmationScreen
            onClose={splitQty === 1 ? handleFinalize : handleClose}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

export default PayModal
