import { z } from 'zod'

export interface iAddress {
  street?: string
  city?: string
  state?: string
  zipCode?: string
}

export interface iCustomer {
  _id?: string
  firstName: string
  lastName?: string
  email?: string
  phone: string
  address?: iAddress
  createdBy?: string
  createdAt?: Date
  updatedAt?: Date
  customertype?: 'R' | 'N'
  note?: string
}

export interface iUser {
  _id?: string
  username: string
  email: string
  password: string
  pin?: string
  fname: string
  lname: string
  phone?: string
  image?: string
  role?: string
  createdBy?: string
  usertype?: string
  status?: string
  selectedRestaurants?: string[]
  otp?: string
  otpExpires?: Date
}
