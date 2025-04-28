import * as React from 'react'
import { CheckIcon, PlusCircledIcon } from '@radix-ui/react-icons'
import { Column } from '@tanstack/react-table'

import { cn, countCategories, countTags } from '~/lib/utils'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '~/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '~/components/ui/popover'
import { Separator } from '~/components/ui/separator'
import Icon from '~/components/icon'

interface BlogsFilterProps<TData, TValue> {
  column?: Column<TData, TValue>
  title?: string
  options: any[]
}

export default function BlogsFilter<TData, TValue>({
  column,
  title,
  options,
}: BlogsFilterProps<TData, TValue>) {
  const selectedValues = new Set(column?.getFilterValue() as string[])

  // Get the filtered data
  const filteredData = column
    ?.getFacetedRowModel()
    .rows.map(row => row.original) as any[]

  // Get the category counts from the filtered data
  const categoryCounts = countCategories(filteredData)
  const tagCounts = countTags(filteredData)

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 border-dashed">
          <PlusCircledIcon className="mr-2 h-4 w-4" />
          {title}
          {selectedValues?.size > 0 && (
            <>
              <Separator orientation="vertical" className="mx-2 h-4" />
              <Badge
                variant="secondary"
                className="rounded-sm px-1 font-normal lg:hidden"
              >
                {selectedValues.size}
              </Badge>
              <div className="hidden space-x-1 lg:flex">
                {selectedValues.size > 2 ? (
                  <Badge
                    variant="secondary"
                    className="rounded-sm px-1 font-normal"
                  >
                    {selectedValues.size} selected
                  </Badge>
                ) : (
                  options
                    .filter(option => selectedValues.has(option.id))
                    .map(option => (
                      <Badge
                        variant="secondary"
                        key={option.id}
                        className="rounded-sm px-1 font-normal"
                      >
                        {option.title}
                      </Badge>
                    ))
                )}
              </div>
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[260px] p-0" align="start">
        <Command>
          <CommandInput placeholder={title} />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup>
              {options.map(option => {
                const isSelected = selectedValues.has(option.id)
                return (
                  <CommandItem
                    key={option.id}
                    onSelect={() => {
                      const currentFilterValue =
                        (column?.getFilterValue() as string[]) || []
                      const newFilterValue = isSelected
                        ? currentFilterValue.filter(
                            value => value !== option.id
                          )
                        : [...currentFilterValue, option.id]
                      column?.setFilterValue(
                        newFilterValue.length ? newFilterValue : undefined
                      )
                    }}
                  >
                    <div
                      className={cn(
                        'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary',
                        isSelected
                          ? 'bg-primary text-primary-foreground'
                          : 'opacity-50 [&_svg]:invisible'
                      )}
                    >
                      <CheckIcon className={cn('h-4 w-4')} />
                    </div>
                    {option.icon && (
                      <Icon name={option.icon} className="mr-2 h-4 w-4" />
                    )}
                    <span>{option.title}</span>
                    <span className="ml-auto flex h-4 w-4 items-center justify-center font-mono text-xs">
                      {categoryCounts.get(option.id) ||
                        tagCounts.get(option.id) ||
                        0}
                    </span>
                  </CommandItem>
                )
              })}
            </CommandGroup>
            {selectedValues.size > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem
                    onSelect={() => column?.setFilterValue(undefined)}
                    className="justify-center text-center"
                  >
                    Clear filters
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
