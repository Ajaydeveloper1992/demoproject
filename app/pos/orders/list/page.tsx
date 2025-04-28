'use client'

import * as React from 'react'
import Link from 'next/link'
import {
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { DateRange } from 'react-day-picker'
import { isWithinInterval } from 'date-fns'
import { filterFns } from '@tanstack/react-table'
import { useQuery } from 'react-query'
import { iOrder } from '~/types'
// Libs
import Axios from '~/lib/axios'
import { OrderEndpoints } from '~/lib/constants'
// Hooks
import { useOrder } from '~/hooks/use-order'
// Components
import { Button } from '~/components/ui/button'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '~/components/ui/breadcrumb'
import Icon from '~/components/icon'
import Layout from '~/components/layout'
import Header from '~/components/header'
import { Card } from '~/components/ui/card'
import ConfirmDialog from '~/components/confirm-dialog'
//
import DataTable from './_components/data-table'
import { columns } from './_components/column'
import Toolbar from './_components/toolbar'
import ActionsBar from './_components/actions-bar'

// Add this function before your component
const fuzzyGlobalFilter = (row: any, columnId: string, filterValue: string) => {
  const searchValue = filterValue.toLowerCase()

  // Check order number and total
  const orderNumber = String(row.getValue('orderNumber'))?.toLowerCase()
  const total = String(row.getValue('total'))?.toLowerCase()

  // Check customer details
  const customer = row.original.customer
  const firstName = customer?.firstName?.toLowerCase() || ''
  const lastName = customer?.lastName?.toLowerCase() || ''
  const email = customer?.email?.toLowerCase() || ''
  const phone = customer?.phone?.toLowerCase() || ''

  return (
    orderNumber?.includes(searchValue) ||
    total?.includes(searchValue) ||
    firstName.includes(searchValue) ||
    lastName.includes(searchValue) ||
    email.includes(searchValue) ||
    phone.includes(searchValue)
  )
}

export default function PostsPage() {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  )
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({ tags: false })
  const [rowSelection, setRowSelection] = React.useState({})
  const [activeTab, setActiveTab] = React.useState('all')
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = React.useState(false)
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>()

  const { isLoading } = useOrder()

  React.useEffect(() => {
    if (dateRange?.from && dateRange?.to) {
      setColumnFilters(prevFilters => [
        ...prevFilters.filter(filter => filter.id !== 'dateRange'),
        {
          id: 'dateRange',
          value: { from: dateRange.from, to: dateRange.to },
        },
      ])
    } else {
      setColumnFilters(prevFilters =>
        prevFilters.filter(filter => filter.id !== 'dateRange')
      )
    }
  }, [dateRange])

  const { data } = useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const { data } = await Axios.get(OrderEndpoints.getAll())
      return data?.data as iOrder[]
    },
    refetchOnMount: true,
  })

  const filteredData = React.useMemo(() => {
    let filteredPosts = data || []

    if (
      dateRange?.from &&
      dateRange?.to &&
      dateRange.from?.getTime() !== dateRange?.to.getTime()
    ) {
      filteredPosts = filteredPosts.filter(item =>
        isWithinInterval(new Date(item.date!), {
          start: dateRange.from!,
          end: dateRange.to!,
        })
      )
    }

    // If only from date is selected, filter posts only that selected date
    if (
      dateRange?.from &&
      (!dateRange?.to ||
        dateRange?.from?.getTime() === dateRange?.to?.getTime())
    ) {
      filteredPosts = filteredPosts.filter(item => {
        return new Date(item.date!).getDate() === dateRange.from?.getDate()
      })
    }

    return filteredPosts
  }, [activeTab, data, dateRange])

  const table = useReactTable({
    data: filteredData,
    columns,
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
    initialState: {
      pagination: {
        pageSize: 8,
      },
    },
    filterFns: {
      ...filterFns,
      fuzzyGlobal: fuzzyGlobalFilter,
    },
    globalFilterFn: fuzzyGlobalFilter,
  })

  const selectedRowsCount = Object.keys(rowSelection).length

  const handleDelete = React.useCallback(() => {
    // Implement delete functionality here
    console.log('Deleting selected rows:', rowSelection)
    // Reset row selection after delete
    setRowSelection({})
    setIsConfirmDialogOpen(false)
  }, [rowSelection])

  return (
    <>
      <Header />
      <Layout
        className=""
        title="Orders"
        BreadCrumb={PostsBreadCrumb}
        actionEl={
          <Link href="/pos/orders/new">
            <Button size="sm">
              <Icon name="Plus" size={15} /> New Order
            </Button>
          </Link>
        }
      >
        <Card className="mt-5">
          <Toolbar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            className="p-3 pt-0"
            table={table}
            data={data || []}
            dateRange={dateRange}
            setDateRange={setDateRange}
          />

          <div className="relative">
            {selectedRowsCount > 0 && (
              <ActionsBar
                selectedRowsCount={selectedRowsCount}
                handleDelete={() => setIsConfirmDialogOpen(true)}
                setRowSelection={setRowSelection}
              />
            )}

            <DataTable isLoading={isLoading} table={table} />
          </div>
        </Card>

        <ConfirmDialog
          isOpen={isConfirmDialogOpen}
          onClose={() => setIsConfirmDialogOpen(false)}
          onConfirm={handleDelete}
          title="Confirm Deletion"
          description={
            <p>
              Are you sure want to delete <strong>({selectedRowsCount})</strong>{' '}
              items?
              <br />
              This action cannot be undone!
            </p>
          }
        />
      </Layout>
    </>
  )
}

const PostsBreadCrumb = () => {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="/pos">Dashboard</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator className="-mx-1">
          <Icon name="ChevronRight" />
        </BreadcrumbSeparator>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="/pos/orders/list">Orders</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator>
          <Icon name="ChevronRight" />
        </BreadcrumbSeparator>
        <BreadcrumbItem>
          <BreadcrumbPage>List</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  )
}
