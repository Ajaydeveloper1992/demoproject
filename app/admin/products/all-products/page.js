'use client'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  Search,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  GripVertical,
  Copy,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import axios from 'axios'
import Toastify from 'toastify-js'
import Image from 'next/image'
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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'

import { CSS } from '@dnd-kit/utilities'
import Loading from '../../components/Loading'
const SortableTableRow = ({ product, onSelectProduct, onAction, selected }) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: product._id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }
  console.log('Printer name ', product)
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
          <input
            type="checkbox"
            checked={selected}
            onChange={() => onSelectProduct(product._id)}
            className="rounded border-gray-300"
          />
        </div>
      </TableCell>
      <TableCell className="font-medium">
        <div
          className="flex items-center"
          onClick={() => onAction('edit', product._id)}
        >
          {Array.isArray(product.mediaFiles) &&
            product.mediaFiles.length > 0 && (
              <Image
                src={`${
                  process.env.NEXT_PUBLIC_IMAGE_BASE_URL
                }/${product.mediaFiles[0].replace(/\\/g, '/')}`}
                alt={product.name}
                className="w-10 h-10 mr-3 rounded"
                width={100}
                height={100}
              />
            )}
          {product.name}
        </div>
      </TableCell>
      <TableCell>
        {product.selectedRestaurants &&
        product.selectedRestaurants.length > 0 ? (
          product.selectedRestaurants.map(selectedRestaurants => (
            <div key={selectedRestaurants._id}>{selectedRestaurants.name}</div>
          ))
        ) : (
          <div>N/A</div>
        )}
      </TableCell>
      <TableCell>
        {product.modifiersgroup && product.modifiersgroup.length > 0 ? (
          product.modifiersgroup.map(modifiersgroup => (
            <div key={modifiersgroup._id}>
              {modifiersgroup.pos.name}
              <p style={{ fontSize: '12px', fontWeight: 'bold' }}>
                {modifiersgroup?.internal_info}
              </p>
            </div>
          ))
        ) : (
          <div>N/A</div>
        )}
      </TableCell>
      <TableCell>
        {product.selectedPrinters && product.selectedPrinters.length > 0 ? (
          product.selectedPrinters.map(Printers => (
            <div key={Printers._id}>{Printers.name}</div>
          ))
        ) : (
          <div>N/A</div>
        )}
      </TableCell>
      <TableCell>
        {product.categories && product.categories.length > 0 ? (
          product.categories.map(category => (
            <div key={category._id}>{category.name}</div>
          ))
        ) : (
          <div>N/A</div>
        )}
      </TableCell>

      <TableCell>
        {product.webprice && (
          <div>
            <strong>Web Price:</strong> $
            {parseFloat(product.webprice).toFixed(2)}
          </div>
        )}
        {product.posprice && (
          <div>
            <strong>POS Price:</strong> $
            {parseFloat(product.posprice).toFixed(2)}
          </div>
        )}
      </TableCell>
      <TableCell>
        <Badge
          variant="outline"
          className="bg-green-100 text-green-800 border-green-200"
        >
          {product.stockQuantity}
        </Badge>
      </TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">...</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            <DropdownMenuLabel>Product Action</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onAction('edit', product._id)}
                >
                  <Pencil className="h-4 w-4" /> <span> Edit Product</span>
                </Button>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onAction('clone', product._id)}
                >
                  <Copy className="h-4 w-4" /> <span>Clone Product</span>
                </Button>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onAction('delete', product._id)}
                >
                  <Trash2 className="h-4 w-4" /> <span> Delete Product</span>
                </Button>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  )
}

export default function ProductList() {
  const { data: session } = useSession()
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedProducts, setSelectedProducts] = useState({})
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [userdata, setUserdata] = useState({})
  const [modifierGroups, setModifierGroups] = useState([])
  const [categories, setCategories] = useState([])
  const userDetails = useAdmin(state => state.userDetails)
  const [selectedCategory, setSelectedCategory] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedProductId, setSelectedProductId] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [action, setAction] = useState(null)
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
    const fetchProducts = async () => {
      setLoading(true)
      try {
        let userId = ''
        let restaurantIds = []

        if (userDetails?.user?.usertype === 'restaurant_owner') {
          userId = userdata?.user ? userdata.user.id : ''
        } else {
          userId = userDetails?.user?.createdBy
          restaurantIds = userDetails.user.selectedRestaurants
        }

        if (userId) {
          const token =
            userdata.user && userdata.user.name ? userdata.user.name.token : ''
          const response = await axios.get(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/product/getproductsuserid/${userId}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          )

          let allProducts = response.data.data || []

          if (userDetails?.user?.usertype === 'restaurant_owner') {
          } else {
            allProducts = allProducts.filter(product => {
              const productRestaurantIds = product.selectedRestaurants.map(
                restaurant => restaurant._id
              )
              return restaurantIds.some(restaurantId =>
                productRestaurantIds.includes(restaurantId)
              )
            })
          }
          // Sort the products by 'sortOrder' (ascending order)
          allProducts.sort((a, b) => a.sortOrder - b.sortOrder)
          setProducts(allProducts)
        }
      } catch (error) {
        console.error('Error fetching products:', error)
      } finally {
        setLoading(false)
      }
    }

    const fetchModifierGroups = async () => {
      try {
        const token =
          userdata.user && userdata.user.name ? userdata.user.name.token : ''
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/modifiersgroup/getmodifiersgroups`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )
        setModifierGroups(response.data.data)
      } catch (error) {
        console.error('Error fetching modifier groups:', error)
      }
    }

    const fetchCategories = async () => {
      try {
        setLoading(true)
        let userId = ''
        if (userDetails?.user?.usertype == 'restaurant_owner') {
          userId = userdata.user ? userdata.user.id : ''
        } else {
          userId = userDetails?.user?.createdBy
        }

        if (userId) {
          const token =
            userdata.user && userdata.user.name ? userdata.user.name.token : ''
          const response = await axios.get(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/categories/getcategoriesuserid/${userId}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          )

          setCategories(response.data.data)
        }
      } catch (error) {
        console.error('Error fetching categories:', error)
        setLoading(false)
      }
    }

    fetchProducts()
    fetchModifierGroups()
    fetchCategories()
  }, [userdata, userDetails, userDetails?.user?.usertype])

  // const filteredProducts = products.filter(product =>
  //   product.name.toLowerCase().includes(searchTerm.toLowerCase())
  // );
  // Filter products based on search term and selected category
  const filteredProducts_cat = (products || []).filter(product => {
    const matchesSearchTerm = product.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
    if (selectedCategory === 'all') {
      return matchesSearchTerm
    } else {
      const matchesCategory = selectedCategory
        ? product.categories?.some(
            category => category.name === selectedCategory
          )
        : true
      return matchesSearchTerm && matchesCategory
    }
  })
  //Handel Confirmation
  const handleConfirmation = async (action, id) => {
    if (action === 'edit') {
      router.push(`/admin/products/edit-product/${id}`)
    } else if (action === 'clone') {
      try {
        const userId = userdata.user ? userdata.user.id : ''
        const token =
          userdata.user && userdata.user.name ? userdata.user.name.token : ''
        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/product/clone`,
          { productId: id }, // Ensure the key matches what the backend expects
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
          }
        )
        // Show success toast
        Toastify({
          text: 'Product cloned successfully!',
          duration: 3000,
          close: true,
          gravity: 'top',
          position: 'right',
          backgroundColor: 'linear-gradient(to right, #00b09b, #96c93d)',
        }).showToast()
        // **Fetch updated product list after cloning**
        const fetchProducts = async () => {
          try {
            setLoading(true)
            let userId = ''
            let restaurantIds = []

            if (userDetails?.user?.usertype === 'restaurant_owner') {
              userId = userdata?.user ? userdata.user.id : ''
            } else {
              userId = userDetails?.user?.createdBy
              restaurantIds = userDetails.user.selectedRestaurants
            }

            if (userId) {
              const token =
                userdata.user && userdata.user.name
                  ? userdata.user.name.token
                  : ''
              const response = await axios.get(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}/product/getproductsuserid/${userId}`,
                {
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                }
              )

              let allProducts = response.data.data || []

              if (userDetails?.user?.usertype === 'restaurant_owner') {
              } else {
                allProducts = allProducts.filter(product => {
                  const productRestaurantIds = product.selectedRestaurants.map(
                    restaurant => restaurant._id
                  )
                  return restaurantIds.some(restaurantId =>
                    productRestaurantIds.includes(restaurantId)
                  )
                })
              }
              // Sort the products by 'sortOrder' (ascending order)
              allProducts.sort((a, b) => a.sortOrder - b.sortOrder)
              setProducts(allProducts)
            }
          } catch (error) {
            console.error('Error fetching products:', error)
          } finally {
            setLoading(false)
          }
        }
        fetchProducts()
      } catch (error) {
        console.error('Error cloning product:', error)
        // Show error toast
        Toastify({
          text: 'Failed to clone product.',
          duration: 3000,
          close: true,
          gravity: 'top',
          position: 'right',
          backgroundColor: 'linear-gradient(to right, #FF5C5C, #FF3B3B)',
        }).showToast()
      }
    } else {
      setSelectedProductId(id)
      setDialogOpen(true)
      setAction(action)
    }
  }
  const handleAction = async () => {
    if (action === 'delete') {
      // const confirmed = window.confirm("Are you sure you want to delete this product?");
      // if (!confirmed) return;
      try {
        const userId = userdata.user ? userdata.user.id : ''
        const token =
          userdata.user && userdata.user.name ? userdata.user.name.token : ''

        const response = await axios.delete(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/product/deleteproducts/${selectedProductId}`,
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
          }
        )

        if (response.status === 200) {
          setProducts(prevProducts =>
            prevProducts.filter(product => product._id !== selectedProductId)
          )
          Toastify({
            text: response.data.message,
            duration: 3000,
            close: true,
            gravity: 'top',
            position: 'right',
            backgroundColor: 'linear-gradient(to right, #00b09b, #96c93d)',
          }).showToast()
        } else {
          Toastify({
            text: response.data.error || 'Error deleting product.',
            duration: 3000,
            close: true,
            gravity: 'top',
            position: 'right',
            backgroundColor: 'linear-gradient(to right, #FF5C5C, #FF3B3B)',
          }).showToast()
        }
      } catch (error) {
        console.error('Error deleting product:', error)
        Toastify({
          text: 'An error occurred while deleting the product.',
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
  }

  const handleSelectAll = e => {
    const isChecked = e.target.checked
    const newSelected = {}
    filteredProducts.forEach(product => {
      newSelected[product._id] = isChecked
    })
    setSelectedProducts(newSelected)
  }

  // const handleSelectProduct = (id) => {
  //   setSelectedProducts((prev) => ({
  //     ...prev,
  //     [id]: !prev[id],
  //   }));
  // };

  const handleAddNewProduct = () => {
    router.push('/admin/products/add-new-product')
  }

  // const handleDragEnd = (event) => {
  //   const { active, over } = event;

  //   if (active.id !== over.id) {
  //     setProducts((items) => {
  //       const oldIndex = items.findIndex((item) => item._id === active.id);
  //       const newIndex = items.findIndex((item) => item._id === over.id);

  //       return arrayMove(items, oldIndex, newIndex);
  //     });
  //   }
  // };

  // Filter products based on search term and selected category
  // const filteredProducts_cat = products.filter(product => {
  //   const matchesSearchTerm = product.name.toLowerCase().includes(searchTerm.toLowerCase());
  //   const matchesCategory = selectedCategory ? product.categories.some(category => category.name === selectedCategory) : true;
  //   return matchesSearchTerm && matchesCategory;
  // });

  const handleDragEnd = async event => {
    const { active, over } = event

    if (active.id !== over.id) {
      const reorderedProducts = arrayMove(
        products,
        products.findIndex(item => item._id === active.id),
        products.findIndex(item => item._id === over.id)
      )
      setProducts(reorderedProducts)

      const updatedProducts = reorderedProducts.map((product, index) => ({
        ...product,
        sortOrder: index + 1,
      }))

      try {
        const token = userdata.user?.name?.token
        const response = await axios.put(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/product/product-sort-order`,
          updatedProducts,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )

        if (response.status === 200) {
          Toastify({
            text: 'Product order updated successfully!',
            duration: 3000,
            close: true,
            gravity: 'top',
            position: 'right',
            backgroundColor: 'linear-gradient(to right, #00b09b, #96c93d)',
          }).showToast()
        }
      } catch (error) {
        console.error('Error updating product order:', error)
        Toastify({
          text: 'Error updating product order.',
          duration: 3000,
          close: true,
          gravity: 'top',
          position: 'right',
          backgroundColor: 'linear-gradient(to right, #FF5C5C, #FF3B3B)',
        }).showToast()
      }
    }
  }

  const filteredProducts = products.filter(
    product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (selectedCategory === 'all' ||
        product.categories.some(category => category.name === selectedCategory))
  )

  const handleSelectProduct = id => {
    setSelectedProducts(prev => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  const handleCategoryChange = category => {
    setSelectedCategory(category)
  }
  const isAllSelected = '' //filteredProducts.length > 0 && filteredProducts.every(product => selectedProducts[product._id]);

  if (loading) {
    return <div>Loading...</div>
  }
  const totalItems = filteredProducts_cat.length
  const totalPages = Math.ceil(totalItems / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize
  const currentItems = filteredProducts_cat.slice(startIndex, endIndex)
  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        {loading && <Loading />}
        <h1 className="text-2xl font-semibold">Products</h1>
        <div className="flex gap-2">
          <Button onClick={handleAddNewProduct} className="bg-teal-600">
            <Plus className="mr-2 h-4 w-4" /> New Product
          </Button>
          <Button variant="outline">
            More Actions <MoreHorizontal className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="flex mb-4 space-x-4">
        {/* Search Input */}
        <div className="relative w-1/2">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search"
            className="pl-8"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        {/* Select Dropdown */}
        <div className="w-1/2">
          <Select onValueChange={handleCategoryChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem key="" value="all">
                  All Category
                </SelectItem>
                {categories &&
                  categories.map(category => (
                    <SelectItem key={category.id} value={category.name}>
                      {category.name}
                    </SelectItem>
                  ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={handleSelectAll}
                  className="rounded border-gray-300"
                />
              </TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Store Name</TableHead>
              <TableHead>Modifier Group</TableHead>
              <TableHead>Printer</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Inventory</TableHead>
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
                items={currentItems.map(product => product._id)}
                strategy={verticalListSortingStrategy}
              >
                {currentItems.map(product => (
                  <SortableTableRow
                    key={product._id}
                    product={product}
                    onSelectProduct={handleSelectProduct}
                    onAction={handleConfirmation}
                    selected={selectedProducts[product._id] || false}
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
                Are you sure you want to delete this product?
              </AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the
                product.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction asChild>
                <Button onClick={handleAction} className="btn btn-danger">
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
