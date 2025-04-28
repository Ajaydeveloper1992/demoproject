export const API_VERSION = process.env.NEXT_PUBLIC_API_VERSION || 'api/v1'
export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
// site base url/domain
export const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
export const SESSION_KEY = 'session'

export const LAYOUT = 'BOXED'
export const HEADER_HEIGHT = 48
export const TAX_RATE = 13

export const ProductEndpoints = {
  getAll: () => 'product/getproducts',
  getById: (id: string | number) => `product/${id}`,
}

export const CategoryEndpoints = {
  getAll: () => 'categories/getcategories',
  getById: (id: string | number) => `category/${id}`,
}

export const OrderEndpoints = {
  new: 'orders/createorders',
  takeouts: 'orders/takeout',
  getAll: () => 'orders/getorders',
  getById: (id: string) => `orders/getorders/${id}`,
  history: (phone: string) => `orders/orderhistory/?phone=${phone}`,
  updateById: (id: string) => `orders/editorders/${id}`,
  accept: (id: string) => `orders/editorders/${id}`,
  reject: `orders/rejectorder`,
  delayorder: `orders/delayorder`,
  emailReceipt: `orders/orderemail`,
  voidItem: `voidorder/voidItems`,
  refund: `orders/refundItem`,
  kitchenReceipt: (rest: string) => `starcloudprnt/${rest}/kitchen`,
  customerReceipt: (rest: string) => `starcloudprnt/${rest}/customer-receipt`,
}

export const CustomerEndpoints = {
  add: 'customer/createcustomer',
  getAll: () => 'customer/getallcustomers',
  getById: (id: string | number) => `customer/${id}`,
}

export const ReportEndpoints = {
  daily: 'reports/dailyreport',
  send: 'reports/senddailyreport',
}

export const StaffEndpoints = {
  login: 'staff',
  profile: 'staff/profile',
}

export const ModifierEndpoints = {
  getAll: 'modifers/getmodifiers',
}

export const RestaurantEndpoints = {
  edit: (id: string) => `restaurant/editrestaurants/${id}`,
}
