'use client'
import React, { useState } from 'react'
import axios from 'axios'
import { useRouter } from 'next/navigation'
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
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert'
import { CheckCircle2, XCircle } from 'lucide-react'
import Link from 'next/link'
export default function EmailVerification() {
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState(null)
  const router = useRouter()
  const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL
  const handleSubmit = async e => {
    e.preventDefault()
    setIsLoading(true)
    setMessage(null)

    try {
      const response = await axios.post(`${apiUrl}/users/verifyemail`, {
        email,
        otp,
      })
      setMessage({ type: 'success', text: response.data.message })
      router.push('/login')
    } catch (error) {
      setMessage({
        type: 'error',
        text:
          error.response?.data?.message ||
          'An error occurred. Please try again.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-[350px] mx-auto mt-10">
      <CardHeader>
        <CardTitle>Verify Email</CardTitle>
        <CardDescription>
          Enter your email and OTP to verify your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="otp">OTP</Label>
            <Input
              id="otp"
              type="text"
              placeholder="Enter your OTP"
              value={otp}
              onChange={e => setOtp(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Verifying...' : 'Verify Email'}
          </Button>
        </form>
        {message && (
          <Alert
            className={`mt-4 ${
              message.type === 'success' ? 'bg-green-100' : 'bg-red-100'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <XCircle className="h-4 w-4" />
            )}
            <AlertTitle>
              {message.type === 'success' ? 'Success' : 'Error'}
            </AlertTitle>
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}
        <div className="mt-4 text-center text-sm">
          Already have an account?{' '}
          <Link href="/login" className="underline">
            Sign in
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
