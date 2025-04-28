import React from 'react'
import { useMutation } from 'react-query'
import { useParams } from 'next/navigation'
// Hooks
import { useCart } from '~/hooks/use-cart'
import { updateOrder } from '~/hooks/use-order'
// Components
import Icon from '~/components/icon'
import Keypad from '~/components/keypad'
import Discount from '~/components/discount'
import { Button } from '~/components/ui/button'
import { ScrollArea } from '~/components/ui/scroll-area'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'

const DiscountModal = () => {
  const { isDiscountModalOpen, onDiscountModalClose, discount, setDiscount } =
    useCart()

  // Get id from params
  const { id } = useParams<{ id: string }>()

  // Local state for temporary discount values
  const [localDiscount, setLocalDiscount] = React.useState({
    type: discount?.type || '%',
    value: discount?.value || 0,
  })

  // Reset local state when modal opens
  React.useEffect(() => {
    if (isDiscountModalOpen) {
      setLocalDiscount({
        type: discount?.type || '%',
        value: discount?.value || 0,
      })
    }
  }, [isDiscountModalOpen, discount])

  // Update the order data
  const { mutate: update, isLoading } = useMutation({
    mutationKey: ['orders'],
    mutationFn: (data: any) => {
      if (!id) throw new Error('Order ID is required')
      return updateOrder({
        id,
        orderData: data,
      })
    },
    onSuccess: () => {
      setDiscount(localDiscount)
      onDiscountModalClose()
    },
    onError: (err, newTodo, context) => {
      // TODO: Handle error
    },
  })

  const handleConfirm = () => {
    if (id) {
      update({ orderDiscount: localDiscount })
      return
    }
    setDiscount(localDiscount)
    onDiscountModalClose()
  }

  return (
    <Dialog open={isDiscountModalOpen} onOpenChange={onDiscountModalClose}>
      <DialogContent className="max-w-[700px] gap-0 p-0">
        <DialogHeader className="border-b p-4">
          <DialogTitle>Order Discount</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[400px] px-3 py-2">
          <div className="flex gap-4 text-sm p-1">
            <div className="flex-1">
              <Discount
                discount={localDiscount}
                setDiscount={setLocalDiscount}
              />

              <div className="flex gap-2 mt-2">
                {[10, 15, 20].map(val => (
                  <Button
                    key={val}
                    size="sm"
                    variant={
                      localDiscount?.value === val ? 'default' : 'outline'
                    }
                    onClick={() => setLocalDiscount({ type: '%', value: val })}
                  >
                    + {val}%
                  </Button>
                ))}
              </div>
            </div>
            <div className="flex-1">
              <Keypad
                quantity={localDiscount?.value || 0}
                setQuantity={(val: number) =>
                  setLocalDiscount({ ...localDiscount, value: val })
                }
              />
            </div>
          </div>
        </ScrollArea>
        <div className="flex gap-2 p-4 border-t">
          <Button
            className="w-full h-12"
            variant="destructive"
            onClick={onDiscountModalClose}
          >
            <Icon name="X" />
            Cancel
          </Button>
          <Button
            className="w-full h-12 font-bold"
            onClick={handleConfirm}
            disabled={
              localDiscount?.value === 0 || !localDiscount?.value || isLoading
            }
          >
            Confirm
            {isLoading ? (
              <Icon name="Loader" className="animate-spin" size={16} />
            ) : (
              <Icon name="CheckCheck" size={16} />
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default DiscountModal
