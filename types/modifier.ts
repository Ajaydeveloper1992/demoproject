import { iProduct } from './product'

export interface iModifier {
  _id: string
  name: string
  priceAdjustment?: number
  isActive?: boolean
  modifiersgroup: iModifierGroup
  createdBy?: string
  posEnabled?: boolean
  onlineEnabled?: boolean
  createdAt?: Date
  updatedAt?: Date
  defaultSelected: boolean
}

export interface iModifierGroup {
  _id: string
  pos: {
    allowedModifiersCount: number
    description?: string
    enabled?: boolean
    isActive?: boolean
    name: string
    requiredModifiersCount: number
  }
}

export interface iPosWeb {
  name: string
  description?: string
  isActive?: boolean
  enabled?: boolean
  requiredModifiersCount: number
  allowedModifiersCount: number
}

interface iModifiers {
  _id: string
  pos: iPosWeb
  web: iPosWeb
  modifiers: iModifier[]
  selectedProducts: iProduct[]
  createdBy: string
  createdAt?: Date
  updatedAt?: Date
}

export default iModifiers
