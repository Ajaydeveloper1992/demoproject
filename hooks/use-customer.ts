import { create } from 'zustand'
import { iCustomer, iOrder } from '~/types'
import Axios from '~/lib/axios'
import {
  CustomerEndpoints,
  OrderEndpoints,
  StaffEndpoints,
} from '~/lib/constants'
import { getFromLocal, saveToLocal } from '~/lib/utils'

type CustomerState = {
  isOpen: boolean
  selectCustomer?: iCustomer | null
  setSelectCustomer: (data: iCustomer | null) => void
  history: iOrder[]
  setHistory: (data: iOrder[]) => void
  onOpen: () => void
  onClose: () => void
}

export const useCustomer = create<CustomerState>(set => ({
  isOpen: false,
  onOpen: () => set({ isOpen: true }),
  onClose: () => set({ isOpen: false }),
  history: [],
  setHistory: data => set({ history: data }),
  selectCustomer: getFromLocal('customer') || null,
  setSelectCustomer: async data => {
    set({ selectCustomer: data })
    // Save selected customer to local storage
    saveToLocal('customer', data)
    if (data?.phone) {
      const history = await getOrderHistory(data.phone)
      set({ history: history.data })
    } else {
      set({ history: [] })
    }
  },
}))

export const login = async (username: string, pin: string) => {
  const { data } = await Axios.post(StaffEndpoints.login, {
    identifier: username,
    pin,
  })
  return data
}

// Get order history with API call
export const getOrderHistory = async (phone: string) => {
  if (!phone) {
    return {
      data: [],
    }
  }
  try {
    const { data } = await Axios.get(OrderEndpoints.history(phone))
    return data
  } catch (error) {
    return {
      data: [],
    }
  }
}

// Add new customer with API call
export const addCustomer = async (data: iCustomer) => {
  try {
    const { data: res } = await Axios.post(CustomerEndpoints.add, data)
    return res
  } catch (error) {
    return null
  }
}
