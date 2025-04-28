'use client'
import { useSession } from 'next-auth/react'
import React, { useState, useEffect } from 'react'
import { MoreHorizontal, Plus, Pencil, Trash2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '~/components/ui/dialog'
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
import { Badge } from '~/components/ui/badge'
import { Switch } from '~/components/ui/switch'
import { RadioGroup, RadioGroupItem } from '~/components/ui/radio-group'
import { Label } from '~/components/ui/label'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import { Card, CardContent } from '~/components/ui/card'
import axios from 'axios'
import Toastify from 'toastify-js'

export default function TaxRules() {
  const { data: session } = useSession()
  const [taxRules, setTaxRules] = useState([])
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [currentTaxRule, setCurrentTaxRule] = useState(null)
  const [newTaxRule, setNewTaxRule] = useState({
    name: '',
    taxClass: '',
    amount: 0,
    tax_type: 'fixed',
    status: true,
  })
  const [userdata, setUserdata] = useState({})
  const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL

  useEffect(() => {
    setUserdata(session)
  }, [session])

  useEffect(() => {
    const fetchTaxRules = async () => {
      try {
        let userId = userdata.user ? userdata.user.id : ''
        const token = userdata.user?.name?.token || ''
        const response = await axios.get(
          `${apiUrl}/taxrules/gettaxrulesuserid/${userId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )
        if (response.data.data) {
          setTaxRules(response.data.data)
        }
      } catch (error) {
        console.error('Error fetching tax rules:', error)
      }
    }
    fetchTaxRules()
  }, [userdata, apiUrl])

  const handleAddTaxRule = async () => {
    if (newTaxRule.name && newTaxRule.taxClass && newTaxRule.amount) {
      const requestData = {
        name: newTaxRule.name,
        taxClass: newTaxRule.taxClass,
        amount: newTaxRule.amount,
        tax_type: newTaxRule.tax_type,
        createdBy: userdata.user?.id || 'defaultUserId',
      }

      try {
        const token = userdata.user?.name?.token || ''
        const response = await axios.post(
          `${apiUrl}/taxrules/createtaxrules`,
          requestData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )

        setTaxRules([
          ...taxRules,
          { ...requestData, _id: response.data.data._id },
        ])
        resetNewTaxRule()
        setIsAddDialogOpen(false)

        Toastify({
          text: 'Tax rule added successfully!',
          duration: 3000,
          backgroundColor: 'green',
        }).showToast()
      } catch (error) {
        console.error('Error adding Tax rule:', error)
        Toastify({
          text: 'Error adding Tax rule.',
          duration: 3000,
          backgroundColor: 'red',
        }).showToast()
      }
    } else {
      Toastify({
        text: 'Please fill in all required fields.',
        duration: 3000,
        backgroundColor: 'orange',
      }).showToast()
    }
  }

  const handleEditTaxRule = async () => {
    if (currentTaxRule) {
      const requestData = {
        ...currentTaxRule,
        taxClass: newTaxRule.taxClass,
        amount: newTaxRule.amount,
        tax_type: newTaxRule.tax_type,
        status: newTaxRule.status,
      }

      try {
        const token = userdata.user?.name?.token || ''
        await axios.put(
          `${apiUrl}/taxrules/edittaxrules/${currentTaxRule._id}`,
          requestData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )

        setTaxRules(
          taxRules.map(rule =>
            rule._id === currentTaxRule._id ? requestData : rule
          )
        )
        resetNewTaxRule()
        setIsEditDialogOpen(false)

        Toastify({
          text: 'Tax rule edited successfully!',
          duration: 3000,
          backgroundColor: 'green',
        }).showToast()
      } catch (error) {
        console.error('Error editing Tax rule:', error)
        Toastify({
          text: 'Error editing Tax rule.',
          duration: 3000,
          backgroundColor: 'red',
        }).showToast()
      }
    }
  }

  const handleDeleteTaxRule = async id => {
    if (confirm('Are you sure you want to delete this tax rule?')) {
      try {
        const token = userdata.user?.name?.token || ''
        await axios.delete(`${apiUrl}/taxrules/deletetaxrules/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        setTaxRules(taxRules.filter(rule => rule._id !== id))

        Toastify({
          text: 'Tax rule deleted successfully!',
          duration: 3000,
          backgroundColor: 'green',
        }).showToast()
      } catch (error) {
        console.error('Error deleting Tax rule:', error)
        Toastify({
          text: 'Error deleting Tax rule.',
          duration: 3000,
          backgroundColor: 'red',
        }).showToast()
      }
    }
  }

  const resetNewTaxRule = () => {
    setNewTaxRule({
      name: '',
      taxClass: '',
      amount: 0,
      tax_type: 'fixed',
      status: true,
    })
  }

  return (
    <Card className="w-full">
      <CardContent className="space-y-4">
        <div className="container mx-auto py-10">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Tax Rules</h1>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" /> Add Tax Rule
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[625px]">
                <DialogHeader>
                  <DialogTitle>Add Tax Rule</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="taxName">Tax Name *</Label>
                    <Input
                      id="taxName"
                      value={newTaxRule.name}
                      onChange={e =>
                        setNewTaxRule({ ...newTaxRule, name: e.target.value })
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="taxClass">Tax Class *</Label>
                    <Input
                      id="taxClass"
                      value={newTaxRule.taxClass}
                      onChange={e =>
                        setNewTaxRule({
                          ...newTaxRule,
                          taxClass: e.target.value,
                        })
                      }
                    />
                  </div>
                  <RadioGroup
                    defaultValue="fixed"
                    onValueChange={value =>
                      setNewTaxRule({ ...newTaxRule, tax_type: value })
                    }
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="fixed" id="fixed" />
                      <Label htmlFor="fixed">Fixed Amount</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="percentage" id="percentage" />
                      <Label htmlFor="percentage">Percentage</Label>
                    </div>
                  </RadioGroup>
                  <div className="grid gap-2">
                    <Label htmlFor="amount">Amount *</Label>
                    <Input
                      id="amount"
                      type="number"
                      value={newTaxRule.amount}
                      onChange={e =>
                        setNewTaxRule({
                          ...newTaxRule,
                          amount: parseFloat(e.target.value),
                        })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="enableTaxRule">Enable Tax Rule</Label>
                    <Switch
                      id="enableTaxRule"
                      checked={newTaxRule.status}
                      onCheckedChange={checked =>
                        setNewTaxRule({ ...newTaxRule, status: checked })
                      }
                    />
                  </div>
                </div>
                <Button onClick={handleAddTaxRule}>Add Tax Rule</Button>
              </DialogContent>
            </Dialog>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tax Name</TableHead>
                <TableHead>Tax Class</TableHead>
                <TableHead>Tax Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {taxRules && taxRules.length > 0 ? (
                taxRules.map(rule => (
                  <TableRow key={rule._id}>
                    <TableCell>{rule.name}</TableCell>
                    <TableCell>{rule.taxClass}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          rule.tax_type === 'fixed' ? 'default' : 'secondary'
                        }
                      >
                        {rule.tax_type}
                      </Badge>
                    </TableCell>
                    <TableCell>{rule.amount}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setCurrentTaxRule(rule)
                              setNewTaxRule(rule)
                              setIsEditDialogOpen(true)
                            }}
                          >
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteTaxRule(rule._id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    No Data Found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogTrigger asChild>
          <Button onClick={() => {}} style={{ display: 'none' }}>
            Edit
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[625px]">
          <DialogHeader>
            <DialogTitle>Edit Tax Rule</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="editTaxName">Tax Name *</Label>
              <Input
                id="editTaxName"
                value={newTaxRule.name}
                onChange={e =>
                  setNewTaxRule({ ...newTaxRule, name: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="editTaxClass">Tax Class *</Label>
              <Input
                id="editTaxClass"
                value={newTaxRule.taxClass}
                onChange={e =>
                  setNewTaxRule({ ...newTaxRule, taxClass: e.target.value })
                }
              />
            </div>
            <RadioGroup
              value={newTaxRule.tax_type}
              onValueChange={value =>
                setNewTaxRule({ ...newTaxRule, tax_type: value })
              }
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="fixed" id="editFixed" />
                <Label htmlFor="editFixed">Fixed Amount</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="percentage" id="editPercentage" />
                <Label htmlFor="editPercentage">Percentage</Label>
              </div>
            </RadioGroup>
            <div className="grid gap-2">
              <Label htmlFor="editAmount">Amount *</Label>
              <Input
                id="editAmount"
                type="number"
                value={newTaxRule.amount}
                onChange={e =>
                  setNewTaxRule({
                    ...newTaxRule,
                    amount: parseFloat(e.target.value),
                  })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="editEnableTaxRule">Enable Tax Rule</Label>
              <Switch
                id="editEnableTaxRule"
                checked={newTaxRule.status}
                onCheckedChange={checked =>
                  setNewTaxRule({ ...newTaxRule, status: checked })
                }
              />
            </div>
          </div>
          <Button onClick={handleEditTaxRule}>Save Changes</Button>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
