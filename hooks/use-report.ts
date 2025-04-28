import { create } from 'zustand'
import Axios from '~/lib/axios'
import { ReportEndpoints } from '~/lib/constants'
import { iDailyReport } from '~/types'

interface ReportStore {}

export const useReport = create<ReportStore>(set => ({}))

export const getDailyReport = async () => {
  try {
    const { data } = await Axios.get(ReportEndpoints.daily)
    return data.data?.data as iDailyReport
  } catch (error) {
    console.error('Error getting daily report:', error)
    return null
  }
}

// Send Report to email
export const sendReport = async () => {
  try {
    const { data } = await Axios.post(ReportEndpoints.send)
    return {
      data,
      success: true,
      message: 'Report sent successfully',
    }
  } catch (error) {
    console.log(error)
    return {
      success: false,
      message: 'Something went wrong. Please try again later',
    }
  }
}
