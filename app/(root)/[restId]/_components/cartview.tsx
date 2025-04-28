// @ts-nocheck
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '~/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '~/components/ui/sheet'
import { Separator } from '~/components/ui/separator'
import { PlusIcon, MinusIcon, XIcon, Edit2Icon } from 'lucide-react'
import ZizZapPickupTime from './pickuptimeModal'
import axios from 'axios'
import Loading from './Loading'
import { useRestaurant } from '~/hooks/use-restaurant'
const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL

export default function CartView({ isOpen, onClose }) {
  const {
    restaurant,
    pickupInfo,
    cart,
    removeFromCart,
    updatePickupInfo,
    updateCartQuantity,
  } = useRestaurant()
  const router = useRouter()
  const [animatedItemId, setAnimatedItemId] = useState(null)
  const [modifierDetails, setModifierDetails] = useState({})
  const [isEditOrderOpen, setIsEditOrderOpen] = useState(false)
  const [productsWithTax, setProductsWithTax] = useState([])
  //const subtotal = cart.reduce((sum, item) => sum + singleunitprice?.webPrice * item.quantity, 0);

  console.log('Modifier Details', modifierDetails)

  // const subtotal = cart.reduce((sum, item) => {
  //   const product = productsWithTax.find(product => product.id === item.id); // Find the product matching item.id
  //   if (product) {
  //     return sum + product.webPrice * item.quantity; // Add the price * quantity if product is found
  //   }
  //   return sum; // Return the sum unchanged if no matching product is found
  // }, 0);

  const subtotal = cart.reduce((sum, item) => {
    const product = productsWithTax.find(product => product.id === item.id) // Find the product matching item.id
    if (product) {
      // Calculate base price * quantity
      let productTotal = product.webPrice * item.quantity

      // Add modifier price adjustments
      if (item.modifiers && Object.keys(item.modifiers).length > 0) {
        Object.entries(item.modifiers).forEach(([key, ids]) => {
          ids.forEach(id => {
            const modifier = modifierDetails[id]
            if (modifier) {
              productTotal += modifier.priceAdjustment * item.quantity // Add modifier priceAdjustment
            }
          })
        })
      }

      sum += productTotal // Add the product total including modifiers
    }
    return sum
  }, 0)

  const [loading, setLoading] = useState(false)
  const selectedTime = pickupInfo?.selectedTime

  useEffect(() => {
    const loadModifiers = async () => {
      const allModifierIds = cart.flatMap(item =>
        Object.values(item.modifiers).flat()
      )
      try {
        const details = await fetchModifierDetails([...new Set(allModifierIds)])
        const detailsMap = details.reduce((acc, detail) => {
          detail.data.forEach(modifier => {
            acc[modifier._id] = {
              name: modifier.name,
              priceAdjustment: modifier.priceAdjustment,
            }
          })
          return acc
        }, {})
        setModifierDetails(detailsMap)
      } catch (error) {
        console.error('Failed to fetch modifiers:', error)
      }
    }

    const fetchProductDetails = async () => {
      const productIds = cart.map(item => item.id) // Extract product IDs from the cart
      try {
        // Fetch details for all products in the cart
        const productDetails = await Promise.all(
          productIds.map(id =>
            axios.get(`${baseUrl}/product/getproducts/${id}`)
          ) // Fetch each product separately
        )

        // Now, for each product, you will map its tax data
        const productTaxData = productDetails.map(response => {
          const product = response.data.data // Get product details from API response
          return {
            id: product._id, // Assuming the product has an _id field
            taxEnabled: product.taxEnable ?? false, // Default to false if taxEnable is not available
            taxRate: product.taxRule, // Default to 0 if amount is not available
            webPrice: product.webprice || 0, // Assuming each product has a web price (adjust as necessary)
          }
        })

        // Set all product tax data
        setProductsWithTax(productTaxData)
      } catch (error) {
        console.error('Error fetching product details:', error)
      }
    }
    loadModifiers()
    fetchProductDetails()
  }, [cart])

  // Calculation Tax
  // const estimatedTax = cart.reduce((sum, item) => {
  //   // Find product with matching ID in productsWithTax
  //   const productWithTax = productsWithTax.find(product => product.id === item.id);
  //   if (productWithTax) {
  //     // Ensure tax is enabled for the product
  //     if (productWithTax.taxEnabled) {
  //       const basePrice = productWithTax.webPrice;  // Correct price field
  //       const quantity = item.quantity;
  //       let productTotal = basePrice * quantity;  // Calculate total for the item
  //      // Check if the product has a tax rate and it's percentage based
  //       if (productWithTax.taxRate && productWithTax.taxRate.tax_type === "percentage") {
  //         const taxRate = productWithTax.taxRate.amount;  // 13 is the tax rate in percentage

  //         // Apply tax calculation (percentage tax rate)
  //         const taxAmount = productTotal * (taxRate / 100);  // Multiply by percentage tax rate

  //         // Add the calculated tax to the total sum
  //         sum += taxAmount;
  //       }else{
  //         sum += productWithTax.taxRate.amount;
  //       }
  //     }
  //   }
  //   return sum;
  // }, 0);
  const estimatedTax = cart.reduce((sum, item) => {
    const productWithTax = productsWithTax.find(
      product => product.id === item.id
    )
    if (productWithTax) {
      if (productWithTax.taxEnabled) {
        let productTotal = productWithTax.webPrice * item.quantity

        // Apply price adjustments from modifiers
        if (item.modifiers && Object.keys(item.modifiers).length > 0) {
          Object.entries(item.modifiers).forEach(([key, ids]) => {
            ids.forEach(id => {
              const modifier = modifierDetails[id]
              if (modifier) {
                productTotal += modifier.priceAdjustment * item.quantity
              }
            })
          })
        }

        // Now calculate tax based on the total price (including modifier adjustments)
        if (
          productWithTax.taxRate &&
          productWithTax.taxRate.tax_type === 'percentage'
        ) {
          const taxAmount = productTotal * (productWithTax.taxRate.amount / 100)
          sum += taxAmount
        } else {
          sum += productWithTax?.taxRate?.amount // Flat tax rate (if applicable)
        }
      }
    }
    return sum
  }, 0)
  // Log the final result for Estimated Tax
  //const estimatedTax = subtotal * 0.13;
  const total = parseFloat(subtotal) + parseFloat(estimatedTax.toFixed(2))
  const fetchModifierDetails = async modifierIds => {
    const requests = modifierIds.map(async id => {
      const response = await axios.get(
        `${baseUrl}/modifers/getmodifierscartpage/${id}`
      )
      return response.data
    })
    return Promise.all(requests)
  }

  //console.log("Restorent data",restaurant.data.minimumOrderValue);
  // Generate a unique key for each cart item based on product id and its modifiers
  const generateUniqueKey = (productId, modifiers) => {
    const modifierString = Object.entries(modifiers)
      .sort()
      .map(([key, values]) => {
        return `${key}:${values.sort().join(',')}`
      })
      .join('|')
    return `${productId}_${modifierString}`
  }

  const updateQuantity = (id, change) => {
    // Find the unique item based on the uniqueKey
    const item = cart.find(item => item.uniqueKey === id)
    if (item) {
      const updatedQuantity = item.quantity + change
      // Ensure quantity doesn't go below 1
      if (updatedQuantity > 0) {
        updateCartQuantity(id, updatedQuantity) // Update cart quantity
        setAnimatedItemId(id) // Optionally add animation for the updated item
      }
    }
  }
  const formatPickupInfo = () => {
    // Check if restaurant and its data are available
    if (!restaurant || !restaurant.data) {
      return 'Loading...' // or any placeholder message you prefer
    }

    const currentDay = new Intl.DateTimeFormat('en-US', { weekday: 'long' })
      .format(new Date())
      .toLowerCase()
    const todayHours = restaurant.data.openingHours
      ? JSON.parse(restaurant.data.openingHours)[currentDay]
      : null

    if (todayHours && todayHours.isOpen) {
      const timeSlots = todayHours.timeSlots
      if (timeSlots.length > 0) {
        const [slot] = timeSlots // Assuming a single time slot for simplicity
        return `${slot.start} - ${slot.end}`
      }
    }
    return 'Closed'
  }
  const handleUpdateOrder = orderDetails => {
    updatePickupInfo(orderDetails)
    setIsEditOrderOpen(false)
  }
  const handleCheckout = () => {
    // Set loading state to true when checkout is triggered
    setLoading(true)

    // Navigate to the checkout page
    router.push(`/${restaurant.data.url_slug}/checkout`)
  }
  // Check if cartTotal is eligible for checkout based on minimumOrderValue
  const isEligibleForCheckout =
    restaurant && restaurant.data && total >= restaurant.data.minimumOrderValue
  return (
    <>
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent
          side="right"
          className="w-full max-w-[700px] sm:max-w-[500px] md:max-w-[500px] h-screen flex flex-col"
        >
          {/* Header */}
          <SheetHeader className="flex justify-between items-center p-4">
            <SheetTitle>Your Order</SheetTitle>
            {loading && <Loading />}
            <span className="text-sm font-medium">{formatPickupInfo()}</span>

            <span
              className={`text-sm font-medium ${!isOpen ? 'text-red-500' : ''}`}
            >
              {selectedTime ? `Pick Up Time: ${selectedTime}` : ''}
            </span>

            {!selectedTime ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditOrderOpen(true)}
              >
                <Edit2Icon className="h-4 w-4 mr-1" />
                Please select a time
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditOrderOpen(true)}
              >
                <Edit2Icon className="h-4 w-4 mr-1" />
              </Button>
            )}
            {/* Pickup Info Modal */}
            {isEditOrderOpen && (
              <ZizZapPickupTime
                onClose={() => setIsEditOrderOpen(false)}
                onUpdate={handleUpdateOrder}
              />
            )}
          </SheetHeader>

          {/* Order Items - Scrollable */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {cart.map(item => {
              const uniqueKey = generateUniqueKey(item.id, item.modifiers)
              const singleunitprice = productsWithTax.find(
                product => product.id === item.id
              )
              return (
                <div
                  key={uniqueKey}
                  className={`flex justify-between items-center p-2 rounded-lg transition-all duration-300 ${
                    animatedItemId === uniqueKey ? 'bg-green-100' : ''
                  }`}
                >
                  <div className="flex-1">
                    <div className="font-medium">{item.name}</div>
                    <div>${singleunitprice?.webPrice}</div>
                    {item.note && (
                      <p className="text-sm text-gray-600">
                        <strong>Note:</strong> {item.note}
                      </p>
                    )}

                    {item.modifiers &&
                      Object.keys(item.modifiers).length > 0 && (
                        <div className="text-gray-500 text-sm mt-1">
                          {Object.entries(item.modifiers).map(([key, ids]) => (
                            <div key={key} className="mb-1">
                              <strong>{key}:</strong>
                              <div className="ml-4">
                                {ids.map(id => {
                                  const modifier = modifierDetails[id]
                                  return (
                                    <div key={id}>
                                      {modifier
                                        ? `${modifier.name} (+$${modifier.priceAdjustment})`
                                        : id}
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateQuantity(uniqueKey, -1)}
                    >
                      <MinusIcon className="h-4 w-4" />
                    </Button>
                    <span className="w-8 text-center font-medium">
                      {item.quantity}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateQuantity(uniqueKey, 1)}
                    >
                      <PlusIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFromCart(uniqueKey)}
                    >
                      <XIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
          {/* Subtotal & Checkout */}
          <div className="p-4 bg-white sticky bottom-0 w-full shadow-md">
            <Separator className="my-2" />
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Estimated Tax</span>
              <span>${estimatedTax.toFixed(2)}</span>
            </div>
            <Separator className="my-2" />

            {!isEligibleForCheckout && (
              <div className="text-red-500 text-sm mb-2">
                Minimum order value is ${restaurant?.data?.minimumOrderValue}.
                Please add more items to proceed.
              </div>
            )}

            <Button
              className="selected-button h-[60px] w-full py-3 text-lg bg-teal-600 text-white"
              onClick={handleCheckout}
              disabled={!isEligibleForCheckout}
            >
              Checkout ${total.toFixed(2)}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
