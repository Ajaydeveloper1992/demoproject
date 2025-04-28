import { ArrowLeft } from 'lucide-react'
import { KeypadButton } from './KeypadButton'
import Icon from '~/components/icon'

interface NumericKeypadProps {
  onNumberClick: (num: string) => void
  onClear: () => void
  onBackspace: () => void
  customPads?: string[]
  onConfirm?: React.MouseEventHandler<HTMLButtonElement>
  isLoading?: boolean
  disabled?: boolean
}

export function NumericKeypad({
  onNumberClick,
  disabled,
  onClear,
  onBackspace,
  customPads = ['0', '.', '00'],
  onConfirm,
  isLoading,
}: NumericKeypadProps) {
  return (
    <div className="grid grid-cols-4 gap-2 col-span-4">
      {[1, 2, 3].map(num => (
        <KeypadButton
          key={num}
          onClick={() => onNumberClick(num.toString())}
          disabled={isLoading || disabled}
        >
          {num}
        </KeypadButton>
      ))}
      <KeypadButton onClick={onClear} className="bg-gray-100">
        clear
      </KeypadButton>

      {[4, 5, 6].map(num => (
        <KeypadButton
          key={num}
          onClick={() => onNumberClick(num.toString())}
          disabled={isLoading || disabled}
        >
          {num}
        </KeypadButton>
      ))}
      <KeypadButton
        onClick={onBackspace}
        className="bg-gray-100"
        disabled={isLoading || disabled}
      >
        <ArrowLeft className="h-4 w-4" />
      </KeypadButton>

      {[7, 8, 9].map(num => (
        <KeypadButton
          key={num}
          onClick={() => onNumberClick(num.toString())}
          disabled={isLoading || disabled}
        >
          {num}
        </KeypadButton>
      ))}
      <KeypadButton
        className="row-span-2 h-full bg-gray-100"
        onClick={onConfirm}
        type="submit"
        disabled={isLoading}
      >
        {isLoading ? (
          <Icon name="Loader" className="animate-spin" size={18} />
        ) : (
          '↵'
        )}
      </KeypadButton>

      {customPads.map(num => (
        <KeypadButton
          key={num}
          onClick={() => onNumberClick(num)}
          disabled={isLoading || disabled}
        >
          {num}
        </KeypadButton>
      ))}
    </div>
  )
}
