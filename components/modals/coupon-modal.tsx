'use client'

import React from 'react'
// Hooks
import { useCart } from '~/hooks/use-cart'
// Components
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'
import Icon from '~/components/icon'
import { Button } from '~/components/ui/button'
import { Label } from '~/components/ui/label'
import { ScrollArea } from '~/components/ui/scroll-area'
import { Input } from '../ui/input'

const couponsCodes: { code: string; discount: number; type: '$' | '%' }[] = [
  { code: 'SUMMER10', discount: 10, type: '$' },
  { code: 'FALL20', discount: 20, type: '%' },
  { code: 'WINTER30', discount: 30, type: '%' },
]

const searchCoupon = async (code: string) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000))
  return couponsCodes.find(
    coupon => coupon.code.toLowerCase() === code.toLowerCase()
  )
}

const CouponModal = () => {
  const [search, setSearch] = React.useState('')
  const [searched, setSearched] = React.useState(false)
  const [isSearching, setIsSearching] = React.useState(false)
  const [searchResult, setSearchResult] = React.useState<{
    code: string
    discount: number
    type: '$' | '%'
  } | null>(null)
  const { isCouponModalOpen, onCouponModalClose, coupon, setCoupon } = useCart()

  React.useEffect(() => {
    if (searchResult !== null && coupon?.code === '') {
      setSearch('')
      setSearched(false)
      setSearchResult(null)
    }
  }, [coupon, searchResult])

  const handleSearchCoupon = async () => {
    if (!search.trim()) {
      return
    }

    setSearched(true)
    console.log(searched)

    console.log('Searching for coupon:', search)
    setIsSearching(true)
    setSearchResult(null)

    try {
      const result = await searchCoupon(search)
      console.log('Search result:', result)
      if (result) {
        setSearchResult({
          code: result.code,
          discount: result.discount,
          type: result.type,
        })
        setCoupon({
          code: result.code,
          discount: Number(result.discount),
          type: result.type,
        })

        return
      }

      setCoupon({
        code: '',
        discount: 0,
        type: '$',
      })
    } catch (error) {
      console.error('Error searching for coupon:', error)
    } finally {
      setIsSearching(false)
    }
  }

  return (
    <Dialog open={isCouponModalOpen} onOpenChange={onCouponModalClose}>
      <DialogContent className="max-w-[700px] gap-0 p-0">
        <DialogHeader className="border-b p-4">
          <DialogTitle>Apply Coupon</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[400px] min-h-[178px] px-3 py-2">
          <div className="p-1 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="coupon" className="font-semibold block">
                Enter Coupon Code:
              </Label>
              <div className="relative flex gap-2">
                <Input
                  id="coupon"
                  placeholder="Coupon"
                  value={search}
                  onChange={e => {
                    if (e.target.value.length === 0) {
                      setSearched(false)
                    }
                    setSearch(e.target.value)
                  }}
                />
                <Button onClick={handleSearchCoupon} disabled={isSearching}>
                  {isSearching ? 'Searching...' : 'Apply Coupon'}
                  <Icon name="Search" />
                </Button>
              </div>
            </div>

            {/* Search Result */}
            {searched && searchResult && (
              <div className="mt-4 p-4 bg-green-50 rounded-md text-sm">
                <h4 className="font-semibold text-green-700">
                  Coupon Applied!
                </h4>
                <p className="text-green-600">
                  {searchResult.code} - {searchResult.type === '$' && '$'}
                  {searchResult.discount}
                  {searchResult.type === '%' && '%'} off
                </p>
              </div>
            )}

            {searched && !isSearching && !searchResult && (
              <div className="mt-4 p-4 bg-red-50 rounded-md text-sm">
                <h4 className="font-semibold text-red-700">
                  Coupon Not Found!
                </h4>
                <p className="text-red-600">
                  The coupon code you entered is invalid or expired.
                </p>
              </div>
            )}

            {!searched && !searchResult && (
              <div className="space-y-2">
                <Label htmlFor="note" className="font-semibold block">
                  Available Coupons:
                </Label>
                <div className="flex items-center justify-between border rounded p-2 text-sm">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">10% off</p>
                    <p>on orders above $100</p>
                  </div>
                  <Button variant="outline" size="sm">
                    Apply
                  </Button>

                  <div className="flex items-center gap-2">
                    <p className="font-semibold">20% off</p>
                    <p>on orders above $200</p>
                  </div>
                  <Button variant="outline" size="sm">
                    Apply
                  </Button>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        <div className="flex gap-2 p-4 border-t">
          <Button
            className="w-full h-12"
            variant="destructive"
            onClick={onCouponModalClose}
          >
            <Icon name="X" />
            Cancel
          </Button>
          <Button
            className="w-full h-12 font-bold"
            onClick={onCouponModalClose}
          >
            Confirm <Icon name="CheckCheck" className="h-4 w-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default CouponModal
