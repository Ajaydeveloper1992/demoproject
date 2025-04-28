'use client'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import {
  Search,
  ChevronDown,
  MoreHorizontal,
  Plus,
  Pencil,
  Trash2,
  GripVertical,
} from 'lucide-react'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '~/components/ui/alert-dialog'
import { Badge } from '~/components/ui/badge'
import Image from 'next/image'
import Toastify from 'toastify-js'
import axios from 'axios'
import { useAdmin } from '~/hooks/use-admin'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

// SortableTableRow component
const SortableTableRow = ({
  category,
  level = 0,
  productsCount,
  onEdit,
  onDelete,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category._id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const imagePath = category.image
    ? category.image.replace(/\\/g, '/')
    : 'https://g-hhdapkv.vusercontent.net/placeholder.svg'
  //console.log("Category Data",category);
  return (
    <TableRow ref={setNodeRef} style={style}>
      <TableCell>
        <div className="flex items-center">
          <button
            className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded-md mr-2"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </button>
          {level > 0 && <div style={{ width: `${level * 20}px` }} />}
          {level === 0 && (
            <Button variant="ghost" size="sm" className="mr-2">
              <ChevronDown className="h-4 w-4" />
            </Button>
          )}
          {category.image && (
            <Image
              src={`${process.env.NEXT_PUBLIC_IMAGE_BASE_URL}/${imagePath}`}
              alt={category.name}
              className="w-8 h-8 mr-2 rounded"
              width={32}
              height={32}
            />
          )}
          {category.name}
        </div>
      </TableCell>
      <TableCell>
        {category.selectedRestaurants &&
        category.selectedRestaurants.length > 0 ? (
          category.selectedRestaurants.map(selectedRestaurants => (
            <div key={selectedRestaurants._id}>{selectedRestaurants.name}</div>
          ))
        ) : (
          <div>N/A</div>
        )}
      </TableCell>
      <TableCell>
        <div className="flex items-center">{productsCount}</div>
      </TableCell>
      <TableCell>
        <Badge
          variant="outline"
          className="bg-green-100 text-green-800 border-green-200"
        >
          Available
        </Badge>
      </TableCell>
      <TableCell>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(category._id)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(category._id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
}

export default function Categories() {
  const { data: session } = useSession()
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState('all')
  const [categories, setCategories] = useState([])
  const [userdata, setUserdata] = useState({})
  const [loading, setLoading] = useState(true)
  const [products, setProducts] = useState([])
  const [sortBy, setSortBy] = useState('name')
  const [sortDirection, setSortDirection] = useState('asc')
  const userDetails = useAdmin(state => state.userDetails)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectcategoryId, setSelectedCategory] = useState(null)
  const [action, setAction] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  useEffect(() => {
    setUserdata(session)
  }, [session])

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        let userId = ''
        let restaurantIds = []
        if (userDetails?.user?.usertype === 'restaurant_owner') {
          userId = userdata.user ? userdata.user.id : ''
        } else {
          userId = userDetails?.user?.createdBy // Get the creator's user ID
          restaurantIds = userDetails.user.selectedRestaurants // Get the selected restaurants
        }
        let token =
          userdata.user && userdata.user.name ? userdata.user.name.token : ''
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/categories/getcategoriesuserid/${userId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )
        //setCategories(response.data.data); // Adjust based on your API response structure
        // Sort categories by sortOrder field
        const sortedCategories = response.data.data.sort(
          (a, b) => a.sortOrder - b.sortOrder
        )
        setCategories(sortedCategories) // Set sorted categories
      } catch (error) {
        console.error('Error fetching categories:', error)
      }
    }

    const fetchProducts = async () => {
      setLoading(true)
      try {
        let userId = ''
        let restaurantIds = []
        if (userDetails?.user?.usertype === 'restaurant_owner') {
          userId = userdata?.user ? userdata.user.id : ''
        } else {
          userId = userDetails?.user?.createdBy // Get the creator's user ID
          restaurantIds = userDetails.user.selectedRestaurants // Get the selected restaurants
        }
        const token =
          userdata?.user && userdata.user.name ? userdata.user.name.token : ''
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/product/getproductsuserid/${userId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )
        setProducts(response.data.data || [])
      } catch (error) {
        console.error('Error fetching products:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchCategories()
    fetchProducts()
  }, [userdata, userDetails])

  const handleSort = field => {
    const newDirection =
      sortBy === field && sortDirection === 'asc' ? 'desc' : 'asc'
    setSortBy(field)
    setSortDirection(newDirection)

    const sortedCategories = [...categories].sort((a, b) => {
      let comparison = 0

      if (field === 'name') {
        comparison = a.name.localeCompare(b.name)
      } else if (field === 'productCount') {
        const countA = getProductCountForCategory(a._id)
        const countB = getProductCountForCategory(b._id)
        comparison = countA - countB
      }

      return sortDirection === 'asc' ? comparison : -comparison
    })

    setCategories(sortedCategories)
  }

  const getProductCountForCategory = categoryId => {
    return products.filter(product =>
      product.categories.some(category => category._id === categoryId)
    ).length
  }

  const handleNewCategory = () => {
    router.push('/admin/products/categories/addnew')
  }
  // Edit Category
  const handleEditingCategory = categoryId => {
    router.push(`/admin/products/categories/editcat/?id=${categoryId}`)
  }
  // Delete Category
  const handleConfirmation = categoryId => {
    setSelectedCategory(categoryId)
    setDialogOpen(true)
  }
  //  Delete Category
  const handleDeleteCategory = async () => {
    // const confirmDelete = window.confirm("Are you sure you want to delete this category?");
    // if (!confirmDelete) return;
    try {
      let userId = ''
      let restaurantIds = []
      if (userDetails?.user?.usertype === 'restaurant_owner') {
        userId = userdata.user ? userdata.user.id : ''
      } else {
        userId = userDetails?.user?.createdBy // Get the creator's user ID
        restaurantIds = userDetails?.user?.selectedRestaurants // Get the selected restaurants
      }
      let token =
        userdata?.user && userdata?.user?.name
          ? userdata?.user?.name?.token
          : ''
      await axios.delete(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/categories/deletecategories/${selectcategoryId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      setCategories(prevCategories =>
        prevCategories.filter(category => category._id !== selectcategoryId)
      )

      Toastify({
        text: 'Category deleted successfully!',
        duration: 3000,
        close: true,
        gravity: 'top',
        position: 'right',
        backgroundColor: 'linear-gradient(to right, #00b09b, #96c93d)',
      }).showToast()
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || 'Error deleting category.'
      Toastify({
        text: errorMessage,
        duration: 3000,
        close: true,
        gravity: 'top',
        position: 'right',
        backgroundColor: 'linear-gradient(to right, #FF5C5C, #FF3B3B)',
      }).showToast()
    } finally {
      setDialogOpen(false) // Close the dialog after action
    }
  }
  /*
  const handleDragEnd = (event) => {
    const { active, over } = event

    if (active.id !== over.id) {
      setCategories((items) => {
        const oldIndex = items.findIndex((item) => item._id === active.id)
        const newIndex = items.findIndex((item) => item._id === over.id)
        
        return arrayMove(items, oldIndex, newIndex)
      })
    }
  }*/
  const handleDragEnd = async event => {
    const { active, over } = event

    if (active.id !== over.id) {
      // Reorder categories locally
      const oldIndex = categories.findIndex(item => item._id === active.id)
      const newIndex = categories.findIndex(item => item._id === over.id)
      const reorderedCategories = arrayMove(categories, oldIndex, newIndex)

      // Update the sortOrder field for each category based on new order
      const updatedCategories = reorderedCategories.map((category, index) => ({
        ...category,
        sortOrder: index + 1, // You can set the order to be 1, 2, 3... based on index
      }))

      // Update local state
      setCategories(updatedCategories)

      // Send updated categories to the backend
      try {
        const token = userdata.user?.name?.token // Get the user token if required for auth
        await axios.put(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/categories/update-order`,
          updatedCategories,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )

        Toastify({
          text: 'Categories reordered successfully!',
          duration: 3000,
          close: true,
          gravity: 'top',
          position: 'right',
          backgroundColor: 'linear-gradient(to right, #00b09b, #96c93d)',
        }).showToast()
      } catch (error) {
        console.error('Error updating category order:', error)
        Toastify({
          text: 'Error updating category order.',
          duration: 3000,
          close: true,
          gravity: 'top',
          position: 'right',
          backgroundColor: 'linear-gradient(to right, #FF5C5C, #FF3B3B)',
        }).showToast()
      }
    }
  }
  const totalItems = categories.length
  const totalPages = Math.ceil(totalItems / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize
  const currentItems = categories.slice(startIndex, endIndex)
  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Categories</h1>
        <Button onClick={handleNewCategory} className="bg-teal-600">
          <Plus className="mr-2 h-4 w-4" /> New Category
        </Button>
      </div>

      <div className="flex justify-between mb-4">
        <div className="relative w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search"
            className="pl-8"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="active">Active Categories</SelectItem>
            <SelectItem value="inactive">Inactive Categories</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <button
                  className="flex items-center space-x-1"
                  onClick={() => handleSort('name')}
                >
                  <span>Category Name</span>
                  {sortBy === 'name' && (
                    <ChevronDown
                      className={`h-4 w-4 ${
                        sortDirection === 'asc' ? 'rotate-180' : ''
                      }`}
                    />
                  )}
                </button>
              </TableHead>
              <TableHead>Store Name</TableHead>
              <TableHead>
                <button
                  className="flex items-center space-x-1"
                  onClick={() => handleSort('productCount')}
                >
                  <span>Products</span>
                  {sortBy === 'productCount' && (
                    <ChevronDown
                      className={`h-4 w-4 ${
                        sortDirection === 'asc' ? 'rotate-180' : ''
                      }`}
                    />
                  )}
                </button>
              </TableHead>
              <TableHead>Availability</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={currentItems.map(cat => cat._id)}
                strategy={verticalListSortingStrategy}
              >
                {currentItems
                  .filter(category =>
                    category.name
                      .toLowerCase()
                      .includes(searchTerm.toLowerCase())
                  )
                  .map(category => (
                    <SortableTableRow
                      key={category._id}
                      category={category}
                      productsCount={getProductCountForCategory(category._id)}
                      onEdit={handleEditingCategory}
                      onDelete={handleConfirmation}
                    />
                  ))}
              </SortableContext>
            </DndContext>
          </TableBody>
        </Table>
        {/** Pagetion */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <p className="text-sm text-muted-foreground">
              Showing {startIndex + 1} to {Math.min(endIndex, totalItems)} of{' '}
              {totalItems} entries
            </p>
            <Select
              value={pageSize.toString()}
              onValueChange={value => {
                setPageSize(Number(value))
                setCurrentPage(1)
              }}
            >
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue placeholder={pageSize} />
              </SelectTrigger>
              <SelectContent>
                {[5, 10, 20, 50, 100].map(size => (
                  <SelectItem key={size} value={size.toString()}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">per page</p>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <div className="flex items-center justify-center text-sm font-medium">
              Page {currentPage} of {totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setCurrentPage(prev => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
        {/* Confirmation Dialog */}
        <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Are you sure you want to delete this category?
              </AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the
                category.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction asChild>
                <Button
                  onClick={handleDeleteCategory}
                  className="btn btn-danger"
                >
                  Delete
                </Button>
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}
