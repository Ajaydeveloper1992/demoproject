'use client'

import React from 'react'
// Hooks
import { useCart } from '~/hooks/use-cart'
// Components
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'
import Icon from '~/components/icon'
import { Button } from '~/components/ui/button'
import { Label } from '~/components/ui/label'
import { ScrollArea } from '~/components/ui/scroll-area'
import { Textarea } from '~/components/ui/textarea'
import { useMutation } from 'react-query'
import { iOrder } from '~/types'
import { emailReceipt } from '~/hooks/use-order'
import { toast } from 'sonner'
import { Input } from '../ui/input'

interface Props {
  id: string
  order: iOrder
  isOpen: boolean
  onClose: () => void
}

const ReceiptModal = ({ id, order, isOpen, onClose }: Props) => {
  const [mail, setMail] = React.useState('')

  // Send email receipt using react-query
  const { mutate: sendEmail, isLoading: isSending } = useMutation({
    mutationFn: () => {
      if (!order?._id) {
        toast.error('Error', {
          description: 'Order ID is required',
        })
        throw new Error('Order ID is required')
      }
      if (!mail) {
        toast.error('Error', {
          description: 'Email is required',
        })
        throw new Error('Email is required')
      }
      return emailReceipt(id, mail)
    },
    onSuccess: () => {
      toast.success('Success', {
        description: 'Email receipt sent',
      })
      onClose()
    },
    onError: (err, newTodo, context) => {
      console.log(err)
    },
  })

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm gap-0 p-0">
        <DialogHeader className="border-b p-4">
          <DialogTitle>Order Receipt</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[400px] px-3 py-2">
          <div className="space-y-2 p-1">
            <Label htmlFor="note" className="font-semibold block">
              Enter Customer Email:
            </Label>
            <Input
              id="email"
              placeholder="Email"
              type="email"
              value={mail}
              onChange={e => setMail(e.target.value)}
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
            Cancel
          </Button>
          <Button
            className="w-full h-12 font-bold"
            disabled={isSending}
            onClick={() => sendEmail()}
          >
            {isSending ? (
              <>
                Sending <Icon name="Loader" className="animate-spin" />
              </>
            ) : (
              <>
                Send <Icon name="Send" className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default ReceiptModal
