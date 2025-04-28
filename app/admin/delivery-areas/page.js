'use client'
import { useState, useEffect } from 'react'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '~/components/ui/card'

export default function LiveOrder() {
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft())

  useEffect(() => {
    const timer = setTimeout(() => {
      setTimeLeft(calculateTimeLeft())
    }, 1000)

    return () => clearTimeout(timer)
  })

  function calculateTimeLeft() {
    const difference = +new Date('2023-12-31') - +new Date()
    let timeLeft = {}

    if (difference > 0) {
      timeLeft = {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      }
    }

    return timeLeft
  }

  return (
    <div className="min-h-screen bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center">
            Coming Soon
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center mb-6">
            <p className="text-lg mb-4">
              Our website is under construction. We&apos;ll be here soon with
              our new awesome site!
            </p>
            <div className="flex justify-center space-x-4">
              {Object.entries(timeLeft).map(([unit, value]) => (
                <div key={unit} className="text-center">
                  <div className="text-3xl font-bold">{value}</div>
                  <div className="text-sm uppercase">{unit}</div>
                </div>
              ))}
            </div>
          </div>
          <form className="space-y-4">
            <Input type="email" placeholder="Enter your email" />
            <Button className="w-full">Notify Me</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
