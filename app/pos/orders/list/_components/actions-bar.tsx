import React from 'react'
// Components
import { cn } from '~/lib/utils'
import Icon from '~/components/icon'
import { Button } from '~/components/ui/button'

interface Props extends React.HTMLAttributes<HTMLElement> {
  selectedRowsCount: number
  handleDelete: () => void
  setRowSelection: (value: Record<string, unknown>) => void
}

const ActionsBar = ({
  selectedRowsCount,
  handleDelete,
  setRowSelection,
  className,
}: Props) => {
  return (
    <div
      className={cn(
        'flex items-center gap-4 absolute top-[1px] left-0 right-0 px-3 z-20 bg-green-200 h-12',
        className
      )}
    >
      <Button
        variant="link"
        className="text-green-600 font-semibold px-0"
        onClick={() => setRowSelection({})}
      >
        <Icon name="X" size={18} />
        <strong className="mr-1">{selectedRowsCount}</strong> selected
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleDelete}
        className="font-bold p-1 h-auto !text-destructive hover:bg-destructive/10"
      >
        <Icon name="Trash2" className="-mr-1" size={18} />
        Delete ({selectedRowsCount})
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="font-bold p-1 h-auto !text-primary hover:bg-primary/10"
      >
        <Icon name="Download" className="-mr-1" size={18} />
        Export ({selectedRowsCount})
      </Button>
    </div>
  )
}

export default ActionsBar
