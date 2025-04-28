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
import { Textarea } from '~/components/ui/textarea'
import { Upload } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import Image from 'next/image'
import Toastify from 'toastify-js'
import { Checkbox } from '~/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '~/components/ui/radio-group'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs'
import { useAdmin } from '~/hooks/use-admin'
export default function AddNewCategory() {
  const { data: session } = useSession()
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [parentCategory, setParentCategory] = useState('')
  const [categoryName, setCategoryName] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [image, setImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [restaurants, setRestaurants] = useState([])
  const [selectedRestaurants, setSelectedRestaurants] = useState([])
  const [showOnPos, setShowOnPos] = useState(false)
  const [showOnWeb, setShowOnWeb] = useState(false)
  const [categories, setCategories] = useState([])
  const userDetails = useAdmin(state => state.userDetails)
  const [availabilityType, setAvailabilityType] = useState('all-day')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [specifictimeMessage, setspecifyMessage] = useState('')

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

        // Filter restaurants if the usertype is 'staff'
        if (userDetails?.user?.usertype === 'restaurant_owner') {
        } else {
          restaurants = restaurants.filter(restaurant =>
            restaurantIds.includes(restaurant._id)
          )
        }

        setRestaurants(restaurants)
      } catch (error) {
        console.error('Error fetching restaurants:', error)
      }
    }

    const fetchCategories = async (userId, token) => {
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/categories/getcategoriesuserid/${userId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        )
        setCategories(response.data.data || [])
      } catch (error) {
        console.error('Error fetching categories:', error)
      }
    }

    if (session && userDetails) {
      let userId = ''
      let restaurantIds = []
      let token = session.user.name.token // Ensure you have access to the token

      if (userDetails?.user?.usertype === 'restaurant_owner') {
        userId = session.user.id
      } else {
        userId = userDetails?.user?.createdBy // Get the creator's user ID
        restaurantIds = userDetails.user.selectedRestaurants // Get the selected restaurants
      }

      fetchRestaurants(userId, token, restaurantIds)
      fetchCategories(userId, token)
    }
  }, [session, userDetails])

  useEffect(() => {
    if (image) {
      const objectUrl = URL.createObjectURL(image)
      setImagePreview(objectUrl)
      return () => URL.revokeObjectURL(objectUrl)
    } else {
      setImagePreview(null)
    }
  }, [image])

  const handleFileChange = e => {
    const file = e.target.files[0]
    if (file) {
      setImage(file)
    }
  }

  const handleCheckboxChange = restaurantId => {
    setSelectedRestaurants(prev =>
      prev.includes(restaurantId)
        ? prev.filter(id => id !== restaurantId)
        : [...prev, restaurantId]
    )
  }

  const handleSubmit = async e => {
    e.preventDefault()
    if (!categoryName || !slug) {
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

    let userId = ''
    let restaurantIds = []
    if (userDetails?.user?.usertype === 'restaurant_owner') {
      userId = session.user.id
    } else {
      userId = userDetails?.user?.createdBy // Get the creator's user ID
      restaurantIds = userDetails.user.selectedRestaurants // Get the selected restaurants
    }
    const token = session.user.name.token

    const newCategory = {
      name: categoryName,
      slug,
      description,
      createdBy: userId,
      parent: parentCategory || null,
      showOnPos,
      showOnWeb,
      //restaurants: selectedRestaurants,
      selectedRestaurants: selectedRestaurants,
      availabilityType,
      startTime,
      endTime,
      specifictimeMessage,
    }

    try {
      const formData = new FormData()
      Object.keys(newCategory).forEach(key => {
        formData.append(key, newCategory[key])
      })

      if (image) {
        formData.append('image', image)
      }

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/categories/createcategories`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`,
          },
        }
      )

      Toastify({
        text: 'Category created successfully!',
        duration: 3000,
        close: true,
        gravity: 'top',
        position: 'right',
        backgroundColor: 'linear-gradient(to right, #00b09b, #96c93d)',
      }).showToast()
      router.push(`/admin/products/categories/`)
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || 'Error creating category.'
      Toastify({
        text: errorMessage,
        duration: 3000,
        close: true,
        gravity: 'top',
        position: 'right',
        backgroundColor: 'linear-gradient(to right, #FF5C5C, #FF3B3B)',
      }).showToast()
      console.error('Error creating category:', error)
    }
  }
  const handleRemoveImage = () => {
    setImage(null)
    setImagePreview(null)
  }
  useEffect(() => {
    // Generate a slug from categoryName
    const generateSlug = () => {
      return categoryName
        .toLowerCase() // Convert to lowercase
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/[^\w\-]+/g, '') // Remove non-alphanumeric characters except hyphens
        .replace(/\-\-+/g, '-') // Replace multiple hyphens with a single one
        .replace(/^-+/, '') // Remove leading hyphen
        .replace(/-+$/, '') // Remove trailing hyphen
    }

    // Update slug when categoryName changes
    if (categoryName) {
      setSlug(generateSlug())
    } else {
      setSlug('') // Clear the slug if categoryName is empty
    }
  }, [categoryName])
  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-2xl font-bold">Add New Category</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="categoryName">Category Name*</Label>
            <Input
              id="categoryName"
              placeholder="Enter category name"
              value={categoryName}
              onChange={e => setCategoryName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="slug">Slug*</Label>
            <Input
              id="slug"
              placeholder="Enter slug"
              value={slug}
              onChange={e => setSlug(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="parentCategory">Parent Category</Label>
            <Select value={parentCategory} onValueChange={setParentCategory}>
              <SelectTrigger className="w-full border-teal-500">
                <SelectValue placeholder="Select Parent Category" />
              </SelectTrigger>
              <SelectContent>
                <div className="p-2">
                  <Input
                    placeholder="Search"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="mb-2"
                  />
                </div>
                {categories
                  .filter(category =>
                    category.name
                      .toLowerCase()
                      .includes(searchTerm.toLowerCase())
                  )
                  .map(category => (
                    <SelectItem key={category._id} value={category._id}>
                      {category.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Enter category description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          <div className="space-y-2">
            <Label>Media</Label>
            <div
              className="border-2 border-dashed rounded-md p-4 text-center cursor-pointer"
              onClick={() => document.getElementById('fileInput').click()}
            >
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <div className="mt-2">
                <Button
                  type="button"
                  variant="ghost"
                  className="text-sm text-gray-600"
                  onClick={() => document.getElementById('fileInput').click()}
                >
                  Browse for file
                </Button>
                <Input
                  type="file"
                  id="fileInput"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Drag and drop your file here or click to select
              </p>
              {image && (
                <p className="text-xs text-gray-700 mt-2">
                  Selected: {image.name}
                </p>
              )}
            </div>
            {image && (
              <p className="text-xs text-gray-700 mt-2">
                Selected: {image.name}
              </p>
            )}
            {imagePreview && (
              <Image
                src={imagePreview}
                alt="Preview"
                width={128}
                height={128}
                className="mt-4 object-cover border rounded"
              />
            )}
            {imagePreview && (
              <Button
                type="button"
                variant="outline"
                className="mt-2"
                onClick={handleRemoveImage}
              >
                Remove Image
              </Button>
            )}
          </div>
          <Label>Show On POS & Web</Label>
          <div className="flex items-center mt-4 space-x-2">
            <Checkbox checked={showOnPos} onCheckedChange={setShowOnPos} />
            <Label className="text-sm font-medium leading-none">
              POS Product
            </Label>
          </div>
          <div className="flex items-center mt-4 space-x-2">
            <Checkbox checked={showOnWeb} onCheckedChange={setShowOnWeb} />
            <Label className="text-sm font-medium leading-none">
              Web Product
            </Label>
          </div>
          <div>
            <Label>Choose Your Stores</Label>
            {restaurants.length > 0 ? (
              restaurants.map(restaurant => (
                <div
                  key={restaurant._id}
                  className="flex items-center mt-4 space-x-2"
                >
                  <Checkbox
                    checked={selectedRestaurants.includes(restaurant._id)}
                    onCheckedChange={() => handleCheckboxChange(restaurant._id)}
                  />
                  <Label className="text-sm font-medium leading-none">
                    {restaurant.name}
                  </Label>
                </div>
              ))
            ) : (
              <div>No restaurants available.</div>
            )}
          </div>
          <div className="space-y-4 mt-4">
            <Label className="text-base font-semibold">Availability*</Label>
            <RadioGroup
              value={availabilityType}
              onValueChange={setAvailabilityType}
              className="space-y-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="all-day" id="all-day" />
                <Label htmlFor="all-day">All day</Label>
              </div>
              <div className="flex items-start space-x-2 mt-4">
                <RadioGroupItem value="specific-time" id="specific-time" />
                <div className="space-y-4 flex-1">
                  <Label htmlFor="specific-time">Specify available time</Label>
                  {availabilityType === 'specific-time' && (
                    <div className="space-y-4 pt-2">
                      <div className="space-y-2">
                        <Label
                          htmlFor="start-time"
                          className="text-sm font-normal"
                        >
                          Start time
                        </Label>
                        <Input
                          id="start-time"
                          type="time"
                          className="w-full"
                          value={startTime}
                          onChange={e => setStartTime(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label
                          htmlFor="end-time"
                          className="text-sm font-normal"
                        >
                          End time
                        </Label>
                        <Input
                          id="end-time"
                          type="time"
                          className="w-full"
                          value={endTime}
                          onChange={e => setEndTime(e.target.value)}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </RadioGroup>
            <div className="space-y-2">
              <Label htmlFor="description">Specify Message</Label>
              <Textarea
                id="specifyMessage"
                placeholder="Enter Specify Message"
                value={specifictimeMessage}
                onChange={e => setspecifyMessage(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          </div>
          <CardFooter className="flex mt-4">
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
