import Settingmenu from './settingmenu'
import MobileSidebar from './mobile-sidebar'
import Link from 'next/link'
import Image from 'next/image'
import { Boxes } from 'lucide-react'
import { cn } from '~/lib/utils'
export default function Header() {
  return (
    <div className="fixed top-0 left-0 right-0 supports-backdrop-blur:bg-background/60 border-b bg-background/95 backdrop-blur z-20">
      <nav className="h-14 flex items-center justify-between px-4">
        <div className="">
          <Link
            href={'/'}
            className="hidden items-center justify-between gap-2 md:flex"
          >
            {/* <Boxes className="h-6 w-6" /> */}
            {/* <h1 className="text-lg font-semibold">ZipZapPos</h1> */}
            <Image
              src="/images/zipzappos-logo.svg"
              alt="ZipZappos Logo"
              width={150} // Adjust width
              height={50} // Adjust height
            />
          </Link>
          <div className={cn('block md:!hidden')}>
            <MobileSidebar />
          </div>
        </div>
        {/* <ThemeToggle /> */}
        <Settingmenu />
      </nav>
    </div>
  )
}
