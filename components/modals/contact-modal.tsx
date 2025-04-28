import * as React from 'react'
import { redirect } from 'next/navigation'
import { TimeValue } from 'react-aria-components'
import { useMutation, useQuery, useQueryClient } from 'react-query'
import { iOrder, iProfile } from '~/types'
// Libs
import Axios from '~/lib/axios'
import { StaffEndpoints } from '~/lib/constants'
// Hooks
import { useApp } from '~/hooks/use-app'
import { sendDelayMail } from '~/hooks/use-order'
import { logout } from '~/app/pos/(auth)/login/actions'
// Components
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'
import { Button } from '~/components/ui/button'
import Icon from '~/components/icon'
import { ScrollArea } from '~/components/ui/scroll-area'
import { Label } from '~/components/ui/label'
import { Textarea } from '~/components/ui/textarea'
import TimePicker from '~/components/time-picker'

interface ContactModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  order: iOrder
}

const ContactModal: React.FC<ContactModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  order,
}) => {
  const [selectedTime, setSelectedTime] = React.useState<Date>(
    new Date(order?.pickupInfo?.pickupTime ?? Date.now())
  )
  const [reason, setReason] = React.useState('')

  const queryClient = useQueryClient()
  const { setIsAuthenticated } = useApp()

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const { data } = await Axios.get(StaffEndpoints.profile)
      return data?.data as iProfile
    },
    onError: () => {
      logout()
      setIsAuthenticated(false)
      redirect('/pos/login')
    },
    onSuccess: data => {
      setIsAuthenticated(true)
    },
  })

  const restaurant = profile?.selectedRestaurants[0]

  // Generate 5 recommended pickup times, 20 minutes apart starting from order.date
  const recommendedTimes = React.useMemo(() => {
    if (!order?.pickupInfo?.pickupTime) return []
    const times: Date[] = []
    // example order.pickupInfo.pickupTime: '12:30 PM", '12:50 PM-ASAP'
    // Convert to time object
    const timeStr = order?.pickupInfo?.pickupTime
      ? order?.pickupInfo?.pickupTime.split('-')[0].trim()
      : ''
    const today = new Date()
    if (!timeStr) return [today]
    const [time, meridiem] = timeStr.split(' ')
    if (!time || !meridiem) return [today]
    const [hours, minutes] = time.split(':')
    const baseTime = new Date(
      today.setHours(
        meridiem.toLowerCase() === 'pm' && hours !== '12'
          ? parseInt(hours) + 12
          : parseInt(hours),
        parseInt(minutes)
      )
    )

    for (let i = 0; i < 5; i++) {
      const time = new Date(baseTime)
      time.setMinutes(time.getMinutes() + i * 20)
      times.push(time)
    }
    return times
  }, [order?.pickupInfo])

  // Set initial selected time
  React.useEffect(() => {
    if (recommendedTimes.length > 0 && !selectedTime) {
      setSelectedTime(recommendedTimes[0])
    }
  }, [recommendedTimes])

  const formatPickupTime = (date: Date) => {
    return date.toLocaleString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  }

  React.useEffect(() => {
    const _reason = `Dear ${
      order?.customer?.firstName
    },\n\nWe wanted to inform you that due to high order volume, your pick-up order will be delayed. Your new pick-up time is ${formatPickupTime(
      selectedTime
    )}.\n\nWe sincerely apologize for the inconvenience and appreciate your understanding.\n\nIf you have any questions, please don't hesitate to contact us at ${
      restaurant?.businessPhone
    }.\n\nThank you for your patience!\n\nBest regards,\n${
      restaurant?.name || ''
    }`
    setReason(_reason)
  }, [isOpen, order, selectedTime])

  const handleTimeChange = (time: Date) => {
    setSelectedTime(time)
    // Only show reason field if not selecting the first (default) time
    if (time.getTime() !== recommendedTimes[0].getTime()) {
      setReason('')
    }
  }

  // Handle sending message to customer with react-query
  // Update the order data
  const { mutate, isLoading } = useMutation({
    mutationKey: 'orders',
    mutationFn: (data: any) => sendDelayMail(data),
    onSuccess: () => {
      // Update the orders list
      queryClient.invalidateQueries('orders')

      onClose()
    },
    onError: (err, newTodo, context) => {
      console.log(err)
    },
  })

  const handleSend = async () => {
    const _reqBody = {
      order_id: order._id,
      delayTime: formatPickupTime(selectedTime),
      delaymessage: reason,
    }
    mutate(_reqBody)
  }

  if (!order) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[700px] gap-0 p-0">
        <DialogHeader className="border-b p-4">
          <DialogTitle>Contact Customer</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[400px] px-3 py-2">
          <h3 className="text-lg font-semibold mb-2">
            Recommended Pickup Times
          </h3>
          <div className="flex space-x-2 mb-4">
            {recommendedTimes.slice(0, 4).map(time => (
              <Button
                key={time.getTime()}
                size="sm"
                variant={
                  selectedTime?.getTime() === time.getTime()
                    ? 'default'
                    : 'outline'
                }
                onClick={() => handleTimeChange(time)}
              >
                {formatPickupTime(time)}
              </Button>
            ))}
            <TimePicker
              value={
                {
                  hour: recommendedTimes[4]?.getHours() ?? 0,
                  minute: recommendedTimes[4]?.getMinutes() ?? 0,
                  second: recommendedTimes[4]?.getSeconds() ?? 0,
                  millisecond: recommendedTimes[4]?.getMilliseconds() ?? 0,
                } as TimeValue
              }
              setValue={value => {
                const time = new Date(recommendedTimes[4])
                time.setHours(value.hour)
                time.setMinutes(value.minute)
                time.setSeconds(value.second)
                time.setMilliseconds(value.millisecond)
                setSelectedTime(time)
              }}
            />
          </div>
          <div className="space-y-2 p-1">
            <Label htmlFor="note" className="font-semibold block">
              Reason for changing pickup time:
            </Label>
            <Textarea
              id="reason"
              placeholder="Enter reason"
              className="max-h-[350px]"
              rows={10}
              value={reason}
              onChange={e => setReason(e.target.value)}
            />
          </div>
        </ScrollArea>

        <div className="flex gap-2 p-4 border-t">
          <Button
            className="w-full h-12"
            variant="destructive"
            onClick={onClose}
          >
            <Icon name="X" />
            Close
          </Button>
          <Button
            className="w-full h-12 font-bold"
            disabled={isLoading}
            onClick={handleSend}
          >
            Contact
            {isLoading ? (
              <Icon name="Loader" size={15} className="animate-spin" />
            ) : (
              <Icon name="Send" size={15} />
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default ContactModal
