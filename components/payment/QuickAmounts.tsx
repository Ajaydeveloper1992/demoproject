import { KeypadButton } from './KeypadButton'

interface QuickAmountsProps {
  amounts: number[]
  onAmountClick: (amount: string) => void
}

export function QuickAmounts({ amounts, onAmountClick }: QuickAmountsProps) {
  return (
    <div className="grid grid-cols-5 gap-2">
      {amounts.map(amount => (
        <KeypadButton
          key={amount}
          className="text-sm"
          onClick={() => onAmountClick(amount.toString())}
        >
          {amount.toFixed(2)}
        </KeypadButton>
      ))}
    </div>
  )
}
