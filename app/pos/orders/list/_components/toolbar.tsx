import React from 'react'
import { Cross2Icon } from '@radix-ui/react-icons'
import { Table } from '@tanstack/react-table'
// Components
import { cn } from '~/lib/utils'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '~/components/ui/tabs'
import DataTableViewOptions from '~/components/data-table-view-options'

import { categories, tags } from './data'
import Filter from './filter'
import { Badge } from '~/components/ui/badge'
import DateFilter from './date-filter'
import { DateRange } from 'react-day-picker'
import Icon from '~/components/icon'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '~/components/ui/tooltip'
import { iOrder } from '~/types'

const getStatusValue = (tab: string) => {
  const statusMap: Record<string, string> = {
    all: '',
    pending: 'Pending',
    complete: 'Complete',
    inkitchen: 'InKitchen',
    reject: 'Rejected',
    void: 'Voided',
  }
  return statusMap[tab] || ''
}

interface DataTableToolbarProps<TData>
  extends React.HTMLAttributes<HTMLDivElement> {
  table: Table<TData>
  data: iOrder[]
  activeTab: string
  dateRange: DateRange | undefined
  setDateRange: (dateRange: DateRange | undefined) => void
  setActiveTab: (value: string) => void
}
export default function BlogsToolbar<TData>({
  table,
  className,
  dateRange,
  setDateRange,
  setActiveTab,
  data,
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0

  const tabCounts = React.useMemo(
    () => ({
      all: data.length,
      pending: data.filter(b => b.orderstatus === 'Pending').length,
      complete: data.filter(b => b.orderstatus === 'Complete').length,
      inkitchen: data.filter(b => b.orderstatus === 'InKitchen').length,
      reject: data.filter(b => b.orderstatus === 'Rejected').length,
      void: data.filter(b => b.orderstatus === 'Voided').length,
    }),
    [data]
  )

  return (
    <div>
      <div className="p-3 flex items-center gap-2 justify-between">
        <Tabs
          defaultValue="all"
          onValueChange={val => {
            setActiveTab(val)
            if (val === 'all') {
              table.getColumn('orderstatus')?.setFilterValue('')
            } else {
              table
                .getColumn('orderstatus')
                ?.setFilterValue(getStatusValue(val))
            }
          }}
        >
          <TabsList>
            <TabsTrigger value="all" className="text-xs">
              All
              <Badge className="ml-2 !bg-black dark:!bg-white dark:!text-black p-1 leading-none">
                {tabCounts.all}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="pending" className="text-xs">
              Pending
              <Badge className="ml-2 !bg-yellow-500 p-1 leading-none">
                {tabCounts.pending}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="complete" className="text-xs">
              Completed
              <Badge className="ml-2 !bg-blue-500 p-1 leading-none">
                {tabCounts.complete}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="inkitchen" className="text-xs">
              In Kitchen
              <Badge className="ml-2 !bg-green-500 p-1 leading-none">
                {tabCounts.inkitchen}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="reject" className="text-xs">
              Rejected
              <Badge className="ml-2 !bg-destructive p-1 leading-none">
                {tabCounts.reject}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="void" className="text-xs">
              Voided
              <Badge className="ml-2 !bg-rose-400 p-1 leading-none">
                {tabCounts.void}
              </Badge>
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" className="w-7 h-7">
                <Icon name="Printer" size={15} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Print</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipContent>Print</TooltipContent>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" className="w-7 h-7">
                <Icon name="Download" size={15} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Export</TooltipContent>
          </Tooltip>
        </div>
      </div>
      <div className={cn('flex items-center gap-2 justify-between', className)}>
        <div className="flex flex-1 flex-col-reverse items-start gap-y-2 sm:flex-row sm:items-center sm:space-x-2">
          <Input
            placeholder="Search by Order Number / Phone / Email"
            value={table.getState().globalFilter || ''}
            onChange={event => {
              table.setGlobalFilter(event.target.value)
            }}
            className="h-8 w-4/5"
          />
        </div>

        <DateFilter
          dateRange={dateRange}
          onDateChange={val => {
            console.log(val)
            setDateRange(val)
            // Date range filter
            // table.setGlobalFilter(val)
          }}
        />
        <DataTableViewOptions table={table} />
      </div>
    </div>
  )
}
