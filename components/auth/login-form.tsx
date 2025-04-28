'use client'

import React from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { pinLoginSchema } from '~/types'
// Hooks
import { cn } from '~/lib/utils'
import { useApp } from '~/hooks/use-app'
// Components
import { NumericKeypad } from '~/components/payment/NumericKeypad'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card'
import Icon from '~/components/icon'
import { Form, FormMessage } from '~/components/ui/form'

interface Props {
  onSubmit: (values: z.infer<typeof pinLoginSchema>) => void
  error?: string
  isLoading?: boolean
}

const LoginForm = ({ onSubmit, error, isLoading }: Props) => {
  const [isPinVisible, setIsPinVisible] = React.useState(false)

  const { restaurant } = useApp()

  const form = useForm<z.infer<typeof pinLoginSchema>>({
    resolver: zodResolver(pinLoginSchema),
    defaultValues: { username: '', pin: '', restaurant: restaurant },
  })

  const { register, getValues, setValue } = form

  const handleNumberClick = (num: string) => {
    if (getValues('pin') === '') {
      setValue('pin', num)
    } else {
      const pin = getValues('pin')
      if (pin && pin.length < 8) {
        setValue('pin', pin + num)
      }
    }
  }

  const handleClear = () => setValue('pin', '')

  const handleBackspace = () => {
    const pin = getValues('pin')
    if (pin && pin.length > 1) {
      setValue('pin', pin.slice(0, -1))
    } else {
      setValue('pin', '')
    }
  }

  const getCurrentTime = () => {
    const now = new Date()
    return now.toLocaleString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  }

  const getCurrentDate = () => {
    const now = new Date()
    const day = now.getDate()
    const month = now.toLocaleString('en-US', { month: 'short' })
    const year = now.getFullYear()

    const getOrdinalSuffix = (day: number) => {
      if (day > 3 && day < 21) return 'th'
      switch (day % 10) {
        case 1:
          return 'st'
        case 2:
          return 'nd'
        case 3:
          return 'rd'
        default:
          return 'th'
      }
    }

    return `${day}${getOrdinalSuffix(day)} ${month}, ${year}`
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
        <div className="min-h-screen bg-gradient-to-br from-teal-600 to-teal-800 p-6 flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl font-bold">
                Welcome Back!
              </CardTitle>
              <CardDescription className="flex items-center justify-center gap-2 text-lg font-semibold text-primary">
                {getCurrentDate()} | {getCurrentTime()}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <Label htmlFor="restaurant">Restaurant ID</Label>
                <Input
                  id="restaurant"
                  {...register('restaurant')}
                  placeholder="Enter your restaurant ID"
                  className={cn(
                    form.formState.errors.username && 'ring-1 !ring-red-500'
                  )}
                />
              </div>
              <div>
                <Label htmlFor="username">Username or Email</Label>
                <div className="space-y-1">
                  <Input
                    id="username"
                    {...register('username')}
                    placeholder="Enter your username or email"
                    className={cn(
                      form.formState.errors.username && 'ring-1 !ring-red-500'
                    )}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="pin">Enter PIN</Label>
                  <div className="relative -mb-2">
                    <Input
                      id="pin"
                      type={isPinVisible ? 'text' : 'password'}
                      {...register('pin')}
                      max={8}
                      className={cn(
                        'text-center text-2xl tracking-widest',
                        form.formState.errors.pin && 'ring-1 !ring-red-500'
                      )}
                      onBlur={() => form.trigger('pin')}
                      pattern="[0-9]*"
                      onChange={e => {
                        const value = e.target.value
                          .replace(/\D/g, '')
                          .slice(0, 8)
                        setValue('pin', value)
                      }}
                    />

                    <Button
                      variant="ghost"
                      className="absolute top-1/2 right-1 -translate-y-1/2 w-6 h-6 p-1"
                      onClick={() => setIsPinVisible(!isPinVisible)}
                    >
                      {isPinVisible ? (
                        <Icon name="EyeOff" />
                      ) : (
                        <Icon name="Eye" />
                      )}
                    </Button>
                  </div>
                </div>
                {error && error !== '' ? (
                  <FormMessage>{error}</FormMessage>
                ) : (
                  <FormMessage>
                    {form.formState.errors.username?.message ||
                      form.formState.errors.pin?.message}
                  </FormMessage>
                )}
                <NumericKeypad
                  onNumberClick={handleNumberClick}
                  onClear={handleClear}
                  onBackspace={handleBackspace}
                  customPads={['0', '00', '000']}
                  isLoading={isLoading}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </form>
    </Form>
  )
}

export default LoginForm
