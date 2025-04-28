'use client'
import { useState, useEffect } from 'react'
import { MenuIcon } from 'lucide-react'
import { Sheet, SheetContent, SheetTrigger } from '~/components/ui/sheet'
import Menulist from './menu-list'
// import { SideNav } from "~/components/layout/side-nav";
// import { NavItems } from "~/components/constants/side-nav";

export default function MobileSidebar() {
  const [open, setOpen] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Only render if mounted
  if (!isMounted) {
    return null
  }

  return (
    <>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <div className="flex items-center justify-center gap-2">
            <MenuIcon />
            <h1 className="text-lg font-semibold">ZipZapPos</h1>
          </div>
        </SheetTrigger>
        <SheetContent side="left" className="w-72">
          <div className="px-1 py-6 pt-16">
            {/* <SideNav items={NavItems} setOpen={setOpen} /> */}
            <Menulist />
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
