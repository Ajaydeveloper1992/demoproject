'use client'
import { useSession } from 'next-auth/react'
import React, { useState, useEffect, useMemo } from 'react'
import { ChevronLeft, Plus, X, Search } from 'lucide-react'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table'
import { useRouter } from 'next/navigation'
import Toastify from 'toastify-js'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '~/components/ui/alert-dialog'
import axios from 'axios'

export default function AddModifiers({ params }) {
  const { data: session } = useSession()
  const router = useRouter()
  const { gid } = params

  const [showOnPOS, setShowOnPOS] = useState(false)
  const [requiredChoices, setRequiredChoices] = useState('1')
  const [maxChoices, setMaxChoices] = useState('1')
  const [onlineOrderingEnabled, setOnlineOrderingEnabled] = useState(false)
  const [onlineRequiredChoices, setOnlineRequiredChoices] = useState('None')
  const [onlineMaxChoices, setOnlineMaxChoices] = useState('None')
  const [modifiers, setModifiers] = useState([
    { name: '', priceAdjustment: 0, defaultSelected: false },
  ])
  const [groupNamePOS, setGroupNamePOS] = useState('')
  const [groupInfo, setGroupintrinfo] = useState('')
  const [groupNameWeb, setGroupNameWeb] = useState('')
  const [userdata, setUserdata] = useState({})

  const [products, setProducts] = useState([])
  const [selectedProducts, setSelectedProducts] = useState([])

  const [categories, setCategories] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  //console.log("Data Categories: "+JSON.stringify(categories));

  useEffect(() => {
    if (session) {
      setUserdata(session)
    }
  }, [session])

  useEffect(() => {
    const fetchModifiersGroup = async () => {
      if (!userdata.user) return

      try {
        const token = userdata.user.name.token || ''
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/modifiersgroup/getmodifiersgroups/${gid}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        )
        const data = response.data.data

        if (data) {
          setGroupNamePOS(data.pos.name || '')
          setGroupNameWeb(data.web.name || '')
          setGroupintrinfo(data.internal_info || '')
          setShowOnPOS(data.pos.isActive || false)
          setRequiredChoices(data.pos.requiredModifiersCount.toString() || '1')
          setMaxChoices(data.pos.allowedModifiersCount.toString() || '1')
          setOnlineOrderingEnabled(data.web.enabled || false)
          setOnlineRequiredChoices(
            data.web.requiredModifiersCount.toString() || 'None'
          )
          setOnlineMaxChoices(
            data.web.allowedModifiersCount.toString() || 'None'
          )
          //setModifiers(data.modifiers.length > 0 ? data.modifiers : [{ name: '', priceAdjustment: 0 }]);
          setModifiers(
            data.modifiers.length > 0
              ? data.modifiers
              : [{ name: '', priceAdjustment: 0, defaultSelected: false }]
          )
          //setSelectedProducts(data.selectedProducts);
          setSelectedProducts(data.selectedProducts.map(product => product._id))
        }
      } catch (error) {
        console.error('Error fetching modifiers group:', error)
        Toastify({
          text: 'Failed to fetch modifiers group.',
          duration: 3000,
          close: true,
          gravity: 'top',
          position: 'right',
          backgroundColor: 'linear-gradient(to right, #FF5C5C, #FF3B3B)',
        }).showToast()
      }
    }

    const fetchCategories = async () => {
      if (!userdata.user) return
      try {
        const userId = userdata.user.id || ''
        const token = userdata.user.name.token || ''
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/categories/getcategoriesuserid/${userId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        )
        setCategories(response.data.data) // Ensure this matches your API response
      } catch (error) {
        console.error('Error fetching categories:', error)
      }
    }

    fetchModifiersGroup()
    fetchCategories()
  }, [userdata, gid])

  useEffect(() => {
    const fetchProducts = async () => {
      if (!userdata.user) return

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

  // const addModifier = () => {
  //     setModifiers([...modifiers, { name: '', priceAdjustment: 0 }]);
  // };
  const addModifier = () => {
    setModifiers([
      ...modifiers,
      { name: '', priceAdjustment: 0, defaultSelected: false },
    ])
  }
  const updateModifier = (index, field, value) => {
    const newModifiers = [...modifiers]
    newModifiers[index][field] = value
    setModifiers(newModifiers)
  }

  const removeModifier = index => {
    const newModifiers = [...modifiers]
    newModifiers.splice(index, 1)
    setModifiers(newModifiers)
  }

  const handleProductSelection = productId => {
    setSelectedProducts(prevSelected => {
      if (prevSelected.includes(productId)) {
        return prevSelected.filter(id => id !== productId) // Remove from selection
      } else {
        return [...prevSelected, productId] // Add to selection
      }
    })
  }

  const handleSave = async () => {
    // if (!groupNamePOS || !modifiers.some(mod => mod.name?.trim() !== '' && mod.priceAdjustment !== undefined)) {
    if (!groupNamePOS) {
      Toastify({
        text: 'Group Name (POS) and at least one valid modifier are required.',
        duration: 3000,
        close: true,
        gravity: 'top',
        position: 'right',
        backgroundColor: 'linear-gradient(to right, #FF5C5C, #FF3B3B)',
      }).showToast()
      return
    }

    const modifierIds = await Promise.all(
      modifiers.map(async modifier => {
        if (modifier.name.trim() === '' || modifier.priceAdjustment === '') {
          return null
        }

        try {
          const response = modifier._id
            ? await axios.put(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}/modifers/editmodifiers/${modifier._id}`,
                {
                  name: modifier.name,
                  priceAdjustment: parseFloat(modifier.priceAdjustment) || 0,
                  defaultSelected: modifier.defaultSelected,
                  posEnabled: true,
                  onlineEnabled: true,
                },
                {
                  headers: {
                    Authorization: `Bearer ${userdata.user.name.token}`,
                  },
                }
              )
            : await axios.post(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}/modifers/createmodifiers`,
                {
                  name: modifier.name,
                  priceAdjustment: parseFloat(modifier.priceAdjustment) || 0,
                  defaultSelected: modifier.defaultSelected,
                  modifiersgroup: gid,
                  createdBy: userdata.user.id,
                  posEnabled: true,
                  onlineEnabled: true,
                },
                {
                  headers: {
                    Authorization: `Bearer ${userdata.user.name.token}`,
                  },
                }
              )

          return response.data.data._id
        } catch (error) {
          console.error(
            'Error processing modifier:',
            error.response?.data || error.message
          )
          Toastify({
            text: 'Error processing modifier',
            duration: 3000,
            close: true,
            gravity: 'top',
            position: 'right',
            backgroundColor: 'linear-gradient(to right, #FF5C5C, #FF3B3B)',
          }).showToast()
          return null
        }
      })
    )

    const validModifierIds = modifierIds.filter(id => id !== null)

    const requiredChoicesParsed = parseInt(requiredChoices) || 0
    const maxChoicesParsed = parseInt(maxChoices) || 0
    const onlineRequiredChoicesParsed =
      onlineRequiredChoices === 'None'
        ? 0
        : parseInt(onlineRequiredChoices) || 0
    const onlineMaxChoicesParsed =
      onlineMaxChoices === 'None' ? 0 : parseInt(onlineMaxChoices) || 0

    const payload = {
      pos: {
        name: groupNamePOS,
        description: '',
        isActive: showOnPOS,
        enabled: true,
        requiredModifiersCount: requiredChoicesParsed,
        allowedModifiersCount: maxChoicesParsed,
      },
      web: {
        name: groupNameWeb,
        description: '',
        isActive: onlineOrderingEnabled,
        enabled: onlineOrderingEnabled,
        requiredModifiersCount: onlineRequiredChoicesParsed,
        allowedModifiersCount: onlineMaxChoicesParsed,
      },
      modifiers: validModifierIds,
      selectedProducts: Array.from(selectedProducts),
    }

    try {
      const token = userdata.user.name.token || ''
      const url = gid
        ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/modifiersgroup/editmodifiersgroups/${gid}`
        : `${process.env.NEXT_PUBLIC_API_BASE_URL}/modifiersgroup/createmodifiersgroups`

      const method = gid ? axios.put : axios.post

      await method(url, payload, {
        headers: { Authorization: `Bearer ${token}` },
      })

      Toastify({
        text: gid
          ? 'Modifiers group updated successfully!'
          : 'Modifiers group created successfully!',
        duration: 3000,
        close: true,
        gravity: 'top',
        position: 'right',
        backgroundColor: 'linear-gradient(to right, #00b09b, #96c93d)',
      }).showToast()

      router.back() // Navigate back after saving
    } catch (error) {
      console.error(
        'Error saving modifiers group:',
        error.response?.data || error.message
      )
      Toastify({
        text: 'Failed to save modifiers group. Please try again.',
        duration: 3000,
        close: true,
        gravity: 'top',
        position: 'right',
        backgroundColor: 'linear-gradient(to right, #FF5C5C, #FF3B3B)',
      }).showToast()
    }
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

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <ChevronLeft className="h-6 w-6 mr-2" onClick={() => router.back()} />
          <h1 className="text-2xl font-semibold">
            Modifier Group - {groupNamePOS}{' '}
          </h1>

          <p>{groupInfo}</p>
        </div>
        <div className="space-x-2">
          <Button variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button onClick={handleSave} className="bg-teal-600">
            Save
          </Button>
        </div>
      </div>
      <Tabs defaultValue="modifierinfo">
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="modifierinfo">Modifier info*</TabsTrigger>
          {/* <TabsTrigger value="modifier">Modifier*</TabsTrigger> */}
          <TabsTrigger value="product">Product</TabsTrigger>
        </TabsList>
        <TabsContent value="modifierinfo">
          <Card>
            <CardContent className="p-6 space-y-4">
              <div>
                <Label htmlFor="groupnamepos">Group Name (POS)*</Label>
                <Input
                  id="groupnamepos"
                  placeholder="Enter Group Name"
                  value={groupNamePOS}
                  onChange={e => setGroupNamePOS(e.target.value)}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="showOnPOS"
                  checked={showOnPOS}
                  onCheckedChange={setShowOnPOS}
                />
                <Label htmlFor="showOnPOS">Show upon order entry on POS</Label>
              </div>
              <div>
                <Label>How many choices can your customers pick?</Label>
                <div className="flex space-x-4 mt-2">
                  <div>
                    <Label htmlFor="requiredChoices">Required</Label>
                    <Select
                      value={requiredChoices}
                      onValueChange={setRequiredChoices}
                    >
                      <SelectTrigger id="requiredChoices">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">None</SelectItem>
                        {[...Array(Math.min(modifiers.length, 50))].map(
                          (_, i) => (
                            <SelectItem key={i} value={`${i + 1}`}>
                              {i + 1}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="maxChoices">Max</Label>
                    <Select value={maxChoices} onValueChange={setMaxChoices}>
                      <SelectTrigger id="maxChoices">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">None</SelectItem>
                        {[...Array(Math.min(modifiers.length, 50))].map(
                          (_, i) => (
                            <SelectItem key={i} value={`${i + 1}`}>
                              {i + 1}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="mt-4">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Online Ordering</h2>
                <Switch
                  checked={onlineOrderingEnabled}
                  onCheckedChange={setOnlineOrderingEnabled}
                />
              </div>
              {onlineOrderingEnabled && (
                <>
                  <div>
                    <Label htmlFor="groupnameweb">Group Name (Web)*</Label>
                    <Input
                      id="groupnameweb"
                      placeholder="Enter Group Name Web"
                      value={groupNameWeb}
                      onChange={e => setGroupNameWeb(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>How many choices can your customers pick?</Label>
                    <div className="flex space-x-4 mt-2">
                      <div>
                        <Label htmlFor="onlineRequiredChoices">Required</Label>
                        <Select
                          value={onlineRequiredChoices}
                          onValueChange={setOnlineRequiredChoices}
                        >
                          <SelectTrigger id="onlineRequiredChoices">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0">None</SelectItem>
                            {[...Array(Math.min(modifiers.length, 50))].map(
                              (_, i) => (
                                <SelectItem key={i} value={`${i + 1}`}>
                                  {i + 1}
                                </SelectItem>
                              )
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="onlineMaxChoices">Max</Label>
                        <Select
                          value={onlineMaxChoices}
                          onValueChange={setOnlineMaxChoices}
                        >
                          <SelectTrigger id="onlineMaxChoices">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0">None</SelectItem>
                            {[...Array(Math.min(modifiers.length, 50))].map(
                              (_, i) => (
                                <SelectItem key={i} value={`${i + 1}`}>
                                  {i + 1}
                                </SelectItem>
                              )
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
          <Card className="mt-4">
            <CardContent className="p-6 space-y-4">
              <h2 className="text-lg font-semibold">Add Modifiers</h2>
              {modifiers &&
                modifiers.map((modifier, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Input
                      placeholder="Modifier name"
                      value={modifier.name}
                      onChange={e =>
                        updateModifier(index, 'name', e.target.value)
                      }
                    />
                    <Input
                      type="number"
                      placeholder="Price"
                      value={modifier.priceAdjustment}
                      onChange={e =>
                        updateModifier(
                          index,
                          'priceAdjustment',
                          parseFloat(e.target.value) || 0
                        )
                      }
                    />
                    <div className="flex items-center space-x-2">
                      <Switch
                        id={`default-selected-${index}`}
                        checked={modifier.defaultSelected}
                        onCheckedChange={checked =>
                          updateModifier(index, 'defaultSelected', checked)
                        }
                      />
                      <Label
                        htmlFor={`default-selected-${index}`}
                        className="text-sm"
                      >
                        Default
                      </Label>
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => removeModifier(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              <Button onClick={addModifier} className="mt-2 bg-teal-600">
                <Plus className="h-4 w-4 mr-2" /> Add Modifier
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="modifier">{/** Modifier Tab */}</TabsContent>
        <TabsContent value="product">
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
                                      category => category._id === categoryId
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
        </TabsContent>
      </Tabs>
    </div>
  )
}
