'use client'
import { useSession } from 'next-auth/react'
import React, { useEffect, useState } from 'react'
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

const categories = [
  { value: 'vegetables-fruits', label: 'Vegetables & Fruits' },
  { value: 'dairy', label: 'Dairy' },
  { value: 'bakery', label: 'Bakery' },
  { value: 'meat', label: 'Meat' },
  { value: 'seafood', label: 'Seafood' },
]

export default function EditCategory() {
  const { data: session } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  let id = searchParams.get('id')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [categoryName, setCategoryName] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [image, setImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [userdata, setUserdata] = useState({})
  const [categoryId, setCategoryId] = useState(null)

  useEffect(() => {
    setUserdata(session)
  }, [session])

  //console.log("Images get "+imagePreview);

  useEffect(() => {
    if (imagePreview) {
      const objectUrl = URL.createObjectURL(imagePreview)
      setImagePreview(objectUrl)
      return () => URL.revokeObjectURL(objectUrl)
    } else {
      setImagePreview(null)
    }
  }, [imagePreview])

  useEffect(() => {
    const fetchCategoryData = async () => {
      if (id) {
        try {
          let userId = userdata.user ? userdata.user.id : ''
          let token =
            userdata.user && userdata.user.name ? userdata.user.name.token : ''
          const response = await axios.get(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/categories/getcategoriescatid/${id}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          )
          const category = response.data.data
          setCategoryId(category.id)
          setCategoryName(category.name)
          setSlug(category.slug)
          setDescription(category.description)
          setSelectedCategory(category.category)
          setImagePreview(category.imageUrl) // Assuming the image URL is in this property
        } catch (error) {
          console.error('Error fetching category data:', error)
        }
      }
    }

    fetchCategoryData()
  }, [userdata, id])

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

  const handleSubmit = async e => {
    e.preventDefault()
    if (!categoryName || !slug || !description) {
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

    const userId = userdata.user ? userdata.user.id : ''
    const token =
      userdata.user && userdata.user.name ? userdata.user.name.token : ''

    const newCategory = {
      id: categoryId,
      name: categoryName,
      slug,
      description,
      productTypes: [], // Adjust based on your logic
      stores: [], // Adjust based on your logic
      createdBy: userId,
    }

    try {
      const formData = new FormData()
      Object.keys(newCategory).forEach(key => {
        formData.append(key, newCategory[key])
      })

      if (image) {
        formData.append('image', image)
      }

      const response = await axios.put(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/categories/editcategories`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`,
          },
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

      console.log('Category updated successfully:', response.data)
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

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-2xl font-bold">Edit Category</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="categoryName">Category Name</Label>
            <Input
              id="categoryName"
              placeholder="Enter category name"
              value={categoryName}
              onChange={e => setCategoryName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="slug">Slug</Label>
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
                <SelectValue placeholder="Select.." />
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
                    category.label
                      .toLowerCase()
                      .includes(searchTerm.toLowerCase())
                  )
                  .map(category => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
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
            </div>
          </div>
          <CardFooter className="flex">
            <div className="ml-auto">
              <Button type="submit">Save</Button>
            </div>
          </CardFooter>
        </form>
      </CardContent>
    </Card>
  )
}
