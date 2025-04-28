'use client'
import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react' // Import useState and useEffect
import { Button } from '~/components/ui/button'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
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
import { PlusCircle, MoreHorizontal, Pencil, Trash } from 'lucide-react'
import Toastify from 'toastify-js'
export default function StaffList() {
  const { data: session } = useSession()
  const router = useRouter()
  const [staffData, setStaffData] = useState([]) // State to hold staff data
  const [userdata, setUserdata] = useState({})
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectstaffId, setSelectedStaff] = useState(null)
  const [action, setAction] = useState(null)
  // Fetch staff data from API
  useEffect(() => {
    setUserdata(session)
  }, [session])

  useEffect(() => {
    const fetchStaffData = async () => {
      try {
        let userId = userdata.user ? userdata.user.id : ''
        let token =
          userdata.user && userdata.user.name ? userdata.user.name.token : ''
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/staff/getstaffuserid/${userId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )
        setStaffData(response.data.data)
      } catch (error) {
        console.error('Error fetching restaurants:', error)
      } finally {
        setLoading(false) // Set loading to false after fetching
      }
    }
    fetchStaffData()
  }, [userdata])

  const handleEdit = id => {
    console.log(`Edit staff with id: ${id}`)
    router.push(`/admin/staff/edit/?id=${id}`)
  }
  // Delete Staff
  const handleConfirmation = staffId => {
    setSelectedStaff(staffId)
    setDialogOpen(true)
  }
  const handleDelete = async () => {
    //if (confirm('Are you sure you want to delete this staff?')) {}
    try {
      let userId = userdata.user ? userdata.user.id : ''
      let token =
        userdata.user && userdata.user.name ? userdata.user.name.token : ''
      const response = await axios.delete(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/staff/deletestaff/${selectstaffId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      // Remove the deleted restaurant from the state
      setStaffData(prevData =>
        prevData.filter(staff => staff._id !== selectstaffId)
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

  const handleNewStaff = () => {
    router.push('/admin/staff/new')
  }

  console.log(staffData)
  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Our Staff</h1>
        <Button onClick={handleNewStaff} className="bg-teal-600">
          <PlusCircle className="mr-2 h-4 w-4" /> Add New Staff
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
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Username</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created at</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {staffData &&
              staffData.map(staff => (
                <TableRow key={staff._id}>
                  {' '}
                  {/* Assuming staff has a unique _id */}
                  <TableCell className="font-medium">
                    {staff.fname} {staff.lname}
                  </TableCell>
                  <TableCell className="font-medium">
                    {staff.username}
                  </TableCell>
                  <TableCell>{staff.role?.name || 'N/A'}</TableCell>{' '}
                  {/* Adjust according to your role structure */}
                  <TableCell>{staff.status || 'N/A'}</TableCell>
                  <TableCell>
                    {new Date(staff.createdAt).toLocaleString()}
                  </TableCell>{' '}
                  {/* Format date if necessary */}
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleEdit(staff._id)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleConfirmation(staff._id)}
                        >
                          <Trash className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
              Are you sure you want to delete this staff?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              staff.
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
