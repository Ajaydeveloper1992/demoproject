'use client'
import { useSession } from 'next-auth/react'
import React, { useEffect, useState } from 'react'
import { cn } from '~/lib/utils'
import {
  LineChart,
  MoreHorizontal,
  ArrowUpDown,
  ChevronDown,
} from 'lucide-react'
import { Card, CardContent } from '~/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
} from '~/components/ui/select'
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

import { Calendar } from '~/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '~/components/ui/popover'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
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
import axios from 'axios'
import { useAdmin } from '~/hooks/use-admin'
import Loading from '../../components/Loading'
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
export default function ProductReports() {
  const { data: session } = useSession()
  const [reportData, setReportData] = useState(null) // Store the fetched data
  const [loading, setLoading] = useState(true) // Loading state
  const [error, setError] = useState(null) // Error state
  const [userdata, setUserdata] = useState({})
  const userDetails = useAdmin(state => state.userDetails)
  const [chartData, setChartData] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [view, setView] = useState('day')
  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  const [isPreset, setIsPreset] = useState(false)
  const [popoverOpen, setPopoverOpen] = useState(false)
  const [paymentstatus, setPaymentStatus] = useState('All')
  const [date, setDate] = useState({
    from: subDays(new Date(), 30), // 30 days ago
    to: new Date(), // Current date
  })
  useEffect(() => {
    setUserdata(session)
  }, [session])

  useEffect(() => {
    const fetchReportData = async () => {
      let userId = ''
      let restaurantIds = []
      let fromDate = ''
      let toDate = ''

      if (userDetails?.user?.usertype === 'restaurant_owner') {
        userId = userdata?.user ? userdata.user.id : ''
      } else {
        userId = userDetails?.user?.createdBy
        restaurantIds = userDetails?.user?.selectedRestaurants
      }
      const token =
        userdata?.user && userdata.user.name ? userdata.user.name.token : ''
      try {
        setLoading(true)
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/reports/productview/`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            params: {
              userId: userId, // Assuming you get userId from the session
              fromDate: format(date.from, 'yyyy-MM-dd'),
              toDate: format(date.to, 'yyyy-MM-dd'),
              view,
              paymentstatus,
            },
          }
        )
        setReportData(response.data.data) // Assuming response contains the data

        //setChartData(response.data.data.map(item => ({ name: item._id, value: item.totalSales.toFixed(2)})));
        // Prepare chart data
        const formattedChartData = response.data.data.map(item => ({
          name: item.date, // Using the 'date' as the name for the chart
          value: item.products
            .reduce((acc, product) => acc + parseFloat(product.totalSales), 0)
            .toFixed(2), // Summing up total sales for each date
          totalOrders: item.totalorders, // Add total orders for each date (can be used in tooltips or as additional data)
        }))
        setChartData(formattedChartData)
        console.log('Data Report', response.data.data)
      } catch (err) {
        setError('Error fetching data')
      } finally {
        setLoading(false)
      }
    }

    const fetchProducts = async () => {
      let userId = ''
      let restaurantIds = []
      let fromDate = ''
      let toDate = ''

      if (userDetails?.user?.usertype === 'restaurant_owner') {
        userId = userdata?.user ? userdata.user.id : ''
      } else {
        userId = userDetails?.user?.createdBy
        restaurantIds = userDetails?.user?.selectedRestaurants
      }
      const token =
        userdata?.user && userdata.user.name ? userdata.user.name.token : ''

      try {
        setLoading(true)
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/reports/productlist`,
          {
            headers: {
              Authorization: `Bearer ${token}`, // Make sure the API is protected with Authorization header
            },
            params: {
              userId: userId,
              fromDate: format(date.from, 'yyyy-MM-dd'),
              toDate: format(date.to, 'yyyy-MM-dd'),
              searchQuery: searchQuery, // Send search query as a parameter
              paymentstatus,
            },
          }
        )
        setProducts(response.data.data)
        // Assuming the product list is in response.data.data
      } catch (err) {
        setError('Error fetching products ')
      } finally {
        setLoading(false)
      }
    }

    fetchReportData()
    fetchProducts()
  }, [date, searchQuery, view, userDetails, userdata, paymentstatus])

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
    //      setIsPreset(false);
    //     break;
    //   default:
    //     break;
    // }
  }
  console.log('ReportData products', chartData)
  //Payment Status
  //console.log("Data Report",reportData[0].totalOrders);
  const paymentstatuswise = async paymentstatus => {
    setPaymentStatus(paymentstatus)
  }
  return (
    <div className="p-8 space-y-6">
      {loading && <Loading />}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Products</h1>
        <div className="flex items-center gap-2">
          {/* <Button variant="outline" size="sm">
            Activity
          </Button>
          <Button variant="outline" size="sm">
            Finish setup
          </Button> */}
        </div>
      </div>
      <div className="flex gap-4">
        <div className="flex flex-col space-y-2">
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
                    {/* <Select onValueChange={(value) => setIsPreset(value === "presets")} defaultValue="presets">
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
        <div className="flex flex-col space-y-2">
          <label className="text-sm">Payment Status:</label>
          <Select onValueChange={paymentstatuswise}>
            {' '}
            {/* Capture selected value */}
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select All" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="All">All</SelectItem>
                <SelectItem value="Paid">Paid</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
          <div>Selected Status: {paymentstatus}</div>{' '}
          {/* Display selected status */}
        </div>
        {/* <div className="space-y-2">
          <label className="text-sm">Show:</label>
          <Select defaultValue="all">
            <SelectTrigger>
              <SelectValue placeholder="Select products" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All products</SelectItem>
              <SelectItem value="active">Active products</SelectItem>
              <SelectItem value="inactive">Inactive products</SelectItem>
            </SelectContent>
          </Select>
        </div> */}
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {reportData && reportData.length > 0 ? (
          <>
            <Card className="bg-blue-100 border-blue-100">
              <CardContent className="p-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Items Sold</p>
                  {/* Calculate total items sold by iterating over each product and summing up the quantities */}
                  <p className="text-2xl font-bold">
                    {reportData.reduce((acc, report) => {
                      // Accumulate the total quantity sold for all products in each report
                      return (
                        acc +
                        report.products.reduce(
                          (prodAcc, product) => prodAcc + product.quantity,
                          0
                        )
                      )
                    }, 0)}
                  </p>
                  {/* You can calculate percentage change if needed */}
                </div>
              </CardContent>
            </Card>
            <Card className="bg-green-100 border-green-100">
              <CardContent className="p-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Net Sales</p>
                  {/* Calculate total net sales based on product-wise data */}
                  <p className="text-2xl font-bold">
                    $
                    {reportData
                      .reduce((acc, order) => {
                        return (
                          acc +
                          order.products.reduce((productAcc, product) => {
                            return productAcc + parseFloat(product.totalSales) // Summing up each product's total sales
                          }, 0)
                        )
                      }, 0)
                      .toFixed(2)}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gray-200 border-gray-200">
              <CardContent className="p-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Orders</p>
                  {/* Calculate total number of orders by summing up totalOrders */}
                  <p className="text-2xl font-bold">
                    {reportData[0]?.totalOrders}
                  </p>
                  {/* You can calculate percentage change if needed */}
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <p>No data available</p>
        )}
      </div>
      <Card>
        <CardContent className="p-4">
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#8884d8"
                  fill="#8884d8"
                  fillOpacity={0.2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      {/* Search Input */}
      <div className="mb-4">
        <Input
          placeholder="Search products..."
          className="max-w-sm"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)} // Update searchQuery state when the input changes
        />
      </div>
      {/* Display Loading, Error, or Data */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Product title</TableHead>
            {/* <TableHead>Orders</TableHead> */}
            <TableHead>Quantity</TableHead>
            <TableHead>Total Sales</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.length > 0 ? (
            products.map(product => (
              <TableRow key={product._id}>
                <TableCell>{product.productName}</TableCell>
                {/* <TableCell>{product.totalOrders}</TableCell> */}
                <TableCell>{product.totalQuantity}</TableCell>
                <TableCell>${product.totalSales}</TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={10} className="text-muted-foreground">
                No products available
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      {/* Footer with Product Count */}
      {/* <div className="text-sm text-muted-foreground mt-4">
        {products.length} Products
      </div> */}
    </div>
  )
}
