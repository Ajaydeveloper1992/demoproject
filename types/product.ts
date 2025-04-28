import iModifier from './modifier'

export interface iProduct {
  _id: string
  name: string
  itemcustomname?: string
  description?: string
  sku?: string
  barcode?: string
  mediaFiles?: string[]
  categories?: {
    _id: string
    name: string
    slug: string
  }[]
  webprice: number
  websalleprice?: number
  posprice: number
  possalleprice?: number
  stockQuantity?: number
  lowStockThreshold?: number
  taxRule?: string
  modifiersgroup?: iModifier[]
  createdBy?: string
  trackInventory?: boolean
  allowBackorders?: boolean
  taxEnable?: boolean
  selectedPrinters?: string[]
  showOnPos?: boolean
  showOnWeb?: boolean
  selectedRestaurants?: string[]
  createdAt?: Date
  updatedAt?: Date
}

// {
//   "defaultSelected": true,
//   "_id": "67137710586f0f6afec84984",
//   "name": "small",
//   "priceAdjustment": 1,
//   "isActive": true,
//   "createdBy": {
//       "_id": "6708ff59463c37e6f4f0d714",
//       "username": "superadmin",
//       "email": "ajay.shriwas1992@gmail.com",
//       "password": "$2a$10$CDIwbw7nQtuZUphQD11p7.2u2ckF0ym7zLDt7MMytxYVlT6LhUm.C",
//       "fname": "John",
//       "lname": "Doe",
//       "phone": "1234567890",
//       "image": "url_to_image",
//       "role": "670c017e7b8a143435fb4742",
//       "createdBy": "6708e1f254bc995e7b79a336",
//       "usertype": "restaurant_owner",
//       "status": "active",
//       "accessrestaurant": "",
//       "createdAt": "2024-10-11T10:35:05.584Z",
//       "updatedAt": "2025-01-14T23:32:39.996Z",
//       "__v": 1,
//       "selectedRestaurants": [],
//       "otp": null,
//       "otpExpires": null,
//       "pin": "123456"
//   },
//   "posEnabled": true,
//   "onlineEnabled": true,
//   "createdAt": "2024-10-19T09:08:32.812Z",
//   "updatedAt": "2024-10-24T09:52:14.814Z",
//   "__v": 0,
//   "modifiersgroup": null
// },
export interface iModifiers {
  defaultSelected: boolean
  _id: string
  name: string
  priceAdjustment: number
  isActive: boolean
  createdBy: string
  posEnabled: boolean
  onlineEnabled: boolean
  createdAt: Date
  updatedAt: Date
  modifiersgroup: iModifier[]
}
