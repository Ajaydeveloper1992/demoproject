'use client'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '~/components/ui/dialog'
import { Trash2, Pencil } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Checkbox } from '~/components/ui/checkbox'
import { Switch } from '~/components/ui/switch'
import Toastify from 'toastify-js'
import {
  fetchRoles,
  addRole,
  deleteRole,
  fetchRoleById,
  updatePermissions,
} from './api' // Adjust the path accordingly
import axios from 'axios'
// const permissionItems = [
//   "Dashboard", "Products", "Orders", "Customers", "Restaurant",
//   "Tables", "KDS", "POS", "Staff", "Qrbuilder",
//   "Deliveryareas", "Plan", "Finances",'Reports','Add Product', 'Manage Categories', 'tags', 'Modifier Group','Printarea','Void Order'
// ];
const permissionItems = [
  'Dashboard',
  'Products',
  'Orders',
  'Customers',
  'Restaurant',
  'Tables',
  'KDS',
  'POS',
  'Staff',
  'Delivery Areas',
  'Plan',
  'Finances',
  'Reports',
  'Add Product',
  'Manage Categories',
  'Tags',
  'Modifier Group',
  'Print Area',
  'Void Order',
]

export default function RoleManagement() {
  const { data: session, status } = useSession()
  const [roles, setRoles] = useState([])
  const [newRoleName, setNewRoleName] = useState('')
  const [newRoleid, setNewRoleID] = useState('')
  const [selectedRole, setSelectedRole] = useState(null)
  const [permissions, setPermissions] = useState({})
  const [userdata, setUserdata] = useState({})
  const [open, setOpen] = useState(false)
  useEffect(() => {
    setUserdata(session)
  }, [session])

  const token = userdata?.user?.name?.token || ''

  const fetchAllRoles = useCallback(async () => {
    try {
      const user_id = userdata?.user?.id || ''
      const rolesData = await fetchRoles(user_id, token)
      setRoles(rolesData)
      console.log(rolesData)
    } catch (error) {
      console.error('Error fetching roles:', error)
    }
  }, [userdata, token])

  const handleSelectAll = checked => {
    const updatedPermissions = {}
    permissionItems.forEach(item => {
      updatedPermissions[item] = {
        add: checked,
        view: checked,
        update: checked,
        delete: checked,
      }
    })
    setPermissions(updatedPermissions)
  }

  const handleAddRole = async () => {
    if (newRoleName.trim()) {
      try {
        const user_id = userdata?.user?.id || ''
        const newRole = await addRole(newRoleName.trim(), user_id, token)
        setRoles(prevRoles => [...prevRoles, newRole])
        fetchAllRoles()
      } catch (error) {
        console.error('Failed to add role', error)
        Toastify({
          text: 'Failed to add role',
          duration: 3000,
          close: true,
          gravity: 'top',
          position: 'right',
          backgroundColor: 'linear-gradient(to right, #FF5C5C, #FF3B3B)',
        }).showToast()
      } finally {
        setNewRoleName('')
      }
    }
  }

  useEffect(() => {
    fetchAllRoles()
  }, [fetchAllRoles])

  const handleDeleteRole = async id => {
    if (id) {
      const isConfirmed = window.confirm(
        'Are you sure you want to delete this role?'
      )
      if (isConfirmed) {
        try {
          await deleteRole(id, token)
          setRoles(prevRoles => prevRoles.filter(role => role._id !== id))
          Toastify({
            text: 'Role deleted successfully',
            duration: 3000,
            close: true,
            gravity: 'top',
            position: 'right',
            backgroundColor: 'linear-gradient(to right, #00b09b, #96c93d)',
          }).showToast()
        } catch (error) {
          console.error('Failed to delete role:', error)
          Toastify({
            text: 'Failed to delete role',
            duration: 3000,
            close: true,
            gravity: 'top',
            position: 'right',
            backgroundColor: 'linear-gradient(to right, #FF5C5C, #FF3B3B)',
          }).showToast()
        }
      }
    }
  }

  const handleRoleSelect = async role => {
    setSelectedRole(role)
    if (role) {
      try {
        const roleData = await fetchRoleById(role._id, token)
        const rolePermissions = roleData.data?.permissions || {}
        const initializedPermissions = permissionItems.reduce((acc, item) => {
          acc[item] = rolePermissions[item] || {
            add: false,
            view: false,
            update: false,
            delete: false,
          }
          return acc
        }, {})
        setPermissions(initializedPermissions)
        Toastify({
          text: 'Permissions successfully fetched',
          duration: 3000,
          close: true,
          gravity: 'top',
          position: 'right',
          backgroundColor: 'linear-gradient(to right, #00b09b, #96c93d)',
        }).showToast()
      } catch (error) {
        console.error('Failed to fetch role permissions:', error)
        Toastify({
          text: 'Failed to fetch role permissions',
          duration: 3000,
          close: true,
          gravity: 'top',
          position: 'right',
          backgroundColor: 'linear-gradient(to right, #FF5C5C, #FF3B3B)',
        }).showToast()
      }
    }
  }

  const handleSavePermissions = async () => {
    if (selectedRole) {
      try {
        const updatedRole = await updatePermissions(
          selectedRole._id,
          permissions,
          token
        )
        setRoles(prevRoles =>
          prevRoles.map(role =>
            role._id === updatedRole.data._id ? updatedRole.data : role
          )
        )
        setSelectedRole(null)
        Toastify({
          text: 'Permissions updated successfully',
          duration: 3000,
          close: true,
          gravity: 'top',
          position: 'right',
          backgroundColor: 'linear-gradient(to right, #00b09b, #96c93d)',
        }).showToast()
      } catch (error) {
        console.error('Failed to update permissions:', error)
        Toastify({
          text: 'Failed to update permissions',
          duration: 3000,
          close: true,
          gravity: 'top',
          position: 'right',
          backgroundColor: 'linear-gradient(to right, #FF5C5C, #FF3B3B)',
        }).showToast()
      }
    } else {
      Toastify({
        text: 'No role selected',
        duration: 3000,
        close: true,
        gravity: 'top',
        position: 'right',
        backgroundColor: 'linear-gradient(to right, #FF5C5C, #FF3B3B)',
      }).showToast()
    }
  }

  const handlePermissionChange = (item, action) => {
    setPermissions(prev => ({
      ...prev,
      [item]: {
        ...(prev[item] !== undefined
          ? prev[item]
          : { add: false, view: false, update: false, delete: false }),
        [action]: !prev[item]?.[action],
      },
    }))
  }
  // Function to handle editing the role name
  const handleEditRole = role => {
    console.log('Data Role: ', role)
    setNewRoleName(role.name)
    setNewRoleID(role._id)
    // Set the current role name as the initial value
    //setSelectedRole(role);
    setOpen(true) // Open modal
  }
  // Function to handle saving the edited role name
  const handleSaveRoleName = async () => {
    if (newRoleName.trim() === '') {
      Toastify({
        text: 'Role name cannot be empty',
        duration: 3000,
        close: true,
        gravity: 'top',
        position: 'right',
        backgroundColor: 'linear-gradient(to right, #FF5C5C, #FF3B3B)',
      }).showToast()
      return
    }

    try {
      // Make an API request to update the role name in the backend
      if (newRoleid) {
        const updatedRole = await updateRoleName(newRoleid, newRoleName) // Replace with your update API function
        setRoles(prevRoles =>
          prevRoles.map(role => (role._id === newRoleid ? updatedRole : role))
        )
        setSelectedRole(null)
        setNewRoleName('')
        setOpen(false) // Close modal
        Toastify({
          text: 'Role name updated successfully',
          duration: 3000,
          close: true,
          gravity: 'top',
          position: 'right',
          backgroundColor: 'linear-gradient(to right, #00b09b, #96c93d)',
        }).showToast()
      } else {
        Toastify({
          text: 'Role id is not set',
          duration: 3000,
          close: true,
          gravity: 'top',
          position: 'right',
          backgroundColor: 'linear-gradient(to right, #FF5C5C, #FF3B3B)',
        }).showToast()
      }
    } catch (error) {
      console.error('Failed to update role name:', error)
      Toastify({
        text: 'Failed to update role name',
        duration: 3000,
        close: true,
        gravity: 'top',
        position: 'right',
        backgroundColor: 'linear-gradient(to right, #FF5C5C, #FF3B3B)',
      }).showToast()
    }
  }
  // Function to make the API call to update the role name using Axios
  const updateRoleName = async (id, name) => {
    console.log('Role ID', id)

    const token = userdata?.user?.name?.token || '' // Get the token from userdata
    try {
      const response = await axios.put(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/roles/updateRolename/`,
        {
          id, // Role ID
          name, // New role name
        },
        {
          headers: {
            Authorization: `Bearer ${token}`, // Include token in the Authorization header
          },
        }
      )

      if (response.status === 200) {
        return response.data.data // Assuming the role data is in 'data' field
      } else {
        throw new Error('Failed to update role')
      }
    } catch (error) {
      console.error('Error in updating role name:', error)
      throw error // Rethrow to handle in the calling function
    }
  }
  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <div className="flex justify-between items-center flex-wrap">
            <CardTitle>Roles & Permissions</CardTitle>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="default">Manage Role</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[625px] max-w-full">
                <DialogHeader>
                  <DialogTitle>Manage Role</DialogTitle>
                </DialogHeader>
                <Table className="w-full overflow-x-auto">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">#</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {roles.map((role, index) => (
                      <TableRow key={role._id}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>{role.name}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteRole(role._id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="flex items-center space-x-2 mt-4 flex-wrap">
                  <Input
                    placeholder="Role Name"
                    value={newRoleName}
                    onChange={e => setNewRoleName(e.target.value)}
                    className="w-full sm:w-auto"
                  />
                  <Button onClick={handleAddRole} className="w-full sm:w-auto">
                    Save
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Table className="w-full overflow-x-auto">
            <TableBody>
              {roles.map(role => (
                <TableRow key={role._id}>
                  <TableCell className="font-medium">{role.name}</TableCell>
                  <TableCell>{role.members} Member(s)</TableCell>
                  <TableCell>
                    {/* Permissions Button */}
                    <Button
                      variant="outline"
                      onClick={() => handleRoleSelect(role)}
                    >
                      Permissions
                    </Button>

                    {/* Edit Button */}
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleEditRole(role)} // Assuming a handleEditRole function
                      className="ml-2"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>

                    {/* Delete Button */}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteRole(role._id)} // Assuming a handleDeleteRole function
                      className="ml-2"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {/* Modal for editing role name */}
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Role Name</DialogTitle>
              </DialogHeader>
              <Input
                value={newRoleName}
                onChange={e => setNewRoleName(e.target.value)}
                placeholder="Role Name"
                className="w-100"
              />
              <Button onClick={handleSaveRoleName} className="mt-4">
                Save
              </Button>
            </DialogContent>
          </Dialog>
        </CardContent>
        {selectedRole && (
          <Dialog
            open={!!selectedRole}
            onOpenChange={() => setSelectedRole(null)}
          >
            <DialogContent className="max-w-4xl max-h-[100vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{selectedRole.name} Permissions</DialogTitle>
              </DialogHeader>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">
                      <Checkbox
                        checked={
                          permissions &&
                          Object.values(permissions).every(p =>
                            Object.values(p).every(v => v)
                          )
                        }
                        onCheckedChange={handleSelectAll}
                      />{' '}
                      Select All
                    </TableHead>
                    <TableHead>Add</TableHead>
                    <TableHead>View</TableHead>
                    <TableHead>Update</TableHead>
                    <TableHead>Delete</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {permissionItems.map(item => (
                    <TableRow key={item}>
                      <TableCell>{item}</TableCell>
                      {['add', 'view', 'update', 'delete'].map(action => {
                        const isChecked = permissions[item]?.[action] || false
                        return (
                          <TableCell key={action}>
                            <Switch
                              checked={isChecked}
                              onCheckedChange={() =>
                                handlePermissionChange(item, action)
                              }
                            />
                          </TableCell>
                        )
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="mt-4">
                <Button onClick={handleSavePermissions}>
                  Save Permissions
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </Card>
    </>
  )
}
