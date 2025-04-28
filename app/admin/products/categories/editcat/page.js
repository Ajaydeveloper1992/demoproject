'use client'
import { useSession } from 'next-auth/react'
import React, { useEffect, useState, Suspense, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
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
import { Upload, Search } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { RadioGroup, RadioGroupItem } from '~/components/ui/radio-group'
import Image from 'next/image'
import Toastify from 'toastify-js'
import { Checkbox } from '~/components/ui/checkbox'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table'
import { useAdmin } from '~/hooks/use-admin'
const EditCategory = () => {
  const { data: session } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const id = searchParams.get('id')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [categoryName, setCategoryName] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [image, setImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [existingImage, setExistingImage] = useState(null)
  const [userdata, setUserdata] = useState({})
  const [categoryId, setCategoryId] = useState(null)
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(false)
  const [showOnPos, setShowOnPos] = useState(false)
  const [showOnWeb, setShowOnWeb] = useState(false)
  const [selectedRestaurants, setSelectedRestaurants] = useState([])
  const [restaurants, setRestaurants] = useState([])
  const [removeImage, setRemoveImage] = useState('')
  const userDetails = useAdmin(state => state.userDetails)
  const [products, setProducts] = useState([])
  const [selectedProducts, setSelectedProducts] = useState([])
  const [availabilityType, setAvailabilityType] = useState('all-day')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [specifictimeMessage, setspecifyMessage] = useState('')
  useEffect(() => {
    setUserdata(session)
  }, [session])

  useEffect(() => {
    if (image) {
      const objectUrl = URL.createObjectURL(image)
      setImagePreview(objectUrl)
      return () => URL.revokeObjectURL(objectUrl)
    } else {
      setImagePreview(null)
    }
  }, [image])

  useEffect(() => {
    const fetchData = async () => {
      if (id && userdata) {
        setLoading(true)
        let userId = ''
        let restaurantIds = []

        // Determine user ID and restaurant IDs based on user type
        if (userDetails?.user?.usertype === 'restaurant_owner') {
          // Get the selected restaurant IDs
          userId = userdata.user?.id || ''
        } else {
          userId = userDetails?.user?.createdBy // Get the creator's user ID
          restaurantIds = userDetails?.user?.selectedRestaurants
        }
        const token = userdata.user?.name?.token || ''

        try {
          // Fetch category data
          const response = await axios.get(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/categories/getcategoriescatid/${id}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          )

          const category = response.data.data
          setCategoryId(category._id)
          setCategoryName(category.name)
          setSlug(category.slug)
          setDescription(category.description)
          setSelectedCategory(category.parent || '')

          setAvailabilityType(category?.availabilityType || '')
          setStartTime(category?.startTime || '')
          setEndTime(category?.endTime || '')
          setspecifyMessage(category?.specifictimeMessage || '')
          // Filter selected restaurants based on restaurantIds if the user is staff
          setSelectedProducts(category.selectedProducts)
          //setSelectedProducts(category.selectedProducts.map(product => product._id));

          console.log('Restaurant ID: ', restaurantIds)
          let filteredRestaurants = []
          if (userDetails?.user?.usertype === 'restaurant_owner') {
            // For non-staff users, just map the selected restaurants
            filteredRestaurants =
              category.selectedRestaurants.map(selected => selected._id) || []
          } else {
            // Extract the restaurant IDs from the selectedRestaurants
            const cat_r = category.selectedRestaurants.map(
              selected => selected._id
            )
            // Filter the extracted IDs based on restaurantIds available for the staff user
            filteredRestaurants = cat_r.filter(id => restaurantIds.includes(id))
          }

          // Set the selected restaurants
          setSelectedRestaurants(filteredRestaurants)

          setShowOnPos(category.showOnPos || false)
          setShowOnWeb(category.showOnWeb || false)

          if (category.image) {
            const imagePath = category.image.replace(/\\/g, '/')
            setExistingImage(
              `${process.env.NEXT_PUBLIC_IMAGE_BASE_URL}/${imagePath}`
            )
          }
        } catch (error) {
          console.error('Error fetching category data:', error)
        } finally {
          setLoading(false)
        }

        // Fetch restaurants
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
          setRestaurants(restaurants || [])
        } catch (error) {
          console.error('Error fetching restaurants:', error)
        }

        // Fetch categories
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
    }
    fetchData()
  }, [id, userdata, userDetails])

  useEffect(() => {
    const fetchProducts = async () => {
      if (!userdata?.user) return
      try {
        const userId = userdata.user.id || ''
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/product/getproductsuserid/${userId}`,
          {
            headers: { Authorization: `Bearer ${userdata.user.name.token}` },
          }
        )
        setProducts(response.data.data)
      } catch (error) {
        console.error('Error fetching products:', error)
        Toastify({
          text: 'Failed to fetch products.',
          duration: 3000,
          close: true,
          gravity: 'top',
          position: 'right',
          backgroundColor: 'linear-gradient(to right, #FF5C5C, #FF3B3B)',
        }).showToast()
      }
    }
    fetchProducts()
  }, [userdata])
  const handleFileChange = e => {
    const file = e.target.files[0]
    if (file) {
      setImage(file)
    }
  }

  const handleDrop = e => {
    e.preventDefault()
    const files = e.dataTransfer.files
    if (files.length > 0) {
      setImage(files[0])
    }
  }

  const handleDragOver = e => {
    e.preventDefault()
  }

  const handleBrowseClick = () => {
    document.getElementById('fileInput').click()
  }
  //Product Search
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const productName = product.name.toLowerCase()
      const categoryNames = product.categories
        .map(
          categoryId =>
            categories.find(category => category._id === categoryId)?.name || ''
        )
        .join(', ')
        .toLowerCase()
      const productPrices = `${product.webprice || ''} ${
        product.posprice || ''
      }`

      return (
        productName.includes(searchTerm.toLowerCase()) ||
        categoryNames.includes(searchTerm.toLowerCase()) ||
        productPrices.includes(searchTerm)
      )
    })
  }, [products, categories, searchTerm])

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
      userId = userdata?.user?.id || ''
    } else {
      userId = userDetails?.user?.createdBy // Get the creator's user ID
      restaurantIds = userDetails?.user?.selectedRestaurants // Get the selected restaurants
    }

    const token = userdata.user?.name?.token || ''

    const updatedCategory = {
      id: categoryId,
      name: categoryName,
      slug,
      description,
      parent: selectedCategory || categoryId,
      createdBy: userId,
      showOnPos,
      showOnWeb,
      selectedRestaurants,
      selectedProducts: Array.from(selectedProducts),
      removeImage,
      availabilityType: availabilityType,
      startTime: startTime,
      endTime: endTime,
      specifictimeMessage: specifictimeMessage,
    }

    try {
      const formData = new FormData()
      Object.keys(updatedCategory).forEach(key => {
        formData.append(key, updatedCategory[key])
      })

      if (image) {
        formData.append('image', image)
      }

      const response = await axios.put(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/categories/editcategories/${id}`,
        formData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )

      Toastify({
        text: 'Category updated successfully!',
        duration: 3000,
        close: true,
        gravity: 'top',
        position: 'right',
        backgroundColor: 'linear-gradient(to right, #00b09b, #96c93d)',
      }).showToast()

      // Reset the form after submission
      setCategoryName('')
      setSlug('')
      setDescription('')
      setSelectedCategory('')
      setImage(null)
      setImagePreview(null)
      setSelectedRestaurants([])
      setRemoveImage(false)
      router.push(`/admin/products/categories/`)
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || 'Error updating category.'
      Toastify({
        text: errorMessage,
        duration: 3000,
        close: true,
        gravity: 'top',
        position: 'right',
        backgroundColor: 'linear-gradient(to right, #FF5C5C, #FF3B3B)',
      }).showToast()
      console.error('Error updating category:', error)
    }
  }

  const handleCheckboxChange = restaurantId => {
    setSelectedRestaurants(prev =>
      prev.includes(restaurantId)
        ? prev.filter(id => id !== restaurantId)
        : [...prev, restaurantId]
    )
  }

  const handleRemoveImage = () => {
    setImage(null)
    setImagePreview(null)
    setExistingImage(null)
    setRemoveImage(1)
  }
  // Product Selection
  const handleProductSelection = productId => {
    setSelectedProducts(prevSelected => {
      if (prevSelected.includes(productId)) {
        return prevSelected.filter(id => id !== productId) // Remove from selection
      } else {
        return [...prevSelected, productId] // Add to selection
      }
    })
  }
  return (
    <div className="container mx-auto p-4">
      <form onSubmit={handleSubmit}>
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <h1 className="text-2xl font-semibold">
              Edit Category - {categoryName}
            </h1>
          </div>
          <div className="space-x-2">
            <Button variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
            {/* <Button  className="bg-teal-600">Save</Button> */}
            <Button type="submit" className="bg-teal-600">
              Save
            </Button>
          </div>
        </div>
        <Tabs defaultValue="category">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="category">Category</TabsTrigger>
            <TabsTrigger value="product">Product</TabsTrigger>
          </TabsList>
          <TabsContent value="category">
            <Card className="w-full ">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-2xl font-bold">
                  Edit Category
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {loading ? (
                  <div className="text-center">Loading...</div>
                ) : (
                  <>
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
                      <Select
                        value={selectedCategory}
                        onValueChange={setSelectedCategory}
                      >
                        <SelectTrigger className="w-full border-teal-500">
                          <SelectValue placeholder="Select Parent Category..." />
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
                            .filter(
                              category =>
                                category.name &&
                                category.name
                                  .toLowerCase()
                                  .includes(searchTerm.toLowerCase())
                            )
                            .map(category => (
                              <SelectItem
                                key={category._id}
                                value={category._id}
                              >
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
                        className="border-2 border-dashed rounded-md p-4 text-center cursor-pointer hover:bg-gray-100"
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        onClick={handleBrowseClick}
                      >
                        <Upload className="mx-auto h-12 w-12 text-gray-400" />
                        <div className="mt-2">
                          <Button
                            type="button"
                            variant="ghost"
                            className="text-sm text-gray-600"
                            onClick={handleBrowseClick}
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
                      {existingImage && !imagePreview && (
                        <Image
                          src={existingImage}
                          alt="Existing Preview"
                          width={128}
                          height={128}
                          className="mt-4 object-cover border rounded"
                        />
                      )}
                      {(imagePreview || existingImage) && (
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
                    <div>
                      <Label>Show On POS & Web</Label>
                      <div className="flex items-center mt-4 space-x-2">
                        <Checkbox
                          checked={showOnPos}
                          onCheckedChange={setShowOnPos}
                        />
                        <Label className="text-sm font-medium leading-none">
                          POS Product
                        </Label>
                      </div>
                      <div className="flex items-center mt-4 space-x-2">
                        <Checkbox
                          checked={showOnWeb}
                          onCheckedChange={setShowOnWeb}
                        />
                        <Label className="text-sm font-medium leading-none">
                          Web Product
                        </Label>
                      </div>
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
                              checked={selectedRestaurants.includes(
                                restaurant._id
                              )}
                              onCheckedChange={() =>
                                handleCheckboxChange(restaurant._id)
                              }
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
                      <Label className="text-base font-semibold">
                        Availability *
                      </Label>
                      <RadioGroup
                        value={availabilityType}
                        onValueChange={setAvailabilityType}
                        className="space-y-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem
                            value="all-day"
                            id="all-day"
                            onValueChange={setAvailabilityType}
                          />
                          <Label htmlFor="all-day">All day</Label>
                        </div>
                        <div className="flex items-start space-x-2 mt-4">
                          <RadioGroupItem
                            value="specific-time"
                            id="specific-time"
                          />
                          <div className="space-y-4 flex-1">
                            <Label htmlFor="specific-time">
                              Specify available time
                            </Label>
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
                    {/* <CardFooter className="flex">
                  <div className="ml-auto"> 
                    <Button type="submit" className="bg-teal-600">Save</Button>
                  </div>
                </CardFooter> */}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="product">
            <div className="border rounded-lg overflow-hidden">
              <Card>
                <CardContent className="p-6 space-y-4">
                  <div className="flex justify-between items-center">
                    <h2 className="text-lg font-semibold">Product List</h2>
                    <div className="relative">
                      <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        className="pl-8"
                        placeholder="Search products..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px]"></TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Price</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProducts &&
                        filteredProducts.map(product => (
                          <TableRow key={product._id}>
                            <TableCell>
                              <Checkbox
                                checked={selectedProducts.includes(product._id)} // Check if product is selected
                                onCheckedChange={() =>
                                  handleProductSelection(product._id)
                                } // Handle selection
                                id={`product-${product._id}`}
                              />
                            </TableCell>
                            <TableCell>{product.name}</TableCell>
                            <TableCell>
                              {product.categories.length > 0
                                ? product.categories
                                    .map(
                                      categoryId =>
                                        categories.find(
                                          category =>
                                            category._id === categoryId
                                        )?.name || ''
                                    )
                                    .join(', ')
                                : ''}
                            </TableCell>
                            <TableCell>
                              {product.webprice && (
                                <div>
                                  <strong>Web Price:</strong> $
                                  {parseFloat(product.webprice).toFixed(2)}
                                </div>
                              )}
                              {product.posprice && (
                                <div>
                                  <strong>POS Price:</strong> $
                                  {parseFloat(product.posprice).toFixed(2)}
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </form>
    </div>
  )
}

const PageWrapper = () => (
  <Suspense fallback={<div>Loading...</div>}>
    <EditCategory />
  </Suspense>
)

export default PageWrapper
