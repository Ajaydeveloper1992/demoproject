'use server'

import { z } from 'zod'
import { createSession, deleteSession } from '~/lib/auth'
import { pinLoginSchema } from '~/types'
import { redirect } from 'next/navigation'
import Axios from '~/lib/axios'
import { StaffEndpoints } from '~/lib/constants'

export const login = async (data: z.infer<typeof pinLoginSchema>) => {
  try {
    const { data: response } = await Axios.post(StaffEndpoints.login, {
      identifier: data.username,
      pin: data.pin,
      url_slug: data.restaurant,
    })

    if (response?.success) {
      await createSession(response?.data?.token)

      return {
        success: true,
        message: 'Login successful',
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
      message: 'Invalid username or pins',
    }
  }
}

export const logout = async () => {
  await deleteSession()
}
