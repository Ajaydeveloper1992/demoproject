import { format } from 'date-fns'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { Separator } from '~/components/ui/separator'
import { Badge } from '~/components/ui/badge'
import { iOrder } from '~/types'

interface OrderDetailsProps {
  order: iOrder
}

const OrderDetails = ({ order }: OrderDetailsProps) => {
  const formatTime = (date: Date | undefined) => {
    return date ? format(date, 'PPpp') : 'N/A'
  }
  const formatDate = (date: Date | undefined) => {
    return date ? format(date, 'dd MMM yyyy') : 'N/A'
  }
  const getStatusColor = (status: string | undefined) => {
    switch (status) {
      case 'Pending':
        return 'bg-yellow-500'
      case 'In Kitchen':
        return 'bg-blue-500'
      case 'Complete':
        return 'bg-green-500'
      case 'Void':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getPaymentStatusColor = (status: iOrder['paymentStatus']) => {
    switch (status) {
      case 'Paid':
        return 'bg-green-500'
      case 'Pending':
        return 'bg-yellow-500'
      case 'Failed':
        return 'bg-red-500'
      case 'Refunded':
        return 'bg-purple-500'
      default:
        return 'bg-gray-500'
    }
  }
  const subtotal = order.items.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  )
  const tax = subtotal * 0.13 // 13% tax rate
  const total = subtotal + tax

  return (
    <div className="flex flex-col h-full space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{order.orderNumber}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium">Date</p>
              <p className="text-sm text-muted-foreground">
                {formatDate(order.date)} | {formatTime(order.date)}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">Server</p>
              <p className="text-sm text-muted-foreground">
                {order?.server?.name}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">Customer</p>
              <p className="text-sm text-muted-foreground">
                {order.customer?.firstName || 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">Phone</p>
              <p className="text-sm text-muted-foreground">
                {order?.customer?.phone}
              </p>
            </div>
            {order?.customer?.email && (
              <div>
                <p className="text-sm font-medium">Email</p>
                <p className="text-sm text-muted-foreground">
                  {order?.customer?.email}
                </p>
              </div>
            )}
          </div>
          <div className="flex justify-between items-center">
            <Badge variant="outline">{order?.orderType}</Badge>
            <Badge className={getStatusColor(order.orderstatus)}>
              {order.orderstatus}
            </Badge>
            <Badge className={getPaymentStatusColor(order.paymentStatus)}>
              {order.paymentStatus}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Order Items</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Subtotal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.items.map(item => (
                <TableRow key={item._id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{'item?.item?.name'}</p>
                      {item.itemNote && (
                        <p className="text-sm text-muted-foreground">
                          Note: {item.itemNote}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">{item.quantity}</TableCell>
                  <TableCell className="text-right">
                    ${item.price.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    ${(item.price * item.quantity).toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="flex justify-between">
            <span className="font-medium">Total</span>
            <span className="font-bold">${order.total.toFixed(2)}</span>
          </div>
          {order.specialInstructions && (
            <>
              <Separator />
              <div>
                <p className="font-medium">Order Note:</p>
                <p className="text-sm text-muted-foreground">
                  {order?.specialInstructions}
                </p>
              </div>
            </>
          )}
          <Separator />
          <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
            <div>
              <p>Created By: {order.staffid?.fname || 'N/A'}</p>
              <p>Created At: {formatTime(order.date)}</p>
            </div>
            <div>
              <p>Updated At: {formatTime(order.updatedAt)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="sticky bottom-0 bg-background p-4 border-t">
        <Button
          variant="destructive"
          className="w-full"
          disabled={order.paymentStatus === 'Refunded'}
        >
          {order.paymentStatus === 'Refunded'
            ? 'Order Refunded'
            : 'Refund Order'}
        </Button>
      </div>
    </div>
  )
}

export default OrderDetails
