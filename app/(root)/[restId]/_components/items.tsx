// @ts-nocheck
import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent } from '~/components/ui/card'
import { ItemModal } from './ItemModal'
import Image from 'next/image'
import axios from 'axios'
import { useRestaurant } from '~/hooks/use-restaurant'

export default function Items({ categoryRefs = false }) {
  const { restaurant, pickupInfo, updatePickupInfo } = useRestaurant()
  const [products, setProducts] = useState([])
  const [isModalOpen, setModalOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState(null)
  const [categories, setCategories] = useState([])
  const [isEditOrderOpen, setIsEditOrderOpen] = useState(false)
  useEffect(() => {
    // This effect runs once when the component mounts (window loads)
    console.log('Data PickupInfo:', pickupInfo.selectedTime)
    if (!pickupInfo.selectedTime) {
      setIsEditOrderOpen(true)
    }
  }, [pickupInfo])
  useEffect(() => {
    const fetchCategories = async () => {
      if (!restaurant?.data?._id) return

      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/categories/getCategoriesBySelectedRestaurants/${restaurant.data._id}`
        )
        const data = response.data

        if (data.success) {
          const visiblecategories = data.data
          visiblecategories.sort((a, b) => a.sortOrder - b.sortOrder)
          setCategories(visiblecategories)
        } else {
          console.error(data.message)
        }
      } catch (error) {
        console.error('Error fetching categories:', error)
      }
    }

    fetchCategories()
  }, [restaurant?.data?._id])

  useEffect(() => {
    const fetchProducts = async () => {
      if (!restaurant?.data?._id) return

      try {
        //const response = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/product/getproductsrestaurants/${restaurant.data._id}`);

        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/product/getproductsrestaurants/${restaurant?.data?._id}`
        )

        const data = response.data
        if (data.success) {
          // Filter products to include only those with showOnWeb: true
          const visibleProducts = data.data.filter(product => product.showOnWeb)

          visibleProducts.sort((a, b) => a.sortOrder - b.sortOrder)
          setProducts(visibleProducts)
        } else {
          console.error(data.message)
        }
      } catch (error) {
        console.error('Error fetching products:', error)
      }
    }

    fetchProducts()
  }, [restaurant?.data?._id, restaurant?.data?.createdBy])

  const openModal = item => {
    setSelectedItem(item)
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setSelectedItem(null)
  }

  // Group products by category
  const groupedProducts = useMemo(() => {
    const categoriesMap = {}

    // Initialize categories map
    categories.forEach(category => {
      categoriesMap[category._id] = {
        name: category.name,
        availabilityType: category.availabilityType,
        startTime: category.startTime,
        endTime: category.endTime,
        specifictimeMessage: category.specifictimeMessage,
        products: [],
      }
    })

    // Populate products into their respective categories
    products.forEach(product => {
      product.categories.forEach(category => {
        if (categoriesMap[category._id]) {
          categoriesMap[category._id].products.push(product)
        }
      })
    })

    return categoriesMap
  }, [categories, products])
  /**
   * Update Pickup Time
   */
  const handleUpdateOrder = orderDetails => {
    updatePickupInfo(orderDetails)
    setIsEditOrderOpen(false)
  }
  //console.log("Data product", products);
  // Function to get current time in "HH:mm" format
  const getCurrentTime = () => {
    const now = new Date()
    return now.toTimeString().slice(0, 5) // Extract "HH:mm"
  }

  const [currentTime, setCurrentTime] = useState(getCurrentTime())

  // Update time every minute to check availability dynamically
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(getCurrentTime())
    }, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="container mx-auto px-12 py-8 zipzap_items_list">
      {Object.entries(groupedProducts).map(([categoryId, category]) => {
        // Extract availability data
        //console.log("Open Cate",category);
        const { availabilityType, startTime, endTime, specifictimeMessage } =
          category

        // Check if the current time is within the specified range
        const isWithinTimeRange =
          availabilityType === 'all-day' ||
          (availabilityType === 'specific-time' &&
            currentTime >= startTime &&
            currentTime <= endTime)

        return (
          <div
            key={category.name}
            ref={el => (categoryRefs.current[category.name] = el)}
            className="mb-12 zp-scrolling-margin"
            id={category.name}
          >
            <h2 className="text-2xl font-bold mb-6">{category.name}</h2>
            {isWithinTimeRange ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-6">
                {category.products.map(product => (
                  <Card
                    key={product._id}
                    className="overflow-hidden bg-white border border-gray-200 rounded-lg shadow-md transition transform hover:scale-105"
                    onClick={() => openModal(product)}
                  >
                    <div className="flex flex-col sm:flex-row con12">
                      <CardContent className="p-4 flex-1 con13">
                        <h3 className="font-semibold text-lg mb-2">
                          {product.name}
                        </h3>
                        <p className="font-bold text-lg">
                          ${product.webprice?.toFixed(2) || 'N/A'}
                        </p>
                        <p className="text-sm h-10 text-gray-600 mb-2">
                          {product.description.length > 50
                            ? `${product.description.slice(0, 50)}...`
                            : product.description}
                        </p>
                        {/* <p className="font-bold text-lg">${product.webprice?.toFixed(2) || "N/A"}</p> */}
                      </CardContent>

                      {/* Image Section */}
                      {Array.isArray(product.mediaFiles) &&
                        product.mediaFiles[0]?.length > 0 && (
                          <CardContent className="p-0 w-full sm:w-48 con14">
                            <Image
                              src={`${
                                process.env.NEXT_PUBLIC_IMAGE_BASE_URL
                              }/${product.mediaFiles[0].replace(/\\/g, '/')}`}
                              alt={product.name}
                              width={160}
                              height={160}
                              className="w-full h-40 object-cover rounded-md"
                            />
                          </CardContent>
                        )}
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-lg font-semibold text-red-500">
                {specifictimeMessage ||
                  'Products are not available at this time.'}
              </p>
            )}
          </div>
        )
      })}
      <ItemModal
        isOpen={isModalOpen}
        onClose={closeModal}
        item={selectedItem}
      />
      {/* {isEditOrderOpen && (
        <ZizZapPickupTime onClose={() => setIsEditOrderOpen(false)} onUpdate={handleUpdateOrder} />
      )} */}
    </div>
  )
}
