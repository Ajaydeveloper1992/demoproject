'use client'
import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '~/components/ui/pagination'
import { Button } from '~/components/ui/button'
import { PlusCircle, Pencil, Trash2 } from 'lucide-react'
import axios from 'axios'

export default function AllCustomers() {
  const { data: session } = useSession()
  const [customers, setCustomers] = useState([]) // Ensure this is initialized as an array
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  const [loading, setLoading] = useState(true) // Loading state
  const [userdata, setUserdata] = useState({})

  useEffect(() => {
    if (session) {
      setUserdata(session)
    }
  }, [session])

  useEffect(() => {
    const fetchCustomers = async () => {
      if (userdata && userdata.user) {
        try {
          const userId = userdata.user.id
          const token = userdata.user.name.token

          // Fetch customer data
          const response = await axios.get(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/customer/getallcustomersuserid/${userId}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          )

          console.log('API Response:', response) // Debugging API response structure

          // Ensure the response structure is correct
          let data = []
          if (response.data && response.data.data) {
            data = response.data.data // Assuming response.data.data contains the customer array
          } else {
            console.error('Data not found in response:', response.data)
          }

          setCustomers(data) // Update state with fetched customers
        } catch (error) {
          console.error('Error fetching customers: ', error)
        } finally {
          setLoading(false) // Stop loading
        }
      } else {
        console.warn('No user data available.')
        setLoading(false) // Stop loading if no user data
      }
    }

    if (userdata.user) {
      setLoading(true) // Start loading when userdata is set
      fetchCustomers()
    }
  }, [userdata])

  // Check if customers are available
  console.log('Customers State:', customers)

  // Calculate total pages
  const totalPages = Math.ceil(customers.length / itemsPerPage)

  // Paginate customers
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentCustomers = customers.slice(indexOfFirstItem, indexOfLastItem)

  // Handling loading state and empty customer list
  if (loading) {
    return (
      <div className="container mx-auto py-10">
        <h1 className="text-2xl font-bold">Loading...</h1>
      </div>
    )
  }

  if (customers.length === 0) {
    return (
      <div className="container mx-auto py-10">
        <h1 className="text-2xl font-bold">No Customers Found</h1>
      </div>
    )
  }

  const handleEdit = () => {}
  const handleDelete = () => {}
  //console.log("Current Customers Data:", currentCustomers);

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">All Customers</h1>
        <Button
          onClick={() => console.log('Add new customer')}
          className="bg-teal-600"
        >
          <PlusCircle className="mr-2 h-4 w-4" /> Add New Customer
        </Button>
      </div>
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Sr.n</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentCustomers.length > 0 ? (
              currentCustomers.map((customer, index) => (
                <TableRow key={index + 1}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>
                    {`${customer?.firstName || ''} ${
                      customer?.lastName || ''
                    }`.trim() || 'N/A'}
                  </TableCell>
                  <TableCell>{customer.email}</TableCell>
                  <TableCell>{customer.phone}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(customer._id)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(customer._id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  No customers found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <Pagination className="mt-4">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              className={
                currentPage === 1 ? 'pointer-events-none opacity-50' : ''
              }
            />
          </PaginationItem>
          {[...Array(totalPages)].map((_, index) => (
            <PaginationItem key={index}>
              <PaginationLink
                onClick={() => setCurrentPage(index + 1)}
                isActive={currentPage === index + 1}
              >
                {index + 1}
              </PaginationLink>
            </PaginationItem>
          ))}
          <PaginationItem>
            <PaginationNext
              onClick={() =>
                setCurrentPage(Math.min(totalPages, currentPage + 1))
              }
              className={
                currentPage === totalPages
                  ? 'pointer-events-none opacity-50'
                  : ''
              }
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  )
}
