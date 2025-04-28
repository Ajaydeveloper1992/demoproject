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
// const data = [
//   { name: '1', value: 0 },
//   { name: '2', value: 0 },
//   { name: '3', value: 0 },
//   { name: '4', value: 0 },
//   { name: '5', value: 0 },
//   { name: '6', value: 0 },
//   { name: '7', value: 0 }
// ]
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
export default function CategoryReports() {
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
  const [searchTerm, setSearchTerm] = useState('') // State to track search input
  const [popoverOpen, setPopoverOpen] = useState(false)
  const [filteredReportData, setFilteredReportData] = useState(reportData) // Filtered categories data
  const [paymentstatus, setPaymentStatus] = useState('All')
  // Summary Data State
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
    /*
    const today = new Date();
    let newFrom = today;
    let newTo = today;
    switch (preset.value) {
      case "today":
        setDate({ from: today, to: today });
        break;
      case "yesterday":
        newFrom = addDays(today, -1);
        setDate({ from: newFrom, to: newFrom });
        break;
      case "week":
        newFrom = startOfWeek(today);
        newTo = endOfWeek(today);
        setDate({ from: newFrom, to: newTo });
        break;
      case "last-week":
        newFrom = startOfWeek(addDays(today, -7));
        newTo = endOfWeek(addDays(today, -7));
        setDate({ from: newFrom, to: newTo });
        break;
      case "month":
        newFrom = startOfMonth(today);
        newTo = endOfMonth(today);
        setDate({ from: newFrom, to: newTo });
        break;
      case "last-month":
        newFrom = startOfMonth(subMonths(today, 1));
        newTo = endOfMonth(subMonths(today, 1));
        setDate({ from: newFrom, to: newTo });
        break;
      case "quarter":
        newFrom = startOfQuarter(today);
        newTo = endOfQuarter(today);
        setDate({ from: newFrom, to: newTo });
        break;
      case "last-quarter":
        newFrom = startOfQuarter(subQuarters(today, 1));
        newTo = endOfQuarter(subQuarters(today, 1));
        setDate({ from: newFrom, to: newTo });
        break;
      case "year":
        newFrom = startOfYear(today);
        newTo = endOfYear(today);
        setDate({ from: newFrom, to: newTo });
        break;
      case "last-year":
        newFrom = startOfYear(addYears(today, -1));
        newTo = endOfYear(addYears(today, -1));
        setDate({ from: newFrom, to: newTo });
        break;
      case "custom-date":
         setIsPreset(false);
        break;
      default:
        break;
    }*/
  }
  // Fetch category data whenever date range or user changes
  useEffect(() => {
    const fetchCategoryData = async () => {
      let userId = ''
      if (userDetails?.user?.usertype === 'restaurant_owner') {
        userId = userdata?.user ? userdata?.user.id : ''
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
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/reports/categoryorderreport`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
              params: {
                userId: userId,
                fromDate: format(date.from, 'yyyy-MM-dd'),
                toDate: format(date.to, 'yyyy-MM-dd'),
                paymentstatus,
              },
            }
          )

          const reportData = response.data.data
          setReportData(reportData)
          // Map or transform your data if needed to match chart format
          const chartData = reportData.map(item => ({
            name: item._id, // _id can be day, week, month depending on the selected interval
            value: item.totalOrders, // Or any other aggregated value
          }))

          // Process the reportData for the counter sum and chart data
          setChartData(chartData)
          // Calculate summary data
          const totalOrders = reportData.reduce(
            (acc, item) => acc + item.totalOrders,
            0
          )
          const totalGrossSales = reportData.reduce(
            (acc, item) => acc + item.totalRevenue,
            0
          )
          const totalItems = reportData.reduce(
            (acc, item) => acc + item.totalItemsSold,
            0
          )
          const averageOrderValue =
            totalOrders > 0 ? totalGrossSales / totalOrders : 0
          const averageItemsPerOrder =
            totalOrders > 0 ? totalItems / totalOrders : 0

          setSummaryData({
            totalOrders,
            totalGrossSales,
            totalNetSales: totalGrossSales, // Assuming net sales = gross sales in this case
            totalItems,
            averageOrderValue: averageOrderValue.toFixed(2),
            averageItemsPerOrder: averageItemsPerOrder.toFixed(2),
          })

          setLoading(false)
        }
      } catch (err) {
        setError('Error fetching report data.')
        setLoading(false)
      }
    }
    fetchCategoryData()
  }, [date, userDetails, userdata, paymentstatus])

  // Handle search input change
  const handleSearchChange = e => {
    const query = e.target.value
    setSearchTerm(query)

    // Filter categories based on the search term
    if (query) {
      const filteredData = reportData.filter(
        category => category._id.toLowerCase().includes(query.toLowerCase()) // Match category name (_id) with the search term
      )
      setFilteredReportData(filteredData)
    } else {
      setFilteredReportData(reportData) // Reset to original reportData when search is cleared
    }
  }

  // Update filteredReportData when reportData changes
  useEffect(() => {
    setFilteredReportData(reportData)
  }, [reportData])
  //console.log("Report Data",reportData);
  //Payment Status
  const paymentstatuswise = async paymentstatus => {
    setPaymentStatus(paymentstatus)
  }
  return (
    <div className="p-8 space-y-6">
      {loading && <Loading />}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Categories</h1>
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
        <div className="space-y-2">
          {/* <label className="text-sm">Show:</label>
          <Select defaultValue="all">
            <SelectTrigger>
              <SelectValue placeholder="Select categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              <SelectItem value="active">Active categories</SelectItem>
              <SelectItem value="inactive">Inactive categories</SelectItem>
            </SelectContent>
          </Select> */}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-pink-100 border-pink-100">
          <CardContent className="p-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Items sold</p>
              <p className="text-2xl font-bold">{summaryData.totalItems}</p>
              {/* <p className="text-xs text-muted-foreground">0%</p> */}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-green-100 border-green-100">
          <CardContent className="p-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Net sales</p>
              <p className="text-2xl font-bold">
                ${summaryData.totalNetSales.toFixed(2)}
              </p>
              {/* <p className="text-xs text-muted-foreground">0%</p> */}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gray-200 border-gray-200">
          <CardContent className="p-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Categories</p>
              <p className="text-2xl font-bold">{reportData?.length}</p>
              {/* <p className="text-xs text-muted-foreground">0%</p> */}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="space-y-6">
        <CardContent className="p-4">
          <div className="h-[300px]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="font-medium">Items sold</span>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    {/* <input type="checkbox" checked className="text-primary" />
                    <span>Month to date (Nov 1 - 7, 2024)</span> */}
                  </div>
                  <div className="flex items-center gap-1">
                    {/* <input type="checkbox" checked className="text-green-500" />
                    <span>Previous year (Nov 1 - 7, 2023)</span> */}
                  </div>
                </div>
              </div>
              {/* <Select defaultValue="day">
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
      <div className="p-4 space-y-6"></div>
      <Card className="p-4 space-y-6">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <span className="font-medium">Categories</span>
              {/* <Button variant="outline" size="sm">Compare</Button> */}
            </div>
            <Input
              placeholder="Search categories..."
              className="max-w-sm"
              value={searchTerm} // Bind the input field to the searchTerm state
              onChange={handleSearchChange} // Handle changes to search input
            />
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                {/* <TableHead className="w-[30px]">
                  <input type="checkbox" />
                </TableHead> */}
                <TableHead>
                  <div className="flex items-center gap-1">
                    Category
                    <ArrowUpDown className="h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead>Items sold</TableHead>
                {/* <TableHead>Orders</TableHead> */}
                <TableHead>Orders</TableHead>
                <TableHead>Net sales</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReportData &&
                filteredReportData.map((category, index) => (
                  <TableRow key={index}>
                    <TableCell>{category._id}</TableCell>
                    <TableCell>{category.totalItemsSold}</TableCell>
                    <TableCell>{category.totalOrders}</TableCell>
                    <TableCell>${category.totalRevenue.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
          <div className="text-sm text-muted-foreground mt-4">
            {/* {reportData.length} Categories • {totalItemsSold} Items sold • ${totalRevenue.toFixed(2)} Net sales • {totalOrders} Orders */}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
