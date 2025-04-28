import { z } from 'zod'
import { iProduct } from './product'
import { iRestaurant } from './restaurant'
import { iCustomer, iUser } from './customer'

export interface iOrder {
  _id: string
  orderNumber: string
  date: Date
  server: iRestaurant
  customer: iCustomer
  phone: string
  orderType: 'Online' | 'Pickup'
  paymentStatus?:
    | 'Pending'
    | 'Paid'
    | 'Failed'
    | 'Refunded'
    | 'Partially Refunded'
  subtotal: number
  tip?: number
  tax?: number
  total: number
  orderstatus?:
    | 'Pending'
    | 'InKitchen'
    | 'Voided'
    | 'Complete'
    | 'Rejected'
    | 'Refunded'
    | 'Partially Refunded'
  origin: 'POS' | 'Online'
  items: {
    id: string
    _id: string
    price: number
    quantity: number
    timestamp: Date
    modifiers?: {
      [key: string]: string[]
    }
    item: iProduct
    itemcustomname?: string
    itemNote?: string
    itemStatus?: 'Voided' | 'Refunded' | 'Partially Refunded'
    itemReason?: string
    refundQuantity?: number
    itemDiscount?: {
      type: '$' | '%'
      value: number
    }
  }[]
  pickupInfo?: {
    orderType?: string
    pickupTime?: string
    selectedDate?: Date
    delayTime?: string
  }
  specialInstructions?: string
  createdBy?: {
    _id: string
    email: string
    fname: string
    lname?: string
    phone: string
    image?: string
    role: string
    createdBy: string
    usertype: string
    status: string
    accessrestaurant: string
    selectedRestaurants: string[]
  }
  staffid?: iUser
  voidedby?: iUser
  refundby?: iUser
  createdAt?: Date
  updatedAt?: Date
  orderDiscount?: {
    type: '$' | '%'
    value: number
  }
  itemStatus?: 'Voided' | 'Refunded' | 'Partially Refunded'
  itemReason?: string
}

export interface iOrderBody {
  server?: iRestaurant
  customer?: string
  phone?: string
  orderType?: 'Online' | 'Pickup'
  payments?: { method: 'Cash' | 'Card'; amount: number }[]
  paymentStatus?:
    | 'Pending'
    | 'Paid'
    | 'Failed'
    | 'Refunded'
    | 'Partially Refunded'
  total?: number
  subtotal?: number
  tip?: number
  orderstatus?:
    | 'Pending'
    | 'InKitchen'
    | 'Voided'
    | 'Complete'
    | 'Rejected'
    | 'Refunded'
    | 'Partially Refunded'
  items?: {
    item: iProduct
    quantity: number
    price: number
    modifiers?: string[]
    itemNote?: string
    itemDiscount?: {
      type: '$' | '%'
      value: number
    }
  }[]
  totalRefund?: number
  pickupInfo?: {
    orderType?: string
    pickupTime?: string
    selectedDate?: Date
    delayTime?: string
  }
  specialInstructions?: string
  nuviepaymentinfo?: string
  orderDiscount?: {
    type: '$' | '%'
    value: number
  }
  tax: number
}

export interface iOrderUpdate {
  orderNumber: string
  paymentStatus?: 'Pending' | 'Paid' | 'Failed' | 'Refunded'
  orderstatus?:
    | 'Pending'
    | 'InKitchen'
    | 'Voided'
    | 'Complete'
    | 'Rejected'
    | 'Refunded'
    | 'Partially Refunded'
  items: {
    item: string
    quantity: number
    price: number
  }[]
}

export interface iVoidOrderBody {
  orderId: string
  ordervoidreason: string
  itemsToVoid: {
    itemId: string
    itemVoidReason: string
  }[]
}

export interface iRefundOrderBody {
  orderId: string
  refundReason: string
  paymentMethod: 'Cash' | 'Card'
  itemsToRefund?: {
    itemId: string
    refundQuantity: number
    itemStatus: 'Refunded' | 'Partially Refunded'
    refundReason: string
  }[]
}

export type iReceiptBody =
  | {
      uniqueID: string
      printtype: 'kitchen' | 'customer' | 'kitchenall' | 'dailyreport'
      printingInProgress: boolean
      printarea_name: 'kitchen' | 'customer-receipt'
      statusCode: string
      printQty?: number
      splitqty?: number
      Printstatus: boolean
    }
  | {
      uniqueID: string
      printtype: 'quote'
      printingInProgress: boolean
      printarea_name: 'kitchen' | 'customer-receipt'
      statusCode: string
      printQty?: number
      splitqty?: number
      Printstatus: boolean
      // Required fields for quote type
      orderNumber: string
      createdAt: Date
      subtotal: number
      tax: number
      tip: number
      total: number
      storedetails: {
        name: string
        businessPhone: string
        ownerEmail: string
        address: string
        // address: {
        //   streetAddress: string
        //   city: string
        //   province: string
        //   postalCode: string
        //   country: string
        // }
        receiptForExistingCustomer: boolean
      }
      customer: {
        customertype: string
        name: string
        phone: string
      }
      items: {
        item: {
          name: string
          webprice: number
        }
        quantity: number
        price: number
        itemNote: string
        modifiers: {
          name: string
          priceAdjustment: number
          modifiersgroup: {
            pos: {
              name: string
            }
            modifiers: {
              name: string
              priceAdjustment: number
            }[]
          }
        }[]
      }[]
      nuviepaymentinfo: {
        method: string
        status: string
      }
    }

export const updateOrderSchema = z.object({
  paymentStatus: z.enum(['Pending', 'Paid', 'Failed', 'Refunded']).optional(),
  orderstatus: z
    .enum([
      'Pending',
      'InKitchen',
      'Voided',
      'Complete',
      'Rejected',
      'Partially Refunded',
    ])
    .optional(),
})

export default iOrder
