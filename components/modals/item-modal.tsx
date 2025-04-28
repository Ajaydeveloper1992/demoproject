'use client'

import { z } from 'zod'
import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
// Hooks
import { useCart } from '~/hooks/use-cart'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table'
import Icon from '~/components/icon'
import Keypad from '~/components/keypad'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Textarea } from '~/components/ui/textarea'
import { ScrollArea } from '~/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs'

const ItemSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  price: z.number().min(0, { message: 'Price must be a positive number.' }),
  note: z.string().optional(),
  tax: z.enum(['standard', 'no-tax']).optional(),
})

const FeeSchema = z.object({
  feeName: z
    .string()
    .min(2, { message: 'Name must be at least 2 characters.' }),
  fee: z.number().min(0, { message: 'Fee must be a positive number.' }),
  feeType: z.enum(['%', '$']),
})

const getSchema = (selectedTab: string) => {
  return selectedTab === 'item' ? ItemSchema : FeeSchema
}

const ItemModal = () => {
  const { fee, setFee, isItemModalOpen, onItemModalClose, addToCart } =
    useCart()

  const [quantity, setQuantity] = React.useState(1)
  const [selectedTab, setSelectedTab] = React.useState('item')

  const form = useForm({
    resolver: zodResolver(getSchema(selectedTab)),
    defaultValues: {
      name: '',
      price: 0,
      note: '',
      tax: 'no-tax' as 'standard' | 'no-tax',
      feeName: '',
      fee: 0,
      feeType: '$' as '%' | '$',
    },
  })

  React.useEffect(() => {
    form.reset({
      ...form.getValues(),
    })
  }, [selectedTab])

  React.useEffect(() => {
    setSelectedTab('item')
  }, [isItemModalOpen])

  const handleQuantityChange = (change: number) => {
    setQuantity(Math.max(1, Number(quantity) + change))
  }

  const onSubmit = (
    data: z.infer<typeof ItemSchema> | z.infer<typeof FeeSchema>
  ) => {
    console.log(data)
    if ('name' in data) {
      addToCart({
        item: {
          _id: 'new' + Math.random(),
          name: data.name,
          itemcustomname: data.name,
          posprice: data.price,
          webprice: data.price,
          taxEnable: data.tax === 'standard',
        },
        quantity: quantity === 0 || isNaN(quantity) ? 1 : quantity,
        note: data.note,
        timestamp: new Date(),
        modifiers: {},
      })
    } else {
      setFee([
        ...fee,
        {
          title: data.feeName || '',
          value: data.fee || 0,
          type: data.feeType || '$',
        },
      ])
    }

    setQuantity(1)
    form.reset()

    onItemModalClose()
  }

  return (
    <Dialog open={isItemModalOpen} onOpenChange={onItemModalClose}>
      <DialogContent className="max-w-[700px] gap-0 p-0">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <DialogHeader className="border-b p-4">
              <DialogTitle>Add Item or Additional Fee</DialogTitle>
            </DialogHeader>
            <Tabs
              defaultValue="item"
              className="w-full"
              onValueChange={value => {
                form.trigger()
                setSelectedTab(value)
              }}
            >
              <div className="p-2 pb-0">
                <TabsList className="grid w-full grid-cols-2 h-10">
                  <TabsTrigger value="item" className="h-full">
                    Item
                  </TabsTrigger>
                  <TabsTrigger value="fee" className="h-full">
                    Fee
                  </TabsTrigger>
                </TabsList>
              </div>
              <ScrollArea className="h-[300px] px-3 py-2">
                <TabsContent value="item" className="flex gap-4 text-sm p-1">
                  <div className="flex-1">
                    <div className="grid w-full gap-3">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="font-semibold">
                              Name:
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter the name of the item"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="flex gap-2">
                        <FormField
                          control={form.control}
                          name="price"
                          render={({ field }) => (
                            <FormItem className="w-full">
                              <FormLabel className="font-semibold">
                                Price:
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min={0}
                                  placeholder="$0.00"
                                  {...field}
                                  onChange={e => {
                                    field.onChange(parseFloat(e.target.value))
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="tax"
                          render={({ field }) => (
                            <FormItem className="w-full">
                              <FormLabel className="font-semibold">
                                Tax:
                              </FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="no-tax">No Tax</SelectItem>
                                  <SelectItem value="standard">
                                    Standard
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={form.control}
                        name="note"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="font-semibold">
                              Note:
                            </FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Any special requests?"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="quantity"
                      className="text-center block font-semibold"
                    >
                      Quantity
                    </Label>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          if (isNaN(quantity)) {
                            setQuantity(1)
                          } else {
                            handleQuantityChange(-1)
                          }
                        }}
                        disabled={quantity === 1}
                      >
                        <Icon name="Minus" className="h-4 w-4" />
                      </Button>
                      <Input
                        id="quantity"
                        type="number"
                        autoFocus
                        value={quantity}
                        onChange={e =>
                          setQuantity(parseInt(e.target.value, 10))
                        }
                        className="flex-1 text-center"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          if (isNaN(quantity)) {
                            setQuantity(1)
                          } else {
                            handleQuantityChange(1)
                          }
                        }}
                      >
                        <Icon name="Plus" className="h-4 w-4" />
                      </Button>
                    </div>
                    <Keypad
                      quantity={quantity}
                      setQuantity={val => setQuantity(val)}
                    />
                  </div>
                </TabsContent>
                <TabsContent value="fee" className="text-sm p-1 pt-0 -mt-2">
                  {fee.length > 0 && (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead className="w-[100px] text-center">
                            Amount
                          </TableHead>
                          <TableHead className="w-[100px] text-center">
                            Type
                          </TableHead>
                          <TableHead className="w-[60px] text-right"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {fee.length > 0 &&
                          fee.map((f, index) => (
                            <TableRow key={index}>
                              <TableCell className="capitalize">
                                {f.title}
                              </TableCell>
                              <TableCell className="text-center">
                                {f.value}
                              </TableCell>
                              <TableCell className="text-center">
                                {f.type}
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="w-6 h-6 rounded-full !text-destructive hover:bg-destructive/20"
                                  onClick={() => {
                                    setFee(fee.filter((_, i) => i !== index))
                                  }}
                                >
                                  <Icon name="Trash" className="!h-4 !w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  )}
                  <div className="flex-1 flex flex-col gap-4">
                    <div className="flex gap-2">
                      <FormField
                        control={form.control}
                        name="feeName"
                        render={({ field }) => (
                          <FormItem className="w-full">
                            <FormControl>
                              <Input
                                placeholder="Enter the name of the fee"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="fee"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                type="number"
                                min={0}
                                placeholder="$0.00"
                                {...field}
                                onChange={e => {
                                  field.onChange(parseFloat(e.target.value))
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="feeType"
                        render={({ field }) => (
                          <FormItem>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger className="w-[60px]">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="w-[60px] min-w-0">
                                <SelectItem value="%">%</SelectItem>
                                <SelectItem value="$">$</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button
                        type="button"
                        size="sm"
                        disabled={
                          !form.formState.isValid || form.formState.isSubmitting
                        }
                        onClick={() => {
                          setFee([
                            ...fee,
                            {
                              title: form.getValues('feeName') || '',
                              value: form.getValues('fee') || 0,
                              type:
                                (form.getValues('feeType') as '%' | '$') || '$',
                            },
                          ])
                          form.reset({
                            feeName: '',
                            fee: 0,
                            feeType: '$',
                          })
                        }}
                      >
                        Add
                        <Icon name="Plus" className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                </TabsContent>
              </ScrollArea>
            </Tabs>
            <div className="flex gap-2 p-4 border-t">
              <Button
                className="w-full h-12"
                variant="destructive"
                onClick={onItemModalClose}
              >
                <Icon name="X" />
                Cancel
              </Button>
              <Button
                type={selectedTab === 'item' ? 'submit' : 'button'}
                className="w-full h-12 font-bold"
                disabled={
                  selectedTab === 'item' &&
                  (form.formState.isSubmitting ||
                    !form.formState.isValid ||
                    quantity === 0 ||
                    isNaN(quantity))
                }
                onClick={() => {
                  if (selectedTab !== 'item') {
                    // If feeName has a value, add it to the fee list
                    if (form.getValues('feeName')) {
                      setFee([
                        ...fee,
                        {
                          title: form.getValues('feeName') || '',
                          value: form.getValues('fee') || 0,
                          type: (form.getValues('feeType') as '%' | '$') || '$',
                        },
                      ])
                    }
                    // Reset the form
                    form.reset()
                    // Close the modal
                    onItemModalClose()
                  }
                }}
              >
                Confirm <Icon name="CheckCheck" className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export default ItemModal
