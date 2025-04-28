'use client'

import * as React from 'react'
import { addDays, format } from 'date-fns'
import { DateRange } from 'react-day-picker'

import { cn } from '~/lib/utils'
import { Button } from '~/components/ui/button'
import { Calendar } from '~/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '~/components/ui/popover'
import Icon from '~/components/icon'

interface DateFilterProps extends React.HTMLAttributes<HTMLDivElement> {
  dateRange: DateRange | undefined
  onDateChange: (dateRange: DateRange | undefined) => void
}

const DateFilter: React.FC<DateFilterProps> = ({
  className,
  onDateChange,
  dateRange,
}) => {
  //   const [date, setDate] = React.useState<DateRange | undefined>({
  //     from: new Date(2024, 8, 20),
  //     to: addDays(new Date(2024, 8, 20), 20),
  //   })

  //   const handleDateChange = (dateRange: DateRange | undefined) => {
  //     setDate(dateRange)
  //     onDateChange(dateRange)
  //   }

  return (
    <div className={cn('grid gap-2', className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={'outline'}
            className={cn(
              'w-[220px] h-8 justify-start text-left font-normal truncate px-3',
              !dateRange && 'text-muted-foreground'
            )}
          >
            <Icon name="Calendar" size={16} className="mr-2" />
            {dateRange?.from ? (
              dateRange.to ? (
                <>
                  {format(dateRange.from, 'LLL dd, y')} -{' '}
                  {format(dateRange.to, 'LLL dd, y')}
                </>
              ) : (
                format(dateRange.from, 'LLL dd, y')
              )
            ) : (
              <span>Pick a date</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={dateRange?.from}
            selected={dateRange}
            onSelect={onDateChange}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}

export default DateFilter
