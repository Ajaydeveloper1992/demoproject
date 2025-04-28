import { useState } from 'react'
import Link from 'next/link'
import {
  ChevronDown,
  Package,
  ShoppingCart,
  Users,
  Store,
  Grid,
} from 'lucide-react'
import { Button } from '~/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '~/components/ui/collapsible'

export default function Menulist() {
  const [isOpen, setIsOpen] = useState(true) // Initialize sidebar as open

  return (
    <nav className="space-y-2">
      <Collapsible>
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className={`w-full justify-between ${
              isOpen ? 'text-left' : 'text-center'
            }`}
          >
            <div className="flex items-center">
              <Grid className="mr-2 h-4 w-4" />
              {isOpen && 'Dashboard'}
            </div>
            <ChevronDown className="h-4 w-4" />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent
          className={`pl-8 space-y-2 ${isOpen ? 'block' : 'hidden'}`}
        >
          <Link
            href="/admin/"
            className={`block py-1 text-sm hover:text-primary ${
              isOpen ? 'block' : 'hidden'
            }`}
          >
            Dashboard
          </Link>
        </CollapsibleContent>
      </Collapsible>
      {/* Product Menu */}
      <Collapsible>
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className={`w-full justify-between ${
              isOpen ? 'text-left' : 'text-center'
            }`}
          >
            <div className="flex items-center">
              <Package className="mr-2 h-4 w-4" />
              {isOpen && 'Products'}
            </div>
            <ChevronDown className="h-4 w-4" />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent
          className={`pl-8 space-y-2 ${isOpen ? 'block' : 'hidden'}`}
        >
          <Link
            href="/admin/products/all-products"
            className={`block py-1 text-sm hover:text-primary ${
              isOpen ? 'block' : 'hidden'
            }`}
          >
            All Products
          </Link>
          <Link
            href="/admin/products/add-new-product"
            className={`block py-1 text-sm hover:text-primary ${
              isOpen ? 'block' : 'hidden'
            }`}
          >
            + Add New
          </Link>
          <Link
            href="/admin/products/categories"
            className={`block py-1 text-sm hover:text-primary ${
              isOpen ? 'block' : 'hidden'
            }`}
          >
            Categories
          </Link>
          <Link
            href="/admin/products/tags"
            className={`block py-1 text-sm hover:text-primary ${
              isOpen ? 'block' : 'hidden'
            }`}
          >
            Tags
          </Link>
        </CollapsibleContent>
      </Collapsible>
      {/* Order Menu */}
      <Collapsible>
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className={`w-full justify-between ${
              isOpen ? 'text-left' : 'text-center'
            }`}
          >
            <div className="flex items-center">
              <ShoppingCart className="mr-2 h-4 w-4" />
              {isOpen && 'Orders'}
            </div>
            <ChevronDown className="h-4 w-4" />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent
          className={`pl-8 space-y-2 ${isOpen ? 'block' : 'hidden'}`}
        >
          <Link
            href="/admin/orders/all-orders"
            className={`block py-1 text-sm hover:text-primary ${
              isOpen ? 'block' : 'hidden'
            }`}
          >
            All Orders
          </Link>
        </CollapsibleContent>
      </Collapsible>
      {/* Customer Menu */}
      <Collapsible>
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className={`w-full justify-between ${
              isOpen ? 'text-left' : 'text-center'
            }`}
          >
            <div className="flex items-center">
              <Users className="mr-2 h-4 w-4" />
              {isOpen && 'Customers'}
            </div>
            <ChevronDown className="h-4 w-4" />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent
          className={`pl-6 space-y-2 ${isOpen ? 'block' : 'hidden'}`}
        >
          <Link
            href="/admin/customers/all-customers"
            className={`block py-1 text-sm hover:text-primary ${
              isOpen ? 'block' : 'hidden'
            }`}
          >
            All Customers
          </Link>
        </CollapsibleContent>
      </Collapsible>
      {/* Restaurant */}
      <Collapsible>
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className={`w-full justify-between ${
              isOpen ? 'text-left' : 'text-center'
            }`}
          >
            <div className="flex items-center">
              <Store className="mr-2 h-4 w-4" />
              {isOpen && 'Restaurant'}
            </div>
            <ChevronDown className="h-4 w-4" />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent
          className={`pl-8 space-y-2 ${isOpen ? 'block' : 'hidden'}`}
        >
          <Link
            href="/admin/restaurant"
            className={`block py-1 text-sm hover:text-primary ${
              isOpen ? 'block' : 'hidden'
            }`}
          >
            Restaurant
          </Link>
        </CollapsibleContent>
      </Collapsible>
    </nav>
  )
}
