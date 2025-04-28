'use client'

import React from 'react'
import { z } from 'zod'
import { v4 } from 'uuid'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from 'react-query'
import { iCustomer, iProduct } from '~/types'
// Libs
import Axios from '~/lib/axios'
import { cn, formatDateTime } from '~/lib/utils'
import { CustomerEndpoints, ProductEndpoints } from '~/lib/constants'
// Hooks
import { useCart } from '~/hooks/use-cart'
import { addCustomer, getOrderHistory, useCustomer } from '~/hooks/use-customer'
// Components
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '~/components/ui/form'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '~/components/ui/accordion'
import { Button } from '~/components/ui/button'
import Icon from '~/components/icon'
import { Label } from '~/components/ui/label'
import { Input } from '~/components/ui/input'
import { Textarea } from '~/components/ui/textarea'
import { ScrollArea } from '~/components/ui/scroll-area'
import OrderStatus from '~/components/OrderStatus'
import { Checkbox } from '~/components/ui/checkbox'
import { Table, TableBody, TableCell, TableRow } from '~/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs'

const FormSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  email: z
    .string()
    .optional()
    .refine(
      email => {
        if (!email) return true
        return /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)
      },
      { message: 'Invalid email address.' }
    ),
  phone: z.string().refine(
    phone => {
      if (!phone) return true
      const cleanedPhone = phone.replace(/[\s\-\(\)]/g, '')
      return /^\d{10,15}$/.test(cleanedPhone)
    },
    { message: 'Invalid phone number.' }
  ),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  note: z.string().optional(),
})

const CustomerModal = () => {
  const [searchTerm, setSearchTerm] = React.useState('')
  const [searchResults, setSearchResults] = React.useState<iCustomer[]>([])

  const {
    isOpen,
    onClose,
    history,
    setHistory,
    selectCustomer,
    setSelectCustomer,
  } = useCustomer()
  const { addToCart } = useCart()
  const queryClient = useQueryClient()

  const { data: products } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data } = await Axios.get(ProductEndpoints.getAll())
      return data?.data as iProduct[]
    },
  })

  const { mutate, isLoading } = useMutation({
    mutationKey: ['customers'],
    mutationFn: (data: iCustomer) => addCustomer(data),
    onSuccess: res => {
      console.log(res)
      if (res.success) {
        setSelectCustomer(res.data)
        onClose()
        // Update the orders list
        queryClient.invalidateQueries(['customers'])
      }
    },
    onError: (err, newTodo, context) => {
      // Rollback the optimistic update
      // queryClient.setQueryData(['customers'], context?.prevData)
    },
  })

  const { data } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const { data } = await Axios.get(CustomerEndpoints.getAll())
      return data?.data as iCustomer[]
    },
  })

  // Get the order history
  const { isLoading: isHistoryLoading } = useQuery({
    queryKey: ['orderHistory', selectCustomer?.phone!!],
    queryFn: async () => {
      const data = await getOrderHistory(selectCustomer?.phone!)
      return data.data
    },
    enabled: selectCustomer?.phone !== undefined,
  })

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    mode: 'all',
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      zip: '',
      note: '',
    },
  })

  // Update the form data when selectCustomer changes
  React.useEffect(() => {
    if (selectCustomer === null) {
      form.setValue('name', '')
      form.setValue('email', '')
      form.setValue('phone', '')
      form.setValue('address', '')
      form.setValue('city', '')
      form.setValue('state', '')
      form.setValue('zip', '')
      form.setValue('note', '')
      return
    }

    form.setValue(
      'name',
      selectCustomer?.firstName + ' ' + selectCustomer?.lastName
    )
    form.setValue('email', selectCustomer?.email || '')
    form.setValue('phone', selectCustomer?.phone || '')
    form.setValue('address', selectCustomer?.address?.street)
    form.setValue('city', selectCustomer?.address?.city)
    form.setValue('state', selectCustomer?.address?.state)
    form.setValue('zip', selectCustomer?.address?.zipCode)
    form.setValue('note', selectCustomer?.note || '')

    form.trigger()
  }, [selectCustomer])

  const onSubmit = async (data: z.infer<typeof FormSchema>) => {
    const _body = {
      firstName: data.name,
      lastName: '',
      email: data?.email,
      phone: data.phone,
      address: {
        street: data.address,
        city: data.city,
        state: data.state,
        zipCode: data.zip,
      },
      note: data.note,
    }
    mutate(_body)
  }

  const handleSearch = (term: string) => {
    if (!data) return
    setSearchTerm(term)
    const results = data.filter(
      customer =>
        customer.firstName.toLowerCase().includes(term.toLowerCase()) ||
        (customer?.lastName?.toLowerCase() || '').includes(
          term.toLowerCase()
        ) ||
        (customer?.email?.toLowerCase() || '').includes(term.toLowerCase()) ||
        customer.phone.includes(term)
    )
    setSearchResults(results)
  }

  const handleSelectCustomer = (customer: iCustomer) => {
    setSelectCustomer(customer)
    setSearchResults([])
    setSearchTerm('')
  }

  const handleReorder = order => {
    order.items.forEach(itemId => {
      const product = products && products.find(p => p._id === itemId.item._id)
      if (product) {
        console.log(itemId)
        addToCart({
          item: {
            _id: product._id,
            name: product.name,
            itemcustomname: product.itemcustomname || product.name,
            webprice: product.webprice,
            posprice: product.posprice,
          },
          quantity: 1,
          // modifiers: {
          //   exampleKey: [
          //     {
          //       name: 'Example Modifier',
          //       amount: 0,
          //     },
          //   ],
          // },
          modifiers: itemId?.modifiers,
          note: '',
          itemDiscount: { type: '$', value: 0 },
          timestamp: new Date(),
        })

        onClose()
      }
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[700px] gap-0 p-0 text-sm">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <DialogHeader className="border-b p-4">
              <DialogTitle>Add Customer</DialogTitle>
            </DialogHeader>

            <div className="flex flex-col gap-4 p-4">
              <div className="flex gap-2 items-end">
                <div className="grid w-4/6 gap-2 relative">
                  <Label htmlFor="search" className="font-semibold">
                    Search Customer
                  </Label>
                  <div className="relative">
                    <Icon
                      name="Search"
                      className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground"
                    />
                    <Input
                      id="search"
                      placeholder="Enter keyword to search customer"
                      value={searchTerm}
                      onChange={e => handleSearch(e.target.value)}
                      // Listen for enter key
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          setSearchTerm('')
                          if (searchTerm.match(/^\d+$/)) {
                            form.setValue('phone', searchTerm)
                          } else if (searchTerm.includes('@')) {
                            form.setValue('email', searchTerm)
                          } else {
                            form.setValue('name', searchTerm)
                          }
                          form.trigger()
                        }
                      }}
                      className={cn(
                        'pl-8 focus-visible:ring-0',
                        searchTerm.length > 0 && 'rounded-b-none'
                      )}
                    />
                  </div>
                  {searchTerm.length > 0 && searchResults.length > 0 ? (
                    <ul className="absolute rounded-t-none max-h-40 w-full top-14 overflow-auto rounded-md border bg-background shadow-md">
                      {searchResults.map(customer => (
                        <li
                          key={customer._id}
                          className="flex items-center gap-2 cursor-pointer px-4 py-2 hover:bg-muted"
                          onClick={e => {
                            e.stopPropagation()
                            handleSelectCustomer(customer)
                          }}
                        >
                          <Icon name="CircleUser" />
                          <span className="capitalize">
                            {customer?.firstName + ' ' + customer?.lastName}
                          </span>
                          ({customer.phone})
                        </li>
                      ))}
                    </ul>
                  ) : (
                    searchTerm.length > 0 && (
                      <div className="absolute p-4 rounded-t-none max-h-40 w-full top-14 overflow-auto rounded-md border bg-background shadow-md flex justify-center flex-col gap-4">
                        <p className="text-center">No results found.</p>
                        <Button
                          className="mx-auto"
                          size="sm"
                          variant="outline"
                          type="button"
                          onClick={e => {
                            e.stopPropagation()
                            setSearchTerm('')
                            if (searchTerm.match(/^\d+$/)) {
                              form.setValue('phone', searchTerm)
                            } else if (searchTerm.includes('@')) {
                              form.setValue('email', searchTerm)
                            } else {
                              form.setValue('name', searchTerm)
                            }
                            form.trigger()
                          }}
                        >
                          <Icon name="UserPlus" /> New Customer
                        </Button>
                      </div>
                    )
                  )}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive border-destructive hover:bg-destructive hover:text-white"
                  onClick={e => {
                    e.stopPropagation()
                    setSelectCustomer(null)
                    form.reset()
                  }}
                >
                  Clear <Icon name="X" />
                </Button>
              </div>
              <Tabs defaultValue="info" className="w-full">
                <TabsList className="grid w-full grid-cols-2 h-10">
                  <TabsTrigger value="info" className="h-full">
                    Customer Info
                  </TabsTrigger>
                  <TabsTrigger
                    value="history"
                    className="h-full"
                    disabled={selectCustomer === null || isHistoryLoading}
                  >
                    Order History
                    {isHistoryLoading && (
                      <Icon name="Loader" className="animate-spin ml-1" />
                    )}
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="info">
                  <div className="grid gap-2">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem className="space-y-1">
                          <FormLabel className="text-xs">Name</FormLabel>
                          <FormControl>
                            <Input
                              className="h-8"
                              placeholder="John Doe"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem className="space-y-1">
                          <FormLabel className="text-xs">Email</FormLabel>
                          <FormControl>
                            <Input
                              className="h-8"
                              placeholder="Enter email address"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem className="space-y-1">
                          <FormLabel className="text-xs">Phone</FormLabel>
                          <FormControl>
                            <Input
                              type="tel"
                              className="h-8"
                              placeholder="Enter phone number"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem className="space-y-1">
                          <FormLabel className="text-xs">Address</FormLabel>
                          <FormControl>
                            <Input
                              className="h-8"
                              placeholder="Enter address"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {/* City, State, Zip in same row */}
                    <div className="grid grid-cols-3 gap-2">
                      <FormField
                        control={form.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem className="space-y-1">
                            <FormLabel className="text-xs">City</FormLabel>
                            <FormControl>
                              <Input
                                className="h-8"
                                placeholder="Enter city"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="state"
                        render={({ field }) => (
                          <FormItem className="space-y-1">
                            <FormLabel className="text-xs">State</FormLabel>
                            <FormControl>
                              <Input
                                className="h-8"
                                placeholder="Enter state"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="zip"
                        render={({ field }) => (
                          <FormItem className="space-y-1">
                            <FormLabel className="text-xs">
                              PostCode/Zip
                            </FormLabel>
                            <FormControl>
                              <Input
                                className="h-8"
                                placeholder="Enter zip code"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="note"
                      render={({ field }) => (
                        <FormItem className="space-y-1">
                          <FormLabel className="text-xs">Note</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Enter note" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>
                <TabsContent className="-mr-2" value="history">
                  <ScrollArea className="h-[428px] pr-2">
                    {history && history.length === 0 ? (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-gray-400">No order history found.</p>
                      </div>
                    ) : (
                      <Accordion
                        type="single"
                        collapsible
                        className="w-full"
                        // defaultValue={
                        //   history.sort(
                        //     (a, b) =>
                        //       new Date(b.date).getTime() -
                        //       new Date(a.date).getTime()
                        //   )[0].id
                        // }
                      >
                        {history
                          .sort(
                            (a, b) =>
                              new Date(b.date).getTime() -
                              new Date(a.date).getTime()
                          )
                          .map(order => (
                            <AccordionItem
                              key={order.orderNumber}
                              value={order.orderNumber}
                            >
                              <AccordionTrigger className="!no-underline hover:text-primary hover:bg-primary/5 px-1">
                                <div className="flex justify-between w-full">
                                  <div className="flex gap-2">
                                    <p>Order #{order.orderNumber}</p>
                                    <span>-</span>
                                    <p className="text-gray-400 first-letter:capitalize">
                                      {formatDateTime(order.date)}
                                    </p>
                                  </div>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent className="p-0">
                                <div className="flex gap-5 justify-between items-center">
                                  <div className="w-3/5">
                                    <Table className="border">
                                      <TableBody>
                                        <TableRow>
                                          <TableCell className="font-semibold">
                                            Order ID:
                                          </TableCell>
                                          <TableCell className="text-right">
                                            {order.orderNumber}
                                          </TableCell>
                                        </TableRow>
                                        <TableRow>
                                          <TableCell className="font-semibold">
                                            Status:
                                          </TableCell>
                                          <TableCell className="text-right">
                                            <OrderStatus
                                              status={order.orderstatus}
                                            />
                                          </TableCell>
                                        </TableRow>
                                        <TableRow>
                                          <TableCell className="font-semibold">
                                            Order Type:
                                          </TableCell>
                                          <TableCell className="text-right">
                                            <span className="flex justify-end gap-2">
                                              {order?.orderType}
                                              <Icon
                                                name={
                                                  order?.orderType === 'Online'
                                                    ? 'Globe'
                                                    : 'ShoppingBag'
                                                }
                                              />
                                            </span>
                                          </TableCell>
                                        </TableRow>
                                        <TableRow>
                                          <TableCell className="font-semibold">
                                            Items:
                                          </TableCell>
                                          <TableCell className="text-right">
                                            <ul className="space-y-1 flex flex-col items-end px-2">
                                              {order.items &&
                                                order.items.length > 0 &&
                                                order.items.map(
                                                  (item, index) => (
                                                    <li
                                                      key={index}
                                                      className="flex items-center space-x-2"
                                                    >
                                                      <label
                                                        htmlFor={'id' + index}
                                                        className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 capitalize"
                                                      >
                                                        {item?.item?.name.toLowerCase()}
                                                      </label>
                                                      <Checkbox
                                                        id={'id' + index}
                                                        defaultChecked
                                                        checked
                                                      />
                                                    </li>
                                                  )
                                                )}
                                            </ul>
                                          </TableCell>
                                        </TableRow>
                                        <TableRow>
                                          <TableCell className="font-semibold">
                                            Total Amount:
                                          </TableCell>
                                          <TableCell className="text-right font-bold text-rose-600">
                                            ${order.total.toFixed(2)}
                                          </TableCell>
                                        </TableRow>
                                      </TableBody>
                                    </Table>
                                  </div>

                                  <div className="flex flex-1 justify-center">
                                    <Button
                                      size="sm"
                                      onClick={e => {
                                        e.stopPropagation()
                                        handleReorder(order)
                                      }}
                                    >
                                      Reorder
                                      <Icon name="ShoppingCart" />
                                    </Button>
                                  </div>
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          ))}
                      </Accordion>
                    )}
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </div>

            <div className="flex gap-2 p-4 border-t">
              <Button
                className="w-full h-12"
                variant="destructive"
                type="button"
                onClick={onClose}
              >
                <Icon name="X" />
                Cancel
              </Button>
              <Button
                className="w-full h-12"
                type="submit"
                disabled={!form.formState.isValid || isLoading}
                onClick={form.handleSubmit(onSubmit)}
              >
                Confirm
                {isLoading ? (
                  <Icon name="Loader" className="animate-spin" />
                ) : (
                  <Icon name="CheckCheck" className="h-4 w-4" />
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export default CustomerModal
