import Head from 'next/head'
import '../web-globals.css'
import Header from './components/header'
import Footer from './components/footer'
import Sidebar from './components/sidebar'
import { cn } from '~/lib/utils'
import { Inter } from 'next/font/google'
import { UserProvider } from '~/hooks/UserContext'
// import "./globals.css";
const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Ziz Zap Pos',
  description: 'Ziz Zap Pos',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Header />
        <div className="flex">
          <div className="hidden md:block">
            <Sidebar />
          </div>
          <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8 mt-12">
            <UserProvider>{children}</UserProvider>
          </main>
        </div>
        <Footer />
      </body>
    </html>
  )
}
