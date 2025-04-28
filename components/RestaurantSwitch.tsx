import React from 'react'
import { motion } from 'framer-motion'
import { redirect } from 'next/navigation'
import { useMutation, useQuery } from 'react-query'
import { iProfile, iStatus } from '~/types'
// Libs
import Axios from '~/lib/axios'
import { cn } from '~/lib/utils'
import { StaffEndpoints } from '~/lib/constants'
// Hooks
import { toggleStatus, useApp } from '~/hooks/use-app'
import { logout } from '~/app/pos/(auth)/login/actions'
// Components
import Icon from '~/components/icon'
import { Switch } from '~/components/ui/switch'

interface Props extends React.HTMLAttributes<HTMLDivElement> {
  className?: string
}

const RestaurantSwitch: React.FC<Props> = ({ className }) => {
  const { setIsAuthenticated } = useApp()

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const { data } = await Axios.get(StaffEndpoints.profile)
      return data?.data as iProfile
    },
    onError: () => {
      logout()
      setIsAuthenticated(false)
      redirect('/pos/login')
    },
    onSuccess: data => {
      setIsAuthenticated(true)
    },
  })
  const restaurant = profile?.selectedRestaurants[0]
  const [isOpen, setIsOpen] = React.useState(
    restaurant?.status === 'open' ? true : false
  )

  // Set the initial status
  React.useEffect(() => {
    if (restaurant?.status) {
      setIsOpen(restaurant.status === 'open')
    }
  }, [profile])

  const { mutateAsync: toggle, isLoading } = useMutation({
    mutationFn: (data: iStatus) => {
      if (!restaurant?._id) return Promise.reject('No restaurant found')
      return toggleStatus(restaurant._id, data)
    },
    onSuccess: () => {
      // Update the orders list
    },
    onError: (err, newTodo, context) => {
      // TODO: Handle error
    },
  })

  const onToggle = async () => {
    setIsOpen(prev => !prev)
    await toggle({ status: isOpen ? 'closed' : 'open' } as iStatus)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        className,
        'fixed bottom-5 right-4 p-4',
        'backdrop-blur-md rounded-xl shadow-lg',
        'border border-gray-200/20 transition-all duration-500',
        isOpen
          ? 'bg-gradient-to-r from-green-500/20 via-emerald-500/10 to-teal-500/20'
          : 'bg-gradient-to-r from-gray-500/20 via-slate-500/10 to-zinc-500/20',
        'dark:border-gray-700/20',
        isOpen
          ? 'dark:from-green-900/40 dark:via-emerald-900/30 dark:to-teal-900/40'
          : 'dark:from-gray-900/40 dark:via-slate-900/30 dark:to-zinc-900/40',
        'hover:shadow-xl hover:scale-105 hover:border-opacity-50',
        isOpen
          ? 'hover:border-green-200/30 dark:hover:border-green-700/30'
          : 'hover:border-gray-200/30 dark:hover:border-gray-700/30'
      )}
    >
      <div className="flex items-center gap-4">
        <div className="flex flex-col items-start">
          <motion.span
            className="text-xs mb-1"
            animate={{
              color: isOpen ? '#10B981' : '#6B7280',
            }}
          >
            Restaurant Status
          </motion.span>
          <div className="flex items-center gap-2">
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                transition: { duration: 0.3 },
              }}
            >
              {isLoading ? (
                <Icon
                  name="Loader"
                  className="animate-spin size-4 text-yellow-500"
                />
              ) : isOpen ? (
                <Icon name="Clock" className="size-4 text-green-500" />
              ) : (
                <Icon name="Moon" className="size-4 text-gray-400" />
              )}
            </motion.div>
            <motion.span
              animate={{
                color: isOpen ? '#10B981' : '#6B7280',
              }}
              className="font-medium"
            >
              {isLoading ? 'Updating...' : isOpen ? 'Open' : 'Closed'}
            </motion.span>
          </div>
        </div>

        <Switch
          id="restaurant-status"
          checked={isOpen}
          onCheckedChange={onToggle}
          disabled={isLoading || !restaurant?._id}
          className={cn(
            'ml-2',
            'data-[state=checked]:bg-green-500',
            'data-[state=unchecked]:bg-gray-300',
            'transition-all duration-300',
            'hover:scale-105'
          )}
        />
      </div>
    </motion.div>
  )
}

export default RestaurantSwitch
