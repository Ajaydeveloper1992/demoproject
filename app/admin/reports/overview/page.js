'use client'
import { useSession } from 'next-auth/react'
import React, { useEffect, useState } from 'react'
import { cn } from '~/lib/utils'
import {
  BarChart as BarChartIcon,
  LineChart as LineChartIcon,
  MoreHorizontal,
  ChevronDown,
} from 'lucide-react'
import { Card, CardContent } from '~/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectGroup,
  SelectValue,
  SelectLabel,
} from '~/components/ui/select'
import { Button } from '~/components/ui/button'
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
  BarChart,
  Bar,
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

export default function OverviewReports() {
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
  const [popoverOpen, setPopoverOpen] = useState(false)
  const [paymentstatus, setPaymentStatus] = useState('All')
  const [date, setDate] = useState({
    from: subDays(new Date(), 30), // 30 days ago
    to: new Date(), // Current date
  })
  useEffect(() => {
    setUserdata(session)
  }, [session])
  // Fetch data when the component is mounted
  useEffect(() => {
    const fetchData = async () => {
      let userId = ''
      let restaurantIds = []
      // let fromDate = '';
      // let toDate = '';
      if (userDetails?.user?.usertype === 'restaurant_owner') {
        userId = userdata?.user ? userdata.user.id : ''
      } else {
        userId = userDetails?.user?.createdBy
        restaurantIds = userDetails.user.selectedRestaurants
      }

      // Get today's date in 'YYYY-MM-DD' format
      const today = new Date()
      // console.log("This is work date ",today);
      //const formattedDate = today.toISOString().split('T')[0]; // 'YYYY-MM-DD'

      // Use today's date for both 'from' and 'to' as per your requirement
      // fromDate = format(date?.from, "yyyy-MM-dd");
      // toDate = format(date?.to, "yyyy-MM-dd");
      let toDate = '' //format(date.to, "yyyy-MM-dd");
      if (!date || !date?.to) {
        console.error('Date object is missing or invalid:', date)
        toDate = ''
      } else {
        toDate = format(new Date(date.to), 'yyyy-MM-dd')
      }

      let fromDate = '' //format(date.from, "yyyy-MM-dd");
      if (!date || !date?.from) {
        console.error('Date object is missing or invalid:', date)
        fromDate = ''
      } else {
        fromDate = format(date?.from, 'yyyy-MM-dd')
      }
      const token =
        userdata?.user && userdata.user.name ? userdata.user.name.token : ''
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/reports/overview/`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            params: {
              userId: userId,
              fromDate, // Adding fromDate to the API request
              toDate, // Adding toDate to the API request
              paymentstatus,
            },
          }
        )
        setReportData(response.data.data) // Store the fetched data
        setLoading(false) // Set loading to false once data is fetched
        setIsPreset(false)
        setPopoverOpen(false)
      } catch (err) {
        setError('Failed to fetch data')
        setLoading(false)
        console.error(err)
      }
    }
    if (userdata && userDetails) {
      fetchData() // Call the function to fetch data only when userdata and userDetails are available
    }
  }, [userdata, userDetails, date, paymentstatus])

  console.log('Report Data', reportData)

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
    }
    */
  }
  // Fetch chart data whenever the view changes
  useEffect(() => {
    const fetchData = async () => {
      let userId = ''
      let restaurantIds = []
      // let fromDate = format(date?.from, "yyyy-MM-dd");
      // let toDate = format(date?.to, "yyyy-MM-dd");
      let toDate = '' //format(date.to, "yyyy-MM-dd");
      if (!date || !date?.to) {
        console.error('Date object is missing or invalid:', date)
        toDate = ''
      } else {
        toDate = format(new Date(date.to), 'yyyy-MM-dd')
      }

      let fromDate = '' //format(date.from, "yyyy-MM-dd");
      if (!date || !date?.from) {
        console.error('Date object is missing or invalid:', date)
        fromDate = ''
      } else {
        fromDate = format(date?.from, 'yyyy-MM-dd')
      }
      if (userDetails?.user?.usertype === 'restaurant_owner') {
        userId = userdata?.user ? userdata.user.id : ''
      } else {
        userId = userDetails?.user?.createdBy
        restaurantIds = userDetails?.user?.selectedRestaurants
      }
      const token =
        userdata?.user && userdata.user.name ? userdata.user.name.token : ''

      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/reports/orderchart?view=${view}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            params: {
              userId: userId,
              fromDate, // Adding fromDate to the API request
              toDate, // Adding toDate to the API request
              paymentstatus,
            },
          }
        )
        setChartData(response.data.data)
      } catch (error) {
        console.error('Error fetching chart data', error)
        // Optionally handle error gracefully here
      }
    }
    const fetchTopCategories = async () => {
      setLoading(true)
      setError(null)
      let userId = ''
      let restaurantIds = []
      // let fromDate = format(date.from, "yyyy-MM-dd");
      // let toDate = format(date.to, "yyyy-MM-dd");
      let toDate = '' //format(date.to, "yyyy-MM-dd");
      if (!date || !date?.to) {
        console.error('Date object is missing or invalid:', date)
        toDate = ''
      } else {
        toDate = format(new Date(date.to), 'yyyy-MM-dd')
      }

      let fromDate = '' //format(date.from, "yyyy-MM-dd");
      if (!date || !date?.from) {
        console.error('Date object is missing or invalid:', date)
        fromDate = ''
      } else {
        fromDate = format(date?.from, 'yyyy-MM-dd')
      }

      if (userDetails?.user?.usertype === 'restaurant_owner') {
        userId = userdata?.user ? userdata.user.id : ''
      } else {
        userId = userDetails?.user?.createdBy
        restaurantIds = userDetails?.user?.selectedRestaurants
      }

      const token =
        userdata?.user && userdata.user.name ? userdata.user.name.token : ''

      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/reports/topcategories`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            params: {
              userId: userId,
              fromDate: fromDate, // Example date
              toDate: toDate, // Example date
              paymentstatus,
            },
          }
        )
        console.log('Cat Report: ', response.data)

        setCategories(response.data.data) // Set the top categories
      } catch (error) {
        setError('Failed to fetch top categories')
      } finally {
        setLoading(false)
      }
    }
    const fetchTopProducts = async () => {
      setLoading(true)
      setError(null)
      let userId = ''
      let restaurantIds = []

      let toDate = '' //format(date.to, "yyyy-MM-dd");
      if (!date || !date?.to) {
        console.error('Date object is missing or invalid:', date)
        toDate = ''
      } else {
        toDate = format(new Date(date.to), 'yyyy-MM-dd')
      }

      let fromDate = '' //format(date.from, "yyyy-MM-dd");
      if (!date || !date?.from) {
        console.error('Date object is missing or invalid:', date)
        fromDate = ''
      } else {
        fromDate = format(date?.from, 'yyyy-MM-dd')
      }

      if (userDetails?.user?.usertype === 'restaurant_owner') {
        userId = userdata?.user ? userdata.user.id : ''
      } else {
        userId = userDetails?.user?.createdBy
        restaurantIds = userDetails?.user?.selectedRestaurants
      }

      const token =
        userdata?.user && userdata.user.name ? userdata.user.name.token : ''
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/reports/topproducts`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            params: {
              userId: userId,
              fromDate: fromDate,
              toDate: toDate,
              limit: 5,
              paymentstatus,
            },
          }
        )

        setProducts(response.data.data) // Set the top products data
      } catch (error) {
        setError('Failed to fetch top products')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
    fetchTopCategories()
    fetchTopProducts()
  }, [view, userdata, userDetails, date, paymentstatus])

  // Percentage value calculation
  const getPercentageChange = (previous, current) => {
    if (!previous || previous === 0) {
      return current > 0 ? '+100' : '0' // Handle initial state or zero previous value
    }
    const change = ((current - previous) / previous) * 100
    return change >= 0 ? `+${change.toFixed(2)}` : `${change.toFixed(2)}`
  }
  //Payment Status
  const paymentstatuswise = async paymentstatus => {
    setPaymentStatus(paymentstatus)
  }
  console.log('isPreset', isPreset)
  return (
    <div className="flex-1">
      {loading && <Loading />}
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Overview</h1>
          <div className="flex items-center gap-2">
            {/* Add additional buttons here */}
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
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Performance</h2>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
          <div className="grid grid-cols-4 gap-4">
            {/* Net Sales */}
            <Card className="bg-green-100 border-green-100">
              <CardContent className="p-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Net sales</p>
                  <p className="text-2xl font-bold">
                    {reportData?.netSales
                      ? `$${reportData.netSales.toFixed(2)}`
                      : '$0.00'}
                  </p>
                  {/* <p className="text-xs text-muted-foreground">
                    {reportData?.previous?.netSales
                      ? `${getPercentageChange(reportData.previous.netSales, reportData.netSales)}%`
                      : "+0%"}
                  </p> */}
                </div>
              </CardContent>
            </Card>
            {/* Total Sales */}
            <Card className="bg-indigo-100 border-indigo-100">
              <CardContent className="p-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Total sales</p>
                  <p className="text-2xl font-bold">
                    {reportData?.totalPaymentAmount
                      ? `$${reportData.totalPaymentAmount.toFixed(2)}`
                      : '$0.00'}
                  </p>
                  {/* <p className="text-xs text-muted-foreground">
                    {reportData?.previous?.totalSales
                      ? `${getPercentageChange(reportData.previous.totalSales, reportData.totalSales)}%`
                      : "+0%"}
                  </p> */}
                </div>
              </CardContent>
            </Card>
            {/* Orders */}
            <Card className="bg-gray-200 border-gray-200">
              <CardContent className="p-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Orders</p>
                  <p className="text-2xl font-bold">
                    {reportData?.totalOrders || 0}
                  </p>
                  {/* <p className="text-xs text-muted-foreground">
                    {reportData?.previous?.totalOrders
                      ? `${getPercentageChange(reportData.previous.totalOrders, reportData.totalOrders)}%`
                      : "+0%"}
                  </p> */}
                </div>
              </CardContent>
            </Card>

            {/* Products Sold */}
            <Card className="bg-pink-100 border-pink-100">
              <CardContent className="p-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Products sold</p>
                  <p className="text-2xl font-bold">
                    {reportData?.productsSold || 0}
                  </p>
                  {/* <p className="text-xs text-muted-foreground">
                    {reportData?.previous?.productsSold
                      ? `${getPercentageChange(reportData.previous.productsSold, reportData.productsSold)}%`
                      : "+0%"}
                  </p> */}
                </div>
              </CardContent>
            </Card>

            {/* Variations Sold */}
            {/* <Card>
              <CardContent className="p-4">
                <div className="space-y-1"> */}
            {/* <p className="text-sm text-muted-foreground">Modifiers Sold</p>
                  <p className="text-2xl font-bold">{reportData?.modifiersSold || 0}</p> */}
            {/* <p className="text-xs text-muted-foreground">
                    {reportData?.previous?.variationsSold
                      ? `${getPercentageChange(reportData.previous.variationsSold, reportData.variationsSold)}%`
                      : "+0%"}
                  </p> */}
            {/*</div>
               </CardContent>
            </Card> */}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Charts</h2>
            <div className="flex items-center gap-2">
              {/* <Select defaultValue="day">
                <SelectTrigger className="w-[100px]">
                  <SelectValue placeholder="Select view" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">By day</SelectItem>
                  <SelectItem value="week">By week</SelectItem>
                  <SelectItem value="month">By month</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button> */}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
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
            <Card>
              <CardContent className="p-4">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="orders" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Leaderboards</h2>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4">
                <h3 className="font-medium mb-4">
                  Top categories - Items sold
                </h3>
                <div className="space-y-4">
                  {categories.map(category => (
                    <div className="flex justify-between" key={category.name}>
                      <span>{category.name}</span>
                      <span>{category.itemsSold} items sold</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <h3 className="font-medium mb-4">Top products - Items sold</h3>
                <div className="space-y-4">
                  {products.map(product => (
                    <div className="flex justify-between" key={product.name}>
                      <span>{product.name}</span>
                      <span>{product.quantitySold} items sold</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
