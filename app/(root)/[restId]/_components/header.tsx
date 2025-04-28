// @ts-nocheck

'use client'
import { useState, useEffect, useRef } from 'react'
import { Button } from '~/components/ui/button'
import { Sheet, SheetTrigger } from '~/components/ui/sheet'
import { ShoppingCartIcon, Edit2Icon } from 'lucide-react'
import Link from 'next/link'
import ZizZapPickupTime from './pickuptimeModal'
import CartView from './cartview'
import { useSearchParams } from 'next/navigation'
import { useRestaurant } from '~/hooks/use-restaurant'
import Image from 'next/image'
export default function Header() {
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [isEditOrderOpen, setIsEditOrderOpen] = useState(false)
  const pickupInfo = useRestaurant(state => state.pickupInfo)
  const updatePickupInfo = useRestaurant(state => state.updatePickupInfo)
  const restaurant = useRestaurant(state => state.restaurant) // Fetch restaurant info
  const cartItems = useRestaurant(state => state.cart)
  const [menuCategories, setMenuCategories] = useState([])
  useEffect(() => {
    // This effect runs once when the component mounts (window loads)
    console.log('Data PickupInfo:', pickupInfo.selectedTime)
    if (!pickupInfo.selectedTime) {
      setIsEditOrderOpen(true)
    }
  }, [pickupInfo])
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0)

  const selectedTime = pickupInfo?.selectedTime
  const handleUpdateOrder = orderDetails => {
    updatePickupInfo(orderDetails)
    setIsEditOrderOpen(false)
  }

  const searchParams = useSearchParams()
  const categoryRefs = useRef({})
  const oid = searchParams.get('oid')
  // Fetch categories function
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

  return (
    <>
      <header className="bg-white shadow-md sticky top-0 z-50">
        <div className="container mx-auto max-w-screen-xl px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12">
          {/* Header Flexbox Layout */}
          <div className="flex flex-col md:flex-row items-center justify-between h-auto md:h-20 gap-4 heado">
            <div className="w-full md:w-auto flex justify-center md:justify-start heado1">
              <Link href="/" className="flex items-center">
                <span className="sr-only">ZipZap</span>
                <div className="text-2xl font-bold text-primary">
                  <Image
                    src="/images/zipzappos-logo.svg"
                    alt="ZipZappos Logo"
                    width={150} // Adjust width
                    height={50} // Adjust height
                  />
                </div>
              </Link>
            </div>

            {/* Pickup Time & Shopping Cart - Stacked on Mobile, Side-by-Side on Desktop */}
            <div className="w-full md:w-auto flex flex-col sm:flex-row items-center gap-4 heado2">
              {/* Pickup Time */}
              {!oid && (
                <div className="bg-[#fff] py-1 px-4 flex items-center justify-between w-full sm:w-auto border rounded-lg text-sm desktime">
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

              {/* Shopping Cart */}
              <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <ShoppingCartIcon className="h-6 w-6" />
                    {totalItems > 0 && (
                      <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                        {totalItems}
                      </span>
                    )}
                    <span className="sr-only">Shopping cart</span>
                  </Button>
                </SheetTrigger>
              </Sheet>
              <CartView
                isOpen={isCartOpen}
                onClose={() => setIsCartOpen(false)}
              />
            </div>
            {/* <CategoryProvider>
            <BottomMenu categoryRefs={categoryRefs} />
          </CategoryProvider> */}
          </div>
        </div>
        {/* Pickup Info Modal */}
        {isEditOrderOpen && (
          <ZizZapPickupTime
            onClose={() => setIsEditOrderOpen(false)}
            onUpdate={handleUpdateOrder}
          />
        )}
      </header>
    </>
  )
}
