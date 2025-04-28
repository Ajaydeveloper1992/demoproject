'use client' // Ensure this is a client component
import { useSession } from 'next-auth/react'
import React, { useEffect, useState, Suspense, useMemo } from 'react'
import axios from 'axios'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '~/components/ui/button'
import { Label } from '~/components/ui/label'
import { Input } from '~/components/ui/input'
import { Textarea } from '~/components/ui/textarea'
import ImageUpload from '../../components/imageupload'
import Toastify from 'toastify-js'
import Image from 'next/image'
import { Checkbox } from '~/components/ui/checkbox'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '~/components/ui/accordion'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '~/components/ui/dialog'
import { Card, CardContent } from '~/components/ui/card'
import { ChevronLeft, ChevronRight, Copy, Plus, Trash2 } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import { JsonWebTokenError } from 'jsonwebtoken'
// Basic Switch component for demonstration
const Switch = ({ id, checked, onChange }) => {
  return (
    <input
      type="checkbox"
      id={id}
      checked={checked}
      onChange={onChange}
      className="switch" // Add your custom styling
    />
  )
}
// Edit Restaurant
const EditRestaurant = () => {
  const { data: session } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const id = searchParams.get('id')
  const [userdata, setUserdata] = useState({})
  const [removeLogoImage, setRemoveLogoImage] = useState('')
  const [removebannerImage, setRemoveBannerImage] = useState('')
  const [isBusinessHoursModalOpen, setIsBusinessHoursModalOpen] =
    useState(false)
  // Form Data
  const [formData, setFormData] = useState({
    name: '',
    url_slug: '',
    address: {
      streetAddress: '',
      city: '',
      postalCode: '',
      state: '',
      country: 'Canada',
      timeZone: 'GMT-05:00 America/New_York (EST)',
      platformLanguage: 'English (United States)',
    },
    status: 'open',
    businessDescription: '',
    businessPhone: '',
    minimumOrderValue: 0,
    averageOrderPrepTime: 0,
    timeSlots: 0,
    businessStoreclose: '',
    ownerName: '',
    ownerPhone: '',
    ownerEmail: '',
    websiteurl: '',
    openingHours: '',
    servicesOffered: {
      pickUp: true,
      delivery: false,
      dineIn: false,
    },
    businessLogo: null,
    bannerImage: null,
    autoPrintKitchenReceipt: false,
    receiptForExistingCustomer: false,
    checkoutpage_tip_option: false,
    checkoutpage_upon_void: false,
    send_to_kitchen_print: false,
    voided_order_print: false,
    paymentSettings: {
      currency: 'CAD',
      decimalSeparator: '.',
      cashOnDelivery: {
        enabled: false,
        instructions: '',
      },
      nuvei: {
        enabled: false,
        secretKey: '',
        merchantId: '',
        merchantSiteId: '',
        liveMode: false,
      },
      stripe: {
        enabled: false,
        secretKey: '',
        publicKey: '',
        liveMode: false,
      },
    },
    location_id: '',
    list_token_id: '',
    total_orders_id: '',
    total_revenue_id: '',
    average_order_value_id: '',
    last_order_date_id: '',
  })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    setUserdata(session)
  }, [session])

  const [oldBusinessLogo, setOldBusinessLogo] = useState(null)
  const [oldBannerImage, setOldBannerImage] = useState(null)

  useEffect(() => {
    const fetchRestaurant = async () => {
      if (id) {
        try {
          const token = userdata?.user?.name?.token || ''
          const response = await axios.get(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/restaurant/getrestaurantsid/${id}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          )
          const restaurantData = response.data.data
          const address_db =
            typeof restaurantData.address === 'string'
              ? JSON.parse(restaurantData.address)
              : restaurantData.address || {}

          setFormData(prev => ({
            ...prev,
            ...restaurantData,
            servicesOffered: restaurantData.servicesOffered || {
              pickUp: false,
              delivery: false,
              dineIn: false,
            },
            address: address_db || {
              streetAddress: '',
              city: '',
              postalCode: '',
              state: '',
              country: 'Canada',
              timeZone: 'GMT-05:00 America/New_York (EST)',
              platformLanguage: 'English (United States)',
            },
            paymentSettings: restaurantData.paymentSettings,
          }))
          const businessLogopath = restaurantData.businessLogo
            ? process.env.NEXT_PUBLIC_IMAGE_BASE_URL +
              '/' +
              restaurantData.businessLogo.replace(/\\/g, '/')
            : ''
          setOldBusinessLogo(businessLogopath)
          const bannerImagepath = restaurantData.bannerImage
            ? process.env.NEXT_PUBLIC_IMAGE_BASE_URL +
              '/' +
              restaurantData.bannerImage.replace(/\\/g, '/')
            : ''
          setOldBannerImage(bannerImagepath)
        } catch (error) {
          console.error('Error fetching restaurant:', error)
        }
      }
    }
    fetchRestaurant()
  }, [userdata, id])

  // const handleInputChange = (e) => {
  //     const { name, value } = e.target;
  //     setFormData(prev => ({ ...prev, [name]: value }));
  // };
  const handleInputChange = e => {
    const { id, value, type, checked } = e.target
    const isCheckbox = type === 'checkbox'

    if (id.startsWith('paymentSettings.')) {
      const fieldPath = id.split('.')
      setFormData(prev => {
        const updatedPaymentSettings = { ...prev.paymentSettings }

        if (fieldPath.length === 3) {
          // Handle nested fields like paymentSettings.nuvei.enabled
          updatedPaymentSettings[fieldPath[1]] = {
            ...updatedPaymentSettings[fieldPath[1]],
            [fieldPath[2]]: isCheckbox ? checked : value,
          }
        } else {
          updatedPaymentSettings[fieldPath[1]] = isCheckbox ? checked : value
        }

        return { ...prev, paymentSettings: updatedPaymentSettings }
      })
    } else if (id.startsWith('address.')) {
      const fieldPath = id.split('.')
      setFormData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          [fieldPath[1]]: value,
        },
      }))
    } else {
      setFormData(prev => ({ ...prev, [id]: value }))
    }
  }
  // Address Form Update
  const handleAddressChange = e => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      address: {
        ...prev.address,
        [name]: value,
      },
    }))
    setErrors(prev => ({ ...prev, [`address.${name}`]: '' }))
  }
  // Updated Select onValueChange handling
  const handleSelectChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      address: {
        ...prev.address,
        [name]: value, // Update the value of the specific field in address
      },
    }))
    setErrors(prev => ({ ...prev, [`address.${name}`]: '' }))
  }

  const handleServiceChange = event => {
    const { id, checked } = event.target
    setFormData(prevData => ({
      ...prevData,
      servicesOffered: {
        ...prevData.servicesOffered,
        [id]: checked,
      },
    }))
  }

  const handleImageUpload = (type, file) => {
    setFormData(prev => ({ ...prev, [type]: file }))
  }

  const handleSubmit = async e => {
    e.preventDefault()
    const formDataToSend = new FormData()
    Object.keys(formData).forEach(key => {
      if (key === 'businessLogo' || key === 'bannerImage') {
        if (formData[key]) {
          formDataToSend.append(key, formData[key])
        } else if (key === 'businessLogo' && oldBusinessLogo) {
          formDataToSend.append(key, oldBusinessLogo)
        } else if (key === 'bannerImage' && oldBannerImage) {
          formDataToSend.append(key, oldBannerImage)
        }
      } else if (
        key === 'servicesOffered' ||
        key === 'address' ||
        key === 'paymentSettings'
      ) {
        formDataToSend.append(key, JSON.stringify(formData[key]))
      } else {
        formDataToSend.append(key, formData[key])
      }
    })

    try {
      const token = userdata?.user?.name?.token || ''
      const response = await axios.put(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/restaurant/editrestaurants/${id}`,
        formDataToSend,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`,
          },
        }
      )

      Toastify({
        text: response.data.message || 'Restaurant updated successfully',
        duration: 3000,
        close: true,
        gravity: 'top',
        position: 'right',
        backgroundColor:
          response.status === 'Error'
            ? 'linear-gradient(to right, #FF5C5C, #FF3B3B)'
            : 'linear-gradient(to right, #00b09b, #96c93d)',
      }).showToast()

      if (response.status !== 'Error') {
        router.push('/admin/restaurant')
      }
    } catch (error) {
      Toastify({
        text: error.response?.data?.error || 'Failed to update restaurant',
        duration: 3000,
        close: true,
        gravity: 'top',
        position: 'right',
        backgroundColor: 'linear-gradient(to right, #FF5C5C, #FF3B3B)',
      }).showToast()
    }
  }

  const handlelogoRemoveImage = type => {
    setFormData(prev => ({ ...prev, [type]: null }))
    setRemoveLogoImage(1)
    setOldBusinessLogo(null)
  }

  const handlebannerRemoveImage = type => {
    setFormData(prev => ({ ...prev, [type]: null }))
    setRemoveBannerImage(1)
    setOldBannerImage(null)
  }

  const handleBusinessHoursChange = newSchedule => {
    setFormData(prev => ({
      ...prev,
      openingHours: JSON.stringify(newSchedule),
    }))
  }

  if (!id) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 mt-3 mb-6 rounded"></div>
        <div className="h-4 bg-gray-300 mb-6 rounded"></div>
        <div className="h-4 bg-gray-200 mb-6 rounded"></div>
        <div className="h-4 bg-gray-300 mb-6 rounded"></div>
        <div className="h-4 bg-gray-200 mb-6 rounded"></div>
      </div>
    )
  }
  let address_info = []
  if (typeof formData.address === 'object' && formData.address !== null) {
    // It's already an object, so no need to parse
    address_info = formData.address
  } else if (typeof formData.address === 'string') {
    // It's a string, check if it is valid JSON
    try {
      address_info = JSON.parse(formData.address)
    } catch (error) {
      console.error('Invalid JSON string:', error)
      address_info = {} // Set to empty object or handle error as needed
    }
  } else {
    // Handle the case where it's neither an object nor a string
    console.error('Unexpected type for formData.address')
  }
  // Recipte Print
  const handleCheckboxChange = (checked, field) => {
    if (field.startsWith('paymentSettings.')) {
      const fieldPath = field.split('.')
      setFormData(prev => ({
        ...prev,
        paymentSettings: {
          ...prev.paymentSettings,
          [fieldPath[1]]: checked,
        },
      }))
    } else {
      setFormData(prev => ({ ...prev, [field]: checked }))
    }
  }
  //console.log("Restorant Details PaymentSettings :: ",formData);
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Edit Restaurant</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-4">
            <div>
              <Label>Business Logo</Label>
              {oldBusinessLogo && (
                <div className="relative mb-2">
                  <Image
                    src={oldBusinessLogo}
                    alt="Current Business Logo"
                    width={100}
                    height={100}
                    className="w-32 h-32 object-cover"
                  />
                  <Button
                    type="button"
                    onClick={() => handlelogoRemoveImage('businessLogo')}
                    className="absolute top-0 right-0 bg-red-500 text-white"
                  >
                    Remove
                  </Button>
                </div>
              )}
              <ImageUpload
                label="Upload New Logo"
                imageType="businessLogo"
                onImageUpload={handleImageUpload}
              />
            </div>
            <div>
              <Label htmlFor="name">Business Name</Label>
              <Input
                id="name"
                name="name"
                placeholder="Enter business name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="name">Business Website</Label>
              <Input
                id="websiteurl"
                name="websiteurl"
                placeholder="Enter business Website"
                value={formData.websiteurl}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <Label htmlFor="businessDescription">Business Description</Label>
              <Textarea
                id="businessDescription"
                name="businessDescription"
                placeholder="Enter business description"
                value={formData.businessDescription}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <Label htmlFor="businessPhone">Business Phone</Label>
              <Input
                id="businessPhone"
                name="businessPhone"
                type="tel"
                placeholder="Enter business phone"
                value={formData.businessPhone}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <Label htmlFor="minimumOrderValue">Minimum Order Value</Label>
              <Input
                id="minimumOrderValue"
                name="minimumOrderValue"
                type="number"
                placeholder="Enter minimum order value"
                value={formData.minimumOrderValue}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <Label htmlFor="averageOrderPrepTime">
                Average Order Prepare Time
              </Label>
              <Input
                id="averageOrderPrepTime"
                name="averageOrderPrepTime"
                type="number"
                placeholder="Enter average prepare time"
                value={formData.averageOrderPrepTime}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <Label htmlFor="timeSlots">Time Slots</Label>
              <Input
                id="timeSlots"
                name="timeSlots"
                type="number"
                placeholder="Enter time slot separation"
                value={formData.timeSlots}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <Label htmlFor="businessStoreclose">Store Close Message</Label>
              <Textarea
                id="businessStoreclose"
                name="businessStoreclose"
                placeholder="Enter Store Close"
                onChange={handleInputChange}
                value={formData.businessStoreclose}
              />
            </div>
            {/* Store New Order */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="autoPrintKitchenReceipt"
                checked={formData.autoPrintKitchenReceipt}
                onCheckedChange={checked =>
                  handleCheckboxChange(checked, 'autoPrintKitchenReceipt')
                }
              />
              <Label
                htmlFor="autoPrintKitchenReceipt"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Web Order Kitchen Receipt Auto Print
              </Label>
              <Checkbox
                id="receiptForExistingCustomer"
                checked={formData.receiptForExistingCustomer}
                onCheckedChange={checked =>
                  handleCheckboxChange(checked, 'receiptForExistingCustomer')
                }
              />
              <Label
                htmlFor="receiptForExistingCustomer"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Receipt on Print Existing Customer N/R
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="checkoutpage_tip_option"
                name="checkoutpage_tip_option"
                checked={formData.checkoutpage_tip_option}
                onCheckedChange={checked =>
                  handleCheckboxChange(checked, 'checkoutpage_tip_option')
                }
              />
              <Label
                htmlFor="checkoutpage_tip_option"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Allow tip on Web checkout
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="checkoutpage_upon_void"
                name="checkoutpage_upon_void"
                checked={formData.checkoutpage_upon_void}
                onCheckedChange={checked =>
                  handleCheckboxChange(checked, 'checkoutpage_upon_void')
                }
              />
              <Label
                htmlFor="checkoutpage_upon_void"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Send email upon Void
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="send_to_kitchen_print"
                name="send_to_kitchen_print"
                checked={formData.send_to_kitchen_print}
                onCheckedChange={checked =>
                  handleCheckboxChange(checked, 'send_to_kitchen_print')
                }
              />
              <Label
                htmlFor="send_to_kitchen_print"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Send to Kitchen Print
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="voided_order_print"
                name="voided_order_print"
                checked={formData.voided_order_print}
                onCheckedChange={checked =>
                  handleCheckboxChange(checked, 'voided_order_print')
                }
              />
              <Label
                htmlFor="voided_order_print"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Print Void receipt
              </Label>
            </div>
            {/* Payment Settings */}
            <div className="mb-6">
              <h3 className="text-xl font-bold">Payment Settings</h3>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger>General Settings</AccordionTrigger>
                  <AccordionContent>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="paymentSettings.currency">Currency</Label>
                      <select
                        id="paymentSettings.currency"
                        className="border rounded p-2"
                        value={formData?.paymentSettings?.currency}
                        onChange={handleInputChange}
                      >
                        <option value="CAD">CAD - Canadian Dollar</option>
                        <option value="USD">USD - US Dollar</option>
                        <option value="EUR">EUR - Euro</option>
                      </select>
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="paymentSettings.decimalSeparator">
                        Decimal Separator
                      </Label>
                      <select
                        id="paymentSettings.decimalSeparator"
                        className="border rounded p-2"
                        value={formData?.paymentSettings?.decimalSeparator}
                        onChange={handleInputChange}
                      >
                        <option value=".">Dot (.)</option>
                        <option value=",">Comma (,)</option>
                      </select>
                    </div>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2">
                  <AccordionTrigger>Cash on Delivery</AccordionTrigger>
                  <AccordionContent>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="paymentSettings.cashOnDelivery.enabled">
                        Enable Cash on Delivery
                      </Label>
                      <Switch
                        id="paymentSettings.cashOnDelivery.enabled"
                        checked={
                          formData?.paymentSettings?.cashOnDelivery?.enabled
                        }
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="paymentSettings.cashOnDelivery.instructions">
                        Instructions for Cash on Delivery
                      </Label>
                      <Input
                        id="paymentSettings.cashOnDelivery.instructions"
                        placeholder="Pay with cash upon delivery."
                        value={
                          formData?.paymentSettings?.cashOnDelivery
                            ?.instructions
                        }
                        onChange={handleInputChange}
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-3">
                  <AccordionTrigger>Nuvei</AccordionTrigger>
                  <AccordionContent>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="paymentSettings.nuvei.enabled">
                        Enable Nuvei
                      </Label>
                      <Switch
                        id="paymentSettings.nuvei.enabled"
                        checked={formData?.paymentSettings?.nuvei?.enabled}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="paymentSettings.nuvei.secretKey">
                        Secret Key
                      </Label>
                      <Input
                        id="paymentSettings.nuvei.secretKey"
                        type="text"
                        placeholder="Enter Nuvei secret key"
                        value={formData?.paymentSettings?.nuvei?.secretKey}
                        onChange={handleInputChange}
                      />
                      <Label htmlFor="paymentSettings.nuvei.merchantId">
                        Merchant ID
                      </Label>
                      <Input
                        id="paymentSettings.nuvei.merchantId"
                        placeholder="Enter Merchant ID"
                        value={formData?.paymentSettings?.nuvei?.merchantId}
                        onChange={handleInputChange}
                      />
                      <Label htmlFor="paymentSettings.nuvei.merchantSiteId">
                        Merchant Site ID
                      </Label>
                      <Input
                        id="paymentSettings.nuvei.merchantSiteId"
                        placeholder="Enter Merchant Site ID"
                        value={formData?.paymentSettings?.nuvei?.merchantSiteId}
                        onChange={handleInputChange}
                      />
                      <div className="flex items-center">
                        <Label htmlFor="paymentSettings.nuvei.liveMode">
                          Live Mode
                        </Label>
                        <Switch
                          id="paymentSettings.nuvei.liveMode"
                          checked={formData?.paymentSettings?.nuvei?.liveMode}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
                {/** Nuvei Payment Strip */}
                <AccordionItem value="item-4">
                  <AccordionTrigger>Stripe</AccordionTrigger>
                  <AccordionContent>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="paymentSettings.stripe.enabled">
                        Enable Stripe
                      </Label>
                      <Switch
                        id="paymentSettings.stripe.enabled"
                        checked={formData?.paymentSettings?.stripe?.enabled}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="paymentSettings.stripe.secretKey">
                        Secret Key
                      </Label>
                      <Input
                        id="paymentSettings.stripe.secretKey"
                        type="text"
                        placeholder="Enter Stripe Secret Key"
                        value={formData?.paymentSettings?.stripe?.secretKey}
                        onChange={handleInputChange}
                      />
                      <Label htmlFor="paymentSettings.stripe.publicKey">
                        Public Key
                      </Label>
                      <Input
                        id="paymentSettings.stripe.publicKey"
                        placeholder="Enter Public Key"
                        value={formData?.paymentSettings?.stripe?.publicKey}
                        onChange={handleInputChange}
                      />
                      <div className="flex items-center">
                        <Label htmlFor="paymentSettings.stripe.liveMode">
                          Live Mode
                        </Label>
                        <Switch
                          id="paymentSettings.stripe.liveMode"
                          checked={formData?.paymentSettings?.stripe?.liveMode}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>
          {/* Right Column */}
          <div className="space-y-4">
            <div>
              <Label>Banner Image</Label>
              {oldBannerImage && (
                <div className="relative mb-2">
                  <Image
                    src={oldBannerImage}
                    alt="Current Banner"
                    width={100}
                    height={100}
                    className="w-full h-32 object-cover"
                  />
                  <Button
                    type="button"
                    onClick={() => handlebannerRemoveImage('bannerImage')}
                    className="absolute top-0 right-0 bg-red-500 text-white"
                  >
                    Remove
                  </Button>
                </div>
              )}
              <ImageUpload
                label="Upload New Banner"
                imageType="bannerImage"
                onImageUpload={handleImageUpload}
              />
            </div>
            <div className="p-0 space-y-4">
              <div>
                <Label htmlFor="streetAddress">Street Address</Label>
                <Input
                  id="streetAddress"
                  name="streetAddress"
                  placeholder="Enter street address"
                  value={address_info?.streetAddress}
                  onChange={handleAddressChange}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    name="city"
                    placeholder="Enter city"
                    value={address_info?.city}
                    onChange={handleAddressChange}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="postalCode">Postal/Zip Code</Label>
                  <Input
                    id="postalCode"
                    name="postalCode"
                    placeholder="Enter postal code"
                    value={address_info?.postalCode}
                    onChange={handleAddressChange}
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="state">State / Province / Region</Label>
                <Input
                  id="state"
                  name="state"
                  placeholder="Enter state/province"
                  value={address_info?.state}
                  onChange={handleAddressChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="country">Country</Label>
                <Select
                  value={address_info?.country}
                  onValueChange={value => handleSelectChange('country', value)} // Use the new helper function
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Canada">Canada</SelectItem>
                    <SelectItem value="United States">United States</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="timeZone">Time Zone</Label>
                <Select
                  value={address_info?.timeZone}
                  onValueChange={value => handleSelectChange('timeZone', value)} // Use the new helper function
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select time zone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GMT-05:00 America/New_York (EST)">
                      GMT-05:00 America/New_York (EST)
                    </SelectItem>
                    <SelectItem value="GMT-06:00 America/Chicago (CST)">
                      GMT-06:00 America/Chicago (CST)
                    </SelectItem>
                    <SelectItem value="GMT-07:00 America/Denver (MST)">
                      GMT-07:00 America/Denver (MST)
                    </SelectItem>
                    <SelectItem value="GMT-08:00 America/Los_Angeles (PST)">
                      GMT-08:00 America/Los_Angeles (PST)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="platformLanguage">Platform Language</Label>
                <Select
                  value={address_info?.platformLanguage}
                  onValueChange={value =>
                    handleSelectChange('platformLanguage', value)
                  } // Use the new helper function
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="English (United States)">
                      English (United States)
                    </SelectItem>
                    <SelectItem value="French (Canada)">
                      French (Canada)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="ownerEmail">Business Email</Label>
              <Input
                id="ownerEmail"
                name="ownerEmail"
                type="email"
                placeholder="Enter owner email"
                value={formData?.ownerEmail}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <Label htmlFor="openingHours">Opening Hours</Label>
              <Button
                type="button"
                onClick={() => setIsBusinessHoursModalOpen(true)}
                className="w-full bg-teal-600"
              >
                Set Business Hours
              </Button>
            </div>
            <div>
              <Label htmlFor="status">Online Ordering</Label>
              <select
                id="status"
                name="status"
                value={formData?.status}
                onChange={handleInputChange}
                className="mt-1 block w-full"
              >
                <option value="open">Open</option>
                <option value="closed">Closed</option>
              </select>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Services Offered</h3>
              <div className="space-y-2">
                {['pickUp', 'delivery', 'dineIn'].map(service => (
                  <div className="flex items-center space-x-2" key={service}>
                    <Switch
                      id={service}
                      checked={formData?.servicesOffered[service]}
                      onChange={handleServiceChange}
                    />
                    <Label htmlFor={service}>
                      {service?.charAt(0).toUpperCase() + service?.slice(1)}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            <h3 className="font-semibold mb-2">Purple Graph Details</h3>
            <Card className="w-[600px]">
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <Label htmlFor="location_id">Location ID</Label>
                    <Input
                      id="location_id"
                      name="location_id"
                      type="text"
                      placeholder="Enter Location ID"
                      onChange={handleInputChange}
                      value={formData?.location_id}
                    />
                    {errors.location_id && (
                      <div className="text-red-500">{errors.location_id}</div>
                    )}{' '}
                    {/* Display validation error */}
                  </div>
                  <div>
                    <Label htmlFor="list_token_id">List Token ID</Label>
                    <Input
                      id="list_token_id"
                      name="list_token_id"
                      type="text"
                      placeholder="Enter List Token"
                      onChange={handleInputChange}
                      value={formData?.list_token_id}
                    />
                    {errors.list_token_id && (
                      <div className="text-red-500">{errors.list_token_id}</div>
                    )}{' '}
                    {/* Display validation error */}
                  </div>
                  <div>
                    <Label htmlFor="total_orders_id">Total Orders ID</Label>
                    <Input
                      id="total_orders_id"
                      name="total_orders_id"
                      type="text"
                      placeholder="Enter Total Orders ID"
                      onChange={handleInputChange}
                      value={formData?.total_orders_id}
                    />
                    {errors.total_orders_id && (
                      <div className="text-red-500">
                        {errors.total_orders_id}
                      </div>
                    )}{' '}
                    {/* Display validation error */}
                  </div>
                  <div>
                    <Label htmlFor="total_revenue_id">Total Revenue ID</Label>
                    <Input
                      id="total_revenue_id"
                      name="total_revenue_id"
                      type="text"
                      placeholder="Enter Total Revenue ID"
                      onChange={handleInputChange}
                      value={formData?.total_revenue_id}
                    />
                    {errors.total_revenue_id && (
                      <div className="text-red-500">
                        {errors.total_revenue_id}
                      </div>
                    )}{' '}
                    {/* Display validation error */}
                  </div>
                  <div>
                    <Label htmlFor="average_order_value_id">
                      Average Order value ID
                    </Label>
                    <Input
                      id="average_order_value_id"
                      name="average_order_value_id"
                      type="text"
                      placeholder="Enter Average Order value ID"
                      onChange={handleInputChange}
                      value={formData?.average_order_value_id}
                    />
                    {errors.average_order_value_id && (
                      <div className="text-red-500">
                        {errors.average_order_value_id}
                      </div>
                    )}{' '}
                    {/* Display validation error */}
                  </div>
                  <div>
                    <Label htmlFor="last_order_date_id">
                      Last Order Date ID
                    </Label>
                    <Input
                      id="last_order_date_id"
                      name="last_order_date_id"
                      type="text"
                      placeholder="Enter Last Order Date ID"
                      onChange={handleInputChange}
                      value={formData?.last_order_date_id}
                    />
                    {errors.last_order_date_id && (
                      <div className="text-red-500">
                        {errors.last_order_date_id}
                      </div>
                    )}{' '}
                    {/* Display validation error */}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        <Button type="submit" className="w-full bg-teal-600">
          Save Changes
        </Button>
      </form>
      <BusinessHoursModal
        isOpen={isBusinessHoursModalOpen}
        onClose={() => setIsBusinessHoursModalOpen(false)}
        onSave={handleBusinessHoursChange}
        initialSchedule={
          formData?.openingHours ? JSON.parse(formData?.openingHours) : null
        }
      />
    </div>
  )
}
// Export the main component wrapped in a Suspense boundary
export default function WrappedEditRestaurant() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <EditRestaurant />
    </Suspense>
  )
}

// Business Hours Modal
function BusinessHoursModal({ isOpen, onClose, onSave, initialSchedule }) {
  //console.log("Business Hours Time  : " + JSON.stringify(initialSchedule));

  // const defaultSchedule = {
  //     monday: { isOpen: false, timeSlots: [{ start: "9:00 AM", end: "12:00 AM" }] },
  //     tuesday: { isOpen: false, timeSlots: [{ start: "12:00 AM", end: "12:00 AM" }] },
  //     wednesday: { isOpen: false, timeSlots: [{ start: "12:00 AM", end: "12:00 AM" }] },
  //     thursday: { isOpen: false, timeSlots: [{ start: "12:00 AM", end: "12:00 AM" }] },
  //     friday: { isOpen: false, timeSlots: [{ start: "12:00 AM", end: "12:00 AM" }] },
  //     saturday: { isOpen: false, timeSlots: [{ start: "12:00 AM", end: "12:00 AM" }] },
  //     sunday: { isOpen: false, timeSlots: [{ start: "12:00 AM", end: "12:00 AM" }] },
  // };
  const defaultSchedule = useMemo(
    () => ({
      monday: {
        isOpen: false,
        timeSlots: [{ start: '9:00 AM', end: '12:00 AM' }],
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
    }),
    []
  )

  const [schedule, setSchedule] = useState(defaultSchedule)

  useEffect(() => {
    if (initialSchedule && typeof initialSchedule === 'object') {
      setSchedule(initialSchedule)
    } else {
      setSchedule(defaultSchedule)
    }
  }, [initialSchedule, defaultSchedule])

  const days = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday',
  ]
  const [selectedDays, setSelectedDays] = useState([0, 1, 2, 3, 4, 5, 6]) // Monday to Friday

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
                    className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-medium transition-colors ${
                      selectedDays.includes(index)
                        ? 'bg-teal-600 text-white'
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
                    {day.charAt(0)}
                  </button>
                ))}
              </div>
              <button className="p-2 hover:bg-teal-200 rounded-full">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {schedule &&
              Object.entries(schedule).map(([day, { isOpen, timeSlots }]) => (
                <div key={day} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`toggle-${day}`}
                        checked={isOpen}
                        onChange={() => toggleDay(day)}
                        className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                      />
                      <Label htmlFor={`toggle-${day}`} className="capitalize">
                        {day.charAt(0).toUpperCase() + day.slice(1)}
                      </Label>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToAll(day)}
                      className="text-teal-600 hover:text-teal-700"
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
                      className="text-blue-600 hover:text-teal-700 text-sm font-medium mt-2 flex items-center"
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
          <Button
            type="button"
            className="selected-button"
            onClick={handleSave}
          >
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
