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
export default function TaxReports() {
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
  const [searchTerm, setSearchTerm] = useState('')
  const [popoverOpen, setPopoverOpen] = useState(false)
  const [paymentstatus, setPaymentStatus] = useState('All')
  // const [filteredData, setFilteredData] = useState(reportData);
  // const [summaryData, setSummaryData] = useState({
  //   totalOrders: 0,
  //   totalTax: 0,
  //   totalOrderTax: 0,
  //   totalShippingTax: 0,
  // });
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
    }
    */
  }
  // Fetch tax data whenever date range or user changes
  useEffect(() => {
    const fetchTaxData = async () => {
      let userId = ''
      if (userDetails?.user?.usertype === 'restaurant_owner') {
        userId = userdata?.user ? userdata.user.id : ''
      } else {
        userId = userDetails?.user?.createdBy
      }

      const token = userdata?.user?.name?.token || ''
      setLoading(true)
      setError(null)

      try {
        if (userId) {
          const response = await axios.get(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/reports/taxesorderreport`,
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

          console.log('Data Tax Report dd', response)

          const reporttax = response.data.data
          setReportData(reporttax)
          setLoading(false)
        }
      } catch (err) {
        setError('Error fetching tax report data.')
        setLoading(false)
      }
    }
    const fetchChartData = async () => {
      try {
        let userId = ''
        if (userDetails?.user?.usertype === 'restaurant_owner') {
          userId = userdata?.user ? userdata.user.id : ''
        } else {
          userId = userDetails?.user?.createdBy
        }

        const token = userdata?.user?.name?.token || ''
        setLoading(true)
        setError(null)
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/reports/taxreportchart`,
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

        const reporttaxchart = response?.data?.data
        setChartData(reporttaxchart)
      } catch (error) {
        console.error('Error fetching chart data:', error)
      }
    }
    fetchTaxData()
    fetchChartData()
  }, [date, userDetails, userdata, paymentstatus])

  // console.log("Report Data Chart",chartData);
  //  // Handle the search term change
  //  const handleSearch = (e) => {
  //   setSearchTerm(e.target.value);
  // };

  // Filter data based on the search term
  // useEffect(() => {
  //   if (searchTerm === '') {
  //     setFilteredData(reportData);  // Reset to full data when search term is empty
  //   } else {
  //     const filtered = reportData.filter((item) => {
  //       const taxCode = item._id ? item._id.toString() : '';  // Assuming _id is the tax code
  //       return taxCode.includes(searchTerm);  // Check if the tax code contains the search term
  //     });
  //     setFilteredData(filtered);
  //   }
  // }, [searchTerm, reportData]);

  console.log('Chart Data', chartData)
  //Payment Status
  const paymentstatuswise = async paymentstatus => {
    setPaymentStatus(paymentstatus)
  }
  return (
    <div className="p-8 space-y-6">
      {loading && <Loading />}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Tax</h1>
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
              <SelectValue placeholder="Select taxes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All taxes</SelectItem>
              <SelectItem value="order">Order taxes</SelectItem>
              <SelectItem value="shipping">Shipping taxes</SelectItem>
            </SelectContent>
          </Select> */}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-green-100 border-green-100">
          <CardContent className="p-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Total tax</p>
              <p className="text-2xl font-bold">
                {' '}
                $
                {reportData?.totalTax ? reportData.totalTax.toFixed(2) : '0.00'}
              </p>
              {/* <p className="text-xs text-muted-foreground">0%</p> */}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gray-200 border-gray-200">
          <CardContent className="p-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Orders</p>
              <p className="text-2xl font-bold">{reportData?.totalOrders}</p>
              {/* <p className="text-xs text-muted-foreground">0%</p> */}
            </div>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardContent className="p-4">
          <div className="h-[300px]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="font-medium">Total tax</span>
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

      {/* <div className="p-4 space-y-6"></div>
      <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <span className="font-medium">Taxes</span>
          </div>
          <Input
            placeholder="Search tax codes..."
            className="max-w-sm"
            value={searchTerm}
            onChange={handleSearch}
          />
        </div>
      </CardContent>
    </Card> */}
    </div>
  )
}
