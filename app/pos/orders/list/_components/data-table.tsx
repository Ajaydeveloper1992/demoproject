'use client'

import * as React from 'react'
import { Table as TableType, flexRender } from '@tanstack/react-table'
import { iOrder } from '~/types'
// Hooks
import { useOrder } from '~/hooks/use-order'
// Components
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table'
import Icon from '~/components/icon'
//
import { columns } from './column'
import Pagination from './pagination'
import OrderDetails from '~/components/modals/order-details'

interface Props extends React.HTMLAttributes<HTMLElement> {
  data?: iOrder[]
  table: TableType<any>
  isLoading: boolean
}

const OrdersTable = ({ isLoading, table }: Props) => {
  const { selectedOrder, setSelectedOrder } = useOrder()
  console.log(selectedOrder)
  // const [selectedOrder, setSelectedOrder] = React.useState<iOrder | null>(null)
  // {isLoading && (
  //   <TableRow>
  //     <TableCell
  //       colSpan={columns.length}
  //       className='py-8 text-center'
  //     >
  //       <div className='flex justify-center items-center flex-col gap-2'>
  //         <Icon name='Inbox' size={50} className='text-muted' />
  //         <p className='text-muted-foreground font-semibold'>
  //           Fetching Data...
  //         </p>
  //       </div>
  //     </TableCell>
  //   </TableRow>
  // )}
  //  {table.getRowModel().rows.length ? (
  //   table.getRowModel().rows.map((row) => (
  //     <TableRow
  //       key={row.id}
  //       data-state={row.getIsSelected() && 'selected'}
  //     >
  //       {row.getVisibleCells().map((cell) => (
  //         <TableCell key={cell.id}>
  //           {flexRender(
  //             cell.column.columnDef.cell,
  //             cell.getContext()
  //           )}
  //         </TableCell>
  //       ))}
  //     </TableRow>
  //   ))
  // ) : (
  //   <TableRow>
  //     <TableCell
  //       colSpan={columns.length}
  //       className='py-8 text-center'
  //     >
  //       <div className='flex justify-center items-center flex-col gap-2'>
  //         <Icon name='Inbox' size={50} className='text-muted' />
  //         <p className='text-muted-foreground font-semibold'>
  //           No Data Found!
  //         </p>
  //       </div>
  //     </TableCell>
  //   </TableRow>
  // )}

  const renderTable = () => {
    if (isLoading)
      return (
        <TableRow>
          <TableCell colSpan={columns.length} className="py-8 text-center">
            <div className="flex justify-center items-center flex-col gap-2">
              <Icon name="Inbox" size={50} className="text-muted" />
              <p className="text-muted-foreground font-semibold">
                Fetching Data...
              </p>
            </div>
          </TableCell>
        </TableRow>
      )

    return table.getRowModel().rows.length ? (
      table.getRowModel().rows.map(row => (
        <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
          {row.getVisibleCells().map(cell => (
            <TableCell key={cell.id}>
              {flexRender(cell.column.columnDef.cell, cell.getContext())}
            </TableCell>
          ))}
        </TableRow>
      ))
    ) : (
      <TableRow>
        <TableCell colSpan={columns.length} className="py-8 text-center">
          <div className="flex justify-center items-center flex-col gap-2">
            <Icon name="Inbox" size={50} className="text-muted" />
            <p className="text-muted-foreground font-semibold">
              No Data Found!
            </p>
          </div>
        </TableCell>
      </TableRow>
    )
  }

  return (
    <div>
      <div className="border-y">
        <Table>
          <TableHeader className="bg-gray-100 dark:bg-muted h-12">
            {table.getHeaderGroups().map(headerGroup => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map(header => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>{renderTable()}</TableBody>
        </Table>
      </div>

      <Pagination table={table} />

      {/* <Sheet
        open={selectedOrder !== null}
        onOpenChange={(open) => !open && setSelectedOrder(null)}
      >
        <SheetContent className='sm:max-w-xl w-full'>
          <SheetHeader>
            <SheetTitle>Order Details</SheetTitle>
          </SheetHeader>
          {selectedOrder && <OrderDetails order={selectedOrder} />}
        </SheetContent>
      </Sheet> */}

      <OrderDetails
        isOpen={selectedOrder !== null}
        onClose={() => setSelectedOrder(null)}
        order={selectedOrder!!}
      />
    </div>
  )
}

export default OrdersTable
