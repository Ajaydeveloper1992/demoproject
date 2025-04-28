import React from 'react'
//
import { cn } from '~/lib/utils'
import { Input } from '~/components/ui/input'
import { Button } from '~/components/ui/button'

interface Props extends React.HTMLProps<HTMLDivElement> {
  discount?: {
    type: '%' | '$'
    value: number
  }
  setDiscount: (discount: { value: number; type: '%' | '$' }) => void
}

const Discount = ({ discount, setDiscount, className, ...props }: Props) => {
  const handleTypeChange = type => {
    setDiscount({
      value: discount?.value || 0,
      type: type,
    })
  }

  return (
    <div className={cn('space-y-2', className)} {...props}>
      <label className="font-semibold" htmlFor="discount">
        Discount
      </label>
      <div className="flex items-center relative space-x-2">
        <Input
          type="number"
          name="discount"
          id="discount"
          className="appearance-none"
          placeholder={`Enter discount (${discount?.type})`}
          value={discount?.value || ''}
          step="0.01"
          onChange={e => {
            const inputValue = e.target.value
            let parsedValue

            if (inputValue.startsWith('.')) {
              parsedValue = parseFloat('0' + inputValue)
            } else {
              parsedValue = parseFloat(inputValue)
            }

            setDiscount({
              value: isNaN(parsedValue) ? 0 : parsedValue,
              type: discount?.type || '%',
            })
          }}
        />
        <div className="flex">
          <Button
            size="icon"
            className="rounded-r-none"
            variant={discount?.type === '%' ? 'destructive' : 'outline'}
            onClick={() => handleTypeChange('%')}
          >
            %
          </Button>
          <Button
            size="icon"
            className="rounded-l-none"
            variant={discount?.type === '$' ? 'destructive' : 'outline'}
            onClick={() => handleTypeChange('$')}
          >
            $
          </Button>
        </div>
      </div>
    </div>
  )
}

export default Discount
