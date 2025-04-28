interface iCategory {
  _id: string
  name: string
  slug: string
  description?: string
  parent?: string
  isActive?: boolean
  createdBy: string
  showOnPos?: boolean
  showOnWeb?: boolean
  selectedRestaurants?: string[]
  image?: string
  createdAt?: Date
  updatedAt?: Date
}

export default iCategory
