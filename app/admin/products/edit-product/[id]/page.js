'use client'
import { useSession } from 'next-auth/react'
import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { useRouter } from 'next/navigation'
import {
  ChevronLeft,
  Upload,
  Plus,
  X,
  Search,
  ChevronDown,
  ChevronRight,
  Grip,
} from 'lucide-react'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Textarea } from '~/components/ui/textarea'
import { Label } from '~/components/ui/label'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '~/components/ui/tabs'
import { Card, CardContent } from '~/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import { Switch } from '~/components/ui/switch'
import { Checkbox } from '~/components/ui/checkbox'
import {
  DndContext,
  closestCenter,
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table'
import { Badge } from '~/components/ui/badge'
import Toastify from 'toastify-js'
import Image from 'next/image'
import { useAdmin } from '~/hooks/use-admin'

export default function AddNewProduct({ params }) {
  const { id } = params
  const { data: session } = useSession()
  const router = useRouter()
  const [mediaFiles, setMediaFiles] = useState([])
  const [selectedTaxRule, setSelectedTaxRule] = useState('')
  const [categories, setCategories] = useState([])
  const [tags, setTags] = useState([])
  const [productName, setProductName] = useState('')
  const [description, setDescription] = useState('')
  const [sku, setSku] = useState('')
  const [barcode, setBarcode] = useState('')
  const [webPrice, setWebPrice] = useState(0)
  const [websellingPrice, setwebSellingPrice] = useState(0)
  const [posPrice, setPosPrice] = useState(0)
  const [possellingPrice, setPosSellingPrice] = useState(0)
  const [stockQuantity, setStockQuantity] = useState('')
  const [lowStockThreshold, setLowStockThreshold] = useState('')
  const [userdata, setUserdata] = useState({})
  const [taxRules, setTaxRules] = useState([])
  const [modifierGroups, setModifierGroups] = useState([])
  const [productmodifierGroups, setProductModifierGroups] = useState([])
  const [selectedModifiers, setSelectedModifiers] = useState([])
  const [expandedCategories, setExpandedCategories] = useState([])

  const [restaurants, setRestaurants] = useState({})
  const [showOnPos, setShowOnPos] = useState(false)
  const [showOnWeb, setShowOnWeb] = useState(false)
  const [selectedRestaurants, setSelectedRestaurants] = useState([])
  const [selectedPrinters, setSelectedPrinters] = useState([])
  const [trackInventory, setTrackInventory] = useState(false)
  const [allowBackorders, setAllowBackorders] = useState(false)
  const [taxEnable, setTaxEnable] = useState(false)
  const [image_url, setImagePreview] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [removeImage, setRemoveImage] = useState('')

  const userDetails = useAdmin(state => state.userDetails)

  useEffect(() => {
    setUserdata(session)
  }, [session])

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )
  //console.log("Modifiers"+ JSON.stringify(selectedModifiers));
  const [printers, setPrintAreas] = useState([])

  useEffect(() => {
    const fetchProductData = async () => {
      if (id && userdata) {
        setLoading(true)
        try {
          let userId = ''
          let restaurantIds = []
          if (userDetails?.user?.usertype === 'restaurant_owner') {
            userId = userdata?.user ? userdata.user.id : ''
          } else {
            userId = userDetails?.user?.createdBy // Get the creator's user ID
            restaurantIds = userDetails?.user?.selectedRestaurants // Get the selected restaurants
          }
          let token =
            userdata?.user && userdata.user.name ? userdata.user.name.token : ''
          const response = await axios.get(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/product/getproducts/${id}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          )

          const product = response.data.data
          console.log('Product Information', product)
          // console.log("Product Details"+JSON.stringify(product));
          // Set state based on the fetched product data
          setProductName(product.name || '')
          setDescription(product.description || '')
          setSku(product.sku || '')
          setBarcode(product.barcode || '')
          setWebPrice(product.webprice || 0)
          setwebSellingPrice(product.websalleprice || 0)
          setPosPrice(product.posprice || 0)
          setPosSellingPrice(product.posSalePrice || 0)
          setStockQuantity(product.stockQuantity || 0)
          setLowStockThreshold(product.lowStockThreshold || '')
          setSelectedTaxRule(product.taxRule._id || '')

          // setCategories(product.categories || []);
          setTags(product.tags || [])
          setMediaFiles(product.mediaFiles || [])
          setShowOnPos(product.showOnPos || false)
          setShowOnWeb(product.showOnWeb || false)

          //setSelectedRestaurants(product.selectedRestaurants || []);

          setSelectedRestaurants(
            product.selectedRestaurants.map(
              selectedRestaurants => selectedRestaurants._id
            ) || []
          )

          //setSelectedModifiers(product.modifiersgroup || []);
          // This is product modifiers group
          setProductModifierGroups(product.modifiersgroup || [])
          // Checked Select Modifier
          setSelectedModifiers(
            product.modifiersgroup.map(modifiersgroup => modifiersgroup._id) ||
              []
          )

          //setExpandedCategories(product.categories || [])

          setExpandedCategories(
            product.categories.map(categories => categories._id) || []
          )

          //setSelectedPrinters(product.selectedPrinters || []);

          setSelectedPrinters(
            product.selectedPrinters.map(
              selectedPrinters => selectedPrinters._id
            ) || []
          )

          setTrackInventory(product.trackInventory || false)
          setAllowBackorders(product.allowBackorders || false)
          setTaxEnable(product.taxEnable || false)

          if (
            product.mediaFiles &&
            Array.isArray(product.mediaFiles) &&
            product.mediaFiles.length > 0
          ) {
            const productImage = `${
              process.env.NEXT_PUBLIC_IMAGE_BASE_URL
            }/${product.mediaFiles[0].replace(/\\/g, '/')}`
            setImagePreview(productImage)
          }
        } catch (error) {
          console.error('Error fetching product data:', error)
          setError('Failed to fetch product data')
        } finally {
          setLoading(false)
        }
      }
    }
    // Get TaxRules
    const fetchTaxRules = async () => {
      try {
        let userId = ''
        let restaurantIds = []
        if (userDetails?.user?.usertype === 'restaurant_owner') {
          userId = userdata?.user ? userdata.user.id : ''
        } else {
          userId = userDetails?.user?.createdBy // Get the creator's user ID
          restaurantIds = userDetails?.user?.selectedRestaurants // Get the selected restaurants
        }
        let token =
          userdata?.user && userdata.user.name ? userdata.user.name.token : ''
        if (userId) {
          const response = await axios.get(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/taxrules/gettaxrulesuserid/${userId}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          )
          if (response.data.data) {
            setTaxRules(response.data.data)
          }
        }
      } catch (error) {
        console.error('Error fetching tax rules:', error)
      }
    }
    // Get Restaurants
    const fetchRestaurants = async () => {
      try {
        let userId = ''
        let restaurantIds = []
        if (userDetails?.user?.usertype === 'restaurant_owner') {
          userId = userdata?.user ? userdata.user.id : ''
        } else {
          userId = userDetails?.user?.createdBy // Get the creator's user ID
          restaurantIds = userDetails?.user?.selectedRestaurants // Get the selected restaurants
        }
        let token =
          userdata?.user && userdata.user.name ? userdata.user.name.token : ''
        if (userId) {
          const response = await axios.get(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/restaurant/getrestaurantsuserid/${userId}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          )

          if (Array.isArray(response.data.data)) {
            const allRestaurants = response.data.data

            // Filter restaurants based on restaurantIds
            const filteredRestaurants =
              userDetails?.user?.usertype === 'staff'
                ? allRestaurants.filter(restaurant =>
                    restaurantIds.includes(restaurant._id)
                  )
                : allRestaurants

            setRestaurants(filteredRestaurants)
          } else {
            console.warn('Expected an array but got:', response.data.data)
            setRestaurants([])
          }
        }
      } catch (error) {
        console.error('Error fetching restaurants:', error)
      }
    }
    // Get Modifiers Groups
    const fetchModifiersGroups = async () => {
      if (session && userdata) {
        let userId = ''
        let restaurantIds = []
        if (userDetails?.user?.usertype === 'restaurant_owner') {
          userId = userdata?.user ? userdata.user.id : ''
        } else {
          userId = userDetails?.user?.createdBy // Get the creator's user ID
          restaurantIds = userDetails?.user?.selectedRestaurants // Get the selected restaurants
        }
        let token =
          userdata?.user && userdata.user.name ? userdata.user.name.token : ''
        if (userId) {
          try {
            const response = await axios.get(
              `${process.env.NEXT_PUBLIC_API_BASE_URL}/modifiersgroup/getmodifiersgroupsuserid/${userId}`,
              {
                headers: { Authorization: `Bearer ${token}` },
              }
            )
            const sortedModifiersgroup = response.data.data.sort(
              (a, b) => a.sortOrder - b.sortOrder
            )
            setModifierGroups(sortedModifiersgroup)
          } catch (error) {
            console.error('Error fetching modifiers groups:', error)
          }
        }
      }
    }
    // Get Categories
    const fetchCategories = async () => {
      try {
        let userId = ''
        let restaurantIds = []
        if (userDetails?.user?.usertype === 'restaurant_owner') {
          userId = userdata?.user ? userdata.user.id : ''
        } else {
          userId = userDetails?.user?.createdBy // Get the creator's user ID
          restaurantIds = userDetails?.user?.selectedRestaurants // Get the selected restaurants
        }
        let token =
          userdata?.user && userdata.user.name ? userdata.user.name.token : ''
        if (userId) {
          const response = await axios.get(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/categories/getcategoriesuserid/${userId}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          )
          // console.log("categorlist"+JSON.stringify(response));
          const allCategories = response.data.data
          setCategories(allCategories)
          if (Array.isArray(response.data.data)) {
            const allCategories = response.data.data

            const filteredCategories =
              userDetails?.user?.usertype === 'staff'
                ? allCategories.filter(
                    category =>
                      category.parent.selectedRestaurants &&
                      restaurantIds.some(restaurantId =>
                        category.parent.selectedRestaurants.includes(
                          restaurantId
                        )
                      )
                  )
                : allCategories

            setCategories(allCategories)
          } else {
            console.warn('Expected an array but got:', response.data.data)
            setCategories([])
          }
        }
      } catch (error) {
        console.error('Error fetching categories:', error)
      }
    }
    //Get Printarea
    const fetchPrintAreas = async () => {
      let userId = ''
      let restaurantIds = []
      if (userDetails?.user?.usertype === 'restaurant_owner') {
        userId = userdata?.user?.id
      } else {
        userId = userDetails?.user?.createdBy
        restaurantIds = userDetails?.user?.selectedRestaurants
      }
      const token = userdata?.user?.name?.token || ''
      try {
        // Updated API request to the correct endpoint
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/printarea/getprintareauserid/${userId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`, // Include the token in the Authorization header
            },
          }
        )
        setPrintAreas(response.data.data)
      } catch (error) {
        console.error('Error fetching print areas:', error)
      }
    }
    fetchProductData()
    fetchTaxRules()
    fetchRestaurants()
    fetchModifiersGroups()
    fetchCategories()
    fetchPrintAreas()
  }, [userdata, id, session, userDetails])

  const handleFileUpload = event => {
    const file = event.target.files[0] // Get the first file only
    if (file) {
      setMediaFiles([file]) // Set the mediaFiles state to the single file
    }
  }
  const handleDrop = event => {
    event.preventDefault()
    const file = event.dataTransfer.files[0] // Get the first dropped file only
    if (file) {
      setMediaFiles([file]) // Set the mediaFiles state to the single file
    }
  }

  const handleDragOver = event => {
    event.preventDefault()
  }
  const removeFile = index => {
    setRemoveImage(1)
    setMediaFiles(prevFiles => {
      const currentFiles = Array.isArray(prevFiles) ? prevFiles : []
      const newFiles = [...currentFiles]
      newFiles.splice(index, 1)
      return newFiles
    })
  }

  //  const toggleModifier = (modifierId) => {
  //     setSelectedModifiers(prevSelected =>
  //       prevSelected.includes(modifierId)
  //         ? prevSelected.filter(id => id !== modifierId)
  //         : [...prevSelected, modifierId]
  //     )

  //   }

  const toggleModifier = modifierId => {
    setSelectedModifiers(prevSelected => {
      const isSelected = prevSelected.includes(modifierId)

      // Handle case where the modifier is already selected
      if (isSelected) {
        // Remove from both selectedModifiers and productmodifierGroups
        setProductModifierGroups(prevGroups =>
          prevGroups.filter(group => group._id !== modifierId)
        )
        return prevSelected.filter(id => id !== modifierId)
      } else {
        // Handle case where the modifier is not selected
        // Add to both selectedModifiers and productmodifierGroups, ensuring no duplicates
        const groupToAdd = modifierGroups.find(
          group => group._id === modifierId
        )
        setProductModifierGroups(prevGroups => {
          // Avoid adding duplicates to productmodifierGroups
          if (!prevGroups.some(group => group._id === modifierId)) {
            return [...prevGroups, groupToAdd]
          }
          return prevGroups
        })

        return [...prevSelected, modifierId]
      }
    })
  }

  const toggleCategory = categoryId => {
    setCategories(prevCategories =>
      prevCategories.includes(categoryId)
        ? prevCategories.filter(id => id !== categoryId)
        : [...prevCategories, categoryId]
    )
  }
  const toggleExpandCategory = categoryId => {
    // Use a more descriptive parameter name
    setExpandedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(cat => cat !== categoryId)
        : [...prev, categoryId]
    )
  }
  // const toggleExpandCategory = (categoryId) => {
  //   setExpandedCategories(prev => ({
  //     ...prev,
  //     [categoryId]: !prev[categoryId]
  //   }))
  // }

  const handlePosChange = () => {
    // console.log('POS checkbox clicked');
    setShowOnPos(prev => !prev)
  }
  const handleWebChange = () => {
    setShowOnWeb(prev => !prev)
  }

  const handleCheckboxChange = id => {
    //console.log(`Toggling restaurant with ID: ${id}`); // Debugging line
    setSelectedRestaurants(prev => {
      if (prev.includes(id)) {
        // console.log(`Removing: ${id}`);
        return prev.filter(r => r !== id)
      } else {
        // console.log(`Adding: ${id}`);
        return [...prev, id]
      }
    })
  }
  // Handler for printer checkbox
  const handlePrinterChange = id => {
    setSelectedPrinters(prev => {
      if (prev.includes(id)) {
        return prev.filter(printerId => printerId !== id)
      } else {
        return [...prev, id]
      }
    })
  }
  /**
   * Save Handle Mange
   */
  const handleEditSave = async () => {
    let userId = ''
    let restaurantIds = []
    if (userDetails?.user?.usertype === 'restaurant_owner') {
      userId = userdata?.user ? userdata.user.id : ''
    } else {
      userId = userDetails?.user?.createdBy // Get the creator's user ID
      restaurantIds = userDetails.user.selectedRestaurants // Get the selected restaurants
    }
    const productData = new FormData()
    // Append product details
    productData.append('name', productName)
    productData.append('description', description)
    productData.append('sku', sku)
    productData.append('barcode', barcode)
    productData.append('stockQuantity', parseInt(stockQuantity, 10))
    productData.append('lowStockThreshold', parseInt(lowStockThreshold, 10))
    productData.append('taxRule', selectedTaxRule) // Ensure this is a valid ObjectId
    // Append pricing details
    productData.append('webprice', parseFloat(Number(webPrice)))
    productData.append('websalleprice', parseFloat(Number(websellingPrice)))
    productData.append('posprice', parseFloat(Number(posPrice)))
    productData.append('posSalePrice', parseFloat(Number(possellingPrice)))
    productData.append('userid', userId)
    // Append categories and tags
    // productData.append('categories', JSON.stringify(categories));
    productData.append('tags', JSON.stringify(tags))
    // Append media files
    mediaFiles.forEach(file => {
      productData.append('mediaFiles', file)
    })
    // Append modifiers, expanded categories, selected restaurants, and visibility settings
    productData.append('modifiersgroup', JSON.stringify(selectedModifiers))
    productData.append('expandedCategories', JSON.stringify(expandedCategories))
    productData.append(
      'selectedRestaurants',
      JSON.stringify(selectedRestaurants)
    )
    productData.append('showOnPos', showOnPos)
    productData.append('showOnWeb', showOnWeb)
    // Append switch states and selected printers
    productData.append('trackInventory', trackInventory)
    productData.append('allowBackorders', allowBackorders)
    productData.append('taxEnable', taxEnable)
    productData.append('selectedPrinters', JSON.stringify(selectedPrinters))

    productData.append('removeImage', removeImage)

    try {
      let token =
        userdata.user && userdata.user.name ? userdata.user.name.token : ''
      const response = await axios.put(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/product/editproducts/${id}`,
        productData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`,
          },
        }
      )

      if (response.data.success) {
        Toastify({
          text: 'Product updated successfully',
          duration: 3000,
          close: true,
          gravity: 'top',
          position: 'right',
          backgroundColor: 'linear-gradient(to right, #00b09b, #96c93d)',
        }).showToast()
        router.push('/admin/products/all-products')
      }
    } catch (error) {
      console.error(
        'Error updating product:',
        error.response ? error.response.data : error.message
      )
      Toastify({
        text: error.response ? error.response.data : error.message,
        duration: 3000,
        close: true,
        gravity: 'top',
        position: 'right',
        backgroundColor: 'linear-gradient(to right, #FF5C5C, #FF3B3B)',
      }).showToast()
    }
  }
  /**
   * Product Cancel
   */
  const handleCancel = () => {
    router.push('/admin/products/all-products')
  }

  //console.log("Printers Data: "+JSON.stringify(selectedPrinters));

  const renderCategoryTree = (categories, depth = 0) => {
    return categories.map(category => (
      <div key={category.id} style={{ marginLeft: `${depth * 20}px` }}>
        <div className="flex items-center space-x-2">
          {category.children && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleExpandCategory(category.id)}
            >
              {expandedCategories[category.id] ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          )}
          <Checkbox
            id={`category-${category.id}`}
            checked={categories.includes(category.id)}
            onCheckedChange={() => toggleCategory(category.id)}
          />
          <Label htmlFor={`category-${category.id}`}>{category.name}</Label>
        </div>
        {category.children &&
          expandedCategories[category.id] &&
          renderCategoryTree(category.children, depth + 1)}
      </div>
    ))
  }

  const renderUploadedImages = () => {
    if (mediaFiles.length === 0) return null // or return a fallback UI
    const file = mediaFiles[0] // Get the first (and only) file
    return (
      <div className="relative mb-4">
        {file && file instanceof File ? ( // Check if file is defined and is an instance of File
          <Image
            src={URL.createObjectURL(file)}
            alt={`Uploaded ${file.name}`}
            className="h-24 object-cover rounded"
            width={100}
            height={100} // Always provide a height for the Image component
          />
        ) : (
          image_url && ( // Remove curly braces here
            <Image
              src={image_url}
              alt="Uploaded"
              className="h-24 object-cover rounded"
              width={100}
              height={100} // Always provide a height for the Image component
            />
          )
        )}
        <Button
          size="sm"
          variant="destructive"
          className="absolute top-0 right-0"
          onClick={() => removeFile(0)} // Adjust index for single file
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    )
  }
  //console.log("Print Area data",printers);
  console.log('Product Modifier Groups', productmodifierGroups)
  console.log('Select Modifiers', selectedModifiers)

  const handleDragEnd = event => {
    const { active, over } = event

    // If no item was dropped over another item, do nothing
    if (!over) return

    const oldIndex = productmodifierGroups.findIndex(
      group => group._id === active.id
    )
    const newIndex = productmodifierGroups.findIndex(
      group => group._id === over.id
    )

    if (oldIndex !== newIndex) {
      const reorderedModifierGroups = arrayMove(
        productmodifierGroups,
        oldIndex,
        newIndex
      )
      setProductModifierGroups(reorderedModifierGroups)

      // Update selectedModifiers to match the reordered modifier groups
      const sortedModifiers = reorderedModifierGroups.map(group => group._id) // Extract the group IDs

      console.log('sorting ids', sortedModifiers)

      setSelectedModifiers(sortedModifiers)
    }
  }
  return (
    <>
      <div className="container mx-auto p-4">
        {loading && <p>Loading...</p>}
        {error && <p>{error}</p>}

        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <ChevronLeft className="h-6 w-6 mr-2" />
            <h1 className="text-2xl font-semibold">
              Edit Product- {productName}
            </h1>
          </div>
          <div className="space-x-2">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button onClick={handleEditSave} className="bg-teal-600">
              Save
            </Button>
          </div>
        </div>

        <Tabs defaultValue="general">
          <TabsList className="grid w-full grid-cols-8 mb-4">
            <TabsTrigger value="general">General*</TabsTrigger>
            <TabsTrigger value="pricing">Pricing*</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="modifiers">Modifiers Group</TabsTrigger>
            <TabsTrigger value="inventory">Inventory</TabsTrigger>
            <TabsTrigger value="printer">Printer</TabsTrigger>
            <TabsTrigger value="recommendation">Recommendation</TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <Card>
              <CardContent className="p-6 space-y-4">
                <div>
                  <Label htmlFor="productName">Product Name*</Label>
                  <Input
                    id="productName"
                    placeholder="Enter product name"
                    value={productName}
                    onChange={e => setProductName(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Enter product description"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="sku">SKU (Stock Keeping Unit)</Label>
                  <Input
                    id="sku"
                    placeholder="Enter SKU"
                    value={sku}
                    onChange={e => setSku(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="barcode">
                    Barcode (ISBN, UPC, GTIN, etc.)
                  </Label>
                  <Input
                    id="barcode"
                    placeholder="Enter barcode"
                    value={barcode}
                    onChange={e => setBarcode(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="mt-4">
              <CardContent className="p-6 space-y-4">
                <div className="mt-4">{renderUploadedImages()}</div>
                <div
                  className="border-2 border-dashed p-4 text-center"
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                >
                  <Label className="ml-2">Images</Label>
                  <label className="rounded-md p-4 text-center cursor-pointer">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-2">Browse for file</p>
                    <p className="text-xs text-gray-500">
                      or drop files here to upload
                    </p>
                    <Input
                      type="file"
                      className="hidden"
                      onChange={handleFileUpload}
                      accept="image/*"
                      multiple
                    />
                  </label>
                </div>
                <div>
                  <Label htmlFor="choose_pos_web">Show On Pos & Web</Label>
                  <div className="flex items-center mt-4 space-x-2">
                    <Checkbox
                      id="product_pos"
                      checked={showOnPos}
                      onCheckedChange={handlePosChange}
                    />
                    <Label
                      htmlFor="product_pos"
                      className="text-sm font-medium leading-none"
                    >
                      Pos Product
                    </Label>
                  </div>
                  <div className="flex items-center mt-4 space-x-2">
                    <Checkbox
                      id="product_web"
                      checked={showOnWeb}
                      onCheckedChange={handleWebChange}
                    />
                    <Label
                      htmlFor="product_web"
                      className="text-sm font-medium leading-none"
                    >
                      Web Product
                    </Label>
                  </div>
                </div>
                <div>
                  <Label htmlFor="choose_your_stores">Choose Your Stores</Label>
                  {Array.isArray(restaurants) && restaurants.length > 0 ? (
                    restaurants.map(restaurant => (
                      <div
                        key={restaurant._id}
                        className="flex items-center mt-4 space-x-2"
                      >
                        <Checkbox
                          id={`restaurant-${restaurant._id}`}
                          checked={selectedRestaurants.includes(restaurant._id)}
                          onCheckedChange={() =>
                            handleCheckboxChange(restaurant._id)
                          }
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
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pricing">
            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="msrp">Web MSRP*</Label>
                    <Input
                      id="msrp"
                      type="number"
                      placeholder="0.00"
                      value={webPrice}
                      onChange={e => setWebPrice(e.target.value)}
                    />
                  </div>
                  {/* <div>
                  <Label htmlFor="sellingPrice">Web Selling Price</Label>
                  <Input
                    id="sellingPrice"
                    type="number"
                    placeholder="0.00"
                    value={websellingPrice}
                    onChange={(e) => setwebSellingPrice(e.target.value)}
                  />
                </div>  */}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="msrp">Pos MSRP*</Label>
                    <Input
                      id="msrp"
                      type="number"
                      placeholder="0.00"
                      value={posPrice}
                      onChange={e => setPosPrice(e.target.value)}
                    />
                  </div>
                  {/* <div>
                  <Label htmlFor="sellingPrice">Pos Selling Price</Label>
                  <Input
                    id="sellingPrice"
                    type="number"
                    placeholder="0.00"
                    value={possellingPrice}
                    onChange={(e) => setPosSellingPrice(e.target.value)}
                  />
                </div> */}
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="taxenable"
                    checked={taxEnable}
                    onCheckedChange={() => setTaxEnable(!taxEnable)}
                  />
                  <Label htmlFor="taxenable">Tax Enable</Label>
                </div>
                <div>
                  <Label htmlFor="taxRule">Tax Rule</Label>
                  <Select
                    value={selectedTaxRule}
                    onValueChange={setSelectedTaxRule}
                  >
                    <SelectTrigger id="taxRule">
                      <SelectValue placeholder="Select a tax rule" />
                    </SelectTrigger>
                    <SelectContent>
                      {taxRules.map(rule => (
                        <SelectItem key={rule._id} value={rule._id}>
                          {rule.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="inventory">
            <Card>
              <CardContent className="p-6 space-y-4">
                <div>
                  <Label htmlFor="stockQuantity">Stock Quantity</Label>
                  <Input
                    id="stockQuantity"
                    type="number"
                    placeholder="Enter stock quantity"
                    value={stockQuantity}
                    onChange={e => setStockQuantity(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="lowStockThreshold">Low Stock Threshold</Label>
                  <Input
                    id="lowStockThreshold"
                    type="number"
                    placeholder="Enter low stock threshold"
                    value={lowStockThreshold}
                    onChange={e => setLowStockThreshold(e.target.value)}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="trackInventory"
                    checked={trackInventory}
                    onCheckedChange={() => setTrackInventory(!trackInventory)}
                  />
                  <Label htmlFor="trackInventory">Track Inventory</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="allowBackorders"
                    checked={allowBackorders}
                    onCheckedChange={() => setAllowBackorders(!allowBackorders)}
                  />
                  <Label htmlFor="allowBackorders">Allow Backorders</Label>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="modifiers">
            <div className="flex space-x-2">
              <Card>
                <CardContent className="p-6 space-y-4">
                  <h2 className="text-lg font-semibold">Modifier Groups</h2>
                  <div className="space-y-2">
                    {modifierGroups.map(group => (
                      <div
                        key={group._id}
                        className="flex items-center space-x-2"
                      >
                        <Checkbox
                          id={`modifier-${group._id}`}
                          checked={selectedModifiers.includes(group._id)}
                          onCheckedChange={() => toggleModifier(group._id)}
                        />
                        <Label htmlFor={`modifier-${group._id}`}>
                          {group.pos.name}{' '}
                          <p style={{ fontSize: '12px' }}>
                            {group?.internal_info}
                          </p>
                        </Label>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              {/* Right: Selected modifier groups with drag-and-drop */}
              <Card>
                <CardContent className="p-6 space-y-4">
                  <h2 className="text-lg font-semibold">Selected Modifiers</h2>
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={productmodifierGroups.map(group => group._id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-4">
                        {productmodifierGroups.map(group => (
                          <SortableModifierGroup
                            key={group._id}
                            group={group}
                            isChecked={selectedModifiers.includes(group._id)}
                            toggleModifier={toggleModifier}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          <TabsContent value="categories">
            <Card>
              <CardContent className="p-6 space-y-4">
                <div>
                  <Label className="text-lg font-semibold">Categories</Label>
                  <div className="mt-2 space-y-2">
                    {categories.map(category => (
                      <div
                        key={category._id}
                        className="flex items-center space-x-2"
                      >
                        <Checkbox
                          id={`category-${category._id}`}
                          checked={expandedCategories.includes(category._id)}
                          onCheckedChange={() =>
                            toggleExpandCategory(category._id)
                          }
                        />
                        <Label htmlFor={`category-${category._id}`}>
                          {category.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="printer">
            <Card>
              <CardContent className="p-6 space-y-4">
                <h2 className="text-lg font-semibold">Printer Area</h2>
                <div className="relative">
                  {/* <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input className="pl-8" placeholder="Search printers..." /> */}
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]"></TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Store</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {printers.map(printer => (
                      <TableRow key={printer._id}>
                        <TableCell>
                          <Checkbox
                            id={`printer-${printer._id}`}
                            checked={selectedPrinters.includes(printer._id)}
                            onCheckedChange={() =>
                              handlePrinterChange(printer._id)
                            }
                          />
                        </TableCell>
                        <TableCell>{printer.name}</TableCell>
                        <TableCell>
                          {printer.selectedRestaurants?.map(restaurant => (
                            <span key={restaurant._id} className="mr-2">
                              {restaurant.name}
                            </span>
                          ))}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="recommendation">
            {/* <Card>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="recommendedProducts">Recommended Products</Label>
                <Switch id="recommendedProducts" />
              </div>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select Products" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="product1">Product 1</SelectItem>
                  <SelectItem value="product2">Product 2</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex items-center justify-between">
                <Label htmlFor="upsell">Upsell</Label>
                <Switch id="upsell" />
              </div>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select Products (max 2)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="product1">Product 1</SelectItem>
                  <SelectItem value="product2">Product 2</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex items-center justify-between">
                <Label htmlFor="crossSell">Cross-sell</Label>
                <Switch id="crossSell" />
              </div>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select Products (max 3)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="product1">Product 1</SelectItem>
                  <SelectItem value="product2">Product 2</SelectItem>
                  <SelectItem value="product3">Product 3</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card> */}
          </TabsContent>
        </Tabs>
      </div>
    </>
  )
}
// Sortable Modifier Group
const SortableModifierGroup = ({ group, isChecked, toggleModifier }) => {
  const { setNodeRef, attributes, listeners, isDragging } = useSortable({
    id: group._id,
  })

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={`flex items-center space-x-2 p-2 rounded border ${
        isDragging ? 'bg-gray-200' : 'bg-white'
      }`}
    >
      {/* Drag Icon */}
      <Grip className="cursor-move text-gray-500" />

      {/* Checkbox */}
      {/* <Checkbox
        id={`modifier-${group._id}`}
        checked={isChecked}
        onCheckedChange={() => toggleModifier(group._id)}
      /> */}

      {/* Label */}
      <Label htmlFor={`modifier-${group._id}`}>
        {group.pos.name}{' '}
        <p style={{ fontSize: '12px' }}>{group?.internal_info}</p>
      </Label>
    </div>
  )
}
