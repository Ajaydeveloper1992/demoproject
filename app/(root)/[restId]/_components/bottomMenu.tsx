// @ts-nocheck

import { useState, useRef, useEffect, useCallback } from 'react'
import { Button } from '~/components/ui/button'
import { MenuIcon } from 'lucide-react'
import { Sheet, SheetContent, SheetTrigger } from '~/components/ui/sheet'
import axios from 'axios'
import Link from 'next/link'
import { useCategory } from './CategoryContext'
import { useSearchParams } from 'next/navigation'
import { useRestaurant } from '~/hooks/use-restaurant'

export default function BottomMenu({ categoryRefs }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
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
  }, [restaurant?.data?._id])

  // Fetch categories on component mount
  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  // Scroll handling
  const handleScroll = direction => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -200 : 500
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

  const handleSmoothScroll = (event, targetId) => {
    event.preventDefault() // Prevent default anchor click behavior
    const targetElement = document.getElementById(targetId)
    if (targetElement) {
      targetElement.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
      // Update URL hash without jumping
      window.history.pushState(null, null, `#${targetId}`)
      setIsMenuOpen(false)
    }
  }

  return (
    <>
      {/* Logo - Centered on Mobile */}
      <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden">
            {' '}
            {/* Hide on larger screens */}
            <MenuIcon className="h-6 w-6" />
            <span className="sr-only">Toggle menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="md:hidden">
          {' '}
          {/* Hide on larger screens */}
          <nav className="flex flex-col space-y-4">
            {menuCategories.map(category => (
              <>
                <Link
                  href={category.name}
                  onClick={e => handleSmoothScroll(e, category.name)}
                >
                  {category.name}
                </Link>
              </>
            ))}
          </nav>
        </SheetContent>
      </Sheet>
    </>
  )
}
