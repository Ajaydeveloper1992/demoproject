'use client'
import { useState, Suspense } from 'react'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Separator } from '~/components/ui/separator'
import { Trash2Icon, PlusIcon, MinusIcon } from 'lucide-react'
import Header from '../_components/header'
import Footer from '../_components/footer'
import Loading from '../_components/Loading'
export default function CartPage() {
  const [cartItems, setCartItems] = useState([
    { id: 1, name: 'Classic Wings', price: 12.99, quantity: 2 },
    { id: 2, name: 'BBQ Wings', price: 13.99, quantity: 1 },
    { id: 3, name: 'Garlic Parmesan Wings', price: 14.99, quantity: 1 },
  ])

  const updateQuantity = (id, newQuantity) => {
    if (newQuantity >= 0) {
      setCartItems(
        cartItems.map(item =>
          item.id === id ? { ...item, quantity: newQuantity } : item
        )
      )
    }
  }

  const removeItem = id => {
    setCartItems(cartItems.filter(item => item.id !== id))
  }

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.quantity * item.price,
    0
  )
  const tax = subtotal * 0.13 // Assuming 13% tax
  const total = subtotal + tax

  return (
    <>
      <Suspense fallback={<Loading />}>
        <Header />
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-8">Your Cart</h1>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Cart Items</CardTitle>
                </CardHeader>
                <CardContent>
                  {cartItems.map(item => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between py-4"
                    >
                      <div className="flex-1">
                        <h3 className="font-semibold">{item.name}</h3>
                        <p className="text-sm text-gray-600">
                          ${item.price.toFixed(2)}
                        </p>
                      </div>
                      <div className="flex items-center">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() =>
                            updateQuantity(item.id, item.quantity - 1)
                          }
                        >
                          <MinusIcon className="h-4 w-4" />
                        </Button>
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={e =>
                            updateQuantity(item.id, parseInt(e.target.value))
                          }
                          className="w-16 mx-2 text-center"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() =>
                            updateQuantity(item.id, item.quantity + 1)
                          }
                        >
                          <PlusIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItem(item.id)}
                          className="ml-2"
                        >
                          <Trash2Icon className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax</span>
                      <span>${tax.toFixed(2)}</span>
                    </div>
                    <Separator className="my-2" />
                    <div className="flex justify-between font-bold">
                      <span>Total</span>
                      <span>${total.toFixed(2)}</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded">
                    Proceed to Checkout
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </div>
        <Footer />
      </Suspense>
    </>
  )
}
