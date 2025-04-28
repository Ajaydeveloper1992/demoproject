'use client'
import { useSession } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import axios from 'axios' // Ensure axios is imported
import { useAdmin } from '~/hooks/use-admin'
export default function Sidebar() {
  const { data: session } = useSession()
  const [userdata, setUserdata] = useState({})
  const userDetails = useAdmin(state => state.userDetails)
  const pathname = usePathname()
  useEffect(() => {
    setUserdata(session)
  }, [session])
  const getLinkClass = path => {
    return pathname === path
      ? 'font-semibold text-primary'
      : 'text-muted-foreground'
  }
  console.log('Login Details ', userDetails?.user?.usertype)

  return (
    <>
      {userDetails?.user?.usertype == 'restaurant_owner' && ( // Check usertype correctly
        <>
          <Link
            href="/admin/settings/"
            className={getLinkClass('/admin/settings/')}
          >
            General
          </Link>
          <Link
            href="/admin/settings/roles"
            className={getLinkClass('/admin/settings/roles')}
          >
            Role Management
          </Link>
          <Link
            href="/admin/settings/taxrules"
            className={getLinkClass('/admin/settings/taxrules')}
          >
            Tax Rules
          </Link>
          <Link
            href="/admin/settings/addprinter"
            className={getLinkClass('/admin/settings/addprinter')}
          >
            Add Printer
          </Link>
          {/* <Link href="/admin/settings/paymentsettings" className={getLinkClass('/admin/settings/paymentsettings')}>
                    Payment Settings
                </Link> */}
        </>
      )}
      {/* Links visible to all users */}
      <Link
        href="/admin/settings/profile"
        className={getLinkClass('/admin/settings/profile')}
      >
        Profile
      </Link>
    </>
  )
}
