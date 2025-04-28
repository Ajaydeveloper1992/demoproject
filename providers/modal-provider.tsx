'use client'
import React from 'react'
// Modals
import CartModal from '~/components/modals/cart-modal'
import CouponModal from '~/components/modals/coupon-modal'
import CustomerModal from '~/components/modals/customer-modal'
import DiscountModal from '~/components/modals/discount-modal'
import ItemModal from '~/components/modals/item-modal'
import NoteModal from '~/components/modals/note-modal'

const ModalProvider = () => {
  const [isMounted, setIsMounted] = React.useState(false)

  React.useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) return null

  return (
    <>
      <CartModal />
      <CustomerModal />
      <NoteModal />
      <DiscountModal />
      <CouponModal />
      <ItemModal />
    </>
  )
}

export default ModalProvider
