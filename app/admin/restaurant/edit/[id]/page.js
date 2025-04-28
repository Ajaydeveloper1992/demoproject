'use client' // Ensure this is a client component
import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '~/components/ui/button'
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '~/components/ui/dialog'
import { ChevronLeft, ChevronRight, Copy, Plus, Trash2 } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import Toastify from 'toastify-js'
export default function EditRestaurant() {
  const router = useRouter()
  const searchParams = useSearchParams()
  let id = searchParams.get('id')
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    address: '',
    status: 'pending', // Default status
  })
  const [isBusinessHoursModalOpen, setIsBusinessHoursModalOpen] =
    useState(false)
  useEffect(() => {
    const fetchRestaurant = async () => {
      if (id) {
        // Only fetch if ID is available
        try {
          const response = await axios.get(`/api/restaurant/view/${id}`)
          setFormData(response.data) // Set form data to the fetched restaurant data
        } catch (error) {
          console.error('Error fetching restaurant:', error)
        } finally {
          setLoading(false) // Set loading to false after fetching
        }
      }
    }

    fetchRestaurant() // Fetch restaurant data
  }, [id]) // Dependency array includes ID

  const handleInputChange = e => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }

  const handleSubmit = async e => {
    e.preventDefault()
    try {
      const response = await axios.put(`/api/restaurant/edit/${id}`, formData)

      Toastify({
        text: response.data.message,
        duration: 3000, // Duration in milliseconds
        close: true, // Show close button
        gravity: 'top', // `top` or `bottom`
        position: 'right', // `left`, `center` or `right`
        backgroundColor: 'linear-gradient(to right, #00b09b, #96c93d)',
        onClick: function () {}, // Callback after click
      }).showToast()

      //alert(response.data.message); // Notify the user of success

      router.push('/admin/restaurant') // Redirect to the restaurant list or any other page
    } catch (error) {
      console.error('Error updating restaurant:', error)
      //alert(error.response?.data?.error || 'Failed to update restaurant');
      Toastify({
        text: error.response?.data?.error || 'Failed to update restaurant',
        duration: 3000, // Duration in milliseconds
        close: true, // Show close button
        gravity: 'top', // `top` or `bottom`
        position: 'right', // `left`, `center` or `right`
        backgroundColor: 'linear-gradient(to right, #FF5C5C, #FF3B3B)', // Red gradient for error
        onClick: function () {}, // Callback after click
      }).showToast()
    }
  }

  // If ID is not yet set, show a loading indicator or a message
  if (!id) {
    return <div>Loading...</div> // Show loading or similar while waiting for ID
  }

  return (
    <>
      {loading ? ( // Conditional rendering for loading
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 mt-3 mb-6 rounded"></div>
          <div className="h-4 bg-gray-300 mb-6 rounded"></div>
          <div className="h-4 bg-gray-200 mb-6 rounded"></div>
          <div className="h-4 bg-gray-300 mb-6 rounded"></div>
          <div className="h-4 bg-gray-200 mb-6 rounded"></div>
        </div>
      ) : (
        <Card className="w-full max-w-6xl mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl">Edit Restaurant vvvvvvv</CardTitle>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Restaurant Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="url">Restaurant Slug</Label>
                <Input
                  id="url"
                  name="url"
                  value={formData.url}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  name="status"
                  value={formData.status}
                  onValueChange={value =>
                    setFormData({ ...formData, status: value })
                  }
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full">
                Update Restaurant
              </Button>
            </CardFooter>
          </form>
          <BusinessHoursModal
            isOpen={isBusinessHoursModalOpen}
            onClose={() => setIsBusinessHoursModalOpen(false)}
            onSave={handleBusinessHoursChange}
            initialSchedule={
              formData.openingHours ? JSON.parse(formData.openingHours) : null
            }
          />
        </Card>
      )}
    </>
  )
}
// Business Hours Modal
function BusinessHoursModal({ isOpen, onClose, onSave, initialSchedule }) {
  // const [schedule, setSchedule] = useState(initialSchedule || {
  //     monday: { isOpen: false, timeSlots: [{ start: "12:00 AM", end: "12:00 AM" }] },
  //     tuesday: { isOpen: false, timeSlots: [{ start: "12:00 AM", end: "12:00 AM" }] },
  //     wednesday: { isOpen: false, timeSlots: [{ start: "12:00 AM", end: "12:00 AM" }] },
  //     thursday: { isOpen: false, timeSlots: [{ start: "12:00 AM", end: "12:00 AM" }] },
  //     friday: { isOpen: false, timeSlots: [{ start: "12:00 AM", end: "12:00 AM" }] }
  // })
  const [schedule, setSchedule] = useState(
    initialSchedule || {
      monday: {
        isOpen: false,
        timeSlots: [{ start: '12:00 AM', end: '12:00 AM' }],
      },
      tuesday: {
        isOpen: false,
        timeSlots: [{ start: '12:00 AM', end: '12:00 AM' }],
      },
      wednesday: {
        isOpen: false,
        timeSlots: [{ start: '12:00 AM', end: '12:00 AM' }],
      },
      thursday: {
        isOpen: false,
        timeSlots: [{ start: '12:00 AM', end: '12:00 AM' }],
      },
      friday: {
        isOpen: false,
        timeSlots: [{ start: '12:00 AM', end: '12:00 AM' }],
      },
      saturday: {
        isOpen: false,
        timeSlots: [{ start: '12:00 AM', end: '12:00 AM' }],
      },
      sunday: {
        isOpen: false,
        timeSlots: [{ start: '12:00 AM', end: '12:00 AM' }],
      },
    }
  )
  const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
  const [selectedDays, setSelectedDays] = useState([1, 2, 3, 4, 5]) // Monday to Friday

  const timeOptions = Array.from({ length: 48 }, (_, i) => {
    const hour = Math.floor(i / 2)
    const minute = i % 2 === 0 ? '00' : '30'
    const period = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
    return `${displayHour}:${minute} ${period}`
  })

  const handleTimeChange = (day, slotIndex, type, value) => {
    const newSchedule = {
      ...schedule,
      [day]: {
        ...schedule[day],
        timeSlots: schedule[day].timeSlots.map((slot, i) =>
          i === slotIndex ? { ...slot, [type]: value } : slot
        ),
      },
    }
    setSchedule(newSchedule)
  }

  const addTimeSlot = day => {
    const newSchedule = {
      ...schedule,
      [day]: {
        ...schedule[day],
        timeSlots: [
          ...schedule[day].timeSlots,
          { start: '12:00 AM', end: '12:00 AM' },
        ],
      },
    }
    setSchedule(newSchedule)
  }

  const copyToAll = day => {
    const daySchedule = schedule[day]
    const newSchedule = Object.keys(schedule).reduce(
      (acc, currentDay) => ({
        ...acc,
        [currentDay]: { ...daySchedule },
      }),
      {}
    )
    setSchedule(newSchedule)
  }

  const toggleDay = day => {
    const newSchedule = {
      ...schedule,
      [day]: {
        ...schedule[day],
        isOpen: !schedule[day].isOpen,
      },
    }
    setSchedule(newSchedule)
  }
  const removeTimeSlot = (day, slotIndex) => {
    const newSchedule = {
      ...schedule,
      [day]: {
        ...schedule[day],
        timeSlots: schedule[day].timeSlots.filter((_, i) => i !== slotIndex),
      },
    }
    setSchedule(newSchedule)
  }
  const handleSave = () => {
    onSave(schedule)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-full sm:max-w-[600px] h-[80vh] overflow-y-auto p-4">
        <DialogHeader>
          <DialogTitle>Set Business Hours</DialogTitle>
        </DialogHeader>
        <Card className="p-6 bg-white shadow-sm">
          <div className="flex items-center justify-center mb-6">
            <div className="flex items-center bg-gray-100 rounded-full p-1">
              <button className="p-2 hover:bg-gray-200 rounded-full">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div className="flex space-x-1">
                {days.map((day, index) => (
                  <button
                    key={index}
                    className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-medium transition-colors
                                            ${
                                              selectedDays.includes(index)
                                                ? 'bg-blue-600 text-white'
                                                : 'text-gray-600 hover:bg-gray-200'
                                            }`}
                    onClick={() => {
                      if (selectedDays.includes(index)) {
                        setSelectedDays(selectedDays.filter(d => d !== index))
                      } else {
                        setSelectedDays([...selectedDays, index].sort())
                      }
                    }}
                  >
                    {day}
                  </button>
                ))}
              </div>
              <button className="p-2 hover:bg-gray-200 rounded-full">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {Object.entries(schedule).map(([day, { isOpen, timeSlots }]) => (
              <div key={day} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id={`toggle-${day}`}
                      checked={isOpen}
                      onChange={() => toggleDay(day)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <Label htmlFor={`toggle-${day}`} className="capitalize">
                      {day}
                    </Label>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToAll(day)}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy to all
                  </Button>
                </div>
                <div className="pl-6 space-y-2">
                  {timeSlots.map((slot, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Select
                        value={slot.start}
                        onValueChange={value =>
                          handleTimeChange(day, index, 'start', value)
                        }
                      >
                        <SelectTrigger className="w-[120px]">
                          <SelectValue placeholder="Start time" />
                        </SelectTrigger>
                        <SelectContent>
                          {timeOptions.map(time => (
                            <SelectItem key={time} value={time}>
                              {time}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <span>to</span>
                      <Select
                        value={slot.end}
                        onValueChange={value =>
                          handleTimeChange(day, index, 'end', value)
                        }
                      >
                        <SelectTrigger className="w-[120px]">
                          <SelectValue placeholder="End time" />
                        </SelectTrigger>
                        <SelectContent>
                          {timeOptions.map(time => (
                            <SelectItem key={time} value={time}>
                              {time}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <button
                        onClick={() => removeTimeSlot(day, index)}
                        className="text-red-600 hover:text-red-700 text-sm"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => addTimeSlot(day)}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium mt-2 flex items-center"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Hours
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
