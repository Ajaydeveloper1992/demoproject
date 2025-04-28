'use client'
import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { Plus, Trash2, Copy } from 'lucide-react'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Card } from '~/components/ui/card'
import Toastify from 'toastify-js'
import 'toastify-js/src/toastify.css'
import { useAdmin } from '~/hooks/use-admin'
import axios from 'axios'

export default function AddPrinter() {
  const { data: session } = useSession()
  const [userdata, setUserdata] = useState({})
  const [printAreas, setPrintAreas] = useState([])
  const userDetails = useAdmin(state => state.userDetails)
  const [isCopied, setIsCopied] = useState(false)

  useEffect(() => {
    setUserdata(session)
  }, [session])

  const apiUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/starcloudprnt`

  useEffect(() => {
    const fetchPrintAreas = async () => {
      let userId = ''
      if (userDetails?.user?.usertype === 'restaurant_owner') {
        userId = userdata?.user?.id
      } else {
        userId = userDetails?.user?.createdBy
      }
      const token = userdata?.user?.name?.token || ''

      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/printarea/getprintareauserid/${userId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )
        setPrintAreas(response.data.data)
      } catch (error) {
        console.error('Error fetching print areas:', error)
      }
    }
    fetchPrintAreas()
  }, [userdata, userDetails])

  const copyToClipboard = async url => {
    try {
      await navigator.clipboard.writeText(url)
      setIsCopied(true)

      Toastify({
        text: 'API URL copied to clipboard!',
        duration: 3000,
        close: true,
        gravity: 'top',
        position: 'right',
        backgroundColor: 'green',
        stopOnFocus: true,
      }).showToast()

      setTimeout(() => setIsCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy: ', err)

      Toastify({
        text: 'Failed to copy URL',
        duration: 3000,
        close: true,
        gravity: 'top',
        position: 'right',
        backgroundColor: 'red',
        stopOnFocus: true,
      }).showToast()
    }
  }

  return (
    <>
      <h1 className="text-3xl font-bold mb-4">Printer Area </h1>
      {printAreas.map((printArea, index) => (
        <Card key={index} className="w-full mb-4">
          <div className="container mx-auto p-4">
            <h2 className="text-lg font-semibold mb-2">{printArea.name}</h2>
            <div className="flex flex-wrap items-center mb-4">
              {printArea.selectedRestaurants?.map(restaurant => (
                <span
                  key={restaurant._id}
                  className="bg-gray-100 text-gray-800 px-2 py-1 rounded mr-2"
                >
                  {restaurant.name}
                </span>
              ))}
            </div>
            <div className="flex items-center space-x-2">
              <Input
                type="text"
                value={`${apiUrl}/${
                  printArea.selectedRestaurants?.[0]?.url_slug || ''
                }/${printArea.slug_name}`}
                readOnly
                className="flex-grow"
              />
              <Button
                onClick={() =>
                  copyToClipboard(
                    `${apiUrl}/${
                      printArea.selectedRestaurants?.[0]?.url_slug || ''
                    }/${printArea.slug_name}`
                  )
                }
                variant="outline"
                size="icon"
                className={isCopied ? 'bg-green-500 text-white' : ''}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </>
  )
}
