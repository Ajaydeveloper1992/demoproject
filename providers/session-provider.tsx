'use client'
import { SessionProvider as SP } from 'next-auth/react'
export default function SessionProvider({ children }) {
  return <SP>{children}</SP>
}
