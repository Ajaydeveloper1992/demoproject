// @ts-nocheck
import { useState, useRef, useEffect, useCallback } from 'react'
import { Button } from '~/components/ui/button'
import {
  ChevronRightIcon,
  ChevronLeftIcon,
  MoreHorizontalIcon,
  CalendarClock,
  Clock,
  XCircle,
  Edit2Icon,
} from 'lucide-react'
import Image from 'next/image'
import axios from 'axios'
import BottomMenu from './bottomMenu'
import { CategoryProvider } from './CategoryContext'
import Link from 'next/link'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import { useCategory } from './CategoryContext'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table'
import { Card } from '~/components/ui/card'
import { useRouter, useSearchParams } from 'next/navigation'
import ZizZapPickupTime from './pickuptimeModal'
import { useRestaurant } from '~/hooks/use-restaurant'
const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL

export default function HorizontalScrollingMenu({ categoryRefs }) {
  const restaurant = useRestaurant(state => state.restaurant)
  const { activeCategory, setActiveCategory } = useCategory()
  const [menuCategories, setMenuCategories] = useState([])
  const [isSticky, setIsSticky] = useState(false)
  const scrollContainerRef = useRef(null)
  const [showLeftArrow, setShowLeftArrow] = useState(false)
  const [showRightArrow, setShowRightArrow] = useState(true)
  const [istimehoverOpen, setTimehoverOpen] = useState(false)
  const [openingHours, setOpeningHours] = useState({})
  const [isEditOrderOpen, setIsEditOrderOpen] = useState(false)
  const pickupInfo = useRestaurant(state => state.pickupInfo)
  const updatePickupInfo = useRestaurant(state => state.updatePickupInfo)
  const cart = useRestaurant(state => state.cart)
  const updateCartQuantity = useRestaurant(state => state.updateCartQuantity)
  const removeFromCart = useRestaurant(state => state.removeFromCart)
  const router = useRouter()
  const [animatedItemId, setAnimatedItemId] = useState(null)
  const [modifierDetails, setModifierDetails] = useState({})
  const [productsWithTax, setProductsWithTax] = useState([])

  const selectedTime = pickupInfo?.selectedTime
  const handleUpdateOrder = orderDetails => {
    updatePickupInfo(orderDetails)
    setIsEditOrderOpen(false)
  }
  const searchParams = useSearchParams()
  const oid = searchParams.get('oid')
  const formatPickupInfo = () => {
    // Check if restaurant and its data are available
    if (!restaurant || !restaurant.data) {
      return { message: 'Loading...', isOpen: null } // 'Loading...' or placeholder message
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
        return { message: `${slot.start} - ${slot.end}`, isOpen: true }
      }
    }
    return { message: 'Closed', isOpen: false } // Return 'Closed' if the restaurant is not open
  }
  // Fetch categories function
  const fetchCategories = useCallback(async () => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/categories/getCategoriesBySelectedRestaurants/${restaurant.data._id}`
      )
      const data = response.data
      if (data.success) {
        // Filter menuCategories to include only those with showOnWeb: true
        const visibleProducts = data.data.filter(
          menuCategories => menuCategories.showOnWeb
        )
        visibleProducts.sort((a, b) => a.sortOrder - b.sortOrder)
        setMenuCategories(visibleProducts)
      } else {
        console.error(data.message)
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }, [restaurant.data._id])

  // Fetch categories on component mount
  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  // Scroll handling
  const handleScroll = direction => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -200 : 200
      scrollContainerRef.current.scrollBy({
        left: scrollAmount,
        behavior: 'smooth',
      })
    }
  }

  // Update arrow visibility on scroll
  const updateArrows = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } =
        scrollContainerRef.current
      setShowLeftArrow(scrollLeft > 0)
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth)
    }
  }

  // Scroll event listener
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', updateArrows)
      updateArrows()
    }
    return () => {
      if (scrollContainer) {
        scrollContainer.removeEventListener('scroll', updateArrows)
      }
    }
  }, [])

  // Handle category click
  const handleCategoryClick = category => {
    setActiveCategory(category)
    const categoryRef = categoryRefs.current[category]
    if (categoryRef) {
      categoryRef.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  // Sticky header effect
  useEffect(() => {
    const handleScrollEvent = () => {
      setIsSticky(window.scrollY > 50)
    }

    window.addEventListener('scroll', handleScrollEvent)
    return () => {
      window.removeEventListener('scroll', handleScrollEvent)
    }
  }, [])

  // Update opening hours from restaurant data
  useEffect(() => {
    if (restaurant.data.openingHours) {
      setOpeningHours(JSON.parse(restaurant.data.openingHours))
    }
  }, [restaurant.data.openingHours])

  // Get the current day of the week
  const currentDay = new Intl.DateTimeFormat('en-US', { weekday: 'long' })
    .format(new Date())
    .toLowerCase()
  // console.log("Data Menu Categories",menuCategories);
  let address = JSON.parse(restaurant.data.address)
  ;/ sub total /
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
  console.log('Total Cart Item s', total)
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
  const handleCheckout = () => {
    // Set loading state to true when checkout is triggered
    setLoading(true)
    // Navigate to the checkout page
    router.push(`/${restaurant.data.url_slug}/checkout`)
  }

  const isEligibleForCheckout =
    restaurant && restaurant.data && total >= restaurant.data.minimumOrderValue

  return (
    <div className="container mx-auto px-4 py-0 zipzap_category_list frontu2">
      <div className="px-4 py-0 mx-auto mt-5 frontu3">
        {restaurant.data.bannerImage && (
          <div className="relative w-full h-[200px] sm:h-[250px] md:h-[300px] lg:h-[350px] mb-8 resbanner">
            <Image
              src={`${
                process.env.NEXT_PUBLIC_IMAGE_BASE_URL
              }/${restaurant.data.bannerImage.replace(/\\/g, '/')}`}
              alt={`${restaurant.data.name} hero image`}
              fill
              className="object-cover rounded-lg"
              priority
            />
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 text-center text-sm infos2">
          {restaurant.data.businessLogo && (
            <div className="relative w-full h-[80px] sm:h-[100px] mb-4 reslogo">
              <Image
                src={`${
                  process.env.NEXT_PUBLIC_IMAGE_BASE_URL
                }/${restaurant.data.businessLogo.replace(/\\/g, '/')}`}
                alt={`${restaurant.data.name} logo`}
                fill
                className="object-cover rounded-lg"
                priority
              />
            </div>
          )}
          {address.streetAddress && (
            <div className="space-y-1">
              <p className="text-muted-foreground">Address</p>
              <p className="font-medium">{address.streetAddress}</p>
            </div>
          )}
          {restaurant?.data?.businessPhone && restaurant?.data?.ownerEmail && (
            <div className="space-y-1">
              <p className="text-muted-foreground">Email & Phone</p>
              <p className="font-medium">{restaurant?.data?.ownerEmail}</p>
              <p className="font-medium">{restaurant?.data?.businessPhone}</p>
            </div>
          )}

          <div className="space-y-1">
            <p className="text-muted-foreground">Pickup</p>
            <p className="font-medium">
              {!oid && ( // Only show if it's not the Thank You page
                <div className="">
                  <div className="flex-1 flex justify-center jusleft">
                    {(() => {
                      const { message, isOpen } = formatPickupInfo() // Get message and isOpen status
                      return (
                        <>
                          <span
                            className={`text-sm font-medium mr-0 ${
                              isOpen === false ? 'text-red-500' : ''
                            }`}
                          >
                            {/* Conditionally render the selected time or the "Please select a time" message */}
                            {
                              selectedTime
                                ? `Pick Up Time: ${selectedTime}` // Display the selected time
                                : message // Show the default message if no time is selected
                            }
                          </span>
                          {/* Show the "Please select a time" button only if no time has been selected */}
                          {/* {!selectedTime ? (
                        <Button variant="ghost" size="sm" onClick={() => setIsEditOrderOpen(true)}>
                          <Edit2Icon className="h-4 w-4 mr-1" />
                          Please select a time
                        </Button>
                      ) : (
                        <Button variant="ghost" size="sm" onClick={() => setIsEditOrderOpen(true)}>
                          <Edit2Icon className="h-4 w-4 mr-1" />
                        </Button>
                      )} */}
                        </>
                      )
                    })()}
                  </div>
                </div>
              )}
            </p>
          </div>

          {/* Pickup Time */}
          {!oid && (
            <div className="bg-[#fff] py-1 px-4 flex items-center justify-between w-full sm:w-auto border rounded-lg text-sm mobtime">
              <div className="flex-1 flex items-center">
                {(() => {
                  const { message, isOpen } = formatPickupInfo()
                  return (
                    <>
                      <span
                        className={`font-medium mr-2 ${
                          isOpen === false ? 'text-red-500' : ''
                        }`}
                      >
                        {selectedTime
                          ? `Pick Up Time: ${selectedTime}`
                          : message}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsEditOrderOpen(true)}
                      >
                        <Edit2Icon className="h-4 w-4 mr-1" />
                        {!selectedTime && 'Please select a time'}
                      </Button>
                    </>
                  )
                })()}
              </div>
            </div>
          )}
        </div>
        {/* Pickup Info Modal */}
        {isEditOrderOpen && (
          <ZizZapPickupTime
            onClose={() => setIsEditOrderOpen(false)}
            onUpdate={handleUpdateOrder}
          />
        )}

        <div className="space-y-6 mt-5 info3s">
          <Card className="bg-primary/5 p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              {restaurant?.data?.businessDescription && (
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">Note</h3>
                  <p className="text-muted-foreground">
                    {restaurant?.data?.businessDescription}
                  </p>
                </div>
              )}
              <Button
                onClick={() => setTimehoverOpen(true)}
                className="bg-[#008080] text-white text-base sm:text-lg h-[50px] sm:h-[60px] px-6 sm:px-10 min-w-[220px] self-start sm:self-center"
              >
                Store Information <CalendarClock />
              </Button>
            </div>
          </Card>
        </div>
      </div>
      {/**
       * Menu Option
       */}
      {/* <div className={`transition-transform duration-300 ease-in-out ${isSticky ? 'fixed top-12 left-0 right-0 z-50 bg-white shadow-md ' : 'relative mt-5'}`}> */}
      <div
        className={`transition-transform duration-300 ease-in-out ${
          isSticky
            ? 'fixed top-12 left-0 right-0 z-40 bg-white shadow-md sm:top-9rem md:top-16 lg:top-20 custom-top'
            : 'relative mt-5'
        }`}
      >
        <div className="container mx-auto px-4">
          <h3 className="text-xl font-bold mb-0">Our Menu</h3>
          <div className="relative  mobhum">
            {showLeftArrow && (
              <Button
                variant="outline"
                size="icon"
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10"
                onClick={() => handleScroll('left')}
              >
                <ChevronLeftIcon className="h-4 w-4" />
              </Button>
            )}
            <div class="menumo">
              <CategoryProvider>
                <BottomMenu categoryRefs={categoryRefs} />
              </CategoryProvider>
            </div>
            <div
              ref={scrollContainerRef}
              className="flex overflow-x-auto scrollbar-hide space-x-2 py-7 pb-[15px]"
              style={{ scrollbarWidth: 'thin', msOverflowStyle: 'none' }}
            >
              {menuCategories.map(category => (
                <Button
                  key={category._id}
                  ref={el => (categoryRefs.current[category._id] = el)}
                  variant="ghost"
                  className={`zipzap_cate_list px-4 py-2 text-sm md:text-base font-medium ${
                    activeCategory === category.name
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground'
                  }`}
                  onClick={() => handleCategoryClick(category.name)}
                >
                  {category.name}
                </Button>
              ))}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex-shrink-0 px-4 py-2 text-sm font-medium"
                  >
                    <MoreHorizontalIcon className="h-4 w-4" />
                    <span className="ml-2">More</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {/* More categories can be added here */}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            {showRightArrow && (
              <Button
                variant="outline"
                size="icon"
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10"
                onClick={() => handleScroll('right')}
              >
                <ChevronRightIcon className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        <div className="transition-transform duration-300 ease-in-out px-4 py-2 fixed bottom-0 left-0 w-full z-50 bg-white shadow-md md:max-w-2xl md:left-1/2 md:transform md:-translate-x-1/2">
          <Button
            className="selected-button h-[60px] w-full py-3 text-lg bg-teal-600 text-white"
            onClick={handleCheckout}
            disabled={!isEligibleForCheckout}
          >
            Checkout ${total.toFixed(2)}
          </Button>
        </div>
      </div>

      <Dialog open={istimehoverOpen} onOpenChange={setTimehoverOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              {restaurant.data.name}
            </DialogTitle>
            {address.streetAddress && (
              <span>Address: {address.streetAddress}</span>
            )}
            {restaurant.data.businessPhone && (
              <span>
                <Link
                  href={`tel:${restaurant.data.businessPhone}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Phone Number: {restaurant.data.businessPhone}
                </Link>
              </span>
            )}

            {restaurant.data.ownerEmail && (
              <span>
                <Link
                  href={`mailto:${restaurant.data.ownerEmail}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Email: {restaurant.data.ownerEmail}
                </Link>
              </span>
            )}

            {restaurant.data.websiteurl && (
              <span>
                <Link
                  href={
                    restaurant.data.websiteurl.startsWith('http')
                      ? restaurant.data.websiteurl
                      : `https://${restaurant.data.websiteurl}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {restaurant.data.websiteurl}
                </Link>
              </span>
            )}

            {/* {address.postalCode &&(
            <p>Postcode: {address.postalCode}</p>
            )}
            {address.city &&(
            <p>City: {address.city}</p>
            )}
            {address.state && (<p>State: {address.state}</p>)}

            {address.country && (
              <p>Country: {address.country}</p>
            )} */}
          </DialogHeader>
          <div className="mt-4 max-h-[60vh] overflow-y-auto pr-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Day</TableHead>
                  <TableHead>Hours</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(openingHours).map(
                  ([day, { isOpen, timeSlots }]) => (
                    <TableRow
                      key={day}
                      className={day === currentDay ? 'bg-muted/50' : ''}
                    >
                      <TableCell className="font-medium capitalize">
                        {day}
                      </TableCell>
                      <TableCell>
                        {isOpen ? (
                          <div className="flex items-center text-green-600">
                            <Clock className="mr-2 h-4 w-4" />
                            {timeSlots.map((slot, index) => (
                              <span key={index} className="mr-2">
                                {slot.start} - {slot.end}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <div className="flex items-center text-red-500">
                            <XCircle className="mr-2 h-4 w-4" />
                            Closed
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                )}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
      {/* {isEditOrderOpen && (
        <ZizZapPickupTime
          onClose={() => setIsEditOrderOpen(false)}
          onUpdate={handleUpdateOrder}
        />
      )} */}
    </div>
  )
}
