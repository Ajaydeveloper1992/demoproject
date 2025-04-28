'use client'
import React, { useState } from 'react'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card'

export default function ForgotPassword() {
  const [code, setVerifyCode] = useState('')

  const handleSubmit = e => {
    e.preventDefault()
    // Here you would typically call an API to handle the password reset
    console.log('Password reset requested for:', code)
    // You could also add some user feedback here
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle>Verify</CardTitle>
          <CardDescription>Enter your Code to Verify Account.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label
                htmlFor="verifycode"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Enter Code
              </label>
              <Input
                id="verifycode"
                type="verifycode"
                placeholder="Enter your code"
                value={code}
                onChange={e => setVerifyCode(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full">
              Verify
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            Remember your password?{' '}
            <a href="/login" className="text-blue-600 hover:underline">
              Login
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
