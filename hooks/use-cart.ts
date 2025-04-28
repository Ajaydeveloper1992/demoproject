import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import {
  calculateBaseTotal,
  calculateItemTotal,
  getFromLocal,
  saveToLocal,
} from '~/lib/utils'
import { iCustomer, iOrder, iProduct } from '~/types'
import { useProduct } from './use-product'

export type CartState = {
  isOpen: boolean
  data: (iOrder['items'][number] & {
    calculatedTotal?: number
    subTotal?: number
    inKitchen?: boolean
    modifiers: {
      [key: string]: string[]
    }
    timestamp: Date
    itemDiscount?: CartState['discount']
    quantity: number
  })[]
  setData: (data: CartState['data']) => void
  sendToKitchen: boolean
  setSendToKitchen: (value: boolean) => void
  customer: any
  setCustomer: (customer: any) => void
  total: number
  setTotal: (total: number) => void
  note?: string
  setNote: (note: string) => void
  discount?: {
    type: '%' | '$'
    value: number
  }
  setDiscount: (discount: { value: number; type: '%' | '$' }) => void
  coupon?: {
    code: string
    discount: number
    type: '%' | '$'
  }
  setCoupon: (data: CartState['coupon']) => void
  modalType?: 'cart' | 'product'
  setModalType: (type: 'cart' | 'product') => void
  fee: { title: string; type: '%' | '$'; value: number }[]
  setFee: (fee: CartState['fee']) => void
  item?: {
    item: iProduct
    quantity: number
    note?: string
    timestamp: Date
    itemDiscount?: CartState['discount']
  }
  setItem: (item: CartState['item']) => void
  onOpen: () => void
  onClose: () => void
  addToCart: ({
    item,
    quantity,
    modifiers,
    note,
    itemDiscount,
  }: {
    item: iProduct & { itemcustomname: string }
    quantity: number
    modifiers: CartState['data'][number]['modifiers']
    note?: string
    timestamp: Date
    itemDiscount?: CartState['discount']
  }) => void
  removeCart: (productId: string) => void
  updateCart: (params: {
    productId: string
    data: CartState['data'][0]
  }) => void
  clearCart: () => void
  selectedCart:
    | (CartState['data'][0] & {
        customer?: iCustomer | null
      })
    | null
  setSelectCart: (data: CartState['selectedCart']) => void
  splitQty: number
  setSplitQty: (qty: number) => void
  isNoteModalOpen: boolean
  openNoteModal: () => void
  onNoteModalClose: () => void
  isDiscountModalOpen: boolean
  openDiscountModal: () => void
  onDiscountModalClose: () => void
  isCouponModalOpen: boolean
  openCouponModal: () => void
  onCouponModalClose: () => void
  isItemModalOpen: boolean
  openItemModal: () => void
  onItemModalClose: () => void
  isPayModalOpen: boolean
  openPayModal: () => void
  onPayModalClose: () => void
  splitPayments: number[]
  setSplitPayments: (payments: number[]) => void
  tendered: string
  setTendered: (amount: string) => void
  currentSplitIndex: number
  setCurrentSplitIndex: (index: number) => void
  partialPayments: { amount: number; method: string }[][] // Array of arrays for each split's payments
  resetPartialPayments: () => void
  addPartialPayment: (
    splitIndex: number,
    amount: number,
    method: 'Cash' | 'Card'
  ) => void
  remainingAmount: number
  setRemainingAmount: (amount: number) => void
  paymentMethod: 'Cash' | 'Card'
  setPaymentMethod: (method: 'Cash' | 'Card') => void
  payMethods: { method: 'Cash' | 'Card'; amount: number }[]
  resetPayMethods: () => void
  tipAmount: number
  tipType: '%' | '$'
  setTipDetails: (amount: number, type: '%' | '$') => void
  splitTips: { amount: number; type: '%' | '$' }[]
  setSplitTipDetails: (index: number, amount: number, type: '%' | '$') => void
  resetTips: () => void
  isFinalizing: boolean
  setFinalizing: (value: boolean) => void
  hideSendToKitchen: boolean
  setHideSendToKitchen: (value: boolean) => void
  splitTaxAmounts: number[]
  setSplitTaxAmounts: (amounts: number[]) => void
}

const calculateTotal = data => {
  if (!Array.isArray(data)) return 0
  return data.reduce((acc: number, item) => {
    let total =
      item.subtotal || calculateItemTotal(item, useProduct.getState().modifiers)
    return acc + total
  }, 0)
}

export const useCart = create<CartState>((set, get) => ({
  isOpen: false,
  data: getFromLocal('cart') || [],
  total: getFromLocal('cartTotal') || 0,
  setTotal: total => {
    set({ total })
    saveToLocal('cartTotal', total)
  },
  note: getFromLocal('cartNote') || '',
  customer: null,
  discount: getFromLocal('cartDiscount') || { type: '$', value: 0 },
  fee: getFromLocal('cartFee') || [],
  coupon: getFromLocal('cartCoupon') || { code: '', discount: 0, type: '%' },
  modalType: 'cart',
  paymentMethod: 'Cash',
  payMethods: [],
  resetPayMethods: () => set({ payMethods: [] }),
  setPaymentMethod: method => set({ paymentMethod: method }),
  item: undefined,
  sendToKitchen: false,
  setSendToKitchen: value => set({ sendToKitchen: value }),
  setData: data => {
    // Calculate the subTotal for each item

    // Find the orderDiscount and apply it to the total
    // orderDiscount: {
    //   type: "$"
    //   value: 5
    // }
    // const _orderDiscount = getFromLocal('orderDiscount')

    data.forEach(item => {
      item._id = uuidv4()
      item.subTotal = calculateItemTotal(item, useProduct.getState().modifiers)
      inKitchen: false
    })
    const total = calculateTotal(data)

    set({ data, total })
    // Save to local storage
    saveToLocal('cart', data)
    saveToLocal('cartTotal', total)
  },
  onOpen: () => set({ isOpen: true }),
  onClose: () => set({ isOpen: false }),
  setNote: note => {
    set({ note })
    saveToLocal('cartNote', note)
  },
  setCustomer: customer => set({ customer }),
  setDiscount: data => {
    set({ discount: data })
    saveToLocal('cartDiscount', data)
  },
  setCoupon: data => {
    set({ coupon: data })
    saveToLocal('cartCoupon', data)
  },
  setModalType: type => set({ modalType: type }),
  setFee: fee => {
    set({ fee })
    saveToLocal('cartFee', fee)
  },
  setItem: item => set({ item }),
  addToCart: ({ item, quantity, modifiers, note, itemDiscount }) => {
    const _item = {
      id: uuidv4(),
      _id: item._id,
      price: item.posprice,
      quantity,
      item,
      modifiers,
      itemNote: note,
      itemDiscount,
      timestamp: new Date(),
    }
    set(state => {
      const newItem = {
        id: uuidv4(),
        _id: item._id,
        // @ts-ignore
        price: calculateBaseTotal(_item, useProduct.getState().modifiers),
        quantity,
        item,
        modifiers,
        itemNote: note,
        itemDiscount,
        // @ts-ignore
        subTotal: calculateItemTotal(_item, useProduct.getState().modifiers),
        timestamp: new Date(),
      }
      // @ts-ignore
      const newCartData = state.data.concat(newItem)
      const total = calculateTotal(newCartData)
      // Save to local storage
      saveToLocal('cart', newCartData)
      saveToLocal('cartTotal', total)
      return { data: newCartData, total }
    })
    // Play sound
    const audio = new Audio('/audio/add_to_cart.mp3')
    audio.play()
  },
  removeCart: (id: string) => {
    set(state => {
      const newCartData = state.data.filter(item => item.id !== id)
      const total = calculateTotal(newCartData)
      // Save to local storage
      saveToLocal('cart', newCartData)
      saveToLocal('cartTotal', total)
      return { data: newCartData, total }
    })
    // Play sound
    const audio = new Audio('/audio/remove_cart_item.mp3')
    audio.play()
  },
  updateCart: ({ productId, data }) => {
    set(state => {
      const newCartData = state.data.map(item => {
        console.log(item.id === productId)
        if (item.id === productId) {
          const updatedItem = { ...item, ...data }
          updatedItem.price = calculateBaseTotal(
            updatedItem,
            useProduct.getState().modifiers
          )
          updatedItem.subTotal = calculateItemTotal(
            updatedItem,
            useProduct.getState().modifiers
          )
          return updatedItem
        }
        return item
      })
      // Save to local storage
      saveToLocal('cart', newCartData)
      return { data: newCartData, total: calculateTotal(newCartData) }
    })
    // Play sound
    const audio = new Audio('/audio/add_to_desk.mp3')
    audio.play()
  },
  clearCart: () => {
    set({
      data: [],
      total: 0,
      note: '',
      discount: { type: '$', value: 0 },
      fee: [],
      customer: null,
      coupon: { code: '', discount: 0, type: '%' },
    })
    // Clear local storage
    localStorage.removeItem('cart')
    localStorage.removeItem('cartTotal')
    localStorage.removeItem('cartNote')
    localStorage.removeItem('cartDiscount')
    localStorage.removeItem('cartFee')
    localStorage.removeItem('cartCoupon')
    localStorage.removeItem('cartCustomer')
    // Play sound
    const audio = new Audio('/audio/clear_cart.mp3')
    audio.play()
  },
  selectedCart: null,
  setSelectCart: data => set({ selectedCart: data }),
  splitQty: 1,
  setSplitQty: qty => set({ splitQty: qty }),
  isNoteModalOpen: false,
  openNoteModal: () => set({ isNoteModalOpen: true }),
  onNoteModalClose: () => set({ isNoteModalOpen: false }),
  isDiscountModalOpen: false,
  openDiscountModal: () => set({ isDiscountModalOpen: true }),
  onDiscountModalClose: () => set({ isDiscountModalOpen: false }),
  isCouponModalOpen: false,
  openCouponModal: () => set({ isCouponModalOpen: true }),
  onCouponModalClose: () => set({ isCouponModalOpen: false }),
  isItemModalOpen: false,
  openItemModal: () => set({ isItemModalOpen: true }),
  onItemModalClose: () => set({ isItemModalOpen: false }),
  isPayModalOpen: false,
  openPayModal: () => set({ isPayModalOpen: true }),
  onPayModalClose: () => set({ isPayModalOpen: false }),
  splitPayments: [],
  setSplitPayments: payments => set({ splitPayments: payments }),
  tendered: '0',
  setTendered: amount => set({ tendered: amount }),
  currentSplitIndex: 0,
  setCurrentSplitIndex: index => set({ currentSplitIndex: index }),
  partialPayments: [],
  resetPartialPayments: () => set({ partialPayments: [] }), // Reset all partial payments
  addPartialPayment: (splitIndex, amount, method) =>
    set(state => {
      const newPartialPayments = [...state.partialPayments]
      if (!newPartialPayments[splitIndex]) {
        newPartialPayments[splitIndex] = []
      }
      newPartialPayments[splitIndex].push({ amount, method })

      // Update split payments total
      const newSplitPayments = [...state.splitPayments]
      newSplitPayments[splitIndex] =
        (newSplitPayments[splitIndex] || 0) + amount

      // Update payMethods
      const newPayMethods = [...state.payMethods]
      const existingMethodIndex = newPayMethods.findIndex(
        p => p.method === method
      )
      if (existingMethodIndex >= 0) {
        newPayMethods[existingMethodIndex].amount += amount
      } else {
        newPayMethods.push({
          method: method as 'Cash' | 'Card',
          amount: amount,
        })
      }

      // Calculate total with tip for the current split
      const baseAmount =
        state.splitQty <= 1
          ? state.total
          : Math.floor((state.total / state.splitQty) * 100) / 100

      const tip = state.splitTips[splitIndex] || { amount: 0, type: '%' }
      const tipAmount =
        tip.type === '%' ? (baseAmount * tip.amount) / 100 : tip.amount

      const totalWithTip = baseAmount + tipAmount

      // Update remaining amount including tip
      const newRemainingAmount = Math.max(
        0,
        totalWithTip - newSplitPayments[splitIndex]
      )

      return {
        partialPayments: newPartialPayments,
        splitPayments: newSplitPayments,
        remainingAmount: newRemainingAmount,
        payMethods: newPayMethods,
      }
    }),
  remainingAmount: 0,
  setRemainingAmount: amount => set({ remainingAmount: amount }),
  tipAmount: 0,
  tipType: '%',
  setTipDetails: (amount, type) => set({ tipAmount: amount, tipType: type }),
  splitTips: [],
  setSplitTipDetails: (index, amount, type) =>
    set(state => {
      const newSplitTips = [...(state.splitTips || [])]
      newSplitTips[index] = { amount, type }
      return { splitTips: newSplitTips }
    }),
  resetTips: () => set({ tipAmount: 0, tipType: '%', splitTips: [] }), // Reset all tips
  isFinalizing: false,
  setFinalizing: value => set({ isFinalizing: value }),
  hideSendToKitchen: false,
  setHideSendToKitchen: value => set({ hideSendToKitchen: value }),
  splitTaxAmounts: [],
  setSplitTaxAmounts: amounts => set({ splitTaxAmounts: amounts }),
}))

// Send cart to kitchen
// Update cart.data.item inKitchen: true
export const sendToKitchen = () => {
  useCart.getState().data.forEach(item => {
    item.inKitchen = true
  })
}
