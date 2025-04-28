import * as React from 'react'
import { iOrder, iVoidOrderBody } from '~/types'
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
import { Button } from '~/components/ui/button'
import { Textarea } from '~/components/ui/textarea'
import { Checkbox } from '~/components/ui/checkbox'
import { ScrollArea } from '~/components/ui/scroll-area'

interface VoidModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (data: iVoidOrderBody) => void
  loading: boolean
  order: iOrder
  error?: string
}

const VoidModal: React.FC<VoidModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  loading,
  order,
  error,
}) => {
  const [reason, setReason] = React.useState('')
  const [voidSelected, setVoidSelected] = React.useState<
    Record<string, boolean>
  >({})

  React.useEffect(() => {
    setReason('')
    if (order) {
      const initialSelected: Record<string, boolean> = {}
      order.items.forEach(i => {
        initialSelected[i._id] = false
      })
      setVoidSelected(initialSelected)
    }
  }, [isOpen, order])

  // Updated toggleItem to only toggle selection
  const toggleItem = (itemId: string) => {
    setVoidSelected({ ...voidSelected, [itemId]: !voidSelected[itemId] })
  }

  const handleConfirm = () => {
    if (order) {
      const items = order.items
        .filter(i => voidSelected[i._id])
        .map(i => ({
          itemId: i._id,
          itemVoidReason: reason,
        }))
      onConfirm({
        orderId: order._id,
        ordervoidreason: reason,
        itemsToVoid: items,
      })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm gap-0 p-0">
        <DialogHeader className="border-b p-4">
          <DialogTitle>Void Order (#{order?.orderNumber})</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[400px] px-3 py-2">
          {/* Render bulk void list when not in single-item mode */}
          {order && (
            <div className="space-y-1 p-1">
              {order.items
                .filter(o => o.itemStatus !== 'Voided')
                .map(i => (
                  <div
                    key={i._id}
                    className="flex items-center space-x-2 text-sm"
                  >
                    <Checkbox
                      checked={voidSelected[i._id]}
                      onCheckedChange={() => toggleItem(i._id)}
                    />
                    <span
                      className="cursor-pointer select-none capitalize"
                      onClick={() => toggleItem(i._id)}
                    >
                      {`${i.quantity} x ${i.item?.name?.toLowerCase()}`}{' '}
                      <span className="text-destructive">
                        (${(i.price * i.quantity).toFixed(2)})
                      </span>
                    </span>
                  </div>
                ))}
            </div>
          )}
          <div className="space-y-2 p-1 mt-3">
            <Label htmlFor="reason" className="font-semibold block">
              Reason for voiding this order
            </Label>
            <Textarea
              id="reason"
              placeholder="Enter reason"
              className="max-h-[150px]"
              rows={3}
              value={reason}
              onChange={e => setReason(e.target.value)}
            />
          </div>
          {error && (
            <Alert variant="destructive">
              <strong>ERROR:</strong> {error}
            </Alert>
          )}
          {order &&
            order.items.filter(o => o.itemStatus !== 'Voided').length ===
              Object.values(voidSelected).filter(v => v).length &&
            Object.values(voidSelected).filter(v => v).length > 0 && (
              <Alert variant="destructive" className="p-2">
                Voiding this product will void the entire order. Please add a
                product and then Void as item. <br />
                Would you still like to proceed?
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
              loading || !reason || Object.values(voidSelected).every(v => !v)
            }
            onClick={handleConfirm}
          >
            Confirm
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

export default VoidModal
