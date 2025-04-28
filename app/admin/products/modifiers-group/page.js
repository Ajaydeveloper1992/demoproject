'use client'
import { useSession } from 'next-auth/react'
import React, { useState, useEffect, useMemo } from 'react'
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  GripVertical,
  ChevronDown,
} from 'lucide-react'
import { Input } from '~/components/ui/input'
import { Button } from '~/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '~/components/ui/dialog'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import { Badge } from '~/components/ui/badge'
import Link from 'next/link'
import axios from 'axios'
import Toastify from 'toastify-js'
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
import { useAdmin } from '~/hooks/use-admin'
// Base URL for your API
const API_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL}/modifiersgroup`

const SortableTableRow = ({ modifier, onEdit, onDelete }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: modifier._id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  //console.log("This is Modifier Data",modifier);

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
          <Link
            href={`/admin/products/modifiers-group/addmodifiers/${modifier._id}`}
          >
            {modifier?.pos?.name}
          </Link>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center">
          <Link
            href={`/admin/products/modifiers-group/addmodifiers/${modifier._id}`}
          >
            {modifier?.web?.name}
          </Link>
        </div>
      </TableCell>
      {/* <TableCell>
        <div className="flex items-center">
          {modifier.productCount}
        </div>
      </TableCell> */}
      {/* <TableCell>
        <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
          Available
        </Badge>
      </TableCell> */}
      <TableCell>{modifier?.internal_info}</TableCell>
      <TableCell>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(modifier._id)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(modifier._id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
}
export default function ModifiersGroupsList() {
  const { data: session } = useSession()
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [modifiersgroup, setModifiers] = useState([])
  const [newModifier, setNewModifier] = useState({
    posname: '',
    webname: '',
    allowedCount: 1,
    requiredCount: 1,
    internal_info: '',
  })
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [editingModifier, setEditingModifier] = useState(null)
  const [selectedModifiers, setSelectedModifiers] = useState({})
  const [userdata, setUserdata] = useState({})
  const [loading, setLoading] = useState(true)

  const [sortBy, setSortBy] = useState('name')
  const [sortDirection, setSortDirection] = useState('asc')
  const userDetails = useAdmin(state => state.userDetails)
  const sensors = useSensors(useSensor(PointerSensor))

  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectmodifiersgroupId, setSelectedModifiersgroup] = useState(null)
  const [action, setAction] = useState(null)

  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  console.log('Data Modifiers', modifiersgroup)
  // Fetch user data on session change
  useEffect(() => {
    setUserdata(session)
  }, [session])
  // Fetch modifiers groups on component mount

  useEffect(() => {
    const fetchModifiersGroups = async () => {
      if (session && userdata) {
        let userId = userdata.user ? userdata.user.id : ''
        let token =
          userdata.user && userdata.user.name ? userdata.user.name.token : ''
        try {
          const response = await axios.get(
            `${API_URL}/getmodifiersgroupsuserid/${userId}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          )
          const sortedModifiersgroup = response.data.data.sort(
            (a, b) => a.sortOrder - b.sortOrder
          )
          setModifiers(sortedModifiersgroup)
        } catch (error) {
          console.error('Error fetching modifiers groups:', error)
        }
      }
    }
    fetchModifiersGroups()
  }, [userdata, session]) // Add 'session' to dependencies if used
  // Add new modifier
  const handleAddModifier = async () => {
    if (newModifier.posname && newModifier.webname) {
      let userId = userdata.user ? userdata.user.id : ''
      let token =
        userdata.user && userdata.user.name ? userdata.user.name.token : ''

      try {
        const response = await axios.post(
          `${API_URL}/createmodifiersgroups`,
          {
            pos: {
              name: newModifier.posname,
              requiredModifiersCount: newModifier.requiredCount,
              allowedModifiersCount: newModifier.allowedCount,
            },
            web: {
              name: newModifier.webname,
              requiredModifiersCount: newModifier.requiredCount,
              allowedModifiersCount: newModifier.allowedCount,
            },
            createdBy: userId,
            internal_info: newModifier.internal_info,
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        )

        // Update state with the new modifier group
        setModifiers([...modifiersgroup, response.data.data])
        setNewModifier({
          posname: '',
          webname: '',
          allowedCount: 1,
          requiredCount: 1,
          internal_info: '',
        }) // Reset state
        setIsAddDialogOpen(false)

        // Show success message
        Toastify({
          text: 'Modifier group added successfully!',
          duration: 3000,
          gravity: 'top',
          position: 'right',
          backgroundColor: 'linear-gradient(to right, #4caf50, #81c784)',
          stopOnFocus: true,
        }).showToast()
      } catch (error) {
        console.error(
          'Error adding modifier group:',
          error.response?.data || error.message
        )

        // Show error message
        Toastify({
          text: `Error adding modifier group: ${
            error.response?.data.message || error.message
          }`,
          duration: 3000,
          gravity: 'top',
          position: 'right',
          backgroundColor: 'linear-gradient(to right, #f44336, #ef5350)',
          stopOnFocus: true,
        }).showToast()
      }
    } else {
      console.error('Both POS and Web names are required.')
    }
  }

  // Edit modifier
  const handleEditModifier = async () => {
    if (editingModifier) {
      let userId = userdata.user ? userdata.user.id : ''
      let token =
        userdata.user && userdata.user.name ? userdata.user.name.token : ''
      try {
        const response = await axios.put(
          `${API_URL}/editmodifiersgroups/${editingModifier._id}`,
          {
            pos: {
              name: newModifier.posname,
              description: '', // Add if necessary
              isActive: true, // Add if necessary
              enabled: true, // Add if necessary
              requiredModifiersCount: newModifier.requiredCount,
              allowedModifiersCount: newModifier.allowedCount,
            },
            web: {
              name: newModifier.webname,
              description: '', // Add if necessary
              isActive: true, // Add if necessary
              enabled: true, // Add if necessary
              requiredModifiersCount: newModifier.requiredCount,
              allowedModifiersCount: newModifier.allowedCount,
            },
            internal_info: newModifier.internal_info,
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        )

        // Update local state with the new data
        setModifiers(
          modifiersgroup.map(modifier =>
            modifier._id === editingModifier._id ? response.data.data : modifier
          )
        )

        // Show success message
        Toastify({
          text: 'Modifiers group updated successfully!',
          duration: 3000,
          gravity: 'top', // top or bottom
          position: 'right', // left, center or right
          backgroundColor: 'linear-gradient(to right, #4caf50, #81c784)',
          stopOnFocus: true, // Prevents dismissing of toast on hover
        }).showToast()

        // Close modal and reset editing state
        setEditingModifier(null)
        setIsEditDialogOpen(false)
      } catch (error) {
        console.error(
          'Error editing modifier group:',
          error.response?.data || error.message
        )

        // Show error message
        Toastify({
          text: `Error editing modifier group: ${
            error.response?.data.message || error.message
          }`,
          duration: 3000,
          gravity: 'top',
          position: 'right',
          backgroundColor: 'linear-gradient(to right, #f44336, #ef5350)',
          stopOnFocus: true,
        }).showToast()
      }
    }
  }
  // Delete modifier
  const handleConfirmation = modifierId => {
    setSelectedModifiersgroup(modifierId)
    setDialogOpen(true)
  }
  const handleDeleteModifier = async () => {
    // Confirm deletion
    // const confirmed = window.confirm("Are you sure you want to delete this modifier group?");
    // if (!confirmed) {
    //   return; // Exit if the user cancels the deletion
    // }

    let userId = userdata?.user ? userdata?.user?.id : ''
    let token =
      userdata?.user && userdata?.user?.name ? userdata?.user?.name?.token : ''

    try {
      await axios.delete(
        `${API_URL}/deletemodifiersgroups/${selectmodifiersgroupId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )

      // Update the state to remove the deleted modifier
      setModifiers(
        modifiersgroup.filter(
          modifier => modifier._id !== selectmodifiersgroupId
        )
      )

      // Show success message
      Toastify({
        text: 'Modifier group deleted successfully!',
        duration: 3000,
        gravity: 'top',
        position: 'right',
        backgroundColor: 'linear-gradient(to right, #4caf50, #81c784)',
        stopOnFocus: true,
      }).showToast()
    } catch (error) {
      console.error(
        'Error deleting modifier group:',
        error.response?.data || error.message
      )
      // Show error message
      Toastify({
        text: `Error deleting modifier group: ${
          error.response?.data.message || error.message
        }`,
        duration: 3000,
        gravity: 'top',
        position: 'right',
        backgroundColor: 'linear-gradient(to right, #f44336, #ef5350)',
        stopOnFocus: true,
      }).showToast()
    } finally {
      setDialogOpen(false) // Close the dialog after action
    }
  }
  const handleSort = field => {
    const newDirection =
      sortBy === field && sortDirection === 'asc' ? 'desc' : 'asc'
    setSortBy(field)
    setSortDirection(newDirection)

    const sortedModifiers = [...modifiersgroup].sort((a, b) => {
      let comparison = 0

      if (field === 'name') {
        comparison = a.name.localeCompare(b.name)
      } else if (field === 'productCount') {
        comparison = a.productCount - b.productCount
      }

      return sortDirection === 'asc' ? comparison : -comparison
    })

    setModifiers(sortedModifiers)
  }
  // Select all modifiers
  const handleSelectAll = () => {
    const allSelected =
      Object.keys(selectedModifiers).length === modifiers.length
    const newSelected = modifiers.reduce((acc, modifier) => {
      acc[modifier._id] = !allSelected // Toggle selection
      return acc
    }, {})
    setSelectedModifiers(newSelected)
  }
  //Handle Drage End
  const handleDragEnd = async event => {
    const { active, over } = event

    // If no item is dropped over another (dragging to an invalid position), do nothing
    if (!over) return

    // Ensure that the dragged item is not dropped in the same position
    if (active.id !== over.id) {
      const oldIndex = modifiersgroup.findIndex(item => item._id === active.id)
      const newIndex = modifiersgroup.findIndex(item => item._id === over.id)

      // Reorder the items in the list based on the new index
      const reorderedModifiers = arrayMove(modifiersgroup, oldIndex, newIndex)

      // Update the sortOrder for each modifier in the reordered list
      const updatedModifiers = reorderedModifiers.map((modifier, index) => ({
        ...modifier,
        sortOrder: index + 1, // sortOrder starts from 1, not 0
      }))

      // Update the local state with the new order
      setModifiers(updatedModifiers)

      // Prepare the updatedModifiers array to be sent to the backend
      const modifiersToUpdate = updatedModifiers.map(modifier => ({
        _id: modifier._id,
        sortOrder: modifier.sortOrder,
      }))
      console.log('Update Moridifiers Data  ', modifiersToUpdate)

      try {
        // Send the updated modifiers to the backend
        let userId = userdata.user ? userdata.user.id : ''
        let token =
          userdata.user && userdata.user.token ? userdata.user.token : ''
        let response = await axios.post(
          `${API_URL}/modifierssortorder`,
          { updatedModifiers: modifiersToUpdate },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        )
        console.log('Check ', response)
        // Show success message
        Toastify({
          text: 'Modifiers reordered successfully!',
          duration: 3000,
          close: true,
          gravity: 'top',
          position: 'right',
          backgroundColor: 'linear-gradient(to right, #00b09b, #96c93d)',
        }).showToast()
      } catch (error) {
        console.error('Error updating modifier order:', error)

        // Show error message if the request fails
        Toastify({
          text: 'Error updating modifier order.',
          duration: 3000,
          close: true,
          gravity: 'top',
          position: 'right',
          backgroundColor: 'linear-gradient(to right, #FF5C5C, #FF3B3B)',
        }).showToast()
      }
    }
  }
  const filteredModifiers = useMemo(() => {
    return modifiersgroup.filter(modifier => {
      const posName = modifier?.pos?.name?.toLowerCase() || ''
      const webName = modifier?.web?.name?.toLowerCase() || ''
      const internalInfo = modifier?.internal_info?.toLowerCase() || ''

      return (
        posName.includes(searchTerm.toLowerCase()) ||
        webName.includes(searchTerm.toLowerCase()) ||
        internalInfo.includes(searchTerm.toLowerCase())
      )
    })
  }, [modifiersgroup, searchTerm])

  //console.log(newModifier);
  const totalItems = filteredModifiers.length
  const totalPages = Math.ceil(totalItems / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize
  const currentItems = filteredModifiers.slice(startIndex, endIndex)
  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Modifier Group</h1>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-teal-600">
              <Plus className="mr-2 h-4 w-4" /> Add Modifier Group
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold">
                Add Modifier Group
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {/* <Input
                placeholder="Group Name (POS)"
                value={newModifier.posname}
                onChange={(e) => setNewModifier({ ...newModifier, webname: e.target.value })}
              />
              <Input
                placeholder="Online Group Name"
                value={newModifier.webname}
                onChange={(e) => setNewModifier({ ...newModifier, webname: e.target.value })}
              /> */}
              <Input
                placeholder="Group Name (POS)"
                value={newModifier.posname}
                onChange={e => {
                  const value = e.target.value
                  setNewModifier({
                    ...newModifier,
                    posname: value,
                    webname: value,
                  }) // Set both fields
                }}
              />
              <Input
                placeholder="Online Group Name"
                value={newModifier.webname}
                onChange={e =>
                  setNewModifier({ ...newModifier, webname: e.target.value })
                }
              />
              <Input
                placeholder="Internal Information"
                value={newModifier.internal_info}
                onChange={e =>
                  setNewModifier({
                    ...newModifier,
                    internal_info: e.target.value,
                  })
                }
              />
            </div>
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => setIsAddDialogOpen(false)}
                className="w-[48%]"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddModifier}
                className="w-[48%] bg-teal-600 hover:bg-green-700"
              >
                Done
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        {/* <Button onClick={handleAddModifier} className="bg-teal-600">
        <Plus className="mr-2 h-4 w-4" /> New Modifier
      </Button> */}
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
                  <span>Modifier POS Name</span>
                  {sortBy === 'name' && (
                    <ChevronDown
                      className={`h-4 w-4 ${
                        sortDirection === 'asc' ? 'rotate-180' : ''
                      }`}
                    />
                  )}
                </button>
              </TableHead>
              <TableHead>
                <button className="flex items-center space-x-1">
                  <span>Modifier Web Name</span>
                </button>
              </TableHead>
              <TableHead>Internal Information</TableHead>
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
                items={currentItems.map(mod => mod._id)}
                strategy={verticalListSortingStrategy}
              >
                {currentItems.map(modifier => (
                  <SortableTableRow
                    key={modifier._id}
                    modifier={modifier}
                    onEdit={() => {
                      setEditingModifier(modifier)
                      setNewModifier({
                        posname: modifier.pos.name,
                        webname: modifier.web.name,
                        allowedCount: modifier.web.allowedModifiersCount,
                        requiredCount: modifier.web.requiredModifiersCount,
                        internal_info: modifier.internal_info,
                      })
                      setIsEditDialogOpen(true)
                    }}
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
      </div>

      {/* Only show the dialog if `isEditDialogOpen` is true */}
      {isEditDialogOpen && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditDialogOpen(true)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold">
                Edit Modifier Group
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <Input
                placeholder="Group Name (POS)"
                value={newModifier.posname}
                onChange={e =>
                  setNewModifier({ ...newModifier, posname: e.target.value })
                }
              />
              <Input
                placeholder="Online Group Name"
                value={newModifier.webname}
                onChange={e =>
                  setNewModifier({ ...newModifier, webname: e.target.value })
                }
              />
              <Input
                placeholder="Internal Information"
                value={newModifier.internal_info}
                onChange={e =>
                  setNewModifier({
                    ...newModifier,
                    internal_info: e.target.value,
                  })
                }
              />
            </div>
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
                className="w-[48%]"
              >
                Cancel
              </Button>
              <Button
                onClick={handleEditModifier}
                className="w-[48%] bg-teal-600 hover:bg-teal-700"
              >
                Done
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
      {/* Confirmation Dialog */}
      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Are you sure you want to delete this modifier group?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              modifier group.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button onClick={handleDeleteModifier} className="btn btn-danger">
                Delete
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
