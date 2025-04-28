'use client'
import { Suspense, useEffect, useRef, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import axios from 'axios'
import Header from './_components/header'
import Footer from './_components/footer'
import HorizontalScrollingMenu from './_components/itemcatelist'
import Items from './_components/items'
import { CategoryProvider } from './_components/CategoryContext'
import Loading from './_components/Loading'
import { useRestaurant } from '~/hooks/use-restaurant'
import '../../web-globals.css'
export default function Restaurantwise({ params }) {
  const { restId } = params
  const { data: session } = useSession()
  const setRestaurant = useRestaurant(state => state.setRestaurant) // Get the setter from Zustand

  //const setPaymentSettings = useAdmin((state) => state.setPaymentSettings);

  const restaurant = useRestaurant(state => state.restaurant) // Get restaurant data from Zustand
  const categoryRefs = useRef({})

  // Memoize the fetchUserMetaByIdAndKey function to prevent it from changing on every render
  // const fetchUserMetaByIdAndKey = useCallback(async (userId, metaKey) => {
  //   if (userId) {
  //     try {
  //       const response = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/usermeta/${userId}?meta_key=${metaKey}`);
  //       if (response.status === 200) {
  //         const userMeta = response.data.data;
  //         if (userMeta) {
  //           const { meta_value } = userMeta;
  //           const parsedValue = JSON.parse(meta_value);
  //           setPaymentSettings(parsedValue); // Call to set payment settings
  //         }
  //       }
  //     } catch (error) {
  //       console.error('Error fetching user meta:', error);
  //     }
  //   }
  // }, [setPaymentSettings]); // Only re-create if setPaymentSettings changes

  useEffect(() => {
    const fetchRestaurant = async () => {
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/restaurant/getrestaurants/${restId}`
        )
        setRestaurant(response.data) // Set restaurant data in Zustand
        // if (response.data.data.createdBy._id) {
        //   fetchUserMetaByIdAndKey(response.data.data.createdBy._id, 'paymentSettings');
        // }
      } catch (error) {
        console.error('Error fetching restaurant data:', error)
      }
    }

    fetchRestaurant()
  }, [restId, setRestaurant]) // Add fetchUserMetaByIdAndKey as a dependency

  if (!restaurant) {
    return (
      <>
        <main className="flex min-h-screen flex-col items-center justify-between p-2">
          <Loading />
        </main>
      </>
    )
    // Show loading indicator
  }
  console.log('data restaurant ', restaurant?.data?.status)
  return (
    <>
      <Suspense fallback={<Loading />}>
        <Header />
        <main className="flex min-h-screen flex-col items-center justify-between p-2 frontu1">
          <Suspense fallback={<Loading />}>
            {restaurant?.data?.status === 'open' ? (
              <CategoryProvider>
                <HorizontalScrollingMenu categoryRefs={categoryRefs} />
                <Suspense fallback={<ItemsGlimmer />}>
                  {/* @ts-ignore */}
                  <Items restaurant={restaurant} categoryRefs={categoryRefs} />
                </Suspense>
              </CategoryProvider>
            ) : (
              <p>{restaurant?.data?.businessStoreclose}</p>
            )}
          </Suspense>
        </main>
        <Footer />
      </Suspense>
    </>
  )
}
function ItemsGlimmer() {
  return (
    <div className="glimmer-panel">
      <div className="glimmer-line" />
      <div className="glimmer-line" />
      <div className="glimmer-line" />
    </div>
  )
}
