'use client'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Copyright } from 'lucide-react'
import { Button } from '~/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '~/components/ui/dialog'
import { useAdmin } from '~/hooks/use-admin'
import axios from 'axios'
export default function Footer() {
  const { data: session, status } = useSession()
  const [userdata, setUserdata] = useState({})
  const [showLoginModal, setShowLoginModal] = useState(false)
  const setUserDetails = useAdmin(state => state.setUserDetails)
  const router = useRouter()
  useEffect(() => {
    setUserdata(session)
  }, [session, status])

  useEffect(() => {
    if (!userdata || Object.keys(userdata).length === 0) {
      setShowLoginModal(true)
    } else {
      setShowLoginModal(false)
    }
  }, [userdata])

  const toggleSidebar = () => {
    setIsOpen(!isOpen)
  }

  const handlelogin = () => {
    router.push('/login')
  }

  // async function fetchData() {
  //   let token = userdata?.user && userdata?.user?.name ? userdata.user.name.token : '';
  //   const response = await axios.post(`${process.env.NEXT_PUBLIC_API_BASE_URL}/contactlist/`, {}, {
  //     headers: {
  //       "Content-Type": "multipart/form-data",
  //       Authorization: `Bearer ${token}`,
  //     },
  //   });
  // }
  // setInterval(fetchData, 86400000);
  const currentYear = new Date().getFullYear()
  return (
    <div className="py-4 text-center text-sm text-muted-foreground">
      <div className="flex items-center justify-center">
        <Copyright className="mr-2 h-4 w-4" />
        <p>Copyright © {currentYear} Zipzappos. All rights reserved.</p>
      </div>
      <Dialog open={showLoginModal} onOpenChange={setShowLoginModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Login Required</DialogTitle>
            <DialogDescription>
              Please log in to access the dashboard.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center mt-4">
            <Button onClick={handlelogin}>Log In</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
