'use client'
import { useSession } from 'next-auth/react'
import React, { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '~/components/ui/card'
import { Checkbox } from '~/components/ui/checkbox'
import { useUser } from '~/hooks/UserContext'
import axios from 'axios'
import { Eye, EyeOff, RefreshCw } from 'lucide-react'
import Toastify from 'toastify-js'

const Edit = () => {
  const { data: session } = useSession()
  const { user } = useUser()
  const router = useRouter()
  const searchParams = useSearchParams()
  const id = searchParams.get('id')

  const [userdata, setUserdata] = useState({})
  const [formData, setFormData] = useState({
    fname: '',
    lname: '',
    username: '',
    email: '',
    phone: '',
    password: '',
    pin: '',
    role: '',
    status: '',
    selectedRestaurants: [],
  })

  const [roleOptions, setRoleOptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [restaurants, setRestaurants] = useState([])
  const [showPassword, setShowPassword] = useState(false)
  const [showPin, setShowPin] = useState(false)

  useEffect(() => {
    setUserdata(session)
  }, [session])

  useEffect(() => {
    const fetchStaffData = async () => {
      if (!id || !userdata.user) return

      try {
        const token = userdata.user?.name?.token || ''
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/staff/getstaff/${id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )

        if (response.data.success) {
          const data = response.data.data
          //const restaurant_data = data.restaurants.map(restaurants => restaurants._id)

          setFormData({
            fname: data.fname,
            lname: data.lname,
            username: data.username,
            email: data.email,
            phone: data.phone,
            password: '',
            pin: data.pin || '',
            role: data.role?._id || '',
            status: data.status || '',
            selectedRestaurants: data.selectedRestaurants || [],
          })
        } else {
          throw new Error('Failed to fetch staff data')
        }
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    const fetchRoles = async () => {
      if (!userdata.user) return

      try {
        const userId = userdata.user?.id
        const token = userdata.user?.name?.token

        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/roles/getRolesuserID/${userId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )

        setRoleOptions(response.data.data)
      } catch (error) {
        console.error('Error fetching roles:', error)
      }
    }

    const fetchRestaurants = async () => {
      if (!userdata.user) return

      try {
        const userId = userdata.user?.id
        const token = userdata.user?.name?.token

        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/restaurant/getrestaurantsuserid/${userId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )

        if (Array.isArray(response.data.data)) {
          setRestaurants(response.data.data)
        } else {
          console.warn('Expected an array but got:', response.data.data)
          setRestaurants([])
        }
      } catch (error) {
        console.error('Error fetching restaurants:', error)
      }
    }

    if (userdata && userdata.user) {
      fetchStaffData()
      fetchRoles()
      fetchRestaurants()
    } else {
      setLoading(false)
    }
  }, [userdata, id])

  const handleInputChange = e => {
    const { name, value } = e.target
    setFormData(prevData => ({ ...prevData, [name]: value }))
  }

  const handleRoleChange = value => {
    setFormData(prevData => ({ ...prevData, role: value }))
  }

  const handleStatusChange = value => {
    setFormData(prevData => ({ ...prevData, status: value }))
  }

  const handleCheckboxChange = (id, checked) => {
    setFormData(prevData => ({
      ...prevData,
      selectedRestaurants: checked
        ? [...prevData.selectedRestaurants, id]
        : prevData.selectedRestaurants.filter(restaurant => restaurant !== id),
    }))
  }

  const generatePassword = () => {
    const length = 12
    const charset =
      'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+'
    let password = ''
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length))
    }
    setFormData(prevData => ({ ...prevData, password }))
  }

  const generatePin = () => {
    const pin = Math.floor(100000 + Math.random() * 900000).toString() // Generates a 6-digit number
    setFormData(prevData => ({ ...prevData, pin }))
  }

  const handleSubmit = async e => {
    e.preventDefault()
    let res_mess = ''
    try {
      const token = userdata.user?.name?.token || ''
      const response = await axios.put(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/staff/editstaff/${id}`,
        {
          ...formData,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      )
      res_mess = response?.data
      if (response.status >= 200 && response.status < 300) {
        console.log('Update successful:', response.data)
        Toastify({
          text: 'Update successful',
          duration: 3000,
          close: true,
          gravity: 'top',
          position: 'right',
          backgroundColor: 'linear-gradient(to right, #00b09b, #96c93d)',
          onClick: function () {},
        }).showToast()
        router.push('/admin/staff')
      } else {
        throw new Error('Update failed')
      }
    } catch (error) {
      console.error('Error submitting form:', error)
      Toastify({
        text: error?.response?.data?.message || 'Error Creating Staff',
        duration: 3000,
        close: true,
        gravity: 'top',
        position: 'right',
        backgroundColor: 'linear-gradient(to right, #FF5C5C, #FF3B3B)',
        onClick: function () {},
      }).showToast()
      //setError(error?.response?.data?.message);
    }
  }

  if (loading) {
    return <div>Loading...</div>
  }

  if (error) {
    return <div>Error: {error}</div>
  }

  return (
    <Card className="w-full max-w-6xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl">Edit Staff</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fname">First Name</Label>
              <Input
                id="fname"
                name="fname"
                value={formData.fname}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lname">Last Name</Label>
              <Input
                id="lname"
                name="lname"
                value={formData.lname}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleInputChange}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="flex">
              <Input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleInputChange}
                className="flex-grow"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setShowPassword(!showPassword)}
                className="ml-2"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={generatePassword}
                className="ml-2"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="pin">PIN</Label>
            <div className="flex">
              <Input
                id="pin"
                name="pin"
                type={showPin ? 'text' : 'password'}
                value={formData.pin}
                onChange={handleInputChange}
                className="flex-grow"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setShowPin(!showPin)}
                className="ml-2"
              >
                {showPin ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={generatePin}
                className="ml-2"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Select Role</Label>
            <Select
              name="role"
              onValueChange={handleRoleChange}
              value={formData.role}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {roleOptions &&
                  roleOptions.map(role => (
                    <SelectItem key={role._id} value={role._id}>
                      {role.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              name="status"
              onValueChange={handleStatusChange}
              value={formData.status}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Deactivate</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Restaurants</Label>
            <div className="flex flex-col space-y-2">
              {Array.isArray(restaurants) && restaurants.length > 0 ? (
                restaurants.map(restaurant => (
                  <div
                    key={restaurant._id}
                    className="flex items-center space-x-2"
                  >
                    <Checkbox
                      id={restaurant._id}
                      checked={formData.selectedRestaurants.includes(
                        restaurant._id
                      )}
                      onCheckedChange={checked =>
                        handleCheckboxChange(restaurant._id, checked)
                      }
                    />
                    <label
                      htmlFor={restaurant._id}
                      className="text-sm font-medium leading-none"
                    >
                      {restaurant.name}
                    </label>
                  </div>
                ))
              ) : (
                <div>No restaurants available.</div>
              )}
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full bg-teal-600">
            Update Staff
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}

export default function WrappedEditStaff() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Edit />
    </Suspense>
  )
}
