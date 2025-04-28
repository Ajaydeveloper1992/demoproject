import { create } from 'zustand'

export type AdminState = {
  products: any[]
  cart: any[]
  restaurant: any
  pickupInfo: {
    orderType: string
    orderTime: string
    selectedDate: string
    selectedTime: string
  }
  paymentSettings: any
  userDetails: any
  setInitialStoreState: () => void
  setRestaurant: (restaurant: any) => void
  setUserDetails: (userDetails: any) => void
  addProduct: (product: any) => void
  removeProduct: (productId: string) => void
  addToCart: (product: any) => void
  removeFromCart: (uniqueKey: string) => void
  updateCartQuantity: (uniqueKey: string, quantity: number) => void
  clearCart: () => void
  updatePickupInfo: (pickupInfo: any) => void
  setPaymentSettings: (settings: any) => void
  getCartTotal: () => number
  getCartItemCount: () => number
  resetStore: () => void
}

// Helper function to load from localStorage only on the client side
const loadFromLocalStorage = (key, defaultValue) => {
  if (typeof window !== 'undefined') {
    const savedData = localStorage.getItem(key)
    return savedData ? JSON.parse(savedData) : defaultValue
  }
  return defaultValue
}

// Helper function to save to localStorage
const saveToLocalStorage = (key, value) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(key, JSON.stringify(value))
  }
}

export const useAdmin = create<AdminState>((set, get) => ({
  products: [],
  cart: [],
  restaurant: null,
  pickupInfo: {
    orderType: 'Pickup',
    orderTime: 'ASAP',
    selectedDate: 'Today',
    selectedTime: '',
  },
  paymentSettings: {},
  userDetails: null,

  // Initialize from localStorage after the component mounts on the client side
  setInitialStoreState: () => {
    const products = loadFromLocalStorage('products', [])
    const cart = loadFromLocalStorage('cart', [])
    const restaurant = loadFromLocalStorage('restaurant', null)
    const pickupInfo = loadFromLocalStorage('pickupInfo', {
      orderType: 'Pickup',
      orderTime: 'ASAP',
      selectedDate: 'Today',
      selectedTime: '8:00 PM',
    })
    const paymentSettings = loadFromLocalStorage('paymentSettings', {})
    const userDetails = loadFromLocalStorage('userDetails', null)

    set({
      products,
      cart,
      restaurant,
      pickupInfo,
      paymentSettings,
      userDetails,
    })
  },

  // Set restaurant data
  setRestaurant: restaurant => {
    set({ restaurant })
    saveToLocalStorage('restaurant', restaurant)
  },

  // Set user details
  setUserDetails: userDetails => {
    set({ userDetails })
    saveToLocalStorage('userDetails', userDetails)
  },

  // Product management
  addProduct: product =>
    set(state => {
      const newProducts = [...state.products, product]
      saveToLocalStorage('products', newProducts)
      return { products: newProducts }
    }),

  removeProduct: productId =>
    set(state => {
      const newProducts = state.products.filter(
        product => product.id !== productId
      )
      saveToLocalStorage('products', newProducts)
      return { products: newProducts }
    }),

  // Cart management
  addToCart: product =>
    set(state => {
      // Generate a unique key for each cart item based on product and its modifiers
      const uniqueKey = generateUniqueKey(product)
      const existingItem = state.cart.find(item => item.uniqueKey === uniqueKey)

      // If the product with the same modifiers is already in the cart, increase the quantity
      if (existingItem) {
        const newCart = state.cart.map(item =>
          item.uniqueKey === uniqueKey
            ? { ...item, quantity: item.quantity + product.quantity }
            : item
        )
        saveToLocalStorage('cart', newCart)
        return { cart: newCart }
      }

      // If it's a new item, add to cart
      const newItem = { ...product, quantity: product.quantity, uniqueKey }
      const newCart = [...state.cart, newItem]
      saveToLocalStorage('cart', newCart)
      return { cart: newCart }
    }),

  removeFromCart: uniqueKey =>
    set(state => {
      const newCart = state.cart.filter(item => item.uniqueKey !== uniqueKey)
      saveToLocalStorage('cart', newCart)
      return { cart: newCart }
    }),

  // Update cart item quantity
  updateCartQuantity: (uniqueKey, quantity) =>
    set(state => {
      const newCart = state.cart.map(item =>
        item.uniqueKey === uniqueKey
          ? { ...item, quantity: Math.max(1, quantity) }
          : item
      )
      saveToLocalStorage('cart', newCart)
      return { cart: newCart }
    }),

  clearCart: () => {
    set({ cart: [] })
    saveToLocalStorage('cart', [])
  },

  // Update pickup info
  updatePickupInfo: pickupInfo => {
    set({ pickupInfo })
    saveToLocalStorage('pickupInfo', pickupInfo)
  },

  setPaymentSettings: settings => {
    set({ paymentSettings: settings })
    saveToLocalStorage('paymentSettings', settings)
  },

  getCartTotal: () => {
    const total = get().cart.reduce(
      (sum, product) => sum + product.price * product.quantity,
      0
    )
    return total
  },

  getCartItemCount: () => {
    const itemCount = useAdmin
      .getState()
      .cart.reduce((count, product) => count + product.quantity, 0)
    return itemCount
  },

  resetStore: () => {
    set({
      products: [],
      cart: [],
      restaurant: null,
      pickupInfo: {
        orderType: '',
        orderTime: '',
        selectedDate: '',
        selectedTime: '',
      },
      paymentSettings: {},
      userDetails: null,
    })

    // Clear localStorage for all relevant keys
    localStorage.removeItem('products')
    localStorage.removeItem('cart')
    localStorage.removeItem('restaurant')
    localStorage.removeItem('pickupInfo')
    localStorage.removeItem('paymentSettings')
    localStorage.removeItem('userDetails')
  },
}))

// Generate unique key based on product ID and modifiers
const generateUniqueKey = product => {
  const modifierString = Object.entries(product.modifiers || {})
    .sort()
    // @ts-ignore
    .map(([key, values]) => `${key}:${values.sort().join(',')}`)
    .join('|')
  return `${product.id}_${modifierString}`
}
