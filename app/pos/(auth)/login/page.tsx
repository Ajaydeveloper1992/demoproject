'use client'

import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { useMutation, useQueryClient } from 'react-query'
import { pinLoginSchema } from '~/types'
// Hooks
import { login } from '~/hooks/use-app'
// Components
import LoginForm from '~/components/auth/login-form'

const Login = () => {
  const router = useRouter()
  const queryClient = useQueryClient()

  console.log('TESTE')

  const {
    mutate: handleLogin,
    error,
    isLoading,
  } = useMutation({
    mutationKey: 'login',
    mutationFn: (data: z.infer<typeof pinLoginSchema>) => login(data),
    onSuccess: async () => {
      // Enable and refetch queries after successful login
      await queryClient.setDefaultOptions({
        queries: {
          ...queryClient.getDefaultOptions().queries,
          enabled: true,
        },
      })

      // Invalidate all queries after successful login
      queryClient.invalidateQueries()

      console.log('Refetching')
      queryClient.refetchQueries()

      router.replace('/pos')
    },
    onError: (err: Error, newTodo, context) => {
      console.error(err)
    },
  })

  const handleSubmit = async (values: z.infer<typeof pinLoginSchema>) => {
    handleLogin(values)
  }

  return (
    <LoginForm
      error={error?.message}
      isLoading={isLoading}
      onSubmit={handleSubmit}
    />
  )
}

export default Login
