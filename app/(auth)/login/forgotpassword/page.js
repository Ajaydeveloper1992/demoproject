'use client'
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
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
export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState(null) // Initialize as null
  const router = useRouter()
  const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL

  const handleSubmit = async e => {
    e.preventDefault()

    try {
      const response = await fetch(`${apiUrl}/users/forget-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      // Set the message as an object
      setMessage({
        type: response.ok ? 'success' : 'error', // Determine the type based on response
        text: data.message || 'An unexpected error occurred.', // Use the message from the API
      })
      if (response.ok) {
        router.push('/login/resetpassword')
      }
    } catch (error) {
      console.error('Error:', error)
      setMessage({
        type: 'error',
        text: 'An error occurred. Please try again.',
      })
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle>Forgot Password</CardTitle>
          <CardDescription>
            Enter your email to reset your password.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full">
              Reset Password
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
            Remember your password?{' '}
            <Link href="/login" className="text-blue-600 hover:underline">
              Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
