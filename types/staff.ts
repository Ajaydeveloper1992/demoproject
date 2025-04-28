import { z } from 'zod'
import { iRestaurant } from './restaurant'

export const pinLoginSchema = z.object({
  username: z
    .string()
    .min(2, { message: 'Username or Email is required' })
    .max(30, { message: 'Username or Email is too long' })
    // check if its username or email. if email, check if its valid
    .refine(
      value => {
        if (value.includes('@')) {
          const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
          return emailRegex.test(value)
        }
        return true
      },
      { message: 'Invalid email address' }
    ),
  pin: z.string().min(4, { message: 'PIN is required' }),
  restaurant: z.string().min(1, { message: 'Restaurant Slug is required' }),
})

export type iRole = {
  _id: String
  name: String
  createdBy: String
  createdAt: String
  updatedAt: String
  permissions: {
    Dashboard: {
      add: Boolean
      view: Boolean
      update: Boolean
      delete: Boolean
      _id: String
    }
    Products: {
      add: Boolean
      view: Boolean
      update: Boolean
      delete: Boolean
      _id: String
    }
    Orders: {
      add: Boolean
      view: Boolean
      update: Boolean
      delete: Boolean
      _id: String
    }
    Liveorders: {
      add: Boolean
      view: Boolean
      update: Boolean
      delete: Boolean
      _id: String
    }
    Customers: {
      add: Boolean
      view: Boolean
      update: Boolean
      delete: Boolean
      _id: String
    }
    Restaurant: {
      add: Boolean
      view: Boolean
      update: Boolean
      delete: Boolean
      _id: String
    }
    Tables: {
      add: Boolean
      view: Boolean
      update: Boolean
      delete: Boolean
      _id: String
    }
    Kds: {
      add: Boolean
      view: Boolean
      update: Boolean
      delete: Boolean
      _id: String
    }
    Pos: {
      add: Boolean
      view: Boolean
      update: Boolean
      delete: Boolean
      _id: String
    }
    Staff: {
      add: Boolean
      view: Boolean
      update: Boolean
      delete: Boolean
      _id: String
    }
    Qrbuilder: {
      add: Boolean
      view: Boolean
      update: Boolean
      delete: Boolean
      _id: String
    }
    Deliveryareas: {
      add: Boolean
      view: Boolean
      update: Boolean
      delete: Boolean
      _id: String
    }
    Plan: {
      add: Boolean
      view: Boolean
      update: Boolean
      delete: Boolean
      _id: String
    }
    Finances: {
      add: Boolean
      view: Boolean
      update: Boolean
      delete: Boolean
      _id: String
    }
    AddProduct: {
      add: Boolean
      view: Boolean
      update: Boolean
      delete: Boolean
      _id: String
    }
    ManageCategories: {
      add: Boolean
      view: Boolean
      update: Boolean
      delete: Boolean
      _id: String
    }
    tags: {
      add: Boolean
      view: Boolean
      update: Boolean
      delete: Boolean
      _id: String
    }
    Modifiersgroup: {
      add: Boolean
      view: Boolean
      update: Boolean
      delete: Boolean
      _id: String
    }
  }
}

export type iProfile = {
  _id: String
  email: String
  fname: String
  lname: String
  phone: String
  image: String
  role: iRole
  createdBy: String
  usertype: String
  status: String
  accessrestaurant: String
  selectedRestaurants: iRestaurant[]
}
