'use client'
import React, { useState } from 'react'
import axios from 'axios'
import { Eye, EyeOff, CheckCircle2, XCircle, RefreshCw } from 'lucide-react'
import zxcvbn from 'zxcvbn'
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
import { Progress } from '~/components/ui/progress'
import Link from 'next/link'
export default function ResetPassword() {
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState(null)
  const [passwordStrength, setPasswordStrength] = useState(0)
  const router = useRouter()
  const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL
  const handleSubmit = async e => {
    e.preventDefault()
    setIsLoading(true)
    setMessage(null)

    try {
      const response = await axios.post(`${apiUrl}/users/reset-password`, {
        email,
        otp,
        newPassword,
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

  const checkPasswordStrength = password => {
    const result = zxcvbn(password)
    setPasswordStrength(result.score * 25)
  }

  const getPasswordStrengthColor = () => {
    if (passwordStrength <= 25) return 'bg-red-500'
    if (passwordStrength <= 50) return 'bg-orange-500'
    if (passwordStrength <= 75) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const generatePassword = () => {
    const charset =
      'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+{}[]|:;<>,.?'
    let generatedPassword = ''
    for (let i = 0; i < 16; i++) {
      generatedPassword += charset.charAt(
        Math.floor(Math.random() * charset.length)
      )
    }
    setNewPassword(generatedPassword)
    checkPasswordStrength(generatedPassword)
  }

  return (
    <Card className="w-[350px] mx-auto mt-10">
      <CardHeader>
        <CardTitle>Reset Password</CardTitle>
        <CardDescription>
          Enter your email, OTP, and new password
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
          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter new password"
                value={newPassword}
                onChange={e => {
                  setNewPassword(e.target.value)
                  checkPasswordStrength(e.target.value)
                }}
                required
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-gray-500" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-500" />
                )}
              </button>
            </div>
            <Progress
              value={passwordStrength}
              className={`h-1 ${getPasswordStrengthColor()}`}
            />
            <div className="flex justify-between items-center mt-1">
              <span className="text-xs text-gray-500">Password strength</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={generatePassword}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Generate Password
              </Button>
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Resetting...' : 'Reset Password'}
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
  )
}
