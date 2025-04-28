import * as React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '~/components/ui/dialog'
import { Button } from '~/components/ui/button'
import Icon from '~/components/icon'

interface SuccessModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: string | React.ReactNode
  label?: React.ReactNode
}

const SuccessModal: React.FC<SuccessModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  label,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm gap-0 p-0">
        <DialogHeader className="border-b px-4 py-8 text-center">
          <Icon
            name="CircleCheck"
            size={60}
            className="text-green-500 m-auto mb-4"
          />
          <DialogTitle className="text-center">{title}</DialogTitle>
          <DialogDescription className="text-center">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-2 p-4 border-t">
          <Button
            className="w-full h-12"
            variant="destructive"
            onClick={onClose}
          >
            <Icon name="X" />
            Close
          </Button>
          <Button className="w-full h-12 font-bold" onClick={onConfirm}>
            {label ? (
              label
            ) : (
              <>
                Confirm <Icon name="CheckCheck" size={15} />
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default SuccessModal
