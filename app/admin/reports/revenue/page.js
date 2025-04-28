'use client'
import { useSession } from 'next-auth/react'
import React, { useEffect, useState } from 'react'
import { cn } from '~/lib/utils'
import { LineChart, MoreHorizontal, Download, ChevronDown } from 'lucide-react'
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
import Toastify from 'toastify-js'
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
const formatCurrency = value => {
  if (typeof value === 'number') {
    return `$${value.toFixed(2)}`
  }
  return value
}
const formatDate = dateString => {
  const date = new Date(dateString) // Convert string to date
  return format(date, 'MMMM d, yyyy') // Format the date to 'November 1, 2024'
}
export default function RevenueReports() {
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
  const [selectedFilter, setSelectedFilter] = useState('day')
  const [popoverOpen, setPopoverOpen] = useState(false)
  const [paymentstatus, setPaymentStatus] = useState('All')
  // Initialize state variables to store totals
  const [totals, setTotals] = useState({
    grossSales: 0,
    returns: 0,
    tip: 0, // Assuming Coupons is the same as Tip here
    netSales: 0,
    taxes: 0,
    shipping: 0,
    totalSales: 0,
    totalOrders: 0,
  })
  const [date, setDate] = useState({
    from: subDays(new Date(), 30), // 30 days ago
    to: new Date(), // Current date
  })
  useEffect(() => {
    setUserdata(session)
  }, [session])
  useEffect(() => {
    const fetchRevenueData = async () => {
      let userId = ''
      setLoading(true)
      let fromDate = ''
      let toDate = ''
      if (!date || !date?.to) {
        console.error('Date object is missing or invalid:', date)
        // Toastify({
        //       text: 'Date object is missing or invalid.',
        //       duration: 3000,
        //       close: true,
        //       gravity: "top",
        //       position: 'right',
        //       backgroundColor: "linear-gradient(to right, #FF5C5C, #FF3B3B)",
        //     }).showToast();
        //setDate('');
        toDate = ''
      } else {
        toDate = format(new Date(date.to), 'yyyy-MM-dd')
      }
      if (!date || !date?.from) {
        console.error('Date object is missing or invalid:', date)
        // Toastify({
        //   text: 'Date object is missing or invalid.',
        //   duration: 3000,
        //   close: true,
        //   gravity: "top",
        //   position: 'right',
        //   backgroundColor: "linear-gradient(to right, #FF5C5C, #FF3B3B)",
        // }).showToast();
        //setDate('');
        fromDate = ''
      } else {
        fromDate = format(date?.from, 'yyyy-MM-dd')
      }

      /*let fromDate = format(date?.from, "yyyy-MM-dd");
      let toDate = format(date?.to, "yyyy-MM-dd");*/

      if (userDetails?.user?.usertype === 'restaurant_owner') {
        userId = userdata?.user ? userdata.user.id : ''
      } else {
        userId = userDetails?.user?.createdBy
      }

      const token =
        userdata?.user && userdata.user.name ? userdata.user.name.token : ''

      try {
        if (userId) {
          const response = await axios.get(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/reports/revenue`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
              params: {
                userId: userId,
                fromDate: fromDate,
                toDate: toDate,
                paymentstatus,
              },
            }
          )
          console.log('Data Response:', response.data.data)

          if (response.data.data.length === 0) {
            setError('No data found for the specified date range')
            setReportData(response.data.data)
          } else {
            setReportData(response.data.data)
          }
        }
      } catch (error) {
        console.error('Error fetching revenue data', error)
      } finally {
        setLoading(false)
      }
    }
    fetchRevenueData()
  }, [date, userDetails, userdata, paymentstatus])

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

  const transformChartData = () => {
    const transformedData = reportData.map(item => ({
      name: new Date(item._id).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      }), // Format the date
      value: item.totalGrossSales, // Use the desired field, e.g., totalGrossSales, totalNetSales, etc.
    }))
    setChartData(transformedData)
  }
  // Handle the filter change (day, week, month) and update the chart accordingly
  const handleFilterChange = filter => {
    setSelectedFilter(filter)
    // You can adjust the data here based on the selected filter (day, week, month)
    transformChartData()
  }

  // useEffect to transform data initially
  useEffect(() => {
    // Function to transform the reportData into chart data format
    const transformChartData = () => {
      const transformedData = reportData.map(item => ({
        name: new Date(item._id).toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        }), // Format the date
        value: item.totalGrossSales, // Use the desired field, e.g., totalGrossSales, totalNetSales, etc.
      }))
      setChartData(transformedData)
    }

    if (reportData && Array.isArray(reportData) && reportData.length > 0) {
      transformChartData()
      // Total Calculation
      const calculatedTotals = reportData.reduce(
        (acc, item) => {
          acc.grossSales += item.totalGrossSales
          acc.returns += item.totalReturns
          acc.tip += item.totalTip // Assuming Coupons = Tip
          acc.netSales += item.totalNetSales
          acc.taxes += item.totalTaxes
          acc.shipping += item.totalShipping
          acc.totalSales += item.totalNetSales + item.totalReturns // Total sales = Net Sales + Returns
          acc.totalOrderDiscounts +=
            item.totalItemDiscounts + item.totalOrderDiscounts
          acc.totalOrders += item.totalOrders
          return acc
        },
        {
          grossSales: 0,
          returns: 0,
          tip: 0,
          netSales: 0,
          taxes: 0,
          shipping: 0,
          totalSales: 0,
          totalOrderDiscounts: 0,
          totalOrders: 0,
        }
      )
      setTotals(calculatedTotals)
    } else {
      setTotals({
        grossSales: 0,
        returns: 0,
        tip: 0,
        netSales: 0,
        taxes: 0,
        shipping: 0,
        totalSales: 0,
        totalOrderDiscounts: 0,
        totalOrders: 0,
      })
      setChartData()
    }
  }, [date, reportData])

  console.log('Report Data ', reportData)
  //Payment Status
  const paymentstatuswise = async paymentstatus => {
    setPaymentStatus(paymentstatus)
  }

  console.log('Data is check', totals)
  return (
    <div className="p-8 space-y-6">
      {loading && <Loading />}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Revenue</h1>
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
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-green-100 border-green-100">
          <CardContent className="p-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Net Sales</p>
              <p className="text-2xl font-bold">{`$${parseFloat(
                totals.grossSales
              ).toFixed(2)}`}</p>
              {/* <p className="text-xs text-muted-foreground">0%</p> */}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-red-100 border-red-100">
          <CardContent className="p-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Gross Sale</p>
              <p className="text-2xl font-bold">{`$${(
                totals.grossSales + parseFloat(totals.taxes)
              ).toFixed(2)}`}</p>
              {/* <p className="text-xs text-muted-foreground">0%</p> */}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-indigo-100 border-indigo-100">
          <CardContent className="p-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Total Sales</p>
              <p className="text-2xl font-bold">{`$${(
                parseFloat(totals.grossSales) +
                parseFloat(totals.tip) +
                parseFloat(totals.taxes) +
                parseFloat(totals.shipping)
              ).toFixed(2)}`}</p>
              {/* <p className="text-xs text-muted-foreground">0%</p> */}
            </div>
          </CardContent>
        </Card>
        {/* <Card>
        <CardContent className="p-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Gross Sales</p>
            <p className="text-2xl font-bold">{`$${totals.netSales.toFixed(2)}`}</p> */}
        {/* <p className="text-xs text-muted-foreground">0%</p> */}
        {/* </div>
        </CardContent>
      </Card> */}

        <Card className="bg-yellow-100 border-yellow-100">
          <CardContent className="p-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Tip</p>
              <p className="text-2xl font-bold">{`$${totals.tip.toFixed(
                2
              )}`}</p>
              {/* <p className="text-xs text-muted-foreground">0%</p> */}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-blue-100 border-blue-100">
          <CardContent className="p-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Taxes</p>
              <p className="text-2xl font-bold">{`$${totals.taxes.toFixed(
                2
              )}`}</p>
              {/* <p className="text-xs text-muted-foreground">0%</p> */}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-purple-100 border-purple-100">
          <CardContent className="p-4">
            {/* <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Shipping</p>
            <p className="text-2xl font-bold">{`$${totals.shipping.toFixed(2)}`}</p> */}
            {/* <p className="text-xs text-muted-foreground">0%</p> */}
            {/* </div> */}
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Refund</p>
              <p className="text-2xl font-bold">{`$${totals.returns.toFixed(
                2
              )}`}</p>
              {/* <p className="text-xs text-muted-foreground">0%</p> */}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-pink-100 border-pink-100">
          <CardContent className="p-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Discount</p>
              <p className="text-2xl font-bold">
                {`$${totals?.totalOrderDiscounts?.toFixed(2)}`}{' '}
              </p>
              {/* <p className="text-xs text-muted-foreground">0%</p> */}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gray-200 border-gray-200">
          <CardContent className="p-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Orders</p>
              <p className="text-2xl font-bold">{`${totals.totalOrders}`} </p>
              {/* <p className="text-xs text-muted-foreground">0%</p> */}
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="p-4">
        <Card>
          <CardContent className="p-4">
            <div className="h-[300px]">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Gross Sales</span>
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
                {/* <Select defaultValue="day" onValueChange={handleFilterChange}>
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
      </div>
      <div className="p-4 space-y-6"></div>
      <div>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <span className="font-medium">Revenue</span>
              {/* <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button> */}
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Orders</TableHead>
                  <TableHead>Net Sales</TableHead>
                  <TableHead>Refund</TableHead>
                  <TableHead>Tip</TableHead>
                  <TableHead>Discounts</TableHead>
                  <TableHead>Taxes</TableHead>
                  <TableHead>Gross Sale</TableHead>
                  <TableHead>Total Sales</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportData &&
                  reportData.map((row, i) => (
                    <TableRow key={i}>
                      <TableCell>{formatDate(row._id)}</TableCell>{' '}
                      {/* Format date as "November 1, 2024" */}
                      <TableCell>{row.totalOrders}</TableCell>
                      <TableCell>
                        {formatCurrency(parseFloat(row.totalGrossSales))}
                      </TableCell>
                      <TableCell>{formatCurrency(row.totalReturns)}</TableCell>
                      <TableCell>{formatCurrency(row.totalTip)}</TableCell>{' '}
                      {/* Assuming Coupons = Tips */}
                      <TableCell>
                        {formatCurrency(
                          parseFloat(row.totalOrderDiscounts) +
                            parseFloat(row.totalItemDiscounts)
                        )}
                      </TableCell>
                      <TableCell>{formatCurrency(row.totalTaxes)}</TableCell>
                      {/* <TableCell>{formatCurrency(row.totalShipping)}</TableCell> */}
                      <TableCell>
                        {formatCurrency(
                          parseFloat(row.totalGrossSales) +
                            parseFloat(row.totalTaxes)
                        )}
                      </TableCell>
                      <TableCell>
                        {formatCurrency(
                          parseFloat(row.totalGrossSales) +
                            parseFloat(row.totalTip) +
                            parseFloat(row.totalTaxes)
                        )}
                      </TableCell>{' '}
                      {/* Calculate Total Sales */}
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
            <div className="text-sm text-muted-foreground mt-4">
              {/* Summary Section */}
              {/* {`${reportData && reportData.length} days • ${totals.orders} orders • ${formatCurrency(totals.grossSales)} Gross sales • ${formatCurrency(totals.returns)} Returns • ${formatCurrency(totals.coupons)} Tip • ${formatCurrency(totals.netSales)} Net sales • ${formatCurrency(totals.taxes)} Taxes • ${formatCurrency(totals.shipping)} Shipping • ${formatCurrency(totals.totalSales)} Total sales`} */}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
