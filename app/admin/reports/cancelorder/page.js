'use client'
import { useSession } from 'next-auth/react'
import React, { useEffect, useState } from 'react'
import { cn } from '~/lib/utils'
import { LineChart, MoreHorizontal, ChevronDown } from 'lucide-react'
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
import Link from 'next/link'
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
const data = [
  { name: '1', value: 0 },
  { name: '2', value: 0 },
  { name: '3', value: 0 },
  { name: '4', value: 0 },
  { name: '5', value: 0 },
  { name: '6', value: 0 },
  { name: '7', value: 0 },
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
export default function CancelOrderReports() {
  const { data: session } = useSession()
  const [reportData, setReportData] = useState(null) // Store the fetched data
  const [loading, setLoading] = useState(true) // Loading state
  const [error, setError] = useState(null) // Error state
  const [userdata, setUserdata] = useState({})
  const userDetails = useAdmin(state => state.userDetails)
  const [chartData, setChartData] = useState([])
  const [view, setView] = useState('day')
  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  const [isPreset, setIsPreset] = useState(false)
  const [selectedInterval, setSelectedInterval] = useState('day') // Track selected interval (day, week, month)
  const [selectedRange, setSelectedRange] = useState('month')
  const [popoverOpen, setPopoverOpen] = useState(false)
  const [paymentstatus, setPaymentStatus] = useState('All')
  const [cancelorder, setCancelStatus] = useState('All')
  const [summaryData, setSummaryData] = useState({
    totalOrders: 0,
    totalGrossSales: 0,
    totalNetSales: 0,
    totalItems: 0,
    averageOrderValue: 0,
    averageItemsPerOrder: 0,
  })
  const [date, setDate] = useState({
    from: subDays(new Date(), 30), // 30 days ago
    to: new Date(), // Current date
  })
  useEffect(() => {
    setUserdata(session)
  }, [session])
  const handlePresetSelection = preset => {
    setPopoverOpen(false)
    const today = new Date()
    let newFrom = today
    let newTo = today
    switch (preset.value) {
      case 'today':
        setDate({ from: today, to: today })
        break
      case 'yesterday':
        newFrom = addDays(today, -1)
        setDate({ from: newFrom, to: newFrom })
        break
      case 'week':
        newFrom = startOfWeek(today)
        newTo = endOfWeek(today)
        setDate({ from: newFrom, to: newTo })
        break
      case 'last-week':
        newFrom = startOfWeek(addDays(today, -7))
        newTo = endOfWeek(addDays(today, -7))
        setDate({ from: newFrom, to: newTo })
        break
      case 'month':
        newFrom = startOfMonth(today)
        newTo = endOfMonth(today)
        setDate({ from: newFrom, to: newTo })
        break
      case 'last-month':
        newFrom = startOfMonth(subMonths(today, 1))
        newTo = endOfMonth(subMonths(today, 1))
        setDate({ from: newFrom, to: newTo })
        break
      case 'quarter':
        newFrom = startOfQuarter(today)
        newTo = endOfQuarter(today)
        setDate({ from: newFrom, to: newTo })
        break
      case 'last-quarter':
        newFrom = startOfQuarter(subQuarters(today, 1))
        newTo = endOfQuarter(subQuarters(today, 1))
        setDate({ from: newFrom, to: newTo })
        break
      case 'year':
        newFrom = startOfYear(today)
        newTo = endOfYear(today)
        setDate({ from: newFrom, to: newTo })
        break
      case 'last-year':
        newFrom = startOfYear(addYears(today, -1))
        newTo = endOfYear(addYears(today, -1))
        setDate({ from: newFrom, to: newTo })
        break
      case 'custom-date':
        setIsPreset(false)
        break
      default:
        break
    }
  }

  useEffect(() => {
    const fetchorderreport = async () => {
      let userId = ''

      if (userDetails?.user?.usertype === 'restaurant_owner') {
        userId = userdata?.user ? userdata.user.id : ''
      } else {
        userId = userDetails?.user?.createdBy
      }

      const token =
        userdata?.user && userdata.user.name ? userdata.user.name.token : ''
      setLoading(true)
      setError(null)

      try {
        if (userId) {
          const response = await axios.get(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/reports/refunedvoidedreport`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
              params: {
                userId: userId,
                fromDate: format(date.from, 'yyyy-MM-dd'),
                toDate: format(date.to, 'yyyy-MM-dd'),
                reportType: selectedInterval,
                paymentstatus,
                cancelorder,
              },
            }
          )

          const reportData = response.data.data
          console.log('Order report ', reportData)
          setReportData(reportData) // Assuming the data comes in the expected format

          // Map or transform your data if needed to match chart format
          const chartData = reportData.map(item => ({
            name: item._id, // _id can be day, week, month depending on the selected interval
            value: item.totalOrders, // Or any other aggregated value
          }))

          // Process the reportData for the counter sum and chart data
          const totalOrders = reportData.reduce(
            (acc, item) => acc + item.totalOrders,
            0
          )
          const totalGrossSales = reportData.reduce(
            (acc, item) => acc + item.totalGrossSales,
            0
          )
          const totalNetSales = reportData.reduce(
            (acc, item) => acc + item.totalNetSales,
            0
          )
          const totalItems = reportData.reduce(
            (acc, item) => acc + item.totalItems,
            0
          )
          const totalRefundAmount = reportData.reduce(
            (acc, item) => acc + (item.totalRefund || 0),
            0
          ) // Sum of refund amounts

          setSummaryData({
            totalOrders,
            totalGrossSales,
            totalNetSales,
            totalItems,
            totalRefundAmount, // Add refund amount to summary data
            averageOrderValue: totalRefundAmount / totalOrders || 0,
            averageItemsPerOrder: totalItems / totalOrders || 0,
          })

          setChartData(chartData)
          setLoading(false)
        }
      } catch (err) {
        setError('Error fetching report data.')
        setLoading(false)
      }
    }
    fetchorderreport()
  }, [
    date,
    userDetails,
    userdata,
    selectedInterval,
    paymentstatus,
    cancelorder,
  ])

  // Handle interval selection (day, week, month)
  const handleIntervalChange = value => {
    setSelectedInterval(value)
  }

  // Handle range selection (Month to date, Previous year)
  const handleRangeChange = value => {
    setSelectedRange(value)
  }
  console.log('Order Data reports', reportData)

  //Payment Status
  const paymentstatuswise = async paymentstatus => {
    setPaymentStatus(paymentstatus)
  }
  // Filter Voided and Refuned
  const filtervoideandrefuned = async filterstatus => {
    //console.log("We are check filter Status:",filterstatus);
    setCancelStatus(filterstatus)
  }
  return (
    <div className="p-8 space-y-6">
      {loading && <Loading />}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Refuned & Voided Orders</h1>
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
          <label className="text-sm">Select Orders Status:</label>
          <Select onValueChange={paymentstatuswise}>
            {' '}
            {/* Capture selected value */}
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select All" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {/* <SelectItem value="All">All</SelectItem> */}
                <SelectItem value="Refunded">Refuned</SelectItem>
                <SelectItem value="Voided">Voided</SelectItem>
                <SelectItem value="Partially Refunded">
                  Partially Refunded
                </SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
          <div>Selected Status: {paymentstatus}</div>{' '}
          {/* Display selected status */}
        </div>
        {/* <div className="flex flex-col space-y-2">
          <label className="text-sm">Filter Refuned & Voided:</label>
          <Select onValueChange={filtervoideandrefuned}> 
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select All" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="All">All</SelectItem>
                <SelectItem value="voided">Voided</SelectItem>
                <SelectItem value="refuned">Refuned</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
          <div>Selected Status: {cancelorder}</div>
        </div> */}
        <div className="space-y-2">
          {/* <label className="text-sm">Show:</label>
          <Select defaultValue="all">
            <SelectTrigger>
              <SelectValue placeholder="Select orders" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All orders</SelectItem>
              <SelectItem value="completed">Completed orders</SelectItem>
              <SelectItem value="pending">Pending orders</SelectItem>
            </SelectContent>
          </Select> */}
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 p-4">
        <Card className="bg-gray-200 border-gray-200">
          <CardContent className="p-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Orders</p>
              <p className="text-2xl font-bold">{summaryData?.totalOrders}</p>
              {/* <p className="text-xs text-muted-foreground">0%</p> */}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-pink-100 border-pink-100">
          <CardContent className="p-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Net Refunded</p>
              <p className="text-2xl font-bold">
                ${summaryData?.totalRefundAmount?.toFixed(2)}
              </p>
              {/* <p className="text-xs text-muted-foreground">0%</p> */}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gray-200 border-gray-200">
          <CardContent className="p-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">
                Average order value
              </p>
              <p className="text-2xl font-bold">
                ${summaryData?.averageOrderValue?.toFixed(2)}
              </p>
              {/* <p className="text-xs text-muted-foreground">0%</p> */}
            </div>
          </CardContent>
        </Card>
        {/* <Card className="bg-blue-100 border-blue-100">
          <CardContent className="p-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Average items per order</p>
              <p className="text-2xl font-bold">{summaryData?.averageItemsPerOrder?.toFixed(2)}</p> */}
        {/* <p className="text-xs text-muted-foreground">0%</p> */}
        {/* </div>
          </CardContent>
        </Card> */}
      </div>
      <div className="p-4">
        <Card>
          <CardContent className="p-4">
            <div className="h-[300px]">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Orders</span>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      {/* <input
                      type="checkbox"
                      checked={selectedRange === 'month'}
                      onChange={() => handleRangeChange('month')}
                      className="text-primary"
                    />
                    <span>Month to date (Nov 1 - 7, 2024)</span> */}
                    </div>
                    <div className="flex items-center gap-1">
                      {/* <input
                      type="checkbox"
                      checked={selectedRange === 'previousYear'}
                      onChange={() => handleRangeChange('previousYear')}
                      className="text-green-500"
                    />
                    <span>Previous year (Nov 1 - 7, 2023)</span> */}
                    </div>
                  </div>
                </div>

                {/* Dropdown for selecting the interval (day, week, month) */}
                {/* <Select value={selectedInterval} onValueChange={handleIntervalChange}>
                <SelectTrigger className="w-[100px]">
                  <SelectValue placeholder="By day" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">By day</SelectItem>
                  <SelectItem value="week">By week</SelectItem>
                  <SelectItem value="month">By month</SelectItem>
                </SelectContent>
              </Select> */}
              </div>

              {/* Chart rendering */}
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
      </div>
      <div className="p-4 space-y-6"></div>
      <div className="p-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <span className="font-medium">Orders</span>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order #</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Order Status</TableHead>
                  <TableHead>Payment Status</TableHead>
                  {/* <TableHead>Customer</TableHead> */}
                  <TableHead>Items Sold</TableHead>
                  <TableHead>Refunded By</TableHead>
                  {/* <TableHead>Product(s)</TableHead> */}
                  {/*<TableHead>Coupon(s)</TableHead>*/}
                  <TableHead>Net Refunded</TableHead>
                  {/* <TableHead>Attribution</TableHead> */}
                  {/* <TableHead>Staff</TableHead> 
            <TableHead>Payment Info</TableHead>*/}
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportData && reportData.length === 0 ? (
                  <TableRow className="h-24 text-center">
                    <TableCell colSpan={12} className="text-muted-foreground">
                      No data to display
                    </TableCell>
                  </TableRow>
                ) : (
                  reportData &&
                  reportData.map((item, index) =>
                    item.orders.map((order, orderIndex) => {
                      // Calculate total items sold for this order
                      //const totalItemsSold = order.items.reduce((acc, item) => acc + item.quantity, 0);
                      const totalItemsSold = Array.isArray(order.items)
                        ? order.items.reduce(
                            (acc, item) => acc + (item.quantity || 0),
                            0
                          )
                        : 0
                      return (
                        <TableRow key={`${index}-${orderIndex}`}>
                          {/* Order Number */}
                          <TableCell>
                            <Link
                              href={`/admin/orders/all-orders/${order._id}`}
                            >
                              {order.orderNumber}
                            </Link>
                          </TableCell>

                          {/* Date */}
                          <TableCell>
                            {format(new Date(item._id), 'LLL d, y')}
                          </TableCell>
                          {/** Order Customer */}
                          {/* <TableCell>{order?.customer?.firstName} {order?.customer?.lastName}</TableCell> */}
                          <TableCell>
                            {order?.customerfName} {order?.customerlName}
                          </TableCell>
                          {/* Customer Phone */}
                          <TableCell>{order?.customerPhone}</TableCell>
                          {/* Order Status */}
                          <TableCell>{order.orderStatus}</TableCell>
                          <TableCell>{order.paymentStatus}</TableCell>

                          {/* Total Items Sold - Only display once for the first order */}
                          <TableCell>
                            {/* {orderIndex === 0 && (
                        <>
                          <span>{totalItemsSold}</span>
                         
                        </>
                      )} */}
                            <span>{totalItemsSold}</span>
                          </TableCell>
                          {/* Products */}
                          <TableCell>
                            {order?.refundBy?.fname} {order?.refundBy?.lname}
                          </TableCell>
                          {/*<TableCell>
                       {order.products.length > 0 ? order.products[0].productName : "No products available"} 
                      <Button variant="link" className="ml-2 text-blue-500">
                        <Link href={`/admin/orders/all-orders/${order._id}`}>View More</Link>
                      </Button> 
                    </TableCell> */}
                          {/* Coupons 
                    <TableCell>
                      {order.products.map((p) =>
                        p.modifiers.map((m) => m.name).join(", ")
                      ).join(", ")}
                    </TableCell>
                    */}
                          {/* Net Sales */}
                          <TableCell>
                            ${order?.totalRefund?.toFixed(2)}
                          </TableCell>

                          {/* Attribution */}
                          <TableCell>{order?.attribution}</TableCell>

                          {/* Staff Name */}
                          <TableCell>{order?.staffName}</TableCell>

                          {/* Payment Info 
                    <TableCell>{order.nuviePaymentInfo}</TableCell>
                    */}
                        </TableRow>
                      )
                    })
                  )
                )}
              </TableBody>
            </Table>
            {/* <div className="text-sm text-muted-foreground mt-4">
        </div> */}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
