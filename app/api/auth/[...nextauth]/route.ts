import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        identifier: { label: 'Email or Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
        otp: { label: 'otp', type: 'text' },
      },
      async authorize(credentials) {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/users/verify-otp`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              identifier: credentials?.identifier,
              password: credentials?.password,
              otp: credentials?.otp,
            }),
          }
        )

        const response = await res.json() // Use response instead of user
        console.log(res.ok, response) // Log response for debugging

        // Check for successful response and return user data
        if (res.ok && response.success) {
          const user = response.data // Get user data from response
          return {
            id: user.id, // Make sure to return user ID
            name: user, // Return user name
            email: user.email, // Return user email
          }
        } else {
          console.log('Authentication failed:', response.message || response)
          return null // Return null if authentication fails
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id // Store user ID
        token.name = user.name // Store user name
        token.email = user.email // Store user email
        token.accessToken = user.accessToken // Store access token if available
      }
      return token
    },
    async session({ session, token }) {
      session.user.id = token.id // Include user ID in session
      session.user.name = token.name // Include user name in session
      session.user.email = token.email // Include user email in session
      session.accessToken = token.accessToken // Include access token in session
      return session
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: '/login', // Redirect to your login page
    error: '/api/auth/error', // Error page if authentication fails
  },
}
// Export the GET and POST methods for handling authentication
export const GET = (req, res) => NextAuth(req, res, authOptions)
export const POST = (req, res) => NextAuth(req, res, authOptions)
