'use client'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '~/components/ui/button'
import {
  ChevronDown,
  Package,
  ShoppingCart,
  Users,
  Grid,
  DollarSign,
  MapPin,
  Utensils,
  TableCellsMerge,
  Airplay,
  Briefcase,
  QrCode,
  RadioTower,
  NotebookPen,
  ChartLine,
} from 'lucide-react'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '~/components/ui/collapsible'
import { BsArrowLeftShort } from 'react-icons/bs'
import axios from 'axios'
import { useAdmin } from '~/hooks/use-admin'
import { signOut } from 'next-auth/react'
export default function Sidebar() {
  const { data: session, status } = useSession()
  const [isOpen, setIsOpen] = useState(true)
  const [permissions, setPermissions] = useState({})
  const [userdata, setUserdata] = useState({})
  const setUserDetails = useAdmin(state => state.setUserDetails)
  const router = useRouter()
  useEffect(() => {
    setUserdata(session)
  }, [session, status])

  const toggleSidebar = () => {
    setIsOpen(!isOpen)
  }
  const callbackUrl = '/login'
  useEffect(() => {
    const fetchPermissions = async () => {
      if (userdata) {
        try {
          const user_role =
            userdata && userdata.user && userdata.user.name
              ? userdata.user.name.role
              : '' // Extract role from userdata
          if (user_role) {
            let userId = userdata.user ? userdata.user.id : ''
            let token =
              userdata.user && userdata.user.name
                ? userdata.user.name.token
                : ''
            // Fetch permissions based on user role
            const response = await axios.get(
              `${process.env.NEXT_PUBLIC_API_BASE_URL}/roles/${user_role}`,
              {
                headers: {
                  Authorization: `Bearer ${token}`, // Include the token in the header
                },
              }
            )

            // Log the response for debugging

            // Set permissions if they exist in the response
            if (
              response.data &&
              response.data.data &&
              response.data.data.permissions
            ) {
              setPermissions(response.data.data.permissions)
            }
          }
        } catch (error) {
          console.error('Error fetching permissions:', error)
          // Role without
          signOut({ callbackUrl })
        }
      }
    }
    // Set User Details
    const fetchUserDetails = async () => {
      if (userdata?.user) {
        const userId = userdata.user.id
        const token = userdata.user.name?.token

        if (!userId || !token) {
          console.error('User ID or token is missing')
          return
        }

        try {
          const response = await axios.get(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/users/getuserdetails/${userId}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          )

          const userDetails = response.data.data

          // console.log("User Details Check ",JSON.stringify(userDetails));

          if (userDetails) {
            setUserDetails(userDetails) // Save user details to Zustand store
          }
        } catch (error) {
          //console.log("Error fetching user details:", error);
          console.error('Error fetching user details:', error)
          signOut({ callbackUrl })
        }
      }
    }
    fetchPermissions()
    fetchUserDetails()
  }, [userdata, setUserDetails, router])

  const menuItems = [
    {
      name: 'Dashboard',
      icon: <Grid className="mr-2 h-4 w-4" />,
      permission: 'Dashboard',
      subItems: [
        {
          name: 'Dashboard',
          href: '/admin/reports/overview',
          permission: 'Dashboard',
        },
      ],
    },
    {
      name: 'Products',
      icon: <Package className="mr-2 h-4 w-4" />,
      permission: 'Products',
      subItems: [
        {
          name: 'All Products',
          href: '/admin/products/all-products',
          permission: 'Products',
        },
        {
          name: 'Add Product',
          href: '/admin/products/add-new-product',
          permission: 'AddProduct',
        },
        {
          name: 'Categories',
          href: '/admin/products/categories',
          permission: 'Manage Categories',
        },
        { name: 'Tags', href: '/admin/products/tags', permission: 'Tags' },
        {
          name: 'Modifiers Group',
          href: '/admin/products/modifiers-group',
          permission: 'Modifier Group',
        },
        {
          name: 'Print Area',
          href: '/admin/products/printarea',
          permission: 'Print Area',
        },
      ],
    },
    {
      name: 'Orders',
      icon: <ShoppingCart className="mr-2 h-4 w-4" />,
      permission: 'Orders',
      subItems: [
        {
          name: 'All Orders',
          href: '/admin/orders/all-orders',
          permission: 'Orders',
        },
      ],
    },
    // {
    //   name: "Live Orders",
    //   icon: <RadioTower className="mr-2 h-4 w-4" />,
    //   permission: "Liveorders",
    //   subItems: [
    //     { name: "Live Orders", href: "/admin/orders/live-orders", permission: "Liveorders" },
    //   ]
    // },
    {
      name: 'Customers',
      icon: <Users className="mr-2 h-4 w-4" />,
      permission: 'Customers',
      subItems: [
        {
          name: 'Customers',
          href: '/admin/customers/all-customers',
          permission: 'Customers',
        },
      ],
    },
    {
      name: 'Stores',
      icon: <Utensils className="mr-2 h-4 w-4" />,
      permission: 'Restaurant',
      subItems: [
        {
          name: 'All Store',
          href: '/admin/restaurant',
          permission: 'Restaurant',
        },
      ],
    },
    {
      name: 'Tables',
      icon: <TableCellsMerge className="mr-2 h-4 w-4" />,
      permission: 'Tables',
      subItems: [
        { name: 'Tables', href: '/admin/tables', permission: 'Tables' },
      ],
    },
    {
      name: 'KDS',
      icon: <TableCellsMerge className="mr-2 h-4 w-4" />,
      permission: 'KDS',
      subItems: [{ name: 'KDS', href: '/admin/kds', permission: 'Kds' }],
    },
    // {
    //   name: "POS",
    //   icon: <Airplay className="mr-2 h-4 w-4" />,
    //   permission: "POS",
    //   subItems: [
    //     { name: "POS", href: "/admin/pos", permission: "POS" },
    //   ]
    // },
    {
      name: 'Staff',
      icon: <Users className="mr-2 h-4 w-4" />,
      permission: 'Staff',
      subItems: [{ name: 'Staff', href: '/admin/staff', permission: 'Staff' }],
    },
    {
      name: 'QR Builder',
      icon: <QrCode className="mr-2 h-4 w-4" />,
      permission: 'Qrbuilder',
      subItems: [
        {
          name: 'QR Builder',
          href: '/admin/qr-builder',
          permission: 'Qrbuilder',
        },
      ],
    },
    {
      name: 'Delivery Areas',
      icon: <QrCode className="mr-2 h-4 w-4" />,
      permission: 'Deliveryareas',
      subItems: [
        {
          name: 'Delivery Areas',
          href: '/admin/delivery-areas',
          permission: 'Deliveryareas',
        },
      ],
    },
    {
      name: 'Plan',
      icon: <NotebookPen className="mr-2 h-4 w-4" />,
      permission: 'Plan',
      subItems: [{ name: 'Plan', href: '/admin/plan', permission: 'Plan' }],
    },
    {
      name: 'Finances',
      icon: <DollarSign className="mr-2 h-4 w-4" />,
      permission: 'Finances',
      subItems: [
        { name: 'Finances', href: '/admin/finances', permission: 'Finances' },
      ],
    },
    {
      name: 'Reports',
      icon: <ChartLine className="mr-2 h-4 w-4" />,
      permission: 'Reports',
      subItems: [
        {
          name: 'Overview',
          href: '/admin/reports/overview',
          permission: 'Reports',
        },
        {
          name: 'Products',
          href: '/admin/reports/products',
          permission: 'Reports',
        },
        {
          name: 'Revenue',
          href: '/admin/reports/revenue',
          permission: 'Reports',
        },
        {
          name: 'Orders',
          href: '/admin/reports/orders',
          permission: 'Reports',
        },
        {
          name: 'Categories',
          href: '/admin/reports/categories',
          permission: 'Reports',
        },
        { name: 'Tax', href: '/admin/reports/taxes', permission: 'Reports' },
        // { name: "Coupons", href: "/admin/reports/coupons", permission: "Reports" },
        { name: 'Tip', href: '/admin/reports/tips', permission: 'Reports' },
        {
          name: 'Refuned & Voided',
          href: '/admin/reports/cancelorder',
          permission: 'Reports',
        },
      ],
    },
  ]

  return (
    <aside
      className={`pt-20 pb-10 px-4 border-r overflow-x-hidden overflow-y-auto shrink-0 bg-background transition-all ${
        isOpen ? 'w-64' : 'w-16'
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className={`text-lg font-bold ${isOpen ? 'block' : 'hidden'}`}>
          User:{' '}
          {userdata && userdata.user && userdata.user.name
            ? userdata.user.name.username
            : 'Guest'}
        </h2>
        <Button onClick={toggleSidebar} variant="ghost" className="p-2">
          <BsArrowLeftShort
            className={`h-4 w-4 transition-transform ${
              isOpen ? 'rotate-180' : 'rotate-0'
            }`}
          />
        </Button>
      </div>
      <nav className="space-y-2">
        {menuItems.map(item => {
          const hasPermission = permissions[item.permission]?.view
          return hasPermission ? (
            <div key={item.name}>
              <Collapsible>
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    className={`w-full justify-between ${
                      isOpen ? 'text-left' : 'text-center'
                    }`}
                  >
                    <div className="flex items-center">
                      {item.icon}
                      {isOpen && item.name}
                    </div>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent
                  className={`pl-12 space-y-2 ${isOpen ? 'block' : 'hidden'}`}
                >
                  {item.subItems?.map(subItem => {
                    const hasSubPermission =
                      permissions[subItem.permission]?.view
                    return hasSubPermission ? (
                      <Link
                        key={subItem.name}
                        href={subItem.href}
                        className={`block py-1 text-sm hover:text-primary`}
                      >
                        {subItem.name}
                      </Link>
                    ) : null
                  })}
                </CollapsibleContent>
              </Collapsible>
            </div>
          ) : null
        })}
      </nav>
    </aside>
  )
}
