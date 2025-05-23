import { Inter } from 'next/font/google'
//import "../globals.css";
import Sidebar from './components/sidebar'

const inter = Inter({ subsets: ['latin'] })
export const metadata = {
  title: 'Ziz Zap Pos',
  description: 'Ziz Zap Pos',
}
export default function RootLayout({ children }) {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <main className="flex min-h-[calc(100vh_-_theme(spacing.16))] flex-1 flex-col gap-4 bg-muted/40 p-4 md:gap-8 md:p-10">
        <div className="mx-auto grid w-full gap-2">
          <h1 className="text-3xl font-semibold">Settings</h1>
        </div>
        <div className="mx-auto grid w-full items-start gap-6 md:grid-cols-[180px_1fr] lg:grid-cols-[250px_1fr]">
          <nav
            className="grid gap-4 text-sm text-muted-foreground"
            x-chunk="dashboard-04-chunk-0"
          >
            <Sidebar />
          </nav>
          <div className="grid gap-6">{children}</div>
        </div>
      </main>
    </div>
  )
}
