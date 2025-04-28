// app/(app)/layout.tsx
'use client'

import React from 'react'
import { redirect } from 'next/navigation'
import { QueryClient, QueryClientProvider, useQuery } from 'react-query'

// Types
import { iCategory, iOrder, iProduct, iProfile } from '~/types'

// Libs
import { getSession } from '~/lib/auth'
import Axios from '~/lib/axios'
import {
  StaffEndpoints,
  CategoryEndpoints,
  ProductEndpoints,
  OrderEndpoints,
} from '~/lib/constants'

// Hooks
import { useApp } from '~/hooks/use-app'
import { useOrder } from '~/hooks/use-order'
import { useProduct } from '~/hooks/use-product'

// Components
import ModalProvider from '~/providers/modal-provider'
import { NavigationGuardLayout } from '~/components/layouts/navigation-guard-layout'
import { logout } from '~/app/pos/(auth)/login/actions'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      enabled: false, // Start with all queries disabled
      refetchOnWindowFocus: false,
      refetchInterval: 300000, // 5 minutes in milliseconds
      refetchIntervalInBackground: true,
      refetchOnReconnect: true,
      refetchOnMount: false,
      cacheTime: 1000 * 60 * 60, // 1 hour in milliseconds
    },
  },
})

// Inner component to use React hooks after QueryClientProvider is mounted
const AppContent = ({ children }: React.PropsWithChildren) => {
  const { setIsAuthenticated } = useApp()
  const { fetchModifiers } = useProduct()
  const { newOrder, setNewOrder } = useOrder()

  // Audio notification system
  const [userInteracted, setUserInteracted] = React.useState(false)
  const audioRef = React.useRef<HTMLAudioElement | null>(null)

  // Products query
  useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data } = await Axios.get(ProductEndpoints.getAll())
      return data?.data as iProduct[]
    },
  })

  // Profile query (for regular updates)
  useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const { data } = await Axios.get(StaffEndpoints.profile)
      return data?.data as iProfile
    },
    refetchInterval: 60000, // 1 minute in milliseconds
  })

  // Modifiers query
  useQuery({
    queryKey: ['modifiers'],
    queryFn: async () => fetchModifiers(),
  })

  // Categories query
  useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await Axios.get(CategoryEndpoints.getAll())
      return data?.data as iCategory[]
    },
  })

  // Profile query (for authentication)
  useQuery({
    queryKey: ['profile-auth'],
    queryFn: async () => {
      const { data } = await Axios.get(StaffEndpoints.profile)
      return data?.data as iProfile
    },
    onError: () => {
      logout()
      setIsAuthenticated(false)
      redirect('/pos/login')
    },
    onSuccess: () => {
      setIsAuthenticated(true)
    },
  })

  // Orders query
  const { data: orders } = useQuery({
    queryKey: ['takeouts'],
    queryFn: async () => {
      const { data } = await Axios.get(OrderEndpoints.takeouts)
      return data?.data as iOrder[]
    },
    refetchInterval: 5000, // 5 seconds
  })

  // Update new order state when orders change
  React.useEffect(() => {
    if (orders) {
      const hasNewOrder =
        orders &&
        orders.some((order: iOrder) => order.orderstatus === 'Pending')
      setNewOrder(hasNewOrder)
    }
  }, [orders, setNewOrder])

  // Detect user interaction for audio playback
  React.useEffect(() => {
    const handleUserInteraction = () => {
      setUserInteracted(true)
      window.removeEventListener('click', handleUserInteraction)
      window.removeEventListener('keydown', handleUserInteraction)
    }

    window.addEventListener('click', handleUserInteraction)
    window.addEventListener('keydown', handleUserInteraction)

    return () => {
      window.removeEventListener('click', handleUserInteraction)
      window.removeEventListener('keydown', handleUserInteraction)
    }
  }, [])

  // Play audio when new order is received
  React.useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio('/audio/notification_new_order.mp3')
    }

    const audio = audioRef.current
    if (newOrder && userInteracted) {
      audio.loop = true
      audio.play().catch(error => {
        console.error('Error playing audio', error)
      })
    } else {
      audio.pause()
      audio.currentTime = 0
    }
  }, [newOrder, orders, userInteracted])

  return (
    <div>
      <main>
        <ModalProvider />
        {children}
      </main>
    </div>
  )
}

const PosLayout = ({ children }: React.PropsWithChildren) => {
  const [mounted, setMounted] = React.useState(false)
  const initialCheckDone = React.useRef(false)
  const { setIsAuthenticated } = useApp()

  React.useEffect(() => {
    const checkAuth = async () => {
      if (initialCheckDone.current) return

      const session = await getSession()

      if (session) {
        // Only enable queries on initial auth check
        queryClient.setDefaultOptions({
          queries: {
            ...queryClient.getDefaultOptions().queries,
            enabled: true,
          },
        })

        // Initial data fetch
        queryClient.refetchQueries()

        try {
          const { data } = await Axios.get(StaffEndpoints.profile)
          if (!data) {
            throw new Error('Not authenticated')
          }
          setIsAuthenticated(true)
        } catch (error) {
          // Not authenticated
          logout()
          setIsAuthenticated(false)
          redirect('/pos/login')
        }
      } else {
        setIsAuthenticated(false)
        // Explicitly disable queries when not authenticated
        queryClient.setDefaultOptions({
          queries: {
            ...queryClient.getDefaultOptions().queries,
            enabled: false,
          },
        })
      }

      initialCheckDone.current = true
    }

    checkAuth()
    setMounted(true)

    window.addEventListener('beforeunload', (event: BeforeUnloadEvent) => {
      event.preventDefault()
    })

    return () => {
      window.removeEventListener('beforeunload', (event: BeforeUnloadEvent) => {
        event.preventDefault()
      })
    }
  }, [setIsAuthenticated])

  if (!mounted) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <QueryClientProvider client={queryClient}>
      <NavigationGuardLayout>
        <AppContent>{children}</AppContent>
      </NavigationGuardLayout>
    </QueryClientProvider>
  )
}

export default PosLayout
