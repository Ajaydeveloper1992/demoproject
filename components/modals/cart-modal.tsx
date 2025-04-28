'use client'

import React from 'react'
import { iModifiers } from '~/types'
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
import Keypad from '~/components/keypad'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Textarea } from '~/components/ui/textarea'
import { ScrollArea } from '~/components/ui/scroll-area'
import Variations from '~/components/variations'
//
import Discount from '../discount'

const CartModal = () => {
  const {
    isOpen,
    onClose,
    selectedCart: data,
    updateCart,
    modalType,
    addToCart,
  } = useCart()

  const [discount, setDiscount] = React.useState({
    type: data?.itemDiscount?.type || '%',
    value: data?.itemDiscount?.value || 0,
  })
  const [quantity, setQuantity] = React.useState(data?.quantity || 0)
  const [notes, setNotes] = React.useState(data?.itemNote || '')
  const [selectedOptions, setSelectedOptions] = React.useState<{
    [key: string]: string[]
  }>({})
  const [isOptErr, setIsOptErr] = React.useState(false)

  const handleQuantityChange = (change: number) => {
    setQuantity(Math.max(1, Number(quantity) + change))
  }

  const handleConfirm = () => {
    if (!data) return
    // Update the cart with the new data
    updateCart({
      productId: data?.id,
      data: {
        ...data,
        quantity,
        itemNote: notes,
        itemDiscount: discount,
        modifiers: selectedOptions,
      },
    })
    onClose()
  }

  React.useEffect(() => {
    if (!data) return
    setQuantity(data?.quantity || 1)
    setNotes(data?.itemNote || '')
    setDiscount({
      type: data?.itemDiscount?.type || '%',
      value: data?.itemDiscount?.value || 0,
    })
  }, [data])

  // Reset selectedOptions when the modal opens
  React.useEffect(() => {
    if (isOpen) {
      setSelectedOptions({})
    }
  }, [isOpen])

  // Initialize selectedOptions if data.modifiers is available
  React.useEffect(() => {
    if (data && data.item && data.item.modifiersgroup) {
      let initialOptions: {
        [key: string]: string[]
      } = {}

      data.item.modifiersgroup.forEach(group => {
        initialOptions[group.pos.name] =
          data.modifiers && data.modifiers[group.pos.name]
            ? data.modifiers[group.pos.name]
            : group.modifiers
                .filter(modifier => modifier.defaultSelected)
                .map(modifier => modifier._id)
      })
      setSelectedOptions(initialOptions)
    } else {
      console.error('data.modifiersgroup is not an object or data is null')
      setSelectedOptions({})
    }
  }, [data, isOpen])

  // Calculate initial errors
  React.useEffect(() => {
    if (data?.modifiers) {
      const errors = calculateErrors()
      setIsOptErr(errors.includes(true))
    }
  }, [data])

  // Check for errors in data.modifiersgroup with requiredModifiersCount
  // check it with selectedOptions
  React.useEffect(() => {
    if (data?.modifiers) {
      const errors = calculateErrors()
      setIsOptErr(errors.includes(true))
    }
  }, [selectedOptions])

  const calculateErrors = () => {
    if (!data?.item?.modifiersgroup) return []
    return data?.item?.modifiersgroup.map(modifier => {
      const selectedCount = selectedOptions[modifier.pos.name]?.length || 0
      return (
        selectedCount < modifier.pos.requiredModifiersCount ||
        selectedCount > modifier.pos.allowedModifiersCount
      )
    })
  }

  if (!data) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[700px] gap-0 p-0">
        <DialogHeader className="border-b p-4">
          <DialogTitle>
            {isNaN(quantity) ? 1 : quantity} x {data?.item?.name}{' '}
            <span className="text-destructive">
              ($
              {(
                (isNaN(Number(quantity)) ? 1 : Number(quantity)) *
                data?.item?.posprice
              ).toFixed(2)}
              )
            </span>
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[400px] px-3 py-2">
          <div className="flex gap-4 text-sm p-1">
            <div className="flex-1">
              {data?.item?.modifiersgroup &&
                data?.item?.modifiersgroup.length > 0 && (
                  <div className="space-y-2">
                    <p className="font-semibold">Options:</p>
                    {data?.item?.modifiersgroup.map((modifier: iModifiers) => (
                      <Variations
                        data={modifier}
                        key={modifier.pos.name}
                        value={selectedOptions[modifier.pos.name] || []}
                        setValue={(value: string[]) => {
                          setSelectedOptions(prevOptions => ({
                            ...prevOptions,
                            [modifier.pos.name]: value,
                          }))
                        }}
                      />
                    ))}
                  </div>
                )}
              <div className="grid w-full gap-1.5 mt-3">
                <Label htmlFor="notes" className="font-semibold">
                  Notes:
                </Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Any special requests?"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="quantity"
                className="text-center block font-semibold"
              >
                Quantity
              </Label>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    if (isNaN(quantity)) {
                      setQuantity(1)
                    } else {
                      handleQuantityChange(-1)
                    }
                  }}
                  disabled={quantity === 1}
                >
                  <Icon name="Minus" className="h-4 w-4" />
                </Button>
                <Input
                  id="quantity"
                  type="number"
                  autoFocus
                  value={quantity}
                  onChange={e => setQuantity(parseInt(e.target.value, 10))}
                  className="flex-1 text-center"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    if (isNaN(quantity)) {
                      setQuantity(1)
                    } else {
                      handleQuantityChange(1)
                    }
                  }}
                  // onClick={() => handleQuantityChange(1)}
                  // disabled={quantity === data.stockQuantity}
                >
                  <Icon name="Plus" className="h-4 w-4" />
                </Button>
              </div>
              <Keypad
                quantity={quantity}
                setQuantity={val => setQuantity(val)}
              />
              <div className="h-0.5" />
              <Discount discount={discount} setDiscount={setDiscount} />
            </div>
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
          {modalType === 'product' ? (
            <Button
              className="w-full h-12 font-bold"
              onClick={() => {
                addToCart({
                  item: {
                    ...data.item,
                    itemcustomname: data.item.name,
                  },
                  quantity: quantity === 0 || isNaN(quantity) ? 1 : quantity,
                  modifiers: selectedOptions,
                  note: notes,
                  itemDiscount: discount,
                  timestamp: new Date(),
                })
                onClose()
              }}
              disabled={isOptErr || quantity === 0 || isNaN(quantity)}
            >
              Add to Cart <Icon name="ShoppingCart" className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              className="w-full h-12 font-bold"
              onClick={handleConfirm}
              disabled={isOptErr || quantity === 0 || isNaN(quantity)}
            >
              Confirm <Icon name="CheckCheck" className="h-4 w-4" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default CartModal
