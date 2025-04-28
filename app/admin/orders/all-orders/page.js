'use client'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import React, { useState, useEffect } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table'
import { Input } from '~/components/ui/input'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import { Search, ScanEye, Eye } from 'lucide-react'
import axios from 'axios'
import { useAdmin } from '~/hooks/use-admin'
import Link from 'next/link'
import { cn } from '~/lib/utils'
import { LineChart, MoreHorizontal, ChevronDown } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
} from '~/components/ui/select'
import { Calendar } from '~/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '~/components/ui/popover'
import {
  format,
  addDays,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  subMonths,
  subQuarters,
  subDays,
  addYears,
  startOfQuarter,
  endOfQuarter,
} from 'date-fns'
import Loading from '../../components/Loading'
// Define status options
const statusOptions = [
  'All',
  'New Order',
  'Pending',
  'InKitchen',
  'Voided',
  'Complete',
  'Rejected',
]
const Paymentstatus = [
  'Pending',
  'Paid',
  'Failed',
  'Refunded',
  'Partially Refunded',
  'Voided',
]
const presets = [
  { label: 'Today', value: 'today' },
  { label: 'Yesterday', value: 'yesterday' },
  { label: 'Week to date', value: 'week' },
  { label: 'Last week', value: 'last-week' },
  { label: 'Month to date', value: 'month' },
  { label: 'Last month', value: 'last-month' },
  { label: 'Quarter to date', value: 'quarter' },
  { label: 'Last quarter', value: 'last-quarter' },
  { label: 'Year to date', value: 'year' },
  { label: 'Last year', value: 'last-year' },
  { label: 'Custom Date', value: 'custom-date' },
]
export default function Orders() {
  const { data: session } = useSession()
  const router = useRouter()
  const [orders, setOrders] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('All')
  const [userdata, setUserdata] = useState({})
  const userDetails = useAdmin(state => state.userDetails)
  const [dateRange, setDateRange] = useState({ from: '', to: '' })
  const [isPreset, setIsPreset] = useState(false)
  const [popoverOpen, setPopoverOpen] = useState(false)
  const [selectedInterval, setSelectedInterval] = useState('day')
  const [selectedRange, setSelectedRange] = useState('month')
  const [paymentstatus, setPaymentStatus] = useState('All')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [loading, setLoading] = useState(true)
  const [date, setDate] = useState({
    from: subDays(new Date(), 30), // 30 days ago
    to: new Date(), // Current date
  })

  console.log('This is select Date', date)

  useEffect(() => {
    if (session) {
      setUserdata(session)
    }
  }, [session])

  const handlePresetSelection = preset => {
    setPopoverOpen(false)
    // const today = new Date();
    // let newFrom = today;
    // let newTo = today;
    // switch (preset.value) {
    //   case "today":
    //     setDate({ from: today, to: today });
    //     break;
    //   case "yesterday":
    //     newFrom = addDays(today, -1);
    //     setDate({ from: newFrom, to: newFrom });
    //     break;
    //   case "week":
    //     newFrom = startOfWeek(today);
    //     newTo = endOfWeek(today);
    //     setDate({ from: newFrom, to: newTo });
    //     break;
    //   case "last-week":
    //     newFrom = startOfWeek(addDays(today, -7));
    //     newTo = endOfWeek(addDays(today, -7));
    //     setDate({ from: newFrom, to: newTo });
    //     break;
    //   case "month":
    //     newFrom = startOfMonth(today);
    //     newTo = endOfMonth(today);
    //     setDate({ from: newFrom, to: newTo });
    //     break;
    //   case "last-month":
    //     newFrom = startOfMonth(subMonths(today, 1));
    //     newTo = endOfMonth(subMonths(today, 1));
    //     setDate({ from: newFrom, to: newTo });
    //     break;
    //   case "quarter":
    //     newFrom = startOfQuarter(today);
    //     newTo = endOfQuarter(today);
    //     setDate({ from: newFrom, to: newTo });
    //     break;
    //   case "last-quarter":
    //     newFrom = startOfQuarter(subQuarters(today, 1));
    //     newTo = endOfQuarter(subQuarters(today, 1));
    //     setDate({ from: newFrom, to: newTo });
    //     break;
    //   case "year":
    //     newFrom = startOfYear(today);
    //     newTo = endOfYear(today);
    //     setDate({ from: newFrom, to: newTo });
    //     break;
    //   case "last-year":
    //     newFrom = startOfYear(addYears(today, -1));
    //     newTo = endOfYear(addYears(today, -1));
    //     setDate({ from: newFrom, to: newTo });
    //     break;
    //   case "custom-date":
    //     setIsPreset(false); // To allow custom date selection
    //     break;
    //   default:
    //     break;
    // }
  }
  const formatDate = dateString => {
    if (!dateString) return ''
    const date = new Date(dateString)

    // Extract month, day, and year components
    const month = String(date.getMonth() + 1).padStart(2, '0') // Months are zero-based
    const day = String(date.getDate()).padStart(2, '0')
    const year = date.getFullYear()

    return `${month}/${day}/${year}`
  }

  // Fetch orders from API
  useEffect(() => {
    const fetchOrders = async () => {
      if (userdata.user) {
        try {
          let userId = ''
          let restaurantIds = []

          if (userDetails?.user?.usertype === 'restaurant_owner') {
            userId = userdata?.user ? userdata.user.id : ''
          } else {
            userId = userDetails?.user?.createdBy
            restaurantIds = userDetails?.user?.selectedRestaurants
          }
          setLoading(true)
          const token = userdata.user?.name?.token

          // Pass the selected date range to the API request
          const response = await axios.get(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/orders/getordersuserid/${userId}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
              params: {
                fromDate: date?.from ? format(date.from, 'yyyy-MM-dd') : '',
                toDate: date?.to ? format(date.to, 'yyyy-MM-dd') : '',
              },
            }
          )

          if (response.data.success && Array.isArray(response.data.data)) {
            const allOrders = response?.data?.data

            if (userDetails?.user?.usertype === 'restaurant_owner') {
              setOrders(allOrders)
              setLoading(false)
            } else {
              const filteredOrders = allOrders.filter(order => {
                if (order.storedetails) {
                  const serverId = order.storedetails._id
                  return restaurantIds.includes(serverId)
                } else {
                  return false
                }
              })
              setOrders(filteredOrders)
              setLoading(false)
            }
          } else {
            console.error('Unexpected API response:', response.data)
          }
        } catch (error) {
          console.error('Error fetching orders:', error)
        }
      }
    }
    fetchOrders()
  }, [userdata, userDetails, date]) // Adding date as a dependency
  // Filter orders based on search term, selected status, and date range
  // const filteredOrders = orders.filter(order => {
  //   const orderDate = new Date(order.date);
  //   const fromDate = dateRange.from ? new Date(dateRange.from) : null;
  //   const toDate = dateRange.to ? new Date(dateRange.to) : null;

  //   // Date range filter
  //   const isInDateRange = (!fromDate || orderDate >= fromDate) && (!toDate || orderDate <= toDate);

  //   return (
  //     (order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
  //      order.customer.firstName.toLowerCase().includes(searchTerm.toLowerCase())) &&
  //     (selectedStatus === 'All' ||
  //      (selectedStatus === 'Voided' ? order.voidstatus === 'Voided' : order.orderstatus === selectedStatus)) &&
  //     isInDateRange
  //   );
  // });
  // let filteredOrders = orders.filter(order => {
  //   const orderDate = new Date(order.date);
  //   const fromDate = date?.from ? new Date(date.from) : null;
  //   const toDate = date?.to ? new Date(date.to) : null;

  //   // Date range filter
  //   const isInDateRange = (!fromDate || orderDate >= fromDate) && (!toDate || orderDate <= toDate);

  //   return (
  //     (order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
  //      order?.customer?.firstName.toLowerCase().includes(searchTerm.toLowerCase())) &&
  //     (selectedStatus === 'All' ||
  //      (selectedStatus === 'Voided' ? order.voidstatus === 'Voided' : order.orderstatus === selectedStatus)) &&
  //     isInDateRange
  //   );
  // });
  // Filter orders based on search term, selected status, payment status, and date range

  const filteredOrders = orders.filter(order => {
    const orderDate = new Date(order?.date)
    const fromDate = new Date(date?.from)
    const toDate = new Date(date?.to)

    const isInDateRange = orderDate >= fromDate && orderDate <= toDate

    //console.log("create by name",order?.createdBy?.fname);
    return (
      (order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order?.customer?.firstName
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        order?.customer?.lastName
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        order?.createdBy?.fname
          .toLowerCase()
          .includes(searchTerm.toLowerCase())) &&
      (selectedStatus === 'All' || order.orderstatus === selectedStatus) &&
      (paymentstatus === 'All' || order.paymentStatus === paymentstatus)
    )
  })
  // Count orders by status
  const statusCounts = statusOptions.reduce((counts, status) => {
    if (status === 'All') {
      counts[status] = filteredOrders.length
    } else if (status === 'Voided') {
      counts[status] = orders.filter(
        order => order.voidstatus === 'Voided'
      ).length
    } else {
      counts[status] = orders.filter(
        order => order.orderstatus === status
      ).length
    }
    return counts
  }, {})

  //console.log("Order Details",orders[0]?.createdBy);
  const totalItems = filteredOrders.length
  const totalPages = Math.ceil(totalItems / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize
  const currentItems = filteredOrders.slice(startIndex, endIndex)

  const handleCreateOrder = () => {
    //router.push("/admin/orders/create");
    //router.push('https://app.promehedis-projects.vercel.app/login')
    router.push('https://searchmydeal.com/pos/login')
  }
  //Payment Status
  const paymentstatuswise = async paymentstatus => {
    setPaymentStatus(paymentstatus)
    //filteredOrders = orders.filter(order => order.paymentStatus == paymentstatus)
  }
  return (
    <div className="container mx-auto py-10">
      {loading && <Loading />}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Orders</h1>
        <div>
          <Button className="mr-2 bg-teal-600" onClick={handleCreateOrder}>
            Create
          </Button>
          {/* <Button variant="outline">Export</Button> */}
        </div>
      </div>
      {/* Status filter badges */}
      <div className="flex gap-4 space-between">
        <div className="flex space-x-2 mb-4">
          {statusOptions.map(status => (
            <Badge
              key={status}
              variant={selectedStatus === status ? 'default' : 'outline'}
              onClick={() => setSelectedStatus(status)}
              className="cursor-pointer"
            >
              {status}{' '}
              {status === 'All' ? orders?.length : statusCounts[status] || '0'}
            </Badge>
          ))}
        </div>

        <div className="flex flex-col space-y-0">
          <Select onValueChange={paymentstatuswise}>
            {' '}
            {/* Capture selected value */}
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select All" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="All">All</SelectItem>
                {Paymentstatus.map(status => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          <label className="text-sm">Payment Status:{paymentstatus}</label>
        </div>
      </div>
      {/* Search input */}
      <div className="flex items-center mb-4 gap-2">
        <div className="relative w-64">
          <Input
            type="text"
            placeholder="Search"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-10"
          />
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
        </div>
        {/* Date range filter */}
        {/* <div className="flex gap-2">
          <label htmlFor="from-date" className="text-sm">From:</label>
          <Input 
            id="from-date" 
            type="date" 
            value={dateRange.from} 
            onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
          />
        </div>
        <div className="flex gap-2">
          <label htmlFor="to-date" className="text-sm">To:</label>
          <Input 
            id="to-date" 
            type="date" 
            value={dateRange.to} 
            onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
          />
        </div> */}
        <div className="space-y-2">
          <label className="text-sm">Date range:</label>
          <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-[300px] justify-between text-left font-normal',
                  !date && 'text-muted-foreground'
                )}
              >
                {date?.from ? (
                  date.to ? (
                    <>
                      {format(date.from, 'LLL d, y')} -{' '}
                      {format(date.to, 'LLL d, y')}
                    </>
                  ) : (
                    format(date.from, 'LLL d, y')
                  )
                ) : (
                  <span>Select date range</span>
                )}
                <ChevronDown className="h-4 w-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <div className="space-y-4 p-4">
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    {/* <Select onValueChange={(value) => setIsPreset(value === "custom")} defaultValue="presets">
                      <SelectTrigger>
                        <SelectValue placeholder="Select view" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="presets">Presets</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select> */}
                  </div>
                </div>
                {isPreset ? (
                  <div className="flex flex-col gap-2">
                    {presets.map(preset => (
                      <Button
                        key={preset.value}
                        variant="ghost"
                        className="justify-start font-normal"
                        onClick={() => handlePresetSelection(preset)}
                      >
                        {preset.label}
                      </Button>
                    ))}
                  </div>
                ) : (
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={date?.from}
                    selected={date}
                    onSelect={setDate}
                    numberOfMonths={2}
                  />
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
      {/* Orders Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order Number</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Update Date</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Order Status</TableHead>
            <TableHead>Payment Status</TableHead>
            <TableHead>Store Name</TableHead>
            <TableHead>created By</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Actions</TableHead>
            {selectedStatus === 'Voided' && <TableHead>Void Reason</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {currentItems &&
            currentItems.map(order => (
              <TableRow key={order._id}>
                <TableCell className="font-medium">
                  <Link href={`/admin/orders/all-orders/${order._id}`}>
                    {order.orderNumber}
                  </Link>
                </TableCell>
                <TableCell>{formatDate(order?.date)}</TableCell>
                <TableCell>{formatDate(order?.updatedAt)}</TableCell>
                <TableCell>
                  {order?.customer?.firstName} {order?.customer?.lastName}
                </TableCell>
                <TableCell>{order?.customer?.phone}</TableCell>
                <TableCell>{order?.orderstatus}</TableCell>
                <TableCell>{order?.paymentStatus}</TableCell>
                <TableCell>{order?.storedetails?.name}</TableCell>
                {order.origin === 'Online' ? (
                  <TableCell>Customer</TableCell>
                ) : (
                  <TableCell>
                    {order?.staffid?.fname} {order?.staffid?.lname}
                  </TableCell>
                )}
                <TableCell>${order?.total.toFixed(2)}</TableCell>
                <TableCell>
                  <Link href={`/admin/orders/all-orders/${order?._id}`}>
                    <Eye />
                  </Link>
                </TableCell>
                {selectedStatus === 'Voided' && (
                  <TableCell>{order?.voidReason}</TableCell>
                )}
              </TableRow>
            ))}
        </TableBody>
      </Table>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <p className="text-sm text-muted-foreground">
            Showing {startIndex + 1} to {Math.min(endIndex, totalItems)} of{' '}
            {totalItems} entries
          </p>
          <Select
            value={pageSize.toString()}
            onValueChange={value => {
              setPageSize(Number(value))
              setCurrentPage(1)
            }}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue placeholder={pageSize} />
            </SelectTrigger>
            <SelectContent>
              {[5, 10, 20, 50, 100].map(size => (
                <SelectItem key={size} value={size.toString()}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">per page</p>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <div className="flex items-center justify-center text-sm font-medium">
            Page {currentPage} of {totalPages}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setCurrentPage(prev => Math.min(prev + 1, totalPages))
            }
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}
