'use server'
import { cookies } from 'next/headers'
import { SESSION_KEY } from '~/lib/constants'

export async function createSession(token: string, expiryDays: number = 1) {
  const expiresAt = new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000)

  cookies().set(SESSION_KEY, token, {
    httpOnly: true,
    secure: true,
    expires: expiresAt,
  })
}

export async function deleteSession() {
  cookies().delete(SESSION_KEY)
}

export const getSession = async () => {
  return cookies().get(SESSION_KEY)
}
