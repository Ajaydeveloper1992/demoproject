// @ts-nocheck
'use client'
import { useEffect } from 'react'
import { signIn, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import React from 'react'
import { Button } from '~/components/ui/button'
import Toastify from 'toastify-js'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import Link from 'next/link'
import axios from 'axios'
import Loading from '../_components/Loading'
import { useRestaurant } from '~/hooks/use-restaurant'

export default function Login({ params }) {
  const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL
  const { restId } = params
  const { data: session } = useSession()
  const router = useRouter()
  const [loading, setLoading] = React.useState(false)
  const [step, setStep] = React.useState(1) // 1 = login with password, 2 = verify OTP
  const [user, setUser] = React.useState({
    identifier: '',
    password: '',
    otp: '',
  })
  const [errorMessage, setErrorMessage] = React.useState('')
  const setRestaurant = useRestaurant(state => state.setRestaurant)
  const restaurant = useRestaurant(state => state.restaurant)

  useEffect(() => {
    const fetchRestaurant = async () => {
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/restaurant/getrestaurants/${restId}`
        )
        setRestaurant(response.data) // Set restaurant data in Zustand
      } catch (error) {
        console.error('Error fetching restaurant data:', error)
      }
    }

    fetchRestaurant()
  }, [restId, setRestaurant])
  // Resturent Data
  const showToast = (text, success) => {
    Toastify({
      text,
      duration: 3000,
      close: true,
      gravity: 'top',
      position: 'right',
      backgroundColor: success
        ? 'linear-gradient(to right, #00b09b, #96c93d)'
        : 'linear-gradient(to right, #FF5C5C, #FF3B3B)',
    }).showToast()
  }

  console.log('Restaurant createdBy ID', restaurant?.data?.createdBy?._id)

  if (!restaurant) {
    return (
      <>
        <main className="flex min-h-screen flex-col items-center justify-between p-2">
          <Loading />
        </main>
      </>
    )
    // Show loading indicator
  }
  const onLogin = async e => {
    e.preventDefault()
    setLoading(true)
    setErrorMessage('')

    try {
      const response = await axios.post(`${apiUrl}/staff/login`, {
        identifier: user.identifier,
        password: user.password,
        createdBy: restaurant?.data?.createdBy?._id,
      })

      if (response.status === 200) {
        showToast('OTP sent to your email!', true)
        setStep(2) // Move to OTP verification step
      }
    } catch (error) {
      const message =
        error.response?.data?.error || 'An unexpected error occurred.'
      setErrorMessage(message)
      showToast(message, false)
    } finally {
      setLoading(false)
    }
  }

  const onVerifyOtp = async e => {
    e.preventDefault()
    setLoading(true)
    setErrorMessage('')
    try {
      const result = await signIn('credentials', {
        redirect: false,
        identifier: user.identifier, // Change to match your API's expected field
        otp: user.otp,
      })
      if (result.error) {
        const errorMessage =
          result.error === 'CredentialsSignin'
            ? 'Sorry, you have entered an incorrect OTP.'
            : 'An unexpected error occurred.'
        setErrorMessage(errorMessage)
        Toastify({
          text: errorMessage,
          duration: 3000,
          close: true,
          gravity: 'top',
          position: 'right',
          backgroundColor: 'linear-gradient(to right, #FF5C5C, #FF3B3B)',
        }).showToast()
      } else {
        showToast('Login successful!', true)
        router.push('/admin') // Redirect to the admin page
      }
    } catch (error) {
      const message =
        error.response?.data?.error || 'An unexpected error occurred.'
      setErrorMessage(message)
      showToast(message, false)
    } finally {
      setLoading(false)
    }
  }

  // Resend OTP function
  const resendOtp = async () => {
    setLoading(true)
    setErrorMessage('')

    try {
      const response = await axios.post(`${apiUrl}/users/login`, {
        identifier: user.identifier,
        password: user.password,
      })
      if (response.status === 200) {
        showToast('OTP has been resent to your email!', true)
      }
    } catch (error) {
      const message =
        error.response?.data?.error || 'An unexpected error occurred.'
      setErrorMessage(message)
      showToast(message, false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="mx-auto max-w-sm mt-20">
      {errorMessage && (
        <div
          className="mt-2 bg-red-100 border border-red-200 text-sm text-red-800 rounded-lg p-4"
          role="alert"
        >
          <span className="font-bold"></span> {errorMessage}
        </div>
      )}
      <CardHeader>
        <CardTitle className="text-2xl">Login</CardTitle>
        <CardDescription>
          {step === 1
            ? 'Enter your email and password to receive an OTP.'
            : 'Enter the OTP sent to your email.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {step === 1 ? (
          <div className="grid gap-2">
            <Label htmlFor="identifier">Email or Username</Label>
            <Input
              id="identifier"
              type="text"
              value={user.identifier}
              onChange={e => setUser({ ...user, identifier: e.target.value })}
              placeholder="Email or Username"
              required
            />
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={user.password}
              onChange={e => setUser({ ...user, password: e.target.value })}
              placeholder="Password"
              required
            />
            <Button onClick={onLogin} className="w-full" disabled={loading}>
              {loading ? 'Sending OTP...' : 'Send OTP'}
            </Button>
          </div>
        ) : (
          <div className="grid gap-2">
            <Label htmlFor="otp">Enter OTP</Label>
            <Input
              id="otp"
              type="text"
              value={user.otp}
              onChange={e => setUser({ ...user, otp: e.target.value })}
              placeholder="Enter OTP"
              required
            />
            <Button onClick={onVerifyOtp} className="w-full" disabled={loading}>
              {loading ? 'Verifying...' : 'Verify OTP'}
            </Button>
            <Button
              onClick={resendOtp}
              className="w-full mt-2"
              disabled={loading}
            >
              {loading ? 'Resending...' : 'Resend OTP'}
            </Button>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <div className="mt-4 text-center text-sm">
          Do you not have an account?{' '}
          <Link href="/signup" className="underline">
            Sign up
          </Link>
        </div>
        <div className="mt-4 text-center text-sm">
          Forgot your password?{' '}
          <Link
            href="/login/forgotpassword"
            className="text-blue-600 hover:underline"
          >
            Reset Password
          </Link>
        </div>
      </CardFooter>
    </Card>
  )
}
