import axios from 'axios'
import { API_VERSION, API_URL } from '~/lib/constants'
import { getSession, deleteSession } from '~/lib/auth'
import { redirect } from 'next/navigation'

const Axios = axios.create({
  baseURL: API_URL + API_VERSION,
  headers: {
    Accept: 'application/json',
  },
})

// Request interceptor to add JWT token to headers
Axios.interceptors.request.use(
  async config => {
    const token = await getSession()
    if (token?.value) {
      config.headers['Authorization'] = `Bearer ${token.value}`
    }
    return config
  },
  error => Promise.reject(error)
)

Axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response && error.response.status === 401) {
      deleteSession()
      redirect('/pos/login')
    }
    // Return the Promise.reject to properly propagate the error
    return Promise.reject(
      error.response?.data || error.message || 'Something went wrong'
    )
  }
)

export default Axios
