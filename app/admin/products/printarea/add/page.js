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

export default function AddPrintarea() {
  const { data: session } = useSession()
  const router = useRouter()
  const [printareaName, setPrintareaName] = useState('')
  const [restaurants, setRestaurants] = useState([])
  const [selectedRestaurant, setSelectedRestaurant] = useState('')
  const [allowReceipt, setAllowReceipt] = useState([]) // New State for Receipt Options
  const userDetails = useAdmin(state => state.userDetails)

  // Fetch Restaurants
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
      let userId =
        userDetails?.user?.usertype === 'restaurant_owner'
          ? session.user.id
          : userDetails?.user?.createdBy
      let restaurantIds = userDetails?.user?.selectedRestaurants || []
      let token = session.user.name.token

      fetchRestaurants(userId, token, restaurantIds)
    }
  }, [session, userDetails])

  // Handle checkbox selection
  const handleCheckboxChange = value => {
    setAllowReceipt(prev =>
      prev.includes(value)
        ? prev.filter(item => item !== value)
        : [...prev, value]
    )
  }

  // Handle form submission
  const handleSubmit = async e => {
    e.preventDefault()

    if (!printareaName || !selectedRestaurant) {
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

    let userId =
      userDetails?.user?.usertype === 'restaurant_owner'
        ? session.user.id
        : userDetails?.user?.createdBy
    const token = session.user.name.token

    const newPrintarea = {
      name: printareaName,
      createdBy: userId,
      selectedRestaurants: [selectedRestaurant],
      allowReceipt, // Include selected receipt options
    }

    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/printarea/createprintarea`,
        newPrintarea,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      )

      Toastify({
        text: 'Print Area created successfully!',
        duration: 3000,
        close: true,
        gravity: 'top',
        position: 'right',
        backgroundColor: 'linear-gradient(to right, #00b09b, #96c93d)',
      }).showToast()

      router.push(`/admin/products/printarea/`)
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || 'Error creating Print Area.'
      Toastify({
        text: errorMessage,
        duration: 3000,
        close: true,
        gravity: 'top',
        position: 'right',
        backgroundColor: 'linear-gradient(to right, #FF5C5C, #FF3B3B)',
      }).showToast()
      console.error('Error creating print area:', error)
    }
  }

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-2xl font-bold">Add New Print Area</CardTitle>
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

          {/* Allow Receipt Options */}
          <div className="space-y-2 mt-5">
            <Label>Allow Receipt*</Label>
            <div className="flex items-center mt-4 space-x-2">
              <input
                type="checkbox"
                id="allow_print_area_kitchen"
                value="kitchen"
                checked={allowReceipt.includes('kitchen')}
                onChange={() => handleCheckboxChange('kitchen')}
                className="form-checkbox"
              />
              <Label
                htmlFor="allow_print_area_kitchen"
                className="text-sm font-medium leading-none"
              >
                Kitchen Receipt
              </Label>
            </div>
            <div className="flex items-center mt-4 space-x-2">
              <input
                type="checkbox"
                id="allow_print_area_customer"
                value="customer"
                checked={allowReceipt.includes('customer')}
                onChange={() => handleCheckboxChange('customer')}
                className="form-checkbox"
              />
              <Label
                htmlFor="allow_print_area_customer"
                className="text-sm font-medium leading-none"
              >
                Customer Receipt
              </Label>
            </div>
          </div>

          {/* Choose Store */}
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
                    onChange={() => setSelectedRestaurant(restaurant._id)}
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
