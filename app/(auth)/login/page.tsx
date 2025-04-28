// @ts-nocheck
'use client'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import React from 'react'
import { Button } from '~/components/ui/button'
import { toast } from 'sonner'
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

export default function Login() {
  const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL
  const router = useRouter()
  const [loading, setLoading] = React.useState(false)
  const [step, setStep] = React.useState(1) // 1 = login with password, 2 = verify OTP
  const [user, setUser] = React.useState({
    identifier: '',
    password: '',
    otp: '',
  })
  const [errorMessage, setErrorMessage] = React.useState('')

  const onLogin = async e => {
    e.preventDefault()
    setLoading(true)
    setErrorMessage('')

    try {
      const response = await axios.post(`${apiUrl}/users/login`, {
        identifier: user.identifier,
        password: user.password,
      })

      if (response.status === 200) {
        // showToast('OTP sent to your email!', true)
        toast.success('OTP sent to your email!')
        setStep(2) // Move to OTP verification step
      }
    } catch (error) {
      console.log('Error', error.response?.data?.message)
      const message =
        error.response?.data?.message || 'An unexpected error occurred'
      setErrorMessage(message)
      toast.error(message)
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
      if (result?.error) {
        const errorMessage =
          result.error === 'CredentialsSignin'
            ? 'Invalid email or password.'
            : 'An unexpected error occurred.'
        setErrorMessage(errorMessage)
        toast.error(errorMessage)
      } else {
        toast.success('Login successful!')
        router.push('/admin') // Redirect to the admin page
      }
    } catch (error) {
      const message =
        error.response?.data?.message || 'An unexpected error occurred'

      setErrorMessage(message)
      toast.error(message)
      console.log('Data Results ' + JSON.stringify(error.response))
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
          <span className="font-bold">Danger:</span> {errorMessage}
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
