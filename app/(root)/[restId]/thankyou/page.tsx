// @ts-nocheck

'use client'
import React, { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { Separator } from '~/components/ui/separator'
import { CheckCircle2Icon, ClockIcon, PhoneIcon, Mail } from 'lucide-react'
import Header from '../_components/header'
import Footer from '../_components/footer'
import Loading from '../_components/Loading'
import { MoveLeft } from 'lucide-react'
import axios from 'axios'
import { useRestaurant } from '~/hooks/use-restaurant'

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL

export default function ThankYouPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [oid, setOid] = useState(null)
  const restaurant = useRestaurant(state => state.restaurant)
  const [orderDetails, setOrderDetails] = useState(null)
  const [loading, setLoading] = useState(true)
  const [modifierDetails, setModifierDetails] = useState({})
  const pickupInfo = useRestaurant(state => state.pickupInfo)
  useEffect(() => {
    const orderId = searchParams.get('oid')
    if (orderId) {
      setOid(orderId)
    }
  }, [searchParams])

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        let rs_id = ''
        if (!restaurant?.data?._id) {
          let res_id = JSON.parse(localStorage.getItem('restaurant'))
          rs_id = res_id.data._id
        } else {
          rs_id = restaurant?.data?._id
        }
        const response = await fetch(
          `${baseUrl}/orders/getordersordernumber/${oid}?rs_id=${rs_id}`
        )
        if (!response.ok) {
          throw new Error('Failed to fetch order details')
        }
        const data = await response.json()
        setOrderDetails(data.data)
      } catch (error) {
        console.error('Error fetching order details:', error)
      } finally {
        setLoading(false)
      }
    }

    if (oid) {
      fetchOrderDetails()
    }
  }, [oid, restaurant])

  const fetchModifierDetails = async modifierIds => {
    const requests = modifierIds.map(async id => {
      const response = await axios.get(
        `${baseUrl}/modifers/getmodifierscartpage/${id}`
      )
      return response.data // Returning the full response object
    })
    return Promise.all(requests)
  }

  useEffect(() => {
    const loadModifiers = async () => {
      if (orderDetails) {
        const allModifierIds = orderDetails.items.flatMap(item =>
          item.modifiers.map(modifier => modifier._id)
        )

        try {
          const details = await fetchModifierDetails([
            ...new Set(allModifierIds),
          ])

          const detailsMap = details.reduce((acc, detail) => {
            if (detail && detail.success && detail.data) {
              detail.data.forEach(modifier => {
                const groupName = modifier.modifiersgroup.web.name

                if (!acc[groupName]) {
                  acc[groupName] = {
                    name: groupName,
                    modifiers: [],
                  }
                }

                acc[groupName].modifiers.push({
                  id: modifier._id,
                  name: modifier.name,
                  priceAdjustment: modifier.priceAdjustment,
                })
              })
            }
            return acc
          }, {})

          setModifierDetails(detailsMap)
        } catch (error) {
          console.error('Failed to fetch modifiers:', error)
        }
      }
    }

    loadModifiers()
  }, [orderDetails])

  // Helper function to add minutes to a given time string
  const addMinutesToTime = (timeString, minutesToAdd) => {
    const [time, modifier] = timeString.split(' ')
    const [hour, minute] = time.split(':').map(Number)

    // Determine whether it's AM or PM based on the current time modifier
    let date = new Date()
    date.setHours(modifier === 'PM' ? hour + 12 : hour, minute, 0, 0)

    // Add minutes to the time
    date.setMinutes(date.getMinutes() + minutesToAdd)

    // Format the time in 12-hour format with AM/PM
    const hours = date.getHours() % 12 || 12 // Convert 24-hour to 12-hour format, 0 becomes 12
    const minutes = date.getMinutes().toString().padStart(2, '0')
    const ampm = date.getHours() >= 12 ? 'PM' : 'AM' // Determine AM or PM

    return `${hours}:${minutes} ${ampm}`
  }
  if (loading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-between p-2">
        <Loading />
      </main>
    )
  }

  if (!orderDetails) {
    return <div>Order not found.</div>
  }
  const pickupInfo_local = JSON.parse(localStorage.getItem('pickupInfo'))
  const restaurant_local = JSON.parse(localStorage.getItem('restaurant'))

  let res_url = restaurant?.data?.url_slug
  if (!restaurant?.data?.url_slug) {
    res_url = restaurant_local?.data?.url_slug
  }
  //restaurant_local.data.averageOrderPrepTime
  const estimatedPickupTime =
    pickupInfo_local && restaurant_local.data.averageOrderPrepTime
      ? addMinutesToTime(pickupInfo_local.selectedTime, 0)
      : 'N/A'

  const handleRedirect = () => {
    router.push(`/`)
  }

  return (
    <>
      <Suspense fallback={<Loading />}>
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <Button
              onClick={() => router.push('/' + res_url)}
              className="mb-4 selected-button"
            >
              <MoveLeft className=" gap-8" /> Back to Menu
            </Button>
            <Card>
              <CardHeader className="text-center">
                <CheckCircle2Icon className="w-16 h-16 mx-auto text-green-500 mb-4" />
                <CardTitle className="text-3xl font-bold">
                  Thank You for Your Order!
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="text-center">
                    <p className="text-lg">
                      Your order has been successfully placed.
                    </p>
                    <p className="text-lg font-semibold">
                      Order Number: {orderDetails.orderNumber}
                    </p>
                  </div>
                  <Separator />
                  <div>
                    <h3 className="font-semibold text-lg mb-2">
                      Order Details
                    </h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Order Date:</span>
                        <span>
                          {new Date(orderDetails.date).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Pick up time:</span>
                        <span className="flex items-center">
                          <ClockIcon className="w-4 h-4 mr-1" />
                          {estimatedPickupTime
                            ? `${estimatedPickupTime}`
                            : '30-45 minutes'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Separator />
                  <div>
                    <h3 className="font-semibold text-lg mb-2">
                      Order Summary
                    </h3>
                    <div className="space-y-2">
                      {orderDetails.items.map((item, index) => (
                        <div key={index} className="justify-between">
                          <span>
                            {item.quantity}x {item.item.name}
                          </span>
                          {/* <span>${(item.quantity * item.price).toFixed(2)}</span> */}
                          <p>{item.itemNote ? `Note: ${item.itemNote}` : ''}</p>
                          {item.modifiers && item.modifiers.length > 0 && (
                            <div className="text-gray-500 text-sm mt-1">
                              {Object.entries(modifierDetails).map(
                                ([groupName, group]) => {
                                  const itemModifiers = item.modifiers.filter(
                                    mod =>
                                      group.modifiers.some(
                                        groupMod => groupMod.id === mod._id
                                      )
                                  )

                                  if (itemModifiers.length > 0) {
                                    return (
                                      <div key={groupName}>
                                        <strong>{group.name}:</strong>
                                        <div className="ml-4">
                                          {itemModifiers.map(modifier => {
                                            const detail = group.modifiers.find(
                                              groupMod =>
                                                groupMod.id === modifier._id
                                            )
                                            return (
                                              <div key={modifier._id}>
                                                {detail.name} (+$
                                                {detail.priceAdjustment.toFixed(
                                                  2
                                                )}
                                                )
                                              </div>
                                            )
                                          })}
                                        </div>
                                      </div>
                                    )
                                  }
                                  return null
                                }
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                      <p>Payment Method: {orderDetails.paymentMethod}</p>
                      <p>
                        Special Instructions:{' '}
                        {orderDetails?.specialInstructions}
                      </p>
                      <Separator />
                      <div className="flex justify-between">
                        <span>Subtotal</span>
                        <span>${orderDetails?.subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tax</span>
                        <span>
                          $
                          {orderDetails.tax
                            ? orderDetails.tax.toFixed(2)
                            : '0.00'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tip</span>
                        <span>
                          $
                          {orderDetails.tip
                            ? orderDetails.tip.toFixed(2)
                            : '0.00'}
                        </span>
                      </div>
                      <div className="flex justify-between font-bold">
                        <span>Total</span>
                        <span>${orderDetails.total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col space-y-4">
                {/* <Button className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded" onClick={handleRedirect}>
                  Track Your Order
                </Button> */}
                <div className="text-center">
                  <p>Need help? Contact restaurant</p>
                  <a
                    href={`tel:+${
                      restaurant_local &&
                      restaurant_local.data &&
                      restaurant_local.data.businessPhone
                        ? restaurant_local.data.businessPhone
                        : ''
                    }`}
                    className="flex items-center justify-center text-primary hover:underline mt-1"
                  >
                    <PhoneIcon className="w-4 h-4 mr-1" />
                    {restaurant_local &&
                    restaurant_local.data &&
                    restaurant_local.data.businessPhone
                      ? `${restaurant_local.data.businessPhone}`
                      : ''}
                  </a>
                  <a
                    href={`mailto:+${
                      restaurant_local &&
                      restaurant_local.data &&
                      restaurant_local.data.ownerEmail
                        ? restaurant_local.data.ownerEmail
                        : ''
                    }`}
                    className="flex items-center justify-center text-primary hover:underline mt-1"
                  >
                    <Mail className="w-4 h-4 mr-1" />
                    {restaurant_local &&
                    restaurant_local.data &&
                    restaurant_local.data.ownerEmail
                      ? `${restaurant_local.data.ownerEmail}`
                      : ''}
                  </a>
                </div>
              </CardFooter>
            </Card>
          </div>
        </div>
        <Footer />
      </Suspense>
    </>
  )
}
