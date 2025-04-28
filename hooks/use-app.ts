import { z } from 'zod'
import { create } from 'zustand'
import { iStatus, pinLoginSchema } from '~/types'
// Libs
import Axios from '~/lib/axios'
import { createSession, deleteSession } from '~/lib/auth'
import { RestaurantEndpoints, StaffEndpoints } from '~/lib/constants'
import { getFromLocal, saveToLocal } from '~/lib/utils'

interface AppStore {
  isAuthenticated: boolean
  setIsAuthenticated: (value: boolean) => void
  isLoading: boolean
  setIsLoading: (value: boolean) => void
  restaurant?: string
}

export const useApp = create<AppStore>(set => ({
  isAuthenticated: false,
  setIsAuthenticated: value => set({ isAuthenticated: value }),
  isLoading: false,
  setIsLoading: value => set({ isLoading: value }),
  restaurant: getFromLocal('restId'),
}))

// Toggles the status of a restaurant
export const toggleStatus = async (id: string, body: iStatus) => {
  const { data } = await Axios.put(RestaurantEndpoints.edit(id), body)
  return data
}

export const login = async (data: z.infer<typeof pinLoginSchema>) => {
  try {
    const { data: response } = await Axios.post(StaffEndpoints.login, {
      identifier: data.username,
      pin: data.pin,
      url_slug: data.restaurant,
    })

    if (response?.success) {
      await createSession(response?.data?.token)

      saveToLocal('restId', data.restaurant)

      return await Promise.resolve({
        success: true,
        message: 'Login successful',
      })
    }

    await Promise.reject({
      success: false,
      message: 'Invalid username or pins',
    })
  } catch (error) {
    console.log(error)
    await Promise.reject({
      success: false,
      message: 'Invalid username or pins',
    })
  }
}

export const logout = async () => {
  await deleteSession()
}
