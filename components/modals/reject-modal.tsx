import * as React from 'react'
import { iOrder } from '~/types'
// Components
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'
import { Button } from '~/components/ui/button'
import Icon from '~/components/icon'
import { ScrollArea } from '~/components/ui/scroll-area'
import { Label } from '~/components/ui/label'
import { Textarea } from '~/components/ui/textarea'

interface RejectModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (msg: string) => void
  loading: boolean
  order: iOrder
}

const RejectModal: React.FC<RejectModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  loading,
  order,
}) => {
  const [reason, setReason] = React.useState('')

  React.useEffect(() => {
    const _reason = `Dear ${
      order.customer?.firstName
    }, \n\nThank you for your recent order (${
      order?.orderNumber
    }) with us. Unfortunately, we regret to inform you that we are unable to fulfill your order at this time as we do not have all the items in stock.\n\nWe apologize for any inconvenience this may cause and appreciate your understanding.\n\nPlease feel free to contact us if you have any questions or need further assistance.\n\nBest regards,\n${
      order?.server?.name || ''
    }\n${order?.server?.businessPhone || ''}`
    setReason(_reason)
  }, [isOpen, order])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[700px] gap-0 p-0">
        <DialogHeader className="border-b p-4">
          <DialogTitle>Reject Order</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[400px] px-3 py-2">
          <div className="space-y-2 p-1">
            <Label htmlFor="note" className="font-semibold block">
              Reason for rejecting order
            </Label>
            <Textarea
              id="reason"
              placeholder="Enter reason"
              className="max-h-[350px]"
              rows={10}
              value={reason}
              onChange={e => setReason(e.target.value)}
            />
          </div>
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
            disabled={loading}
            onClick={() => onConfirm(reason)}
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

export default RejectModal
