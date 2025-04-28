'use client'
import { useSession } from 'next-auth/react'
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { Button } from '~/components/ui/button'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import Toastify from 'toastify-js'
import { useAdmin } from '~/hooks/use-admin'

export default function EditPrintarea({ params }) {
  const { data: session } = useSession()
  const router = useRouter()
  const [printareaName, setPrintareaName] = useState('')
  const [restaurants, setRestaurants] = useState([])
  const [selectedRestaurant, setSelectedRestaurant] = useState('') // Changed to handle a single selected restaurant
  const [printareaData, setPrintareaData] = useState(null)
  const [allowReceipt, setAllowReceipt] = useState([])
  const [userdata, setUserdata] = useState({})
  const { id } = params
  const userDetails = useAdmin(state => state.userDetails)

  useEffect(() => {
    if (session) {
      setUserdata(session)
    }
  }, [session])

  useEffect(() => {
    if (!id) return

    const fetchPrintarea = async () => {
      try {
        const token = userdata?.user?.name?.token || ''
        if (token) {
          const response = await axios.get(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/printarea/getprintareaid/${id}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          )
          const data = response.data.data
          setPrintareaData(data)
          setPrintareaName(data.name)
          setSelectedRestaurant(data.selectedRestaurants?.[0]?._id || '') // Set the first selected restaurant
          setAllowReceipt(data.allowReceipt || [])
        }
      } catch (error) {
        console.error('Error fetching print area data:', error)
      }
    }

    fetchPrintarea()
  }, [id, userdata])

  useEffect(() => {
    const fetchRestaurants = async (userId, token, restaurantIds) => {
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/restaurant/getrestaurantsuserid/${userId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        )

        let restaurants = response.data.data || []
        if (userDetails?.user?.usertype !== 'restaurant_owner') {
          restaurants = restaurants.filter(restaurant =>
            restaurantIds.includes(restaurant._id)
          )
        }
        setRestaurants(restaurants)
      } catch (error) {
        console.error('Error fetching restaurants:', error)
      }
    }

    if (session && userDetails) {
      let userId = ''
      let restaurantIds = []
      const token = userdata?.user?.name?.token || ''

      if (userDetails?.user?.usertype === 'restaurant_owner') {
        userId = session.user.id
      } else {
        userId = userDetails?.user?.createdBy
        restaurantIds = userDetails?.user?.selectedRestaurants
      }

      fetchRestaurants(userId, token, restaurantIds)
    }
  }, [session, userDetails, userdata])

  // Handle radio button change for selecting a restaurant
  const handleRadioChange = restaurantId => {
    setSelectedRestaurant(restaurantId)
  }

  // Submit handler for updating the print area
  const handleSubmit = async e => {
    e.preventDefault()

    if (!printareaName) {
      Toastify({
        text: 'Please fill in all required fields.',
        duration: 3000,
        close: true,
        gravity: 'top',
        position: 'right',
        backgroundColor: 'linear-gradient(to right, #FF5C5C, #FF3B3B)',
      }).showToast()
      return
    }

    const token = session.user.name.token
    const updatedPrintarea = {
      name: printareaName,
      selectedRestaurants: [selectedRestaurant],
      allowReceipt, // Update with a single selected restaurant
    }

    try {
      await axios.put(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/printarea/editprintarea/${id}`,
        updatedPrintarea,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      )

      Toastify({
        text: 'Print Area updated successfully!',
        duration: 3000,
        close: true,
        gravity: 'top',
        position: 'right',
        backgroundColor: 'linear-gradient(to right, #00b09b, #96c93d)',
      }).showToast()

      router.push(`/admin/products/printarea/`)
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || 'Error updating Print Area.'
      Toastify({
        text: errorMessage,
        duration: 3000,
        close: true,
        gravity: 'top',
        position: 'right',
        backgroundColor: 'linear-gradient(to right, #FF5C5C, #FF3B3B)',
      }).showToast()
      console.error('Error updating print area:', error)
    }
  }
  // Print Areas Receipt
  const handleCheckboxChange = value => {
    setAllowReceipt(prev =>
      prev.includes(value)
        ? prev.filter(item => item !== value)
        : [...prev, value]
    )
  }
  if (!printareaData) {
    return <div>Loading...</div>
  }

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-2xl font-bold">Edit Print Area</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="PrintareaName">Print Area Name*</Label>
            <Input
              id="PrintareaName"
              placeholder="Enter Print Area name"
              value={printareaName}
              onChange={e => setPrintareaName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2 mt-5">
            <Label>Allow Receipt*</Label>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="allow_kitchen"
                value="kitchen"
                checked={allowReceipt.includes('kitchen')}
                onChange={() => handleCheckboxChange('kitchen')}
              />
              <Label htmlFor="allow_kitchen">Kitchen Receipt</Label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="allow_customer"
                value="customer"
                checked={allowReceipt.includes('customer')}
                onChange={() => handleCheckboxChange('customer')}
              />
              <Label htmlFor="allow_customer">Customer Receipt</Label>
            </div>
          </div>
          <div className="space-y-2 mt-5">
            <Label>Choose Your Store*</Label>
            {restaurants.length > 0 ? (
              restaurants.map(restaurant => (
                <div
                  key={restaurant._id}
                  className="flex items-center mt-4 space-x-2"
                >
                  <input
                    type="radio"
                    id={`restaurant-${restaurant._id}`}
                    name="selectedRestaurant"
                    value={restaurant._id}
                    checked={selectedRestaurant === restaurant._id}
                    onChange={() => handleRadioChange(restaurant._id)}
                    className="form-radio"
                  />
                  <Label
                    htmlFor={`restaurant-${restaurant._id}`}
                    className="text-sm font-medium leading-none"
                  >
                    {restaurant.name}
                  </Label>
                </div>
              ))
            ) : (
              <div>No restaurants available.</div>
            )}
          </div>
          <CardFooter className="flex">
            <div className="ml-auto">
              <Button type="submit" className="bg-teal-600">
                Save
              </Button>
            </div>
          </CardFooter>
        </form>
      </CardContent>
    </Card>
  )
}
