// @ts-nocheck
'use client'
import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { useRestaurant } from '~/hooks/use-restaurant'

export default function ZizZapPickupTime({ onClose }) {
  const restaurant = useRestaurant(state => state.restaurant)
  const pickupInfo = useRestaurant(state => state.pickupInfo)
  const updatePickupInfo = useRestaurant(state => state.updatePickupInfo)
  const [orderType, setOrderType] = useState('Pickup')
  const [orderTime, setOrderTime] = useState('ASAP')
  const [selectedDate, setSelectedDate] = useState('Today')
  const [selectedTime, setSelectedTime] = useState('')
  const [availableTimes, setAvailableTimes] = useState([])

  let address = restaurant?.data?.address
    ? JSON.parse(restaurant.data.address)
    : {}

  useEffect(() => {
    if (!restaurant || !restaurant.data) return

    const openingHours = restaurant.data.openingHours
      ? JSON.parse(restaurant.data.openingHours)
      : {}

    // 🕒 Get current time & convert to Toronto timezone
    let currentTime = new Date()
    console.log('Current local time before conversion:', currentTime.toString())
    const currentTimes = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Toronto',
      dateStyle: 'full',
      timeStyle: 'long',
    }).format(new Date())

    console.log(currentTimes)
    // Convert local time to America/Toronto
    let torontoTime = new Date(
      new Intl.DateTimeFormat('en-US', { timeZone: 'America/Toronto' }).format(
        currentTime
      )
    )

    console.log('Converted Toronto Time:', torontoTime.toString())

    // Get the current day in lowercase (e.g., 'monday')
    const currentDay = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Toronto',
      weekday: 'long',
    })
      .format(torontoTime)
      .toLowerCase()

    console.log('Current Day in Toronto:', currentDay)

    // Get today's opening hours
    const todayHours = openingHours[currentDay]

    console.log("Today's Opening Hours:", todayHours)

    if (todayHours && todayHours.isOpen) {
      const times = []
      const timeSlots = todayHours.timeSlots || []

      timeSlots.forEach(slot => {
        const [start, end] = [slot.start, slot.end].map(timeString => {
          const [time, modifier] = timeString.split(' ')
          const [hour, minute] = time.split(':').map(Number)
          const adjustedHour =
            modifier === 'PM' && hour !== 12
              ? hour + 12
              : modifier === 'AM' && hour === 12
                ? 0
                : hour
          return { hour: adjustedHour, minute: minute || 0 }
        })

        const startDateTime = new Date(torontoTime)
        startDateTime.setHours(start.hour, start.minute, 0, 0)

        const endDateTime = new Date(torontoTime)
        endDateTime.setHours(end.hour, end.minute, 0, 0)

        const timeSlotDis = restaurant?.data?.timeSlots || 30 // Default 30 mins

        for (
          let time = new Date(startDateTime);
          time <= endDateTime;
          time.setMinutes(time.getMinutes() + timeSlotDis)
        ) {
          if (time > currentTime) {
            const formattedTime = `${time.getHours() % 12 || 12}:${
              time.getMinutes() === 0 ? '00' : time.getMinutes()
            } ${time.getHours() >= 12 ? 'PM' : 'AM'}`
            times.push(formattedTime)
          }
        }
      })

      setAvailableTimes(times)
      if (!selectedTime && times.length > 0) {
        setSelectedTime(times[0]) // Set first available time as default
      }
    } else {
      setAvailableTimes([])
      setSelectedTime('')
    }
  }, [
    restaurant,
    restaurant?.data?.timeSlots,
    restaurant?.data?.openingHours,
    selectedTime,
  ])

  const handleUpdate = () => {
    const pickupDetails = { orderType, orderTime, selectedDate, selectedTime }
    updatePickupInfo(pickupDetails)
    onClose()
  }
  // Generate date options dynamically
  const getDateOptions = () => {
    const today = new Date()
    const options = []

    for (let i = 0; i < 3; i++) {
      // Today, Tomorrow, +2 days
      let futureDate = new Date()
      futureDate.setDate(today.getDate() + i)

      const formattedDate = futureDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })

      if (i === 0) {
        options.push({ label: 'Today', value: formattedDate })
      } else if (i === 1) {
        options.push({
          label: `Tomorrow (${formattedDate})`,
          value: formattedDate,
        })
      } else {
        options.push({ label: formattedDate, value: formattedDate })
      }
    }

    return options
  }
  const dateOptions = getDateOptions()
  return (
    <div className="fixed inset-0  bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold">Ordering details</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-6 w-6" />
            <span className="sr-only">Close</span>
          </button>
        </div>
        <div className="p-6 space-y-6">
          <div>
            <select
              value={orderType}
              onChange={e => setOrderType(e.target.value)}
              className="w-full p-2 border rounded-md"
            >
              <option>Pickup</option>
              <option>Delivery</option>
            </select>
          </div>
          <div>
            <h3 className="text-lg font-medium mb-2">Pickup location</h3>
            <div className="flex items-center space-x-4 rounded-md border p-4">
              <div className="flex-1 space-y-1">
                {address.streetAddress && (
                  <div className="space-y-1">
                    <p className="text-muted-foreground">Address</p>
                    <p className="font-medium">{address.streetAddress}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-medium mb-2">Pickup time</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              {/* <button
                onClick={() => setOrderTime(orderTime === 'ASAP' ? '' : 'ASAP')}
                className={`p-2 border rounded-md ${orderTime === 'ASAP' ? 'bg-teal-600 text-white' : 'bg-white'}`}
              >
                ASAP
              </button> */}
              <select
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                className="w-full p-2 border rounded-md"
              >
                {dateOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <select
                value={selectedTime}
                onChange={e => setSelectedTime(e.target.value)}
                className="w-full p-2 border rounded-md"
              >
                {availableTimes.length > 0 ? (
                  availableTimes.map(time => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))
                ) : (
                  <option disabled>No available times</option>
                )}
              </select>
            </div>
          </div>
        </div>
        <div className="flex justify-end space-x-4 p-6 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded-md hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={handleUpdate}
            className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800"
          >
            Update
          </button>
        </div>
      </div>
    </div>
  )
}
