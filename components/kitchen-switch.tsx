'use client'

import { Label } from '~/components/ui/label'
import { Switch } from '~/components/ui/switch'

interface Props {
  checked: boolean
  setChecked: (value: boolean) => void
}

const KitchenSwitch = ({ checked, setChecked }: Props) => {
  return (
    <div className="inline-flex items-center gap-2">
      <Switch
        id="switch-08"
        checked={checked}
        onCheckedChange={setChecked}
        aria-label="Toggle switch"
      />
      <Label htmlFor="switch-08" className="text-sm font-medium">
        {checked ? 'Send to Kitchen' : 'Send to Kitchen'}
      </Label>
    </div>
  )
}

export default KitchenSwitch
