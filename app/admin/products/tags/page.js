'use client'
import { useSession } from 'next-auth/react'
import React, { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, X } from 'lucide-react'
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
import { Badge } from '~/components/ui/badge'
import axios from 'axios'
import Toastify from 'toastify-js'
import 'toastify-js/src/toastify.css' // Import Toastify CSS

export default function TagsManagement() {
  const { data: session } = useSession()
  const [tags, setTags] = useState([])
  const [newTag, setNewTag] = useState({ name: '', slug: '' })
  const [editingTag, setEditingTag] = useState(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [userdata, setUserdata] = useState({})
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selecttagId, setSelectedTag] = useState(null)
  const [action, setAction] = useState(null)

  useEffect(() => {
    setUserdata(session)
  }, [session])

  useEffect(() => {
    const fetchTags = async () => {
      try {
        let userId = userdata.user ? userdata.user.id : ''
        const token = userdata.user?.name?.token || ''
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/tags/gettagsuserid/${userId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )
        setTags(response.data.data)
      } catch (error) {
        console.error('Error fetching tags:', error)
        // Toastify({
        //   text: "Error fetching tags.",
        //   duration: 3000,
        //   backgroundColor: "red",
        // }).showToast();
      }
    }
    fetchTags()
  }, [userdata])

  const handleAddTag = async () => {
    if (newTag.name) {
      try {
        const userId = userdata.user ? userdata.user.id : ''
        const token = userdata.user?.name?.token || ''

        const tagData = {
          ...newTag,
          createdBy: userId,
        }

        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/tags/createtags`,
          tagData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )

        setTags([...tags, { ...newTag, id: response.data.data._id }])
        setNewTag({ name: '', slug: '' })
        setIsAddDialogOpen(false)

        Toastify({
          text: 'Tag added successfully!',
          duration: 3000,
          backgroundColor: 'green',
        }).showToast()
      } catch (error) {
        console.error('Error adding tag:', error)
        Toastify({
          text: 'Error adding tag.',
          duration: 3000,
          backgroundColor: 'red',
        }).showToast()
      }
    }
  }

  const handleEditTag = async () => {
    if (editingTag) {
      try {
        const userId = userdata.user ? userdata.user.id : ''
        const token = userdata.user?.name?.token || ''
        const response = await axios.put(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/tags/edittags/${editingTag.id}`,
          editingTag,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )
        setTags(
          tags.map(tag => (tag.id === editingTag.id ? response.data.data : tag))
        )
        setEditingTag(null)
        setIsEditDialogOpen(false)

        Toastify({
          text: 'Tag updated successfully!',
          duration: 3000,
          backgroundColor: 'green',
        }).showToast()
      } catch (error) {
        console.error('Error editing tag:', error)
        Toastify({
          text: 'Error editing tag.',
          duration: 3000,
          backgroundColor: 'red',
        }).showToast()
      }
    }
  }

  // Delete Tag
  const handleConfirmation = tagId => {
    setSelectedTag(tagId)
    setDialogOpen(true)
  }
  const handleDeleteTag = async () => {
    try {
      const userId = userdata.user ? userdata.user.id : ''
      const token = userdata.user?.name?.token || ''
      await axios.delete(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/tags/deletetags/${selecttagId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )
      setTags(tags.filter(tag => tag._id !== selecttagId))

      Toastify({
        text: 'Tag deleted successfully!',
        duration: 3000,
        backgroundColor: 'green',
      }).showToast()
    } catch (error) {
      console.error('Error deleting tag:', error)
      Toastify({
        text: 'Error deleting tag.',
        duration: 3000,
        backgroundColor: 'red',
      }).showToast()
    } finally {
      setDialogOpen(false) // Close the dialog after action
    }
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Tags Management</h1>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Add New Tag
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Tag</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="name" className="text-right">
                  Name
                </label>
                <Input
                  id="name"
                  value={newTag.name}
                  onChange={e => setNewTag({ ...newTag, name: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="slug" className="text-right">
                  Slug
                </label>
                <Input
                  id="slug"
                  value={newTag.slug}
                  onChange={e => setNewTag({ ...newTag, slug: e.target.value })}
                  className="col-span-3"
                />
              </div>
            </div>
            <Button onClick={handleAddTag}>Add Tag</Button>
          </DialogContent>
        </Dialog>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Slug</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tags &&
            tags.map(tag => (
              <TableRow key={tag._id}>
                <TableCell>{tag.name} </TableCell>
                <TableCell>{tag.slug}</TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Dialog
                      open={isEditDialogOpen}
                      onOpenChange={setIsEditDialogOpen}
                    >
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingTag(tag)
                            setIsEditDialogOpen(true)
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Edit Tag</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="grid grid-cols-4 items-center gap-4">
                            <label htmlFor="edit-name" className="text-right">
                              Name
                            </label>
                            <Input
                              id="edit-name"
                              value={editingTag?.name || ''}
                              onChange={e =>
                                setEditingTag({
                                  ...editingTag,
                                  name: e.target.value,
                                })
                              }
                              className="col-span-3"
                            />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <label htmlFor="edit-slug" className="text-right">
                              Slug
                            </label>
                            <Input
                              id="edit-slug"
                              value={editingTag?.slug || ''}
                              onChange={e =>
                                setEditingTag({
                                  ...editingTag,
                                  slug: e.target.value,
                                })
                              }
                              className="col-span-3"
                            />
                          </div>
                        </div>
                        <Button onClick={handleEditTag}>Save Changes</Button>
                      </DialogContent>
                    </Dialog>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleConfirmation(tag._id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Tag Cloud</h2>
        <div className="flex flex-wrap gap-2">
          {tags.map(tag => (
            <Badge key={tag._id} variant="secondary">
              {tag.name}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 ml-2"
                onClick={() => handleDeleteTag(tag._id)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      </div>
      {/* Confirmation Dialog */}
      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Are you sure you want to delete this tag?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              tag.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button onClick={handleDeleteTag} className="btn btn-danger">
                Delete
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
