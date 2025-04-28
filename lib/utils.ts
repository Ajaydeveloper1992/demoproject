import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { formatDistanceToNow } from 'date-fns'
// Hooks
import { CartState } from '~/hooks/use-cart'
import { iModifier } from '~/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const timeAgo = (dateString: string): string => {
  const date = new Date(dateString)
  return formatDistanceToNow(date, { addSuffix: true })
}

// Save to local storage
export const saveToLocal = (key: string, data: any) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(key, JSON.stringify(data))
  }
}

// Get from local storage
export const getFromLocal = (key: string) => {
  if (typeof window !== 'undefined') {
    const data = localStorage.getItem(key)
    if (!data) return null
    try {
      return JSON.parse(data)
    } catch (error) {
      console.error('Error parsing JSON:', error)
      return null
    }
  }
}

export function countCategories(posts: any[]): Map<string, number> {
  const categoryCounts = new Map<string, number>()

  posts.forEach(post => {
    post.categories?.forEach(category => {
      const count = categoryCounts.get(category.id) || 0
      categoryCounts.set(category.id, count + 1)
    })
  })

  return categoryCounts
}

export function countTags(posts: any[]): Map<string, number> {
  const tagCounts = new Map<string, number>()

  posts.forEach(post => {
    post.tags?.forEach(tag => {
      const count = tagCounts.get(tag.id) || 0
      tagCounts.set(tag.id, count + 1)
    })
  })

  return tagCounts
}

// Get the modifiers for the item from useProduct
export const populateModifiers = (
  item: { [key: string]: string[] },
  modifiers: iModifier[]
) => {
  const _modifiers = {}
  if (!item) return _modifiers
  Object.keys(item).forEach(key => {
    if (!_modifiers[key]) _modifiers[key] = []
    if (!item[key] || !Array.isArray(item[key])) return
    _modifiers[key] = item[key].map(id => modifiers.find(mod => mod._id === id))
  })
  return _modifiers
}

// Calculate the base total of a single item with modifiers
export const calculateBaseTotal = (
  item: CartState['data'][0],
  modifiersList: iModifier[]
) => {
  const modifiersTotal = Object.entries(item.modifiers || {}).reduce(
    (total, [key, selectedIds]) => {
      if (!Array.isArray(selectedIds)) return total

      return (
        total +
        selectedIds.reduce((acc, id) => {
          const modifier = modifiersList.find(m => m._id === id)
          return acc + (modifier?.priceAdjustment || 0)
        }, 0)
      )
    },
    0
  )

  return (item?.item?.posprice || 0) + modifiersTotal
}

// Apply discount to the total
export const applyDiscount = (
  total: number,
  discount: CartState['discount']
) => {
  if (discount) {
    if (discount.type === '%') {
      total -= (total * discount.value) / 100
    } else if (discount.type === '$') {
      total -= discount.value
    }
  }
  return total
}

// Calculate the total of a single item with modifiers and discount
export const calculateItemTotal = (
  item: CartState['data'][0],
  modifiersList: iModifier[] = []
) => {
  let total = calculateBaseTotal(item, modifiersList) * item.quantity
  total = applyDiscount(total, item.itemDiscount)
  return total
}

// Generate fixed amounts
export const generateFixedAmounts = (total: number): number[] => {
  // Round total to 2 decimal places
  const roundedTotal = Math.round(total * 100) / 100

  // Get next whole dollar amount
  const nextDollar = Math.ceil(total)

  // Return fixed amounts
  return [roundedTotal, nextDollar, nextDollar + 0.5, nextDollar + 1.0]
}

export const formatCurrency = (
  amount: number,
  currency: string = 'USD'
): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
  }).format(amount)
}

// Format time and date e.g: 12:00 PM, 1st Jan 2022
export const formatDateTime = (date: Date): string => {
  const dateTime = new Date(date)
  return dateTime.toLocaleString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

// Format to modifers id array
export const formatedModifiers = (modifiers: any) => {
  if (!modifiers) return []
  return Object.values(modifiers).flat()
}

// Transform modifiers
export const transformModifiers = (modifiers: iModifier[]) => {
  if (!modifiers) return {}

  // First create a map to store unique modifier groups
  const groupsMap = new Map()

  // Group modifiers by modifiersgroup
  const grouped = modifiers.reduce((acc: any, modifier) => {
    const groupId = modifier.modifiersgroup?._id
    if (!acc[groupId]) {
      acc[groupId] = []
    }
    acc[groupId].push(modifier._id)
    return acc
  }, {})

  // Transform into final format
  const result = {}
  modifiers.forEach((modifier: iModifier) => {
    const groupId = modifier.modifiersgroup
    console.log(modifier)
    if (!groupsMap.has(groupId)) {
      groupsMap.set(groupId, modifier.name)
      result[groupId?.pos?.name] = grouped[groupId?._id]
    }
  })

  return result
}
