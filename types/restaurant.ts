export interface iServicesOffered {
  pickUp: boolean
  delivery: boolean
  dineIn: boolean
}

export interface iRestaurant {
  _id?: string
  name: string
  url_slug?: string
  address: string
  status: 'open' | 'closed' | 'pending'
  createdBy: string
  businessLogo?: string
  bannerImage?: string
  businessDescription?: string
  businessStoreclose?: string
  businessPhone?: string
  minimumOrderValue?: number
  averageOrderPrepTime?: number
  timeSlots?: number
  ownerName?: string
  ownerPhone?: string
  ownerEmail?: string
  websiteurl?: string
  openingHours?: string
  servicesOffered: iServicesOffered
  createdAt?: Date
  updatedAt?: Date
}

export interface iStatus {
  status: iRestaurant['status']
}
