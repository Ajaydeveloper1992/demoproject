// @ts-nocheck
'use client'
import Link from 'next/link'
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import Toastify from 'toastify-js'
import { Eye, EyeOff, RefreshCw } from 'lucide-react'
import zxcvbn from 'zxcvbn'
import { Button } from '~/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Progress } from '~/components/ui/progress'

export default function Signup() {
  const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL
  const router = useRouter()
  const [user, setUser] = useState({
    fname: '',
    lname: '',
    email: '',
    password: '',
    username: '',
    phone: '',
    image: '',
    createdBy: '6708ff59463c37e6f4f0d714',
  })
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState(0)

  const isValidEmail = email => /\S+@\S+\.\S+/.test(email)

  const handleSubmit = async e => {
    e.preventDefault()
    setSuccessMessage('')
    setErrorMessage('')

    if (!isValidEmail(user.email)) {
      setErrorMessage('Please enter a valid email address.')
      return
    }

    if (user.password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.')
      return
    }

    try {
      const response = await axios.post(`${apiUrl}/users/register`, user, {
        headers: {
          'Content-Type': 'application/json',
        },
      })

      Toastify({
        text: response.data.message || 'Account created successfully!',
        duration: 3000,
        close: true,
        gravity: 'top',
        position: 'right',
        backgroundColor: 'linear-gradient(to right, #00b09b, #96c93d)',
        onClick: function () {},
      }).showToast()

      setSuccessMessage('Account created successfully! Redirecting to login...')
      setTimeout(() => {
        router.push('/login/verifyaccount')
      }, 2000)
    } catch (error) {
      const message =
        error.response?.data?.error || 'Signup failed. Please try again.'
      setErrorMessage(message)
      console.log('Signup failed', message)

      Toastify({
        text: message,
        duration: 3000,
        close: true,
        gravity: 'top',
        position: 'right',
        backgroundColor: 'linear-gradient(to right, #FF5C5C, #FF3B3B)',
        onClick: function () {},
      }).showToast()
    }
  }

  const generatePassword = () => {
    const charset =
      'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+{}[]|:;<>,.?'
    let newPassword = ''
    for (let i = 0; i < 12; i++) {
      newPassword += charset.charAt(Math.floor(Math.random() * charset.length))
    }
    setUser({ ...user, password: newPassword })
    checkPasswordStrength(newPassword)
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

  return (
    <Card className="mx-auto max-w-sm mt-20">
      {successMessage && (
        <div
          className="mt-2 bg-teal-100 border border-teal-200 text-sm text-teal-800 rounded-lg p-4"
          role="alert"
        >
          <span className="font-bold">Success</span> {successMessage}
        </div>
      )}
      {errorMessage && (
        <div
          className="mt-2 bg-red-100 border border-red-200 text-sm text-red-800 rounded-lg p-4"
          role="alert"
        >
          <span className="font-bold">Error</span> {errorMessage}
        </div>
      )}
      <CardHeader>
        <CardTitle className="text-xl">Sign Up</CardTitle>
        <CardDescription>
          Enter your information to create an account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="first-name">First name</Label>
                <Input
                  id="first-name"
                  value={user.fname}
                  onChange={e => setUser({ ...user, fname: e.target.value })}
                  placeholder="First Name"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="last-name">Last name</Label>
                <Input
                  id="last-name"
                  value={user.lname}
                  onChange={e => setUser({ ...user, lname: e.target.value })}
                  placeholder="Last Name"
                  required
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="Username"
                value={user.username}
                onChange={e => setUser({ ...user, username: e.target.value })}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Email Address"
                value={user.email}
                onChange={e => setUser({ ...user, email: e.target.value })}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={user.password}
                  onChange={e => {
                    setUser({ ...user, password: e.target.value })
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
            <Button type="submit" className="w-full">
              Create an account
            </Button>
          </div>
          <div className="mt-4 text-center text-sm">
            Already have an account?{' '}
            <Link href="/login" className="underline">
              Sign in
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
