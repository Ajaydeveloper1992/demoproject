'use client'

import React from 'react'
// Components
import { Button } from '~/components/ui/button'
import Icon from '~/components/icon'

interface Props {
  quantity: number
  setQuantity: any
}

const Keypad = ({ quantity, setQuantity }: Props) => {
  const handleQuantityChange = (value: string) => {
    let newQuantity =
      quantity.toString() === '1' && value !== '0'
        ? value
        : quantity.toString() + value
    if (parseInt(newQuantity) > 0) {
      setQuantity(parseInt(newQuantity))
    }
  }

  const handleBack = () => {
    if (quantity.toString().length > 1) {
      setQuantity(parseInt(quantity.toString().slice(0, -1)) || 0)
    } else {
      setQuantity(0)
    }
  }

  const handleReset = () => {
    setQuantity(1)
  }

  return (
    <div className="grid grid-cols-3 rounded overflow-hidden border">
      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
        <Button
          key={num}
          variant="outline"
          className="h-12 rounded-none"
          onClick={() => handleQuantityChange(num.toString())}
        >
          {num}
        </Button>
      ))}
      <Button
        variant="outline"
        className="h-12 rounded-none"
        onClick={() => handleQuantityChange('0')}
      >
        0
      </Button>
      <Button
        variant="outline"
        className="h-12 rounded-none"
        onClick={handleBack}
      >
        <Icon name="Delete" className="h-4 w-4" />
        <span className="sr-only">Back</span>
      </Button>
      <Button
        variant="outline"
        className="h-12 rounded-none"
        onClick={handleReset}
      >
        <Icon name="X" className="mr-1" />
        Reset
      </Button>
    </div>
  )
}

export default Keypad
