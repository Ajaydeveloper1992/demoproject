import React from 'react'
import { redirect } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from 'react-query'
import { TimeValue } from 'react-aria-components'
import { iOrder, iProfile } from '~/types'
// Libs
import Axios from '~/lib/axios'
import { StaffEndpoints } from '~/lib/constants'
// Hooks
import { sendDelayMail } from '~/hooks/use-order'
import { useApp } from '~/hooks/use-app'
import { logout } from '~/app/pos/(auth)/login/actions'
import { rejectOrder, updateOrder } from '~/app/pos/takeout/actions'
// Components
import Icon from '~/components/icon'
import { Button } from '~/components/ui/button'
import TimePicker from '~/components/time-picker'
import { Textarea } from '~/components/ui/textarea'
import RejectModal from '~/components/modals/reject-modal'

interface Props {
  order: iOrder
  selectedTime: Date | null
  setSelectedTime: (time: Date) => void
  reason: string
  setReason: (reason: string) => void
  onClose: () => void
  setConfirmDialogOpen: (isOpen: boolean) => void
}

const PendingAction = ({
  order,
  selectedTime,
  setSelectedTime,
  reason,
  setReason,
  onClose,
  setConfirmDialogOpen,
}: Props) => {
  const [isAccepting, setIsAccepting] = React.useState(false)
  const [isRejecting, setIsRejecting] = React.useState(false)
  const [isRejectDialogOpen, setIsRejectDialogOpen] = React.useState(false)

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
    const timeStr = order?.pickupInfo?.pickupTime.split('-')[0].trim()
    const today = new Date()
    const [time, meridiem = ''] = timeStr.split(' ')
    const [hours, minutes] = time.split(':')
    const baseTime = new Date(
      today.setHours(
        meridiem?.toLowerCase() === 'pm' && hours !== '12'
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

  React.useEffect(() => {
    const _reason = `Dear ${
      order?.customer?.firstName
    },\n\nWe wanted to inform you that due to high order volume, your pick-up order will be delayed. Your new pick-up time is ${formatPickupTime(
      selectedTime!!
    )}.\n\nWe sincerely apologize for the inconvenience and appreciate your understanding.\n\nIf you have any questions, please don't hesitate to contact us at ${
      restaurant?.businessPhone
    }.\n\nThank you for your patience!\n\nBest regards,\n${
      restaurant?.name || ''
    }`
    setReason(_reason)
  }, [order, selectedTime])

  const formatPickupTime = (date: Date) => {
    if (!date) return ''
    return date.toLocaleString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  }

  const handleTimeChange = (time: Date) => {
    setSelectedTime(time)
    // Only show reason field if not selecting the first (default) time
    if (time.getTime() !== recommendedTimes[0].getTime()) {
      setReason('')
    }
  }
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
  const handleAccept = async () => {
    setIsAccepting(true)
    try {
      const mail_reqBody = {
        order_id: order._id,
        delayTime: selectedTime ? formatPickupTime(selectedTime) : '',
        delaymessage: reason,
      }
      const _reqBody = {
        orderstatus: 'InKitchen' as iOrder['orderstatus'],
        paymentStatus: order.paymentStatus,
        pickupInfo: {
          orderType: order.orderType,
          pickupTime: order.pickupInfo?.pickupTime,
          selectedDate: order.pickupInfo?.selectedDate,
          delayTime: selectedTime ? formatPickupTime(selectedTime) : '',
        },
        tax: order.tax || 0,
      }

      mutate(mail_reqBody)

      const result = await updateOrder(order._id, _reqBody)
      console.log(result)
      queryClient.invalidateQueries('orders')
      onClose()
      setConfirmDialogOpen(true)
    } catch (error) {
      console.log(error)
    } finally {
      setIsAccepting(false)
    }
  }

  const handleReject = async (msg: string) => {
    console.log(order._id)
    setIsRejecting(true)
    try {
      const result = await rejectOrder(order._id, msg)
      console.log(result)
      queryClient.invalidateQueries('orders')
      onClose()
    } catch (error) {
      console.log(error)
    } finally {
      setIsRejecting(false)
    }
  }

  return (
    <>
      <h3 className="text-lg font-semibold mb-2">Recommended Pickup Times</h3>
      <div className="flex space-x-2 mb-4">
        {recommendedTimes.slice(0, 4).map(time => (
          <Button
            key={time.getTime()}
            size="sm"
            variant={
              selectedTime?.getTime() === time.getTime() ? 'default' : 'outline'
            }
            onClick={() => handleTimeChange(time)}
          >
            {formatPickupTime(time)}
          </Button>
        ))}
        <TimePicker
          // Check if selected time is not matching any of the recommended times
          active={
            !recommendedTimes.some(
              time => selectedTime?.getTime() === time.getTime()
            )
          }
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
      {selectedTime &&
        selectedTime.getTime() !== recommendedTimes[0].getTime() && (
          <div className="mb-4 space-y-2">
            <label htmlFor="reason" className="block text-sm font-medium">
              Reason for changing pickup time:
            </label>
            <Textarea
              id="reason"
              className="ring-0 max-h-40"
              rows={3}
              placeholder="Enter reason"
              value={reason}
              onChange={e => setReason(e.target.value)}
            />
          </div>
        )}
      <div className="flex h-16 space-x-2">
        <Button
          variant="destructive"
          className="w-full h-full"
          onClick={() => setIsRejectDialogOpen(true)}
          disabled={
            isRejecting || isAccepting || order?.orderstatus === 'Complete'
          }
        >
          {isRejecting ? (
            <>
              <Icon name="Loader" className="mr-2 h-4 w-4 animate-spin" />
              Rejecting
            </>
          ) : (
            'Reject Order'
          )}
        </Button>
        <Button
          onClick={handleAccept}
          className="w-full h-full"
          disabled={
            isRejecting || isAccepting || order?.orderstatus === 'Complete'
          }
        >
          {isAccepting ? (
            <>
              <Icon name="Loader" className="mr-2 h-4 w-4 animate-spin" />
              Accepting
            </>
          ) : (
            'Accept Order'
          )}
        </Button>
      </div>

      <RejectModal
        order={order}
        isOpen={isRejectDialogOpen}
        onClose={() => setIsRejectDialogOpen(false)}
        onConfirm={msg => handleReject(msg)}
        loading={isRejecting}
      />
    </>
  )
}

export default PendingAction
