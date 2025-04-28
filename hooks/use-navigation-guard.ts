import { useEffect, useCallback } from 'react'
import { usePathname, useRouter } from 'next/navigation'
// Hooks
import { useCart } from '~/hooks/use-cart'
import { useCustomer } from '~/hooks/use-customer'

export const useNavigationGuard = () => {
  const pathname = usePathname()
  const router = useRouter()
  const { setSelectCustomer } = useCustomer()
  const { data, clearCart } = useCart()

  // Check if current path is protected
  const isProtectedPath = useCallback(() => {
    // Protect main POS page
    if (pathname === '/pos') return true

    // Protect POS sub-routes
    if (
      pathname.startsWith('/pos/') &&
      !pathname.includes('/login') &&
      !pathname.includes('/logout')
    ) {
      return true
    }

    // Match exactly '/orders/new' or '/orders/{id}' where id is not 'list' or other known routes
    if (pathname === '/orders/new') return true

    // For /orders/[id] routes, make sure it's not /orders/list or other known static routes
    const orderIdMatch = pathname.match(/^\/orders\/([^/]+)$/)
    if (orderIdMatch) {
      const orderId = orderIdMatch[1]
      // Exclude known static routes
      const excludedRoutes = ['list', 'new', 'history', 'pending']

      // Don't protect if the path contains 'checkout'
      // if (pathname.includes('checkout')) return false

      return !excludedRoutes.includes(orderId)
    }

    return false
  }, [pathname])

  // Check if there are any items not sent to kitchen
  const hasUnsentItems = useCallback(() => {
    return data.some(item => !item.inKitchen)
  }, [data])

  // Prevent navigation if there are unsent items and we're on a protected path
  const preventNavigation = useCallback(() => {
    return hasUnsentItems() && isProtectedPath()
  }, [hasUnsentItems, isProtectedPath])

  useEffect(() => {
    if (!isProtectedPath()) return

    const currentUrl = window.location.pathname + window.location.search
    window.history.pushState(null, '', currentUrl)

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (preventNavigation()) {
        e.preventDefault()
        e.returnValue = ''
      }
    }

    const handlePopState = async (e: PopStateEvent) => {
      if (preventNavigation()) {
        // Preserve the query params
        const currentUrl = window.location.pathname + window.location.search
        window.history.pushState(null, '', currentUrl)

        const shouldNavigate = window.confirm(
          'You have items in your cart. Are you sure you want to leave?'
        )

        if (shouldNavigate) {
          await clearCart()
          await setSelectCustomer(null)
          window.history.go(e.state?.idx > window.history.state?.idx ? 1 : -1)
        }
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    window.addEventListener('popstate', handlePopState)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      window.removeEventListener('popstate', handlePopState)
    }
  }, [pathname, data, preventNavigation, isProtectedPath])

  // For programmatic navigation
  const guardNavigation = async (to: string) => {
    if (preventNavigation()) {
      const shouldNavigate = window.confirm(
        'You have items in your cart. Are you sure you want to leave?'
      )
      if (shouldNavigate) {
        // Clear states if navigates away
        await clearCart()
        await setSelectCustomer(null)
        await router.push(to)
        return true
      }
      return false
    }
    // If not on protected path or no items in cart, just navigate
    router.push(to)
    return true
  }

  return { guardNavigation }
}
