'use client'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Search, Plus, Pencil, Trash2 } from 'lucide-react'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
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
  DropdownMenuGroup,
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
import axios from 'axios'
import { useAdmin } from '~/hooks/use-admin'
import Toastify from 'toastify-js'
import 'toastify-js/src/toastify.css'
export default function PrintAreaPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [printAreas, setPrintAreas] = useState([])
  const [userdata, setUserdata] = useState({})
  const userDetails = useAdmin(state => state.userDetails)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectprintareaId, setSelectedPrintarea] = useState(null)
  const [action, setAction] = useState(null)
  useEffect(() => {
    setUserdata(session)
  }, [session])

  useEffect(() => {
    const fetchPrintAreas = async () => {
      let userId = ''
      let restaurantIds = ''
      if (userDetails?.user?.usertype === 'restaurant_owner') {
        userId = userdata?.user?.id
      } else {
        userId = userDetails?.user?.createdBy
        restaurantIds = userDetails?.user?.selectedRestaurants
      }
      const token = userdata?.user?.name?.token || ''

      try {
        // Updated API request to the correct endpoint
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/printarea/getprintareauserid/${userId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`, // Include the token in the Authorization header
            },
          }
        )
        console.log('Data response', response)
        setPrintAreas(response.data.data)
      } catch (error) {
        console.error('Error fetching print areas:', error)
      }
    }
    fetchPrintAreas()
  }, [userdata, userDetails])
  const handleCreatePrintArea = async () => {
    router.push(`/admin/products/printarea/add`)
  }

  const handleUpdatePrintArea = async id => {
    router.push(`/admin/products/printarea/edit/${id}`)
  }
  // Delete Category
  const handleConfirmation = printareaId => {
    setSelectedPrintarea(printareaId)
    setDialogOpen(true)
  }
  const handleDeletePrintArea = async () => {
    // Ask for user confirmation before proceeding with the delete
    //const isConfirmed = window.confirm("Are you sure you want to delete this print area?");
    // if (!isConfirmed) {
    //   // If the user clicked "No", exit the function and do nothing
    //   return;
    // }
    // Get the token from the session
    const token = userdata.user?.name?.token || ''
    try {
      // Make the DELETE request to remove the print area
      await axios.delete(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/printarea/deleteprintarea/${selectprintareaId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`, // Include the token in the Authorization header
          },
        }
      )
      // Filter out the deleted print area from the state
      setPrintAreas(printAreas.filter(pa => pa._id !== selectprintareaId)) // Filter by _id (MongoDB standard)

      //alert("Print area deleted successfully");
      Toastify({
        text: 'Print area deleted successfully',
        duration: 3000,
        backgroundColor: 'green',
      }).showToast()
    } catch (error) {
      console.error('Error deleting print area:', error)
      //alert("Failed to delete print area");
      Toastify({
        text: 'Failed to delete print area',
        duration: 3000,
        backgroundColor: 'red',
      }).showToast()
    } finally {
      setDialogOpen(false) // Close the dialog after action
    }
  }
  //Filter Search Code
  const filteredPrintAreas = printAreas.filter(pa =>
    pa.name.toLowerCase().includes(searchTerm.toLowerCase())
  )
  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Print Areas</h1>
        <Button onClick={handleCreatePrintArea} className="bg-teal-600">
          <Plus className="mr-2 h-4 w-4" /> New Print Area
        </Button>
      </div>

      <div className="flex justify-between mb-4">
        <div className="relative w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search"
            className="pl-8"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Store</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPrintAreas.map(printArea => (
              <TableRow key={printArea._id}>
                {' '}
                {/* Use _id instead of id */}
                <TableCell>{printArea.name}</TableCell>
                <TableCell>
                  {/* Display the names of selected restaurants */}
                  <div>
                    {printArea.selectedRestaurants?.map(restaurant => (
                      <span key={restaurant._id} className="mr-2">
                        {restaurant.name}
                      </span>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline">...</Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56">
                      <DropdownMenuLabel>Print Area Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuGroup>
                        <DropdownMenuItem>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleUpdatePrintArea(printArea._id)}
                          >
                            <Pencil className="h-4 w-4" />{' '}
                            <span> Edit Print Area</span>
                          </Button>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleConfirmation(printArea._id)}
                          >
                            <Trash2 className="h-4 w-4" />{' '}
                            <span> Delete Print Area</span>
                          </Button>
                        </DropdownMenuItem>
                      </DropdownMenuGroup>
                      <DropdownMenuSeparator />
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {/* Confirmation Dialog */}
        <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Are you sure you want to delete this printArea?
              </AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the
                printArea.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction asChild>
                <Button
                  onClick={handleDeletePrintArea}
                  className="btn btn-danger"
                >
                  Delete
                </Button>
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}
