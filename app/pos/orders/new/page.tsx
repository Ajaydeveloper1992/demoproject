'use client'

import React from 'react'
import { useQuery } from 'react-query'
import { useSearchParams } from 'next/navigation'
import { iCategory, iProduct } from '~/types'
// Lib
import Axios from '~/lib/axios'
import {
  CategoryEndpoints,
  HEADER_HEIGHT,
  ProductEndpoints,
} from '~/lib/constants'
import { cn } from '~/lib/utils'
// Hooks
import { useCart } from '~/hooks/use-cart'
import { useCustomer } from '~/hooks/use-customer'
// Components
import Cart from '~/components/cart'
import Header from '~/components/header'
import { Button } from '~/components/ui/button'
import { ScrollArea } from '~/components/ui/scroll-area'
import ProductCard from '~/components/cards/product-card'

const NewOrder = () => {
  const { setData: setCart } = useCart()

  const [selectedCategoryId, setSelectedCategoryId] = React.useState<
    string | null
  >(null)

  const type = useSearchParams().get('type') as 'takeout' | 'delivery'

  const { onOpen: onCustomerOpen, setSelectCustomer } = useCustomer()

  const { data, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data } = await Axios.get(ProductEndpoints.getAll())
      return data?.data as iProduct[]
    },
  })

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await Axios.get(CategoryEndpoints.getAll())
      return data?.data as iCategory[]
    },
  })

  React.useEffect(() => {
    if (type === 'takeout') {
      onCustomerOpen()
      setSelectCustomer(null)
      setCart([])
    }
  }, [type])

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

      <Cart type={type} />
    </div>
  )
}

export default NewOrder
