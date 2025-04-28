import Link from 'next/link'
import { ColumnDef } from '@tanstack/react-table'
import { rankItem } from '@tanstack/match-sorter-utils'
// Components
import { cn, formatCurrency } from '~/lib/utils'
import Icon from '~/components/icon'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Checkbox } from '~/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import { useOrder } from '~/hooks/use-order'
import OrderStatus from '~/components/OrderStatus'
import PaymentStatus from '~/components/PaymentStatus'

const fuzzyFilter = (
  row: any,
  columnId: string,
  value: string,
  addMeta: any
) => {
  const itemRank = rankItem(row.getValue(columnId), value)
  addMeta({ itemRank })
  return itemRank.passed
}

const globalFilterFn = (row: any, columnId: string, filterValue: string) => {
  const searchValue = filterValue.toLowerCase()

  // Check order number and total
  const orderNumber = String(row.getValue('orderNumber')).toLowerCase()
  const total = String(row.getValue('total')).toLowerCase()

  // Check customer details
  const customer = row.original.customer
  const firstName = customer?.firstName?.toLowerCase() || ''
  const lastName = customer?.lastName?.toLowerCase() || ''
  const email = customer?.email?.toLowerCase() || ''

  return (
    orderNumber.includes(searchValue) ||
    total.includes(searchValue) ||
    firstName.includes(searchValue) ||
    lastName.includes(searchValue) ||
    email.includes(searchValue)
  )
}

export const columns: ColumnDef<any>[] = [
  // {
  //   id: 'select',
  //   header: ({ table }) => (
  //     <div className='w-4 flex justify-center mx-auto'>
  //       <Checkbox
  //         checked={table.getIsAllPageRowsSelected()}
  //         onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
  //         aria-label='Select all'
  //       />
  //     </div>
  //   ),
  //   cell: ({ row }) => (
  //     <div className='w-4 flex justify-center mx-auto'>
  //       <Checkbox
  //         checked={row.getIsSelected()}
  //         onCheckedChange={(value) => row.toggleSelected(!!value)}
  //         aria-label='Select row'
  //       />
  //     </div>
  //   ),
  //   enableSorting: false,
  //   enableHiding: false,
  // },

  {
    accessorKey: 'orderNumber',
    header: ({ column }) => {
      return (
        <Button
          className="pl-0"
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          # Order
          <Icon
            name="ArrowUpDown"
            size={16}
            className={cn(
              'ml-2',
              column.getIsSorted() === 'asc' &&
                'text-primary dark:text-foreground'
            )}
          />
        </Button>
      )
    },
    enableHiding: false,
    filterFn: fuzzyFilter,
    cell: ({ row }) => (
      <Link
        className="hover:underline"
        href={`/pos/orders/${row?.original?._id}/details`}
      >
        {row.getValue('orderNumber')}
      </Link>
    ),
  },
  {
    accessorKey: 'total',
    header: ({ column }) => {
      return (
        <Button
          className="pl-0"
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Amount
          <Icon
            name="ArrowUpDown"
            size={16}
            className={cn(
              'ml-2',
              column.getIsSorted() === 'asc' &&
                'text-primary dark:text-foreground'
            )}
          />
        </Button>
      )
    },
    filterFn: fuzzyFilter,
    cell: ({ row }) => (
      <h2 className="max-w-[220px] truncate">
        {formatCurrency(row.getValue('total'))}
      </h2>
    ),
  },
  {
    accessorKey: 'customer',
    header: ({ column }) => {
      return (
        <Button
          className="pl-0"
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Customer
          <Icon
            name="ArrowUpDown"
            size={16}
            className={cn(
              'ml-2',
              column.getIsSorted() === 'asc' &&
                'text-primary dark:text-foreground'
            )}
          />
        </Button>
      )
    },
    filterFn: (row, columnId, value) => {
      const customer = row.original.customer
      const searchValue = value.toLowerCase()
      console.log(customer)
      return (
        customer?.firstName?.toLowerCase().includes(searchValue) ||
        customer?.lastName?.toLowerCase().includes(searchValue) ||
        customer?.email?.toLowerCase().includes(searchValue)
      )
    },
    cell: ({ row }) => {
      const customer = row.original.customer
      return (
        <div>
          <p className="font-semibold capitalize">
            {customer?.firstName} {customer?.lastName}
          </p>
          <p className="text-sm">{customer?.email}</p>
          <p className="text-sm">{customer?.phone}</p>
        </div>
      )
    },
  },
  {
    accessorKey: 'date',
    header: ({ column }) => {
      return (
        <Button
          className="pl-0"
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Date & Time
          <Icon
            name="ArrowUpDown"
            size={16}
            className={cn(
              'ml-2',
              column.getIsSorted() === 'asc' &&
                'text-primary dark:text-foreground'
            )}
          />
        </Button>
      )
    },
    cell: ({ row }) => {
      const date = new Date(row.getValue('date'))
      const formattedDate = date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
      const formattedTime = date.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      })
      return (
        <p className="text-sm">
          {formattedDate}
          <br />
          <span className="text-xs text-muted-foreground">{formattedTime}</span>
        </p>
      )
    },
  },
  {
    accessorKey: 'orderstatus',
    header: ({ column }) => {
      return (
        <Button
          className="pl-0"
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Order Status
          <Icon
            name="ArrowUpDown"
            size={16}
            className={cn(
              'ml-2',
              column.getIsSorted() === 'asc' &&
                'text-primary dark:text-foreground'
            )}
          />
        </Button>
      )
    },
    filterFn: (row, id, value) => {
      if (!value) return true // show all rows when no filter is applied
      return row.getValue(id) === value // Exact match comparison
    },
    cell: ({ row }) => <OrderStatus status={row.getValue('orderstatus')} />,
  },
  {
    accessorKey: 'paymentStatus',
    header: ({ column }) => {
      return (
        <Button
          className="pl-0"
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Payment Status
          <Icon
            name="ArrowUpDown"
            size={16}
            className={cn(
              'ml-2',
              column.getIsSorted() === 'asc' &&
                'text-primary dark:text-foreground'
            )}
          />
        </Button>
      )
    },
    filterFn: (row, id, value) => {
      if (!value) return true // show all rows when no filter is applied
      return row.getValue(id) === value // Exact match comparison
    },
    cell: ({ row }) => <PaymentStatus status={row.getValue('paymentStatus')} />,
  },
  {
    id: 'actions',
    enableHiding: false,
    header: () => <span className="tracking-tighter">Quick View</span>,
    cell: ({ row }) => {
      const { setSelectedOrder } = useOrder()
      const item = row.original

      return (
        <div className="w-full flex justify-center">
          <Button
            onClick={() => setSelectedOrder(item)}
            variant="ghost"
            size="icon"
          >
            <Icon name="Eye" size={20} />
          </Button>
        </div>
      )
    },
  },
]
