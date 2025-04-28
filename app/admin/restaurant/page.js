'use client'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import React, { useEffect, useState } from 'react'
import axios from 'axios'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '~/components/ui/alert-dialog'
import { Button } from '~/components/ui/button'
import { PlusCircle, Edit, Trash2 } from 'lucide-react'
import Toastify from 'toastify-js'
export default function RestaurantTable() {
  const { data: session } = useSession()
  const router = useRouter()
  const [restaurants, setRestaurants] = useState([])
  const [loading, setLoading] = useState(true)
  const [userdata, setUserdata] = useState({})
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectRestaurantId, setSelectedRestaurant] = useState(null)
  const [action, setAction] = useState(null)

  useEffect(() => {
    setUserdata(session)
  }, [session])
  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        let userId = userdata.user ? userdata.user.id : ''
        let token =
          userdata.user && userdata.user.name ? userdata.user.name.token : ''
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/restaurant/getrestaurantsuserid/${userId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )
        setRestaurants(response.data.data)
      } catch (error) {
        console.error('Error fetching restaurants:', error)
      } finally {
        setLoading(false) // Set loading to false after fetching
      }
    }

    fetchRestaurants()
  }, [userdata])

  //console.log(restaurants);

  const handleAddRestaurant = () => {
    router.push('/admin/restaurant/new')
  }

  const handleEdit = id => {
    router.push(`/admin/restaurant/edit?id=${id}`)
    //router.push(`/admin/restaurant/edit/${id}`);
  }
  // Delete Restaurant
  const handleConfirmation = restaurantId => {
    setSelectedRestaurant(restaurantId)
    setDialogOpen(true)
  }
  const handleDelete = async () => {
    //  if (confirm('Are you sure you want to delete this restaurant?')) {}
    try {
      let userId = userdata.user ? userdata.user.id : ''
      let token =
        userdata.user && userdata.user.name ? userdata.user.name.token : ''
      const response = await axios.delete(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/restaurant/deleterestaurants/${selectRestaurantId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      // Remove the deleted restaurant from the state
      setRestaurants(prevData =>
        prevData.filter(restaurant => restaurant._id !== selectRestaurantId)
      )
      Toastify({
        text: 'Delete successful',
        duration: 3000, // Duration in milliseconds
        close: true, // Show close button
        gravity: 'top', // `top` or `bottom`
        position: 'right', // `left`, `center` or `right`
        backgroundColor: 'linear-gradient(to right, #00b09b, #96c93d)',
        onClick: function () {}, // Callback after click
      }).showToast()
    } catch (error) {
      console.error('Error deleting restaurant:', error)
      //alert(error.response?.data?.error || 'Delete failed'); // Show error to the user
      Toastify({
        text: error.response?.data?.error || 'Delete failed',
        duration: 3000, // Duration in milliseconds
        close: true, // Show close button
        gravity: 'top', // `top` or `bottom`
        position: 'right', // `left`, `center` or `right`
        backgroundColor: 'linear-gradient(to right, #FF5C5C, #FF3B3B)', // Red gradient for error
        onClick: function () {}, // Callback after click
      }).showToast()
    } finally {
      setDialogOpen(false) // Close the dialog after action
    }
  }
  let res_path_url = process.env.NEXT_PUBLIC_URL
  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Restaurants</h2>
        <Button onClick={handleAddRestaurant} className="bg-teal-600">
          <PlusCircle className="mr-2 h-4 w-4" /> Add New Restaurant
        </Button>
      </div>
      {loading ? ( // Conditional rendering for loading
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 mt-3 mb-6 rounded"></div>
          <div className="h-4 bg-gray-300 mb-6 rounded"></div>
          <div className="h-4 bg-gray-200 mb-6 rounded"></div>
          <div className="h-4 bg-gray-300 mb-6 rounded"></div>
          <div className="h-4 bg-gray-200 mb-6 rounded"></div>
        </div>
      ) : (
        <Table>
          <TableCaption>A list of restaurants.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">Sr. No.</TableHead>
              <TableHead>Restaurant Name</TableHead>
              <TableHead>Restaurant URL</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {restaurants &&
              restaurants.map((restaurant, index) => (
                <TableRow key={restaurant._id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell className="font-medium">
                    {restaurant.name}
                  </TableCell>
                  <TableCell>
                    {res_path_url}
                    {restaurant.url_slug}
                  </TableCell>
                  <TableCell>{restaurant.status}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(restaurant._id)}
                    >
                      <Edit className="h-4 w-4" />
                      <span className="sr-only">Edit</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleConfirmation(restaurant._id)}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      )}
      {/* Confirmation Dialog */}
      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Are you sure you want to delete this store?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              store.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button onClick={handleDelete} className="btn btn-danger">
                Delete
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
