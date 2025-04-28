'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import axios from 'axios'
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
import { useUser } from '~/hooks/UserContext'
import { Checkbox } from '~/components/ui/checkbox'
import Toastify from 'toastify-js'
import { Eye, EyeOff, RefreshCw } from 'lucide-react'
import { useAdmin } from '~/hooks/use-admin'
export default function CreateNewStaff() {
  const { data: session } = useSession()
  const { user } = useUser()
  const router = useRouter()
  const [userdata, setUserdata] = useState({})
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    fname: '',
    lname: '',
    email: '',
    phone: '',
    password: '',
    pin: '',
    role: '',
    username: '',
    status: '',
    createdBy: '',
    usertype: 'staff',
    selectedRestaurants: [],
  })
  const [roleOptions, setRoleOptions] = useState([])
  const [restaurants, setRestaurants] = useState([])
  const [showPassword, setShowPassword] = useState(false)
  const [showPin, setShowPin] = useState(false)
  const userDetails = useAdmin(state => state.userDetails)

  useEffect(() => {
    setUserdata(session || {})
    if (session?.user) {
      setFormData(prev => ({ ...prev, createdBy: session.user.id }))
    }
  }, [session])

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const userId = userdata.user?.id
        const token = userdata.user?.name?.token
        if (!userId) {
          throw new Error('User ID is required')
        }
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
      fetchRoles()
      fetchRestaurants()
    } else {
      setLoading(false)
    }
  }, [userdata])

  const handleInputChange = e => {
    const { name, value } = e.target
    setFormData(prevData => ({
      ...prevData,
      [name]: value,
    }))
  }

  const handleRoleChange = value => {
    setFormData(prevData => ({
      ...prevData,
      role: value,
    }))
  }

  const handleStatusChange = value => {
    setFormData(prevData => ({
      ...prevData,
      status: value,
    }))
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

  const handlestaffSubmit = async e => {
    e.preventDefault()
    try {
      const userId = userdata.user?.id
      const token = userdata.user?.name?.token

      const formDataToSubmit = new FormData()
      Object.entries(formData).forEach(([key, value]) => {
        if (typeof value === 'object' && value !== null) {
          if (value instanceof File) {
            formDataToSubmit.append(key, value)
          } else {
            formDataToSubmit.append(key, JSON.stringify(value))
          }
        } else {
          formDataToSubmit.append(key, value)
        }
      })
      console.log('Request Data' + JSON.stringify(formDataToSubmit))
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/staff/createstaff`,
        formData,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      )
      console.log('Staff response ' + JSON.stringify(response))
      if (response.status === 201) {
        Toastify({
          text: 'Staff created successfully',
          duration: 3000,
          close: true,
          gravity: 'top',
          position: 'right',
          backgroundColor: 'linear-gradient(to right, #00b09b, #96c93d)',
          onClick: function () {},
        }).showToast()
        router.push('/admin/staff')
      } else {
        Toastify({
          text: error.response?.data?.error || 'Error Creating Staff',
          duration: 3000,
          close: true,
          gravity: 'top',
          position: 'right',
          backgroundColor: 'linear-gradient(to right, #FF5C5C, #FF3B3B)',
          onClick: function () {},
        }).showToast()
        console.error('Error creating user:', response.data.error)
      }
    } catch (error) {
      console.error('Error As:', error)
      Toastify({
        text: error?.response?.data?.message || 'Error Creating Staff',
        duration: 3000,
        close: true,
        gravity: 'top',
        position: 'right',
        backgroundColor: 'linear-gradient(to right, #FF5C5C, #FF3B3B)',
        onClick: function () {},
      }).showToast()
    }
  }

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <Card className="w-full max-w-6xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl">Create New Staff</CardTitle>
      </CardHeader>
      <form onSubmit={handlestaffSubmit}>
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
                required
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
                required
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
            <Select name="role" onValueChange={handleRoleChange} required>
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {roleOptions.map(role => (
                  <SelectItem key={role._id} value={role._id}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select name="status" onValueChange={handleStatusChange} required>
              <SelectTrigger>
                <SelectValue placeholder="Select a Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem key="active" value="active">
                  Active
                </SelectItem>
                <SelectItem key="inactive" value="inactive">
                  Deactivate
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="block">Select Restaurants</Label>
            <div className="space-y-2 gap-4">
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
            Create Staff
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
