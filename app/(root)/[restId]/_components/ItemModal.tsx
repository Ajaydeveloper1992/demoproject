// @ts-nocheck
import React, { useState, useEffect } from 'react'
import axios from 'axios'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '~/components/ui/dialog'
import { Button } from '~/components/ui/button'
import { RadioGroup, RadioGroupItem } from '~/components/ui/radio-group'
import { Checkbox } from '~/components/ui/checkbox'
import { Label } from '~/components/ui/label'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '~/components/ui/accordion'
import { CirclePlus, MinusCircle } from 'lucide-react'
import { useRestaurant } from '~/hooks/use-restaurant'
export function ItemModal({ isOpen, onClose, item }) {
  const [quantity, setQuantity] = useState(1)
  const [selectedModifiers, setSelectedModifiers] = useState({})
  const [itemNote, setItemNote] = useState('')
  const [modifiers, setModifiers] = useState([])
  const [taxRule, setTaxRule] = useState(null)
  const [isOpennote, setIsOpen] = useState(false)
  const [procesModifiers, procesModifierdata] = useState([])
  const addToCart = useRestaurant(state => state.addToCart)
  useEffect(() => {
    if (isOpen) {
      setQuantity(1)
      setSelectedModifiers({}) // Reset the selectedModifiers state
      setItemNote('') // Reset item note
      if (item) {
        if (item.modifiersgroup && item.modifiersgroup.length > 0) {
          procesModifierdata(item.modifiersgroup)
        } else {
          procesModifierdata([]) // Reset if no modifiers
        }
      }
    }
    if (onClose) {
      setModifiers([]) // Reset modifiers on close
    }
  }, [isOpen, onClose, item])

  useEffect(() => {
    if (item) {
      // Initialize selectedModifiers with defaultSelected items
      const initialModifiers = {}
      item.modifiersgroup.forEach(group => {
        const defaultSelectedModifiers = group.modifiers
          .filter(modifier => modifier.defaultSelected)
          .map(modifier => modifier._id)
        if (defaultSelectedModifiers.length > 0) {
          initialModifiers[group.web.name] = defaultSelectedModifiers
        }
      })
      setSelectedModifiers(initialModifiers)
    }
  }, [item])

  const fetchModifiers = async productId => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/modifiersgroup/getmodifiersgroupscartitem`,
        {
          params: { productId },
        }
      )
      const data = response.data
      if (data.success) {
        setModifiers(data.data)
      }
    } catch (error) {
      console.error('Error fetching modifiers:', error)
    }
  }
  const handleCheckboxChange = (groupName, modifierId) => {
    setSelectedModifiers(prev => {
      const currentSelection = prev[groupName] || []
      const isSelected = currentSelection.includes(modifierId)

      const newSelection = isSelected
        ? currentSelection.filter(id => id !== modifierId)
        : [...currentSelection, modifierId]

      return { ...prev, [groupName]: newSelection }
    })
  }

  const handleRadioChange = (groupName, modifierId) => {
    setSelectedModifiers(prev => ({ ...prev, [groupName]: [modifierId] }))
  }

  const calculateTotalPrice = () => {
    if (!item) return 0

    //const basePrice = item.websalleprice !== null ? item.websalleprice : item.webprice;

    const basePrice = item?.webprice

    let totalPriceAdjustment = 0

    Object.keys(selectedModifiers).forEach(groupName => {
      const selectedIds = selectedModifiers[groupName]
      const group = procesModifiers.find(g => g.web.name === groupName)

      if (group) {
        const groupModifiers = group.modifiers.filter(modifier =>
          selectedIds.includes(modifier._id)
        )
        totalPriceAdjustment += groupModifiers.reduce(
          (acc, mod) => acc + mod.priceAdjustment,
          0
        )
      }
    })

    let taxAmount = 0
    if (taxRule) {
      if (taxRule.tax_type === 'percentage') {
        taxAmount = (basePrice + totalPriceAdjustment) * (taxRule.amount / 100)
      } else if (taxRule.tax_type === 'fixed') {
        taxAmount = taxRule.amount
      }
    }
    return (basePrice + totalPriceAdjustment + taxAmount) * quantity
  }

  // Function to check if the "Add to Cart" button should be disabled
  const isAddToCartDisabled = () => {
    return procesModifiers.some(group => {
      const { requiredModifiersCount } = group.web
      if (requiredModifiersCount === 1) {
        const selectedIds = selectedModifiers[group.web.name] || []
        return selectedIds.length < 1 // If no modifier is selected, return true
      }
      return false // Return false if all required modifiers are selected
    })
  }
  const handleAddToCart = () => {
    if (!item) return

    const itemToAdd = {
      id: item._id,
      name: item.name,
      quantity,
      price: calculateTotalPrice(),
      modifiers: selectedModifiers,
      note: itemNote, // Add the note here
    }
    addToCart(itemToAdd)
    onClose()
  }
  const handleToggle = () => {
    setIsOpen(prevState => !prevState) // Toggle the open/close state
  }
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[100vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {item ? item.name : 'Loading...'}
          </DialogTitle>
          <p className="text-sm text-gray-600 mb-2">
            {' '}
            {item ? item.description : 'Loading...'}
          </p>
        </DialogHeader>
        <div className="space-y-4 overflow-y-auto max-h-[50vh] sm:max-h-[60vh]">
          {procesModifiers.map(group => {
            const requiredModifiersCount = group.web.requiredModifiersCount
            const allowedModifiersCount = group.web.allowedModifiersCount
            return (
              <div className="mainpopcartex" key={group.web.name}>
                <div className="flex">
                  <div className="text-xs text-left popcartex1">
                    <Label className="text-2xl font-bold">
                      {group.web.name}
                    </Label>{' '}
                  </div>
                  <div className="text-xs text-right mt-2 ml-10 popcartex2">
                    {allowedModifiersCount > 0
                      ? `${allowedModifiersCount} MAXIMUM`
                      : `${requiredModifiersCount} REQUIRED`}
                  </div>
                </div>
                <div className="mt-2 space-y-2">
                  {requiredModifiersCount === 1 &&
                  allowedModifiersCount === 1 ? (
                    <RadioGroup
                      value={selectedModifiers[group.web.name]?.[0]}
                      onValueChange={value =>
                        handleRadioChange(group.web.name, value)
                      }
                    >
                      {group.modifiers.map(modifier => {
                        const isSelected = selectedModifiers[
                          group.web.name
                        ]?.includes(modifier._id)
                        return (
                          <div key={modifier._id} className="flex items-center">
                            <RadioGroupItem
                              id={modifier._id}
                              value={modifier._id}
                              checked={isSelected}
                            />
                            <Label htmlFor={modifier._id} className="ml-2">
                              {modifier.name} +${modifier.priceAdjustment}
                            </Label>
                          </div>
                        )
                      })}
                    </RadioGroup>
                  ) : (
                    group.modifiers.map(modifier => {
                      const isChecked = selectedModifiers[
                        group.web.name
                      ]?.includes(modifier._id)
                      const isDisabled =
                        selectedModifiers[group.web.name]?.length >=
                          allowedModifiersCount && !isChecked
                      return (
                        <div key={modifier._id} className="flex items-center">
                          <Checkbox
                            id={modifier._id}
                            checked={isChecked}
                            onCheckedChange={() =>
                              handleCheckboxChange(group.web.name, modifier._id)
                            }
                            disabled={isDisabled}
                          />
                          <Label htmlFor={modifier._id} className="ml-2">
                            {modifier.name} +${modifier.priceAdjustment}
                          </Label>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            )
          })}
          {/* Item Note Input */}
          <div>
            {/* <Accordion type="single" collapsible className="w-full">
                            <AccordionItem value="item-1">
                                <AccordionTrigger onClick={handleToggle} className="flex items-center zp-spceremove">
                                    <span className='zp-text-color'>Special Instructions</span>
                                    {isOpennote ? (
                                        <MinusCircle className="text-xl ml-1" />
                                    ) : (
                                        <CirclePlus className="text-xl ml-1" />
                                    )}
                                </AccordionTrigger>
                                <AccordionContent> 
                                    <input
                                        type="text"
                                        value={itemNote}
                                        onChange={(e) => setItemNote(e.target.value)}
                                        placeholder="Add special instructions"
                                        className="w-full border rounded-md p-2"
                                    />
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion> */}
            <input
              type="text"
              value={itemNote}
              onChange={e => setItemNote(e.target.value)}
              placeholder="Add special instructions"
              className="w-full border rounded-md p-2"
            />
          </div>
        </div>
        <DialogFooter className="flex flex-col sm:flex-row items-center gap-4 w-full mt-4">
          <div className="flex items-center justify-between rounded-md border w-40 sm:w-40">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
              className="h-[50px] w-10 hover:bg-transparent hover:text-black"
            >
              -
            </Button>
            <span className="mx-2 text-lg">{quantity}</span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setQuantity(prev => prev + 1)}
              className="h-[50px] w-10 hover:bg-transparent hover:text-black"
            >
              +
            </Button>
          </div>
          <Button
            onClick={handleAddToCart}
            className="flex-1 bg-[#008080] text-white text-lg h-[60px] px-20"
            disabled={isAddToCartDisabled()}
          >
            Add to Cart ${calculateTotalPrice().toFixed(2)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
