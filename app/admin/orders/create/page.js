'use client'
import React, { useState } from 'react'
import { Input } from '~/components/ui/input'
import { Button } from '~/components/ui/button'
import { Card, CardContent } from '~/components/ui/card'
import { ScrollArea } from '~/components/ui/scroll-area'
import { ShoppingCart, User, Drone, X, Plus, Minus } from 'lucide-react'

const categories = [
  'ALL PRODUCTS',
  'BEEF APPETIZER',
  'BEEF MAIN COURSE',
  'BEVERAGES',
  'CHICKEN APPETIZER',
  'CHICKEN MAIN COURSE',
  'FRIED RICE',
  'LUNCH SPECIAL',
  "MOMO'S DUMPLINGS",
  'NOODLES',
  'SEAFOOD APPETIZER',
  'SEAFOOD MAIN COURSE',
  'SIDES',
  'SOUPS',
  'VEG APPETIZER',
  'VEGETABLE MAIN COURSE',
]

const products = [
  { id: 1, name: 'BEEF 65', price: 15.99, category: 'BEEF APPETIZER' },
  {
    id: 2,
    name: 'BEEF MANCHURIAN DRY',
    price: 17.0,
    category: 'BEEF MAIN COURSE',
  },
  {
    id: 3,
    name: 'BEEF MANCHURIAN GRAVY',
    price: 13.99,
    category: 'BEEF MAIN COURSE',
  },
  {
    id: 4,
    name: 'BEEF WITH BLACK BEAN SAUCE',
    price: 15.99,
    category: 'BEEF MAIN COURSE',
  },
  {
    id: 5,
    name: 'BEEF WITH BLACK BEAN SAUCE',
    price: 10.0,
    category: 'BEEF APPETIZER',
  },
  {
    id: 6,
    name: 'BEEF WITH MIX VEGTABLE',
    price: 15.99,
    category: 'BEEF MAIN COURSE',
  },
  {
    id: 7,
    name: 'BOMBAY CHICKEN DRY',
    price: 14.99,
    category: 'CHICKEN MAIN COURSE',
  },
  {
    id: 8,
    name: 'CAULIFLOWER MANCHURIAN -GRAVY/DRY',
    price: 13.99,
    category: 'VEGETABLE MAIN COURSE',
  },
  {
    id: 9,
    name: 'CAULIFLOWER MANCHURIAN GRAVY',
    price: 11.99,
    category: 'VEGETABLE MAIN COURSE',
  },
  { id: 10, name: 'CHICKEN 65', price: 14.99, category: 'CHICKEN APPETIZER' },
  {
    id: 11,
    name: 'CHICKEN FRIED MOMO',
    price: 14.99,
    category: "MOMO'S DUMPLINGS",
  },
  { id: 12, name: 'CHICKEN HAKKA NOODLE', price: 11.99, category: 'NOODLES' },
]

export default function Create_order() {
  const [selectedCategory, setSelectedCategory] = useState('ALL PRODUCTS')
  const [cart, setCart] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [showCart, setShowCart] = useState(false)

  const filteredProducts = products.filter(
    product =>
      (selectedCategory === 'ALL PRODUCTS' ||
        product.category === selectedCategory) &&
      product.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const addToCart = product => {
    const existingItem = cart.find(item => item.id === product.id)
    if (existingItem) {
      setCart(
        cart.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      )
    } else {
      setCart([...cart, { ...product, quantity: 1 }])
    }
  }

  const removeFromCart = productId => {
    setCart(cart.filter(item => item.id !== productId))
  }

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity === 0) {
      removeFromCart(productId)
    } else {
      setCart(
        cart.map(item =>
          item.id === productId ? { ...item, quantity: newQuantity } : item
        )
      )
    }
  }

  const calculateTotal = () => {
    return cart
      .reduce((total, item) => total + item.price * item.quantity, 0)
      .toFixed(2)
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-md">
        <div className="p-4">
          <h2 className="text-xl font-bold mb-4">Hakkaheritage</h2>
        </div>
        <ScrollArea className="h-[calc(100vh-80px)]">
          {categories.map(category => (
            <button
              key={category}
              className={`w-full text-left p-2 hover:bg-gray-100 ${
                selectedCategory === category ? 'bg-gray-200' : ''
              }`}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </button>
          ))}
        </ScrollArea>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Navigation */}
        <div className="bg-black text-white p-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* <button className="p-2 hover:bg-gray-800 rounded">
                  <span className="sr-only">Menu</span>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button> */}
            <Input
              type="text"
              placeholder="Enter product barcode / name / sku"
              className="w-96 bg-white text-black"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center space-x-4">
            {/* <Drone className="w-6 h-6" /> */}
            <ShoppingCart className="w-6 h-6" />
            <Input
              type="text"
              placeholder="Search customer"
              className="w-64 bg-white text-black"
            />
            <User className="w-6 h-6" />
          </div>
        </div>

        <div className="flex-1 flex">
          {/* Product Grid */}
          <ScrollArea className="flex-1 p-4">
            <div className="grid grid-cols-4 gap-4">
              {filteredProducts.map(product => (
                <Card key={product.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="aspect-square bg-gray-200 mb-2"></div>
                    <h3 className="font-semibold">{product.name}</h3>
                    <p className="text-lg font-bold">
                      ${product.price.toFixed(2)}
                    </p>
                    <Button
                      className="w-full mt-2"
                      onClick={() => addToCart(product)}
                    >
                      Add
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>

          {/* Add Item Screen */}
          <div className="w-96 bg-white shadow-md p-4 flex flex-col">
            <h2 className="text-xl font-bold mb-4">Cart</h2>
            <ScrollArea className="flex-1 mb-4">
              {cart.map(item => (
                <div
                  key={item.id}
                  className="flex justify-between items-center mb-2 p-2 bg-gray-100 rounded"
                >
                  <div>
                    <p className="font-semibold">{item.name}</p>
                    <p>${item.price.toFixed(2)}</p>
                  </div>
                  <div className="flex items-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <span className="mx-2">{item.quantity}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </ScrollArea>
            <div className="mt-auto">
              <div className="flex justify-between items-center mb-2">
                <span>Sub Total</span>
                <span>${calculateTotal()}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span>Tax</span>
                <span>$0.00</span>
              </div>
              <div className="flex space-x-2 mt-4">
                <Button variant="outline" className="flex-1">
                  Note
                </Button>
                <Button variant="outline" className="flex-1">
                  Dine-In
                </Button>
                <Button variant="outline" className="flex-1">
                  Discount
                </Button>
                <Button variant="outline" className="w-8 h-8 p-0">
                  <span className="sr-only">More options</span>
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                  </svg>
                </Button>
              </div>
              <Button className="w-full mt-4">${calculateTotal()}</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
