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
import { ScrollArea } from '~/components/ui/scroll-area'
import { Input } from '~/components/ui/input'
import Keypad from '~/components/keypad'

interface Props {
  isOpen: boolean
  onClose: () => void
  title: string
}

const KeypadModal = ({ isOpen, onClose, title }: Props) => {
  const { splitQty, setSplitQty } = useCart()

  const [quantity, setQuantity] = React.useState(splitQty || 1)

  const handleQuantityChange = (change: number) => {
    setQuantity(Math.max(1, Number(quantity) + change))
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[350px] gap-0 p-0">
        <DialogHeader className="border-b p-4">
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[400px] px-3 py-2">
          <div className="space-y-2 p-1">
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleQuantityChange(-1)}
                disabled={quantity === 1}
              >
                <Icon name="Minus" className="h-4 w-4" />
              </Button>
              <Input
                id="quantity"
                type="number"
                min={1}
                autoFocus
                value={quantity}
                onChange={e => setQuantity(parseInt(e.target.value, 10))}
                className="flex-1 text-center"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleQuantityChange(1)}
              >
                <Icon name="Plus" className="h-4 w-4" />
              </Button>
            </div>
            <Keypad quantity={quantity} setQuantity={setQuantity} />
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
            onClick={() => {
              setSplitQty(quantity)
              onClose()
            }}
          >
            Confirm <Icon name="CheckCheck" className="h-4 w-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default KeypadModal
