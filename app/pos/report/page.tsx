'use client'
import { toast } from 'sonner'
import { redirect } from 'next/navigation'
import { useMutation, useQuery } from 'react-query'
import { iProfile, iReceiptBody } from '~/types'
// Hooks
import Axios from '~/lib/axios'
import { logout, useApp } from '~/hooks/use-app'
import { StaffEndpoints } from '~/lib/constants'
import { getDailyReport, sendReport } from '~/hooks/use-report'
import { printCustomerReceipt } from '~/hooks/use-order'
// Components
import Icon from '~/components/icon'
import Header from '~/components/header'
import { Button } from '~/components/ui/button'
import { Card, CardContent } from '~/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table'

export default function ReportsPage() {
  const { setIsAuthenticated } = useApp()

  const { data, refetch, isFetching } = useQuery({
    queryKey: ['reports'],
    queryFn: getDailyReport,
  })

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const { data } = await Axios.get(StaffEndpoints.profile)
      return data?.data as iProfile
    },
    onError: () => {
      logout()
      setIsAuthenticated(false)
      redirect('/pos/login')
    },
    onSuccess: data => {
      setIsAuthenticated(true)
    },
  })

  // Send report to email
  const { mutate: sendEmail, isLoading: isSending } = useMutation({
    mutationFn: sendReport,
    onSuccess: () => {
      toast.success('Success', {
        description: 'Email receipt sent',
      })
    },
    onError: (err, newTodo, context) => {
      toast.error('Error', {
        description: 'Failed to send email',
      })
    },
  })

  // Handle print customer receipt with react-query
  const {
    mutate: printCustomer,
    isLoading: isCustomerPrinting,
    isError: isCustomerError,
    error: customerError,
  } = useMutation({
    mutationFn: (data: iReceiptBody) => {
      const restName = profile?.selectedRestaurants[0]?.url_slug
      if (!restName) throw new Error('Restaurant name is required')

      return printCustomerReceipt(restName, data)
    },
    onSuccess: () => {
      toast.success('Success', {
        description: 'Customer receipt printed',
      })
    },
    onError: (err, newTodo, context) => {
      console.log(err)
    },
  })

  // Handle Download report as CSV
  const handleDownload = () => {
    const csv = [
      ['Description', 'Amount'],
      ['Net Sale', data?.netSale],
      ['Gross Sale', data?.grossSale],
      ['Tax', data?.tax],
      ['Tip', data?.tip],
      ['Refund', data?.refund],
      ['Discount', data?.discount],
      ['Item Discount', data?.itemDiscount],
      ['Void Amount', data?.void],
      ['Total Collected in Cash', data?.totalCollectedInCash],
      ['Total Collected in Card', data?.totalCollectedInCard],
    ]
      .map(row => row.join(','))
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.setAttribute('hidden', '')
    a.setAttribute('href', url)
    a.setAttribute('download', 'daily-report.csv')
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  return (
    <>
      <div>
        <Header />
        <div className="container h-[calc(100vh-48px)] mx-auto p-4 border-x shadow space-y-4">
          <div className="flex justify-between items-center py-3 border-b">
            <h1 className="text-xl font-bold tracking-tight">Daily Report</h1>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => refetch()}
                disabled={isFetching}
              >
                {isFetching ? (
                  <Icon name="Loader" className="animate-spin h-4 w-4" />
                ) : (
                  <Icon name="RefreshCw" className="h-4 w-4" />
                )}
                <span className="sr-only">Refresh data</span>
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() =>
                  printCustomer({
                    uniqueID: profile?.selectedRestaurants[0]?._id || '',
                    printtype: 'dailyreport',
                    printingInProgress: false,
                    printarea_name: 'customer-receipt',
                    statusCode: '200%20OK',
                    Printstatus: true,
                  })
                }
                disabled={isCustomerPrinting}
              >
                {isCustomerPrinting ? (
                  <Icon name="Loader" className="animate-spin h-4 w-4" />
                ) : (
                  <Icon name="Printer" className="h-4 w-4" />
                )}
                <span className="sr-only">Print report</span>
              </Button>
              <Button variant="outline" size="icon" onClick={handleDownload}>
                <Icon name="Download" className="h-4 w-4" />
                <span className="sr-only">Download report</span>
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => sendEmail()}
                disabled={isSending}
              >
                {isSending ? (
                  <Icon name="Loader" className="animate-spin h-4 w-4" />
                ) : (
                  <Icon name="Mail" className="h-4 w-4" />
                )}
                <span className="sr-only">Send report</span>
              </Button>
            </div>
          </div>

          <Card className="max-w-lg mx-auto">
            <CardContent className="pt-3">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>Net Sale</TableCell>
                    <TableCell className="text-right font-medium">
                      {data?.netSale}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Gross Sale</TableCell>
                    <TableCell className="text-right font-medium">
                      {data?.grossSale}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Tax</TableCell>
                    <TableCell className="text-right font-medium">
                      {data?.tax}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Tip</TableCell>
                    <TableCell className="text-right font-medium">
                      {data?.tip}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Refund</TableCell>
                    <TableCell className="text-right font-medium">
                      {data?.refund}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Discount</TableCell>
                    <TableCell className="text-right font-medium">
                      {data?.discount}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Item Discount</TableCell>
                    <TableCell className="text-right font-medium">
                      {data?.itemDiscount}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Void Amount</TableCell>
                    <TableCell className="text-right font-medium">
                      {data?.void}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Total Collected in Cash</TableCell>
                    <TableCell className="text-right font-medium">
                      {data?.totalCollectedInCash}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Total Collected in Card</TableCell>
                    <TableCell className="text-right font-medium">
                      {data?.totalCollectedInCard}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}
