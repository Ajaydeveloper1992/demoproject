import * as React from 'react'
import { iOrder, iRefundOrderBody } from '~/types'
// Components
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'
import Icon from '~/components/icon'
import { Alert } from '~/components/ui/alert'
import { Label } from '~/components/ui/label'
import {
  Select,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectContent,
} from '~/components/ui/select'
import { Input } from '~/components/ui/input'
import { Button } from '~/components/ui/button'
import { Textarea } from '~/components/ui/textarea'
import { Checkbox } from '~/components/ui/checkbox'
import { ScrollArea } from '~/components/ui/scroll-area'

interface RefundModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (data: iRefundOrderBody) => void
  loading: boolean
  order: iOrder
  error?: string
}

const RefundModal: React.FC<RefundModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  loading,
  order,
  error,
}) => {
  const [reason, setReason] = React.useState('')
  const [refundAmounts, setRefundAmounts] = React.useState<
    Record<string, number>
  >({})
  const [refundSelected, setRefundSelected] = React.useState<
    Record<string, boolean>
  >({})
  const [paymentMethod, setPaymentMethod] = React.useState<'Cash' | 'Card'>(
    'Cash'
  )

  React.useEffect(() => {
    setReason('')
    const initialAmounts: Record<string, number> = {}
    const initialSelected: Record<string, boolean> = {}
    order.items.forEach(item => {
      initialAmounts[item._id] = item.quantity
      initialSelected[item._id] = false
    })
    setRefundAmounts(initialAmounts)
    setRefundSelected(initialSelected)
  }, [isOpen, order.items])

  const toggleItem = (itemId: string, max: number) => {
    const current = refundSelected[itemId]
    const newSelected = !current
    setRefundSelected({ ...refundSelected, [itemId]: newSelected })
    setRefundAmounts({
      ...refundAmounts,
      [itemId]: max,
    })
  }

  const handleConfirm = () => {
    const items = Object.entries(refundAmounts)
      .filter(([itemId, qty]) => refundSelected[itemId] && qty > 0)
      .map(([itemId, qty]) => {
        const item = order.items.find(i => i._id === itemId)
        const status: 'Refunded' | 'Partially Refunded' =
          item && qty < item.quantity ? 'Partially Refunded' : 'Refunded'
        return {
          itemId,
          refundQuantity: qty,
          itemStatus: status,
          refundReason: reason,
        }
      })
    onConfirm({
      orderId: order._id,
      refundReason: reason,
      paymentMethod,
      itemsToRefund: items,
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[400px] gap-0 p-0">
        <DialogHeader className="border-b p-4">
          <DialogTitle>Refund Order (#{order?.orderNumber})</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[400px] px-3 py-2">
          <div className="space-y-1 p-1">
            {/* <Label className='font-semibold block'>Items to Refund</Label> */}
            {order.items
              .filter(o => o.itemStatus !== 'Refunded')
              .map(item => (
                <div
                  key={item._id}
                  className="flex items-center space-x-2 text-sm"
                >
                  <Checkbox
                    checked={refundSelected[item._id]}
                    onCheckedChange={() => toggleItem(item._id, item.quantity)}
                  />
                  <span
                    className="cursor-pointer select-none capitalize flex-1"
                    onClick={() => toggleItem(item._id, item.quantity)}
                  >
                    {item?.item?.name?.toLowerCase()}
                  </span>
                  <Input
                    type="number"
                    min={1}
                    max={item.quantity}
                    disabled={!refundSelected[item._id]}
                    value={
                      refundSelected[item._id] ? refundAmounts[item._id] : 0
                    }
                    onChange={e =>
                      setRefundAmounts({
                        ...refundAmounts,
                        [item._id]: Number(e.target.value),
                      })
                    }
                    className="w-16 h-7"
                  />
                </div>
              ))}
          </div>

          <div className="space-y-2 p-1 my-3">
            <Label className="font-semibold block">Refund Payment Method</Label>
            <Select
              value={paymentMethod}
              onValueChange={value =>
                setPaymentMethod(value as 'Cash' | 'Card')
              }
            >
              <SelectTrigger className="w-full border rounded p-1">
                <SelectValue placeholder="Select payment method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Cash">Cash</SelectItem>
                <SelectItem value="Card">Card</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 p-1">
            <Label htmlFor="reason" className="font-semibold block">
              Reason for refunding order
            </Label>
            <Textarea
              id="reason"
              placeholder="Enter reason"
              className="max-h-[150px]"
              rows={2}
              value={reason}
              onChange={e => setReason(e.target.value)}
            />
          </div>
          {error && (
            <Alert variant="destructive">
              <strong>ERROR:</strong> {error}
            </Alert>
          )}
        </ScrollArea>
        <div className="flex gap-2 p-4 border-t">
          <Button
            className="w-full h-12"
            variant="destructive"
            onClick={onClose}
          >
            <Icon name="X" />
            Close
          </Button>
          <Button
            className="w-full h-12 font-bold"
            disabled={
              loading || !reason || Object.values(refundSelected).every(v => !v)
            }
            onClick={handleConfirm}
          >
            Refund
            {loading ? (
              <Icon name="Loader" size={15} className="animate-spin" />
            ) : (
              <Icon name="CheckCheck" size={15} />
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default RefundModal
