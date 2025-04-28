import { create } from 'zustand'
import Axios from '~/lib/axios'
import { OrderEndpoints } from '~/lib/constants'
import { iOrder } from '~/types'
import {
  iOrderBody,
  iReceiptBody,
  iRefundOrderBody,
  iVoidOrderBody,
} from '~/types/order'

type OrderState = {
  isOpen: boolean
  isLoading: boolean
  setIsLoading: (isLoading: boolean) => void
  newOrder: boolean
  setNewOrder: (newOrder: boolean) => void
  selectedOrder: iOrder | null
  setSelectedOrder: (order: iOrder | null) => void
  isOpenTakeout: boolean
  setIsOpenTakeout: (isOpenTakeout: boolean) => void
}

export const useOrder = create<OrderState>(set => ({
  isOpen: false,
  isLoading: false,
  setIsLoading: isLoading => set({ isLoading }),
  newOrder: false,
  setNewOrder: newOrder => set({ newOrder }),
  selectedOrder: null,
  setSelectedOrder: order => set({ selectedOrder: order }),
  isOpenTakeout: false,
  setIsOpenTakeout: isOpenTakeout => set({ isOpenTakeout }),
}))

// Create new order with API call
export const createOrder = async (orderData: iOrderBody) => {
  const { data } = await Axios.post(OrderEndpoints.new, orderData)
  return data
}

// Update order with API call
export const updateOrder = async ({
  id,
  orderData,
}: {
  id: string
  orderData: iOrderBody
}) => {
  const { data } = await Axios.put(OrderEndpoints.updateById(id), orderData)
  return data
}

// Void Items in order
export const voidItem = async ({
  id,
  body,
}: {
  id: string
  body: iVoidOrderBody
}) => {
  const { data } = await Axios.post(OrderEndpoints.voidItem, body)
  return data
}

// Refund order
export const refundOrder = async ({ body }: { body: iRefundOrderBody }) => {
  const { data } = await Axios.post(OrderEndpoints.refund, body)
  return data
}

// Send delay notification to customer
interface isendDelayMail {
  order_id: string
  delayTime: string
  delaymessage: string
}
export const sendDelayMail = async (_data: isendDelayMail) => {
  const { data } = await Axios.post(OrderEndpoints.delayorder, _data)
  return data
}

// Send email receipt to customer
export const emailReceipt = async (order_id: string, email: string) => {
  try {
    const { data } = await Axios.post(OrderEndpoints.emailReceipt, {
      order_id,
      email,
    })
    return {
      data,
      success: true,
      message: 'Email sent successfully',
    }
  } catch (error) {
    console.log(error)
    return {
      success: false,
      message: 'Something went wrong. Please try again later',
    }
  }
}

// Print kitchen receipt
export const printKitchenReceipt = async (rest: string, body: iReceiptBody) => {
  try {
    const { data } = await Axios.post(OrderEndpoints.kitchenReceipt(rest), body)
    return {
      data,
      success: true,
      message: 'Kitchen receipt printed successfully',
    }
  } catch (error) {
    console.log(error)
    return {
      success: false,
      message: 'Something went wrong. Please try again later',
    }
  }
}

// Print customer receipt
export const printCustomerReceipt = async (
  rest: string,
  body: iReceiptBody
) => {
  try {
    const { data } = await Axios.post(
      OrderEndpoints.customerReceipt(rest),
      body
    )
    return {
      data,
      success: true,
      message: 'Customer receipt printed successfully',
    }
  } catch (error) {
    console.log(error)
    return {
      success: false,
      message: 'Something went wrong. Please try again later',
    }
  }
}
