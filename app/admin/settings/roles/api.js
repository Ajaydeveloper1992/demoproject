import axios from 'axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL

const createAxiosInstance = token => {
  return axios.create({
    baseURL: API_BASE_URL,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
}

export const fetchRoles = async (user_id, token) => {
  const axiosInstance = createAxiosInstance(token)
  const response = await axiosInstance.get('/roles', {
    params: { user_id }, // Send user_id as a query parameter
  })
  return response.data.data || []
}

export const addRole = async (roleName, user_id, token) => {
  const axiosInstance = createAxiosInstance(token)
  const response = await axiosInstance.post('/roles', {
    name: roleName,
    createdBy: user_id,
  })
  return response.data
}

export const deleteRole = async (id, token) => {
  const axiosInstance = createAxiosInstance(token)
  const response = await axiosInstance.delete(`/roles/delete/${id}`)
  return response
}

export const fetchRoleById = async (id, token) => {
  const axiosInstance = createAxiosInstance(token)
  const response = await axiosInstance.get(`/roles/${id}`)
  return response.data
}

export const updatePermissions = async (id, permissions, token) => {
  const axiosInstance = createAxiosInstance(token)
  const response = await axiosInstance.patch(`/roles/${id}/permissions`, {
    permissions,
  })
  return response.data
}
