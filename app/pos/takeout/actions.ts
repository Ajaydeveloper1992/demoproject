'use server'

import { iOrderBody } from '~/types'
import Axios from '~/lib/axios'
import { OrderEndpoints } from '~/lib/constants'

export const updateOrder = async (id: string, data: iOrderBody) => {
  try {
    const { data: response } = await Axios.put(OrderEndpoints.updateById(id), {
      ...data,
    })

    console.log(response)

    if (response?.success) {
      return {
        success: true,
        message: 'Order updated successfully',
      }
    }

    return {
      success: false,
      message: 'Something went wrong. Please try again later',
    }
  } catch (error) {
    console.log(error)
    return {
      success: false,
      message: 'Something went wrong. Please try again later',
    }
  }
}

export const rejectOrder = async (order_id: string, message: string) => {
  try {
    const { data: response } = await Axios.post(OrderEndpoints.reject, {
      order_id,
      message,
    })

    console.log(response)

    if (response?.success) {
      return {
        success: true,
        message: 'Order rejected successfully',
      }
    }

    return {
      success: false,
      message: 'Something went wrong. Please try again later',
    }
  } catch (error) {
    console.log(error)
    return {
      success: false,
      message: 'Something went wrong. Please try again later',
    }
  }
}
