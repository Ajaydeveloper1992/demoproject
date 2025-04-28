'use client'

import React from 'react'
import { useQuery } from 'react-query'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { iCategory, iOrder, iProduct } from '~/types'
// Lib
import Axios from '~/lib/axios'
import {
  CategoryEndpoints,
  HEADER_HEIGHT,
  OrderEndpoints,
  ProductEndpoints,
} from '~/lib/constants'
import { cn, transformModifiers } from '~/lib/utils'
// Hooks
import { useCart } from '~/hooks/use-cart'
import { useCustomer } from '~/hooks/use-customer'
// Components
import Cart from '~/components/cart'
import Header from '~/components/header'
import { Button } from '~/components/ui/button'
import { ScrollArea } from '~/components/ui/scroll-area'
import ProductCard from '~/components/cards/product-card'

const OrderDetails = () => {
  // Get id from params
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const {
    data: cart,
    setData: setCart,
    setTotal,
    setSelectCart,
    setDiscount,
    setNote,
  } = useCart()
  const { onOpen: onCustomerOpen, setSelectCustomer } = useCustomer()

  const [selectedCategoryId, setSelectedCategoryId] = React.useState<
    string | null
  >(null)

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await Axios.get(CategoryEndpoints.getAll())
      return data?.data as iCategory[]
    },
  })

  const {
    data: fetchedOrder,
    isLoading: isFetching,
    isFetching: isReFetching,
  } = useQuery<{
    data: iOrder
  }>({
    queryKey: ['order', id],
    queryFn: async () => {
      const response = await Axios.get(OrderEndpoints.getById(id))
      return response.data
    },
    refetchOnMount: true,
  })

  React.useEffect(() => {
    const handleOrderData = async () => {
      if (fetchedOrder) {
        setTotal(fetchedOrder?.data?.total || 0)
        setDiscount(
          fetchedOrder?.data?.orderDiscount || { type: '%', value: 0 }
        )
        setNote(fetchedOrder?.data?.specialInstructions || '')

        const _itemsWithDefaults = fetchedOrder?.data?.items.map(item => ({
          ...item,
          // @ts-ignore
          modifiers: transformModifiers(item?.modifiers),
          timestamp: item?.timestamp || new Date(),
          inKitchen: true,
        }))

        console.log(_itemsWithDefaults)
        await setCart(_itemsWithDefaults)

        await setSelectCustomer(fetchedOrder?.data?.customer)

        if (fetchedOrder?.data?.orderstatus === 'Voided') {
          console.log('VOIDED')
          // Redirect to takeout page - use direct router to bypass guard for this specific case
          await setCart([])
          await setSelectCustomer(null)
          // Since we're already clearing cart and customer data, we can bypass the guard
          await router.push('/pos/takeout')
        }
      }
    }

    handleOrderData()
  }, [id, isReFetching])

  const type = useSearchParams().get('type') as 'takeout' | 'delivery'

  React.useEffect(() => {
    if (type === 'takeout') {
      onCustomerOpen()
    }
  }, [type])

  const { data, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data } = await Axios.get(ProductEndpoints.getAll())
      return data?.data as iProduct[]
    },
  })

  if (isLoading) {
    return (
      <div>
        {/* TODO: Skeleton loader */}
        Loading...
      </div>
    )
  }

  const allProducts = data ? Object.values(data).flat() : []

  const filteredProducts = selectedCategoryId
    ? allProducts.filter(product =>
        product.categories?.some(
          category => category._id === selectedCategoryId
        )
      )
    : allProducts

  return (
    <div className="flex bg-gray-100">
      <div className="flex-1">
        {isFetching && (
          <div className="flex items-center justify-center fixed left-0 top-0 w-full h-full z-50 bg-white/50">
            <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-primary" />
          </div>
        )}
        <Header />
        <div className="flex">
          <div className="bg-white shadow-md">
            <ScrollArea className="h-[calc(100vh-90px)] p-1 ">
              <div className="bg-white p-1 w-44">
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    'w-full justify-start mb-2 text-xs rounded-sm shadow-[0_2px_4px_#0000002b] capitalize last:mb-0 border-l-[6px] border-transparent border-l-primary',
                    selectedCategoryId === null
                      ? 'bg-primary/10 hover:bg-primary/5 text-primary border-primary border-2 border-l-[6px]'
                      : 'hover:bg-slate-100 border-l-primary'
                  )}
                  onClick={() => setSelectedCategoryId(null)}
                >
                  All Products
                </Button>
                {categories && categories.length > 0 ? (
                  categories.map((category, i) => (
                    <Button
                      key={i}
                      variant="ghost"
                      size="sm"
                      className={cn(
                        'w-full justify-start mb-2 text-xs rounded-sm shadow-[0_2px_4px_#0000002b] capitalize last:mb-0 border-l-[6px] border-transparent border-l-primary',
                        selectedCategoryId === category._id
                          ? 'bg-primary/10 hover:bg-primary/5 text-primary border-primary border-2 border-l-[6px]'
                          : 'hover:bg-slate-100 border-l-primary'
                      )}
                      onClick={() => setSelectedCategoryId(category._id)}
                    >
                      <span className="truncate">
                        {category?.name?.toLowerCase() ?? 'Unnamed Category'}
                      </span>
                    </Button>
                  ))
                ) : (
                  <div>No categories available</div>
                )}
              </div>
            </ScrollArea>
          </div>

          <div className="flex-1">
            <ScrollArea
              className="p-3 pb-0 rounded-lg rounded-b-none"
              style={{ height: `calc(100vh - ${HEADER_HEIGHT}px)` }}
            >
              {filteredProducts.length === 0 ? (
                <div className="flex items-center justify-center h-[calc(100vh-48px)]">
                  No products found
                </div>
              ) : (
                <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-3 auto-rows-fr">
                  {filteredProducts.map((product, i) => (
                    <ProductCard key={i} data={product} />
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      </div>

      <Cart type={type} id={id} />
    </div>
  )
}

export default OrderDetails
