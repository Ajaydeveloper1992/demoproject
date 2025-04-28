'use client'

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
import { Label } from '~/components/ui/label'
import { ScrollArea } from '~/components/ui/scroll-area'
import { Textarea } from '~/components/ui/textarea'

const NoteModal = () => {
  const { isNoteModalOpen, onNoteModalClose, note, setNote } = useCart()

  return (
    <Dialog open={isNoteModalOpen} onOpenChange={onNoteModalClose}>
      <DialogContent className="max-w-[700px] gap-0 p-0">
        <DialogHeader className="border-b p-4">
          <DialogTitle>Order Note</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[400px] px-3 py-2">
          <div className="space-y-2 p-1">
            <Label htmlFor="note" className="font-semibold block">
              Enter Order Note:
            </Label>
            <Textarea
              id="note"
              placeholder="Note"
              className="h-20"
              value={note}
              onChange={e => setNote(e.target.value)}
            />
          </div>
        </ScrollArea>
        <div className="flex gap-2 p-4 border-t">
          <Button
            className="w-full h-12"
            variant="destructive"
            onClick={onNoteModalClose}
          >
            <Icon name="X" />
            Cancel
          </Button>
          <Button className="w-full h-12 font-bold" onClick={onNoteModalClose}>
            Confirm <Icon name="CheckCheck" className="h-4 w-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default NoteModal
