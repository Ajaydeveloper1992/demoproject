import React from 'react'
// Components
import { Label } from '~/components/ui/label'
import { RadioGroup, RadioGroupItem } from '~/components/ui/radio-group'
import { Checkbox } from '~/components/ui/checkbox'
import { iModifiers } from '~/types'

interface Props {
  data: iModifiers
  value: string[]
  setValue: (value: string[]) => void
}

const Variations = ({ data, value = [], setValue }: Props) => {
  const [error, setError] = React.useState<string | null>(null)

  // Set default values
  React.useEffect(() => {
    const defaultSelectedValues = data?.modifiers
      .filter(option => option.defaultSelected)
      .map(option => (option._id as string) || '')
    // Only set the value if it's not already set
    if (value.length === 0 && defaultSelectedValues.length > 0) {
      setValue(defaultSelectedValues)
    }
  }, [data])

  const onValueChange = (newValue: string) => {
    if (data?.pos?.allowedModifiersCount === 1) {
      setValue([newValue])
    } else {
      if (value.some(v => v === newValue)) {
        setValue(value.filter(v => v !== newValue))
      } else {
        setValue([...(value || []), newValue])
      }
    }
  }

  // Verify the values
  React.useEffect(() => {
    if (value.length < data?.pos?.requiredModifiersCount) {
      setError(`Please select ${data?.pos?.requiredModifiersCount} item(s)`)
    } else if (value.length > data?.pos?.allowedModifiersCount) {
      setError(
        `You can only select up to ${data?.pos?.allowedModifiersCount} item(s)`
      )
    } else {
      setError(null)
    }
  }, [value])

  console.log({ data, value })

  return (
    <div className="border rounded p-3 space-y-1">
      {data?.pos?.allowedModifiersCount === 1 ? (
        <>
          <Label className="font-semibold">{data?.pos?.name}</Label>
          <RadioGroup
            value={value[0]}
            onValueChange={id => {
              const selectedOption = data.modifiers.find(
                option => option._id === id
              )
              onValueChange(selectedOption?._id!!)
            }}
          >
            {data?.modifiers &&
              data?.modifiers.length > 0 &&
              data?.modifiers.map((option, index) => (
                <div className="flex items-center space-x-2" key={index}>
                  <RadioGroupItem value={option?._id} id={option?._id} />
                  <Label
                    className="capitalize select-none cursor-pointer"
                    htmlFor={option?._id}
                  >
                    {option?.name?.toLowerCase()}{' '}
                    <span className="text-primary">
                      (+${option?.priceAdjustment})
                    </span>
                  </Label>
                </div>
              ))}
          </RadioGroup>
        </>
      ) : (
        <>
          <Label className="font-semibold">{data?.pos?.name}</Label>
          {data?.modifiers &&
            data?.modifiers.length > 0 &&
            data?.modifiers.map((option, index) => (
              <div className="flex items-center space-x-2" key={index}>
                <Checkbox
                  id={option?._id}
                  checked={value.some(v => v === option?._id)}
                  onCheckedChange={() => onValueChange(option?._id!!)}
                />
                <Label
                  className="capitalize select-none cursor-pointer"
                  htmlFor={option?._id}
                >
                  {option?.name?.toLowerCase()} (+${option?.priceAdjustment})
                </Label>
              </div>
            ))}
        </>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}

export default Variations
