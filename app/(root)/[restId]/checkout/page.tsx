// @ts-nocheck
'use client'
import { useState, useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { SheetFooter } from '~/components/ui/sheet'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Button } from '~/components/ui/button'
import { Separator } from '~/components/ui/separator'
import { Textarea } from '~/components/ui/textarea'
import { Checkbox } from '~/components/ui/checkbox'
import Header from '../_components/header'
import Footer from '../_components/footer'
import Loading from '../_components/Loading'
import { MoveLeft, XIcon, MinusIcon, PlusIcon } from 'lucide-react'
import axios from 'axios'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'
import Toastify from 'toastify-js'
import { useRestaurant } from '~/hooks/use-restaurant'
const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL

export default function CheckoutPage() {
  const router = useRouter()
  const restaurant = useRestaurant(state => state.restaurant)
  const cart = useRestaurant(state => state.cart)
  const clearCart = useRestaurant(state => state.clearCart)
  const pickupInfo = useRestaurant(state => state.pickupInfo)
  const [modifierDetails, setModifierDetails] = useState({})
  const [customerInfo, setCustomerInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: { street: '', city: '', state: '', zipCode: '' },
  })
  const [printAreas, setPrintAreas] = useState([])
  const [error, setError] = useState('')
  const [errors, setErrors] = useState({})
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [loading, setLoading] = useState(false)
  const [tipPercentage, setTipPercentage] = useState(0)
  const [customTip, setCustomTip] = useState('')
  const [isTermsOpen, setIsTermsOpen] = useState(false)
  const [specialInstructions, setSpecialInstructions] = useState('')
  const [showSpecialInstructions, setShowSpecialInstructions] = useState(false)
  const [payAtRestaurant, setPayAtRestaurant] = useState(false)
  const removeFromCart = useRestaurant(state => state.removeFromCart)
  const updateCartQuantity = useRestaurant(state => state.updateCartQuantity)
  const [animatedItemId, setAnimatedItemId] = useState(null)
  const paymentSettings = {} //useAdmin((state) => state.paymentSettings);

  //const hasPaymentOptions = paymentSettings.cashOnDelivery || paymentSettings.nuvei;
  const hasPaymentOptions =
    restaurant?.data?.paymentSettings?.cashOnDelivery?.enabled ||
    restaurant?.data?.paymentSettings?.nuvei?.enabled

  const [productsWithTax, setProductsWithTax] = useState([])
  //console.log("Payment Setting Data in Checkout:", JSON.stringify(paymentSettings));
  const [isCustomTipOpen, setIsCustomTipOpen] = useState(false)
  const [isSticky, setIsSticky] = useState(false)
  //console.log("Restaurant Data paymentSettings",restaurant?.data?._id);
  // Sticky header effect
  useEffect(() => {
    const handleScrollEvent = () => {
      setIsSticky(window.scrollY > 50)
    }

    window.addEventListener('scroll', handleScrollEvent)
    return () => {
      window.removeEventListener('scroll', handleScrollEvent)
    }
  }, [])
  useEffect(() => {
    const loadModifiers = async () => {
      const allModifierIds = cart.flatMap(item => {
        return Object.values(item.modifiers).flat()
      })

      try {
        const details = await fetchModifierDetails([...new Set(allModifierIds)])
        const detailsMap = details.reduce((acc, detail) => {
          detail.data.forEach(modifier => {
            acc[modifier._id] = {
              name: modifier.name,
              priceAdjustment: modifier.priceAdjustment,
            }
          })
          return acc
        }, {})
        setModifierDetails(detailsMap)
      } catch (error) {
        console.error('Failed to fetch modifiers:', error)
      }
    }
    // const fetchProductDetails = async () => {
    //   const productIds = cart.map(item => item.id);
    //   try {
    //     // Fetch details for all products in the cart
    //     const productDetails = await Promise.all(
    //       productIds.map(id => axios.get(`${baseUrl}/product/getproducts/${productIds}`))
    //     );
    //     // Check each product for tax rule and enablement
    //     const productTaxData = productDetails.map(response => {
    //       const product = response.data;
    //       return {
    //         ...product,
    //         taxEnabled: product.taxRule?.taxEnable || false,  // Check if tax is enabled
    //         taxRate: product.taxRule?.amount || 0,  // Assuming `amount` is the tax rate (e.g., 13%)
    //       };
    //     });
    //     setProductsWithTax(productTaxData);
    //   } catch (error) {
    //     console.error('Error fetching product details:', error);
    //   }
    // };
    const fetchProductDetails = async () => {
      const productIds = cart.map(item => item.id) // Extract product IDs from the cart
      try {
        // Fetch details for all products in the cart
        const productDetails = await Promise.all(
          productIds.map(id =>
            axios.get(`${baseUrl}/product/getproducts/${id}`)
          ) // Fetch each product separately
        )

        // Now, for each product, you will map its tax data
        const productTaxData = productDetails.map(response => {
          const product = response.data.data // Get product details from API response
          return {
            id: product._id, // Assuming the product has an _id field
            taxEnabled: product.taxEnable ?? false, // Default to false if taxEnable is not available
            taxRate: product.taxRule, // Default to 0 if amount is not available
            webPrice: product.webprice || 0, // Assuming each product has a web price (adjust as necessary)
          }
        })

        // Set all product tax data
        setProductsWithTax(productTaxData)
      } catch (error) {
        console.error('Error fetching product details:', error)
      }
    }
    const fetchPrintAreaData = async () => {
      try {
        const response = await axios.get(
          `${baseUrl}/printarea/getprintareares/${restaurant?.data?._id}`
        )
        setPrintAreas(response.data.data) // Assuming response.data.data contains the print area data
        console.log('Fetched print areas:', response.data.data)
      } catch (error) {
        console.error('Failed to fetch print areas:', error)
      }
    }
    loadModifiers()
    fetchProductDetails()
    fetchPrintAreaData()
  }, [cart, restaurant?.data?._id])

  // Calculation Tax
  // const estimatedTax = cart.reduce((sum, item) => {
  //   // Find product with matching ID in productsWithTax
  //   const productWithTax = productsWithTax.find(product => product.id === item.id);
  //   if (productWithTax) {
  //     // Ensure tax is enabled for the product
  //     if (productWithTax.taxEnabled) {
  //       const basePrice = productWithTax.webPrice;  // Correct price field
  //       const quantity = item.quantity;
  //       let productTotal = basePrice * quantity;  // Calculate total for the item
  //      // Check if the product has a tax rate and it's percentage based
  //       if (productWithTax.taxRate && productWithTax.taxRate.tax_type === "percentage") {
  //         const taxRate = productWithTax.taxRate.amount;  // 13 is the tax rate in percentage

  //         // Apply tax calculation (percentage tax rate)
  //         const taxAmount = productTotal * (taxRate / 100);  // Multiply by percentage tax rate

  //         // Add the calculated tax to the total sum
  //         sum += taxAmount;
  //       }else{
  //         sum += productWithTax.taxRate.amount;
  //       }
  //     }
  //   }
  //   return sum;
  // }, 0);
  const estimatedTax = cart.reduce((sum, item) => {
    const productWithTax = productsWithTax.find(
      product => product.id === item.id
    )
    if (productWithTax) {
      if (productWithTax.taxEnabled) {
        let productTotal = productWithTax.webPrice * item.quantity

        // Apply price adjustments from modifiers
        if (item.modifiers && Object.keys(item.modifiers).length > 0) {
          Object.entries(item.modifiers).forEach(([key, ids]) => {
            ids.forEach(id => {
              const modifier = modifierDetails[id]
              if (modifier) {
                productTotal += modifier.priceAdjustment * item.quantity
              }
            })
          })
        }

        // Now calculate tax based on the total price (including modifier adjustments)
        if (
          productWithTax.taxRate &&
          productWithTax.taxRate.tax_type === 'percentage'
        ) {
          const taxAmount = productTotal * (productWithTax.taxRate.amount / 100)
          sum += taxAmount
        } else {
          sum += productWithTax.taxRate.amount // Flat tax rate (if applicable)
        }
      }
    }
    return sum
  }, 0)
  const fetchModifierDetails = async modifierIds => {
    const requests = modifierIds.map(async id => {
      const response = await axios.get(
        `${baseUrl}/modifers/getmodifierscartpage/${id}`
      )
      return response.data
    })
    return Promise.all(requests)
  }

  //const subtotal = cart.reduce((sum, item) => sum + item.quantity * parseFloat(item.price), 0);
  // const subtotal = cart.reduce((sum, item) => {
  //   const product = productsWithTax.find(product => product.id === item.id); // Find the product matching item.id
  //   if (product) {
  //     return sum + product.webPrice * item.quantity; // Add the price * quantity if product is found
  //   }
  //   return sum; // Return the sum unchanged if no matching product is found
  // }, 0);
  const subtotal = cart.reduce((sum, item) => {
    const product = productsWithTax.find(product => product.id === item.id) // Find the product matching item.id
    if (product) {
      // Calculate base price * quantity
      let productTotal = product.webPrice * item.quantity

      // Add modifier price adjustments
      if (item.modifiers && Object.keys(item.modifiers).length > 0) {
        Object.entries(item.modifiers).forEach(([key, ids]) => {
          ids.forEach(id => {
            const modifier = modifierDetails[id]
            if (modifier) {
              productTotal += modifier.priceAdjustment * item.quantity // Add modifier priceAdjustment
            }
          })
        })
      }

      sum += productTotal // Add the product total including modifiers
    }
    return sum
  }, 0)

  let taxamount = estimatedTax.toFixed(2)
  // const tax = subtotal * 0.13; // Assuming 13% tax
  const subtotaltax = parseFloat(subtotal) + parseFloat(estimatedTax.toFixed(2))
  const tipAmount = customTip
    ? parseFloat(customTip)
    : subtotal * (tipPercentage / 100)

  const total = parseFloat(subtotaltax) + parseFloat(tipAmount)

  const handleInputChange = e => {
    const { name, value } = e.target
    setCustomerInfo(prev => ({ ...prev, [name]: value }))
  }

  const handleAddressChange = e => {
    const { name, value } = e.target
    setCustomerInfo(prev => ({
      ...prev,
      address: { ...prev.address, [name]: value },
    }))
  }

  const handleTipChange = percentage => {
    setTipPercentage(percentage)
    setCustomTip('')
    setIsCustomTipOpen(false)
  }

  const handleCustomTipChange = e => {
    setCustomTip(e.target.value)
    setTipPercentage(0)
  }
  const handleCustombutton = customval => {
    setIsCustomTipOpen(customval)
    setTipPercentage(0)
  }
  //   const orderItems = cart.map(item => {
  //     // Log the item being processed
  //     console.log("Processing item:", item.modifiers);

  //     return {
  //         item: item.id, // Use 'item' instead of 'productId'
  //         quantity: item.quantity,
  //         price: parseFloat(item.price),
  //         modifiers: item.modifiers ? item.modifiers : [], // Ensure this is always an array
  //         itemNote: item.note || '', // Default to empty string if note is not provided
  //     };
  // });

  // Pay With Card
  const totalamount = total.toFixed(2)
  const subtotalamount = subtotal.toFixed(2)

  const handlePayment = async () => {
    // Ensure all required data is available
    const cardNumber = document.getElementById('cardNumber').value
    const expDate = document.getElementById('expDate').value
    const cvv = document.getElementById('cvv').value

    // Simple validation checks
    if (!cardNumber || !expDate || !cvv || !totalamount) {
      setError('Please fill out all required fields.')
      Toastify({
        text: 'Please fill out all required fields.',
        duration: 3000,
        close: true,
        gravity: 'top',
        position: 'right',
        backgroundColor: 'linear-gradient(to right, #FF5C5C, #FF3B3B)',
      }).showToast()
      return
    }

    // Validate card number (basic format check for simplicity)
    const cardNumberRegex = /^\d{16}$/
    if (!cardNumberRegex.test(cardNumber)) {
      setError('Please enter a valid 16-digit card number.')
      Toastify({
        text: 'Please enter a valid 16-digit card number.',
        duration: 3000,
        close: true,
        gravity: 'top',
        position: 'right',
        backgroundColor: 'linear-gradient(to right, #FF5C5C, #FF3B3B)',
      }).showToast()
      return
    }

    // Validate expiration date (MM/YY format)
    const expDateRegex = /^(0[1-9]|1[0-2])\/\d{2}$/
    if (!expDateRegex.test(expDate)) {
      setError('Please enter a valid expiration date in MM/YY format.')
      Toastify({
        text: 'Please enter a valid expiration date in MM/YY format.',
        duration: 3000,
        close: true,
        gravity: 'top',
        position: 'right',
        backgroundColor: 'linear-gradient(to right, #FF5C5C, #FF3B3B)',
      }).showToast()
      return
    }

    // Validate CVV (3 digits)
    const cvvRegex = /^\d{3}$/
    if (!cvvRegex.test(cvv)) {
      setError('Please enter a valid CVV.')
      Toastify({
        text: 'Please enter a valid CVV.',
        duration: 3000,
        close: true,
        gravity: 'top',
        position: 'right',
        backgroundColor: 'linear-gradient(to right, #FF5C5C, #FF3B3B)',
      }).showToast()
      return
    }
    const sessionToken = '' // Get your session token as needed
    const stateAbbreviations = {
      Alabama: 'AL',
      Alaska: 'AK',
      Arizona: 'AZ',
      Arkansas: 'AR',
      California: 'CA',
      Colorado: 'CO',
      Connecticut: 'CT',
      Delaware: 'DE',
      Florida: 'FL',
      Georgia: 'GA',
      Hawaii: 'HI',
      Idaho: 'ID',
      Illinois: 'IL',
      Indiana: 'IN',
      Iowa: 'IA',
      Kansas: 'KS',
      Kentucky: 'KY',
      Louisiana: 'LA',
      Maine: 'ME',
      Maryland: 'MD',
      Massachusetts: 'MA',
      Michigan: 'MI',
      Minnesota: 'MN',
      Mississippi: 'MS',
      Missouri: 'MO',
      Montana: 'MT',
      Nebraska: 'NE',
      Nevada: 'NV',
      'New Hampshire': 'NH',
      'New Jersey': 'NJ',
      'New Mexico': 'NM',
      'New York': 'NY',
      'North Carolina': 'NC',
      'North Dakota': 'ND',
      Ohio: 'OH',
      Oklahoma: 'OK',
      Oregon: 'OR',
      Pennsylvania: 'PA',
      'Rhode Island': 'RI',
      'South Carolina': 'SC',
      'South Dakota': 'SD',
      Tennessee: 'TN',
      Texas: 'TX',
      Utah: 'UT',
      Vermont: 'VT',
      Virginia: 'VA',
      Washington: 'WA',
      'West Virginia': 'WV',
      Wisconsin: 'WI',
      Wyoming: 'WY',
    }

    const state =
      stateAbbreviations[customerInfo.address.state] ||
      customerInfo.address.state.substring(0, 5)

    const paymentData = {
      amount: totalamount,
      currency: 'CAD',
      sessionToken,
      cardDetails: {
        cardNumber: document.getElementById('cardNumber').value,
        cardHolderName: `${customerInfo.firstName} ${customerInfo.lastName}`,
        // expirationMonth: document.getElementById("expDate").value.split('/')[0],
        // expirationYear: document.getElementById("expDate").value.split('/')[1],
        // CVV: document.getElementById("cvv").value,
        expirationMonth: expDate.split('/')[0],
        expirationYear: expDate.split('/')[1],
        CVV: cvv,
      },
      shippingAddress: {
        firstName: customerInfo.firstName,
        lastName: customerInfo.lastName,
        address: customerInfo.address.street,
        phone: customerInfo.phone,
        zip: customerInfo.address.zipCode,
        city: customerInfo.address.city,
        country: '',
        state,
        email: customerInfo.email,
      },
      billingAddress: {
        firstName: customerInfo.firstName,
        lastName: customerInfo.lastName,
        address: customerInfo.address.street,
        phone: customerInfo.phone,
        zip: customerInfo.address.zipCode,
        city: customerInfo.address.city,
        country: '',
        state,
        email: customerInfo.email,
      },
      dynamicDescriptor: {
        merchantdetails: paymentSettings,
        merchantPhone: '',
        storedetails: restaurant?.data?._id,
      },
      deviceIp: '192.168.1.11',
    }

    try {
      const paymentResponse = await axios.post(
        `${baseUrl}/nuvie/createpayment`,
        paymentData
      )

      console.log('Payment Response:', paymentResponse.data) // Log to check response structure

      if (paymentResponse.data.success) {
        return paymentResponse.data.data.paymentRecordId // Return the paymentRecordId from the response
      } else {
        setError('Payment failed. Please try again.')
        Toastify({
          text: 'Payment failed. Please try again.',
          duration: 3000,
          close: true,
          gravity: 'top',
          position: 'right',
          backgroundColor: 'linear-gradient(to right, #FF5C5C, #FF3B3B)',
        }).showToast()
        return null // Return null if payment fails
      }
    } catch (error) {
      console.error('Payment error:', error)
      setError('Error processing payment. Please try again.')
      Toastify({
        text: 'Error processing payment. Please try again.',
        duration: 3000,
        close: true,
        gravity: 'top',
        position: 'right',
        backgroundColor: 'linear-gradient(to right, #FF5C5C, #FF3B3B)',
      }).showToast()

      return null // Return null in case of error
    }
  }
  // Canadian phone number regex (validates 10 digits and optional hyphens or spaces)
  const canadaPhoneRegex = /^(?:\+1\s?)?(\d{3})[-.\s]?\d{3}[-.\s]?\d{4}$/
  // Handle Submit
  const handleSubmit = async e => {
    e.preventDefault()
    setLoading(true)
    const newErrors = {}
    if (!customerInfo.firstName) newErrors.firstName = 'First name is required.'
    if (!customerInfo.lastName) newErrors.lastName = 'Last name is required.'
    if (!customerInfo.email) newErrors.email = 'Email is required.'

    // Canadian phone number validation
    if (!customerInfo.phone) {
      newErrors.phone = 'Phone number is required.'
    } else if (!canadaPhoneRegex.test(customerInfo.phone)) {
      newErrors.phone = 'Please enter a valid Canadian phone number.'
    }

    setErrors(newErrors)
    // If no errors, proceed with form submission
    if (Object.keys(newErrors).length === 0) {
      setLoading(true)
      // Place order logic here...
      setLoading(false) // reset loading state after submission
    }
    setError('')
    // Validate customer info
    if (
      !customerInfo.firstName ||
      !customerInfo.lastName ||
      !customerInfo.email ||
      !customerInfo.phone
    ) {
      setError('Please fill out all fields.')
      setLoading(false)
      return
    }

    try {
      // Check if customer exists by phone, createdBy, and restaurant
      let customerId
      try {
        setLoading(true)
        const customerCheckResponse = await axios.get(
          `${baseUrl}/customer/checkCustomer`,
          {
            params: {
              phone: customerInfo.phone,
              createdBy: restaurant.data.createdBy,
              restaurant: restaurant.data._id,
            },
          }
        )

        if (
          customerCheckResponse.status === 200 &&
          customerCheckResponse.data?.success
        ) {
          // Customer exists, use the existing customer
          customerId = customerCheckResponse.data.data._id
          console.log('Existing Customer ID:', customerId)
          // Optionally, update the customer information here if needed
          const customerUpdateResponse = await axios.put(
            `${baseUrl}/customer/updatewebcustomer/${customerId}`,
            {
              firstName: customerInfo.firstName,
              lastName: customerInfo.lastName,
              customertype: 'R',
              email: customerInfo.email,
              phone: customerInfo.phone,
              address: customerInfo.address,
              createdBy: restaurant.data.createdBy,
              restaurant: restaurant.data._id,
            }
          )

          console.log('Updated Customer:', customerUpdateResponse.data)
        } else {
          // Customer doesn't exist, create a new customer
          console.log('Creating new customer...')
          const customerResponse = await axios.post(
            `${baseUrl}/customer/createwebcustomer`,
            {
              firstName: customerInfo.firstName,
              lastName: customerInfo.lastName,
              customertype: 'N',
              email: customerInfo.email,
              phone: customerInfo.phone,
              address: customerInfo.address,
              createdBy: restaurant.data.createdBy,
              restaurant: restaurant.data._id,
            }
          )

          customerId = customerResponse.data.data._id
          console.log('New Customer Created with ID:', customerId)
        }
      } catch (error) {
        setLoading(true)
        console.log('Creating new customer...', error)
        const customerResponse = await axios.post(
          `${baseUrl}/customer/createwebcustomer`,
          {
            firstName: customerInfo.firstName,
            lastName: customerInfo.lastName,
            customertype: 'N',
            email: customerInfo.email,
            phone: customerInfo.phone,
            address: customerInfo.address,
            createdBy: restaurant.data.createdBy,
            restaurant: restaurant.data._id,
          }
        )
        customerId = customerResponse.data.data._id
        console.log('New Customer Created with ID:', customerId)
      }

      // Create Order
      if (customerId) {
        setLoading(true)
        let splitPayments = [
          {
            method: 'Card',
            amount: 0,
          },
          {
            method: 'Cash',
            amount: 0,
          },
        ]
        if (paymentMethod === 'Card') {
          splitPayments = [
            {
              method: 'Card',
              amount: totalamount,
            },
            {
              method: 'Cash',
              amount: 0,
            },
          ]
        } else {
          splitPayments = [
            {
              method: 'Card',
              amount: 0,
            },
            {
              method: 'Cash',
              amount: totalamount,
            },
          ]
        }
        console.log('Customer ID: ', customerId)
        const orderNumber = `ORD-${new Date().getTime()}`
        let paymentType = 'Pay at Restaurant'
        let paymentstatus = 'Pending'
        if (paymentMethod === 'Card') {
          paymentType = 'Card'
          paymentstatus = 'Paid'
        }
        const orderData = {
          orderNumber,
          date: new Date().toISOString(),
          storedetails: restaurant.data._id,
          customer: customerId,
          orderType: 'Pickup',
          origin: 'Online',
          payments: splitPayments,
          paymentStatus: paymentstatus, //paymentMethod ? "Paid" : "Pending",
          subtotal: subtotalamount,
          total: totalamount,
          tip: tipAmount.toFixed(2),
          tax: taxamount,
          status: 'Pending',
          email: customerInfo.email,
          items: cart.map(item => {
            const transformedModifiers = Object.values(
              item.modifiers || {}
            ).flat()
            let single_item_price =
              parseFloat(item.price) / parseFloat(item.quantity)
            console.log(single_item_price)
            return {
              item: item.id,
              quantity: item.quantity,
              price: single_item_price.toFixed(2),
              modifiers:
                transformedModifiers.length > 0 ? transformedModifiers : [],
              itemNote: item.note || '',
              printstatus: 'true',
            }
          }),
          createdBy: restaurant.data.createdBy,
          pickupInfo: {
            orderType: pickupInfo.orderType,
            pickupTime: `${pickupInfo.selectedTime}-${pickupInfo.orderTime}`,
            selectedDate: pickupInfo.selectedDate,
          },
          //paymentMethod: payAtRestaurant ? "Pay at Restaurant" : paymentMethod,
          paymentMethod: paymentType,
          specialInstructions,
        }

        // Handle payment processing if not paying at restaurant
        let nuviePaymentInfoId = null
        if (!payAtRestaurant && paymentMethod === 'Card') {
          nuviePaymentInfoId = await handlePayment()
          console.log('Processed Payment Info ID:', nuviePaymentInfoId)

          if (!nuviePaymentInfoId) {
            setError('Payment processing failed. Please try again.')
            setLoading(false)
            return
          }
        }

        // Save order data with nuviepaymentinfo
        const orderResponse = await axios.post(
          `${baseUrl}/orders/createweborders`,
          {
            ...orderData,
            nuviepaymentinfo: nuviePaymentInfoId || null, // Link to Nuvei payment info
          }
        )

        console.log('Order Response:', orderResponse) // Log to verify

        // Send the order print request after order creation
        if (restaurant?.data?.autoPrintKitchenReceipt === true) {
          if (orderResponse.status === 201) {
            try {
              // for (let printArea of printAreas) {
              //   const { name, slug_name, selectedRestaurants } = printArea;
              //   // Check if the restaurant's ID matches any of the selected restaurants for this print area
              //   if (selectedRestaurants.includes(restaurant.data._id)) {

              //     // Construct the URL based on the restaurant's slug and the print area's name
              //     const printUrl = `${baseUrl}/starcloudprnt/${restaurant.data.url_slug}/${slug_name}`;
              //     console.log("Sending print job to:", printUrl);

              //     // Make the request to the print API
              //     const printResponse = await axios.post(printUrl, printData);

              //     if (printResponse.status === 200) {
              //       console.log("Print job created successfully", printResponse.data);
              //     } else {
              //       console.error("Failed to create print job:", printResponse.data);
              //     }
              //   } else {
              //     console.log(`Restaurant ${restaurant.data.url_slug} is not associated with print area ${name}`);
              //   }
              // }

              for (let printArea of printAreas) {
                const { name, slug_name, selectedRestaurants, allowReceipt } =
                  printArea
                const printData = {
                  uniqueID: orderResponse.data.data._id, // Order ID
                  printtype: 'kitchen',
                  printingInProgress: false,
                  printarea_name: slug_name,
                  statusCode: '200%20OK',
                }
                // Ensure the print area is assigned to this restaurant
                if (selectedRestaurants.includes(restaurant.data._id)) {
                  // Check if the print area allows 'kitchen' receipts only
                  if (
                    allowReceipt.includes('kitchen') &&
                    allowReceipt.length === 1
                  ) {
                    // Construct the print URL
                    const printUrl = `${baseUrl}/starcloudprnt/${restaurant.data.url_slug}/${slug_name}`
                    console.log('Sending print job to:', printUrl)

                    try {
                      // Send the print request
                      const printResponse = await axios.post(
                        printUrl,
                        printData
                      )

                      if (printResponse.status === 200) {
                        console.log(
                          'Print job created successfully',
                          printResponse.data
                        )
                      } else {
                        console.error(
                          'Failed to create print job:',
                          printResponse.data
                        )
                      }
                    } catch (error) {
                      console.error('Error while sending print job:', error)
                    }
                  } else {
                    console.log(
                      `Print area ${name} does not allow 'kitchen' only.`
                    )
                  }
                } else {
                  console.log(
                    `Restaurant ${restaurant.data.url_slug} is not associated with print area ${name}`
                  )
                }
              }
              // Contact List
              const customerdata_list = await axios.post(
                `${baseUrl}/contactlist/`,
                {
                  firstName: customerInfo?.firstName,
                  lastName: customerInfo?.lastName,
                  customertype: 'N',
                  email: customerInfo?.email,
                  phone: customerInfo?.phone,
                  address: customerInfo?.address,
                  createdBy: restaurant?.data?.createdBy,
                  store_id: restaurant?.data?._id,
                }
              )
              console.log('Customer List:', customerdata_list)
            } catch (printError) {
              console.error('Error printing order:', printError)
            }
          }
        }
        // Clear cart and reset customer info
        clearCart()
        setCustomerInfo({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          address: { street: '', city: '', state: '', zipCode: '' },
        })
        Toastify({
          text: 'Order created successfully',
          duration: 3000,
          close: true,
          gravity: 'top',
          position: 'right',
          backgroundColor: 'linear-gradient(to right, #00b09b, #96c93d)',
        }).showToast()
        router.push(`thankyou/?oid=${orderResponse.data.data.orderNumber}`)
        //setLoading(false);
      }
    } catch (error) {
      console.error('Error creating customer or order:', error)
      const errorMessage =
        error.response?.data?.message ||
        'Failed to place the order. Please try again.'
      setError(errorMessage)
      Toastify({
        text: errorMessage,
        duration: 3000,
        close: true,
        gravity: 'top',
        position: 'right',
        backgroundColor: 'linear-gradient(to right, #FF5C5C, #FF3B3B)',
      }).showToast()
    } finally {
      setLoading(false)
    }
  }
  const generateSessionToken = async () => {
    const response = await axios.post(`${baseUrl}/nuvie/generatesessiontoken`, {
      /* required parameters */
    })
    return response.data.sessionToken
  }
  useEffect(() => {
    if (!restaurant || !cart || cart.length === 0) {
      const restaurant_local = JSON.parse(localStorage.getItem('restaurant'))

      // Check if the restaurant is available in localStorage
      if (restaurant_local) {
        let url_slug = '/' + restaurant_local.data.url_slug
        // Set a timeout to redirect after 30 seconds
        const timeout = setTimeout(() => {
          router.push(url_slug)
        }, 3000)
        // 30 seconds
        // Cleanup the timeout if the component is unmounted before the redirect happens
        return () => clearTimeout(timeout)
      }
    }
  }, [restaurant, cart, router])
  if (!restaurant || !cart || cart.length === 0) {
    return (
      <>
        <main className="flex min-h-screen flex-col items-center justify-between p-2">
          <Loading />
        </main>
      </>
    )
  }
  const pickupInfo_local = JSON.parse(localStorage.getItem('pickupInfo'))
  // Check if cartTotal is eligible for checkout based on minimumOrderValue
  if (!restaurant.data.minimumOrderValue) {
    setLoading(true)
  }
  const isEligibleForCheckout = total >= restaurant.data.minimumOrderValue

  const calculateTip = () => {
    if (tipPercentage === 0 && customTip) {
      return parseFloat(customTip) // If custom tip is entered, use that value
    }
    return (subtotalamount * (tipPercentage / 100)).toFixed(2) // For preset tips, calculate based on subtotal
  }
  //Generate Unique Key
  const generateUniqueKey = (productId, modifiers) => {
    const modifierString = Object.entries(modifiers)
      .sort()
      .map(([key, values]) => {
        return `${key}:${values.sort().join(',')}`
      })
      .join('|')
    return `${productId}_${modifierString}`
  }
  const updateQuantity = (id, change) => {
    // Find the unique item based on the uniqueKey
    const item = cart.find(item => item.uniqueKey === id)
    if (item) {
      const updatedQuantity = item.quantity + change
      // Ensure quantity doesn't go below 1
      if (updatedQuantity > 0) {
        updateCartQuantity(id, updatedQuantity) // Update cart quantity
        setAnimatedItemId(id) // Optionally add animation for the updated item
      }
    }
  }
  return (
    <>
      <Suspense fallback={<Loading />}>
        <Header />
        <div className="container mx-auto px-4 py-8">
          <Button
            onClick={() => router.push('/' + restaurant.data.url_slug)}
            className="mb-4 selected-button"
          >
            <MoveLeft className=" gap-8" /> Back to Menu
          </Button>
          {error && (
            <div className="text-red-500" role="alert">
              {error}
            </div>
          )}
          <div className="container mx-auto p-6 checkmob">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <Card className="w-full p-6 rounded-2xl shadow-lg check2">
                  <CardHeader>
                    <CardTitle>Customer Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <form onSubmit={handleSubmit}>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="firstName">First Name</Label>
                          <Input
                            id="firstName"
                            name="firstName"
                            value={customerInfo.firstName}
                            onChange={handleInputChange}
                            placeholder="Enter First Name"
                            required
                          />
                          {errors.firstName && (
                            <p className="text-red-500 text-xs">
                              {errors.firstName}
                            </p>
                          )}
                        </div>
                        <div>
                          <Label htmlFor="lastName">Last Name</Label>
                          <Input
                            id="lastName"
                            name="lastName"
                            value={customerInfo.lastName}
                            onChange={handleInputChange}
                            placeholder="Enter Last Name"
                            required
                          />
                          {errors.lastName && (
                            <p className="text-red-500 text-xs">
                              {errors.lastName}
                            </p>
                          )}
                        </div>
                      </div>
                      <div class="check11">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={customerInfo.email}
                          onChange={handleInputChange}
                          placeholder="Enter Email"
                          required
                        />
                        {errors.email && (
                          <p className="text-red-500 text-xs">{errors.email}</p>
                        )}
                      </div>
                      <div class="check11">
                        <Label htmlFor="phone">Phone</Label>
                        <Input
                          id="phone"
                          name="phone"
                          type="tel"
                          value={customerInfo.phone}
                          onChange={handleInputChange}
                          placeholder="Enter Phone Number"
                          required
                        />
                        {errors.phone && (
                          <p className="text-red-500 text-xs">{errors.phone}</p>
                        )}
                      </div>
                      {/* <div>
                      <Label>Address</Label>
                      <div className="grid gap-4">
                        <Input name="street" placeholder="Street Address" value={customerInfo.address.street} onChange={handleAddressChange} required />
                        <Input name="city" placeholder="City" value={customerInfo.address.city} onChange={handleAddressChange} required />
                        <Input name="state" placeholder="State" value={customerInfo.address.state} onChange={handleAddressChange} required />
                        <Input name="zipCode" placeholder="Zip Code" value={customerInfo.address.zipCode} onChange={handleAddressChange} required />
                      </div>
                    </div> */}
                      {restaurant?.data?.checkoutpage_tip_option && (
                        <div className="overflow-auto text-ellipsis check11">
                          <Label>Tip</Label>
                          <div className="flex gap-2 mt-2 tipscrolll">
                            {/* Preset Tip Buttons */}
                            {[0, 10, 15, 18, 20].map(percentage => (
                              <Button
                                key={percentage}
                                type="button"
                                onClick={() => handleTipChange(percentage)}
                                variant={
                                  tipPercentage === percentage &&
                                  !isCustomTipOpen
                                    ? 'default'
                                    : 'outline'
                                }
                                className={
                                  tipPercentage === percentage &&
                                  !isCustomTipOpen
                                    ? 'selected-button'
                                    : ''
                                }
                              >
                                {percentage === 0
                                  ? 'None'
                                  : `${percentage}% ($${(
                                      subtotalamount *
                                      (percentage / 100)
                                    ).toFixed(2)})`}
                              </Button>
                            ))}

                            {/* Custom Tip Button */}
                            <Button
                              type="button"
                              onClick={() =>
                                handleCustombutton(!isCustomTipOpen)
                              }
                              variant={isCustomTipOpen ? 'default' : 'outline'}
                              className={
                                isCustomTipOpen ? 'selected-button' : ''
                              }
                            >
                              Custom Tip
                            </Button>
                          </div>

                          {/* Custom Tip Input */}
                          {isCustomTipOpen && (
                            <div className="mt-2">
                              <input
                                type="number"
                                value={customTip}
                                onChange={handleCustomTipChange}
                                placeholder="Enter custom tip"
                                className="border p-2"
                              />
                            </div>
                          )}

                          {/* Display the Calculated Tip */}
                          <div className="mt-2">
                            <p>Calculated Tip: ${calculateTip()}</p>
                          </div>
                        </div>
                      )}

                      <div className="mt-4">
                        <span
                          onClick={() =>
                            setShowSpecialInstructions(!showSpecialInstructions)
                          }
                          variant="outline"
                          className="w-full justify-start"
                        >
                          Special Instructions{' '}
                          {showSpecialInstructions ? '-' : '+'}
                        </span>
                        {showSpecialInstructions && (
                          <Textarea
                            placeholder="Notes about your  order, e.g. special notes for delivery."
                            className="mt-2"
                            value={specialInstructions}
                            onChange={e =>
                              setSpecialInstructions(e.target.value)
                            }
                          />
                        )}
                      </div>
                      {restaurant?.data?.paymentSettings?.cashOnDelivery
                        ?.enabled ||
                        (restaurant?.data?.paymentSettings?.nuvei?.enabled && (
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="payAtRestaurant"
                              checked={payAtRestaurant}
                              onCheckedChange={setPayAtRestaurant}
                            />
                            <label
                              htmlFor="payAtRestaurant"
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              Pay at Restaurant
                            </label>
                          </div>
                        ))}
                      {!payAtRestaurant && (
                        <div class="check11">
                          {hasPaymentOptions ? (
                            <>
                              <Label>Payment Method</Label>
                              {/* Cash on Delivery Option */}
                              {restaurant?.data?.paymentSettings?.cashOnDelivery
                                ?.enabled && (
                                <div className="flex items-center mb-2">
                                  <input
                                    type="radio"
                                    id="cash"
                                    name="paymentMethod"
                                    value="Cash"
                                    checked={paymentMethod === 'Cash'}
                                    onChange={() => setPaymentMethod('Cash')}
                                  />
                                  <Label htmlFor="cash" className="ml-2">
                                    Pay At Restaurant
                                  </Label>
                                </div>
                              )}

                              {/* Credit/Debit Card Option */}
                              {restaurant?.data?.paymentSettings?.nuvei
                                ?.enabled && (
                                <div className="flex items-center mb-2">
                                  <input
                                    type="radio"
                                    id="card"
                                    name="paymentMethod"
                                    value="Card"
                                    checked={paymentMethod === 'Card'}
                                    onChange={() => setPaymentMethod('Card')}
                                  />
                                  <Label htmlFor="card" className="ml-2">
                                    Credit/Debit Card
                                  </Label>
                                </div>
                              )}
                            </>
                          ) : (
                            <Label>Payment Method Not Enabled</Label>
                          )}
                        </div>
                      )}
                      {!payAtRestaurant && paymentMethod === 'Card' && (
                        <>
                          <div>
                            <Label htmlFor="cardNumber">Card Number</Label>
                            <Input
                              id="cardNumber"
                              placeholder="1234 5678 9012 3456"
                              required
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="expDate">Expiration Date</Label>
                              <Input
                                id="expDate"
                                placeholder="MM/YY"
                                required
                              />
                            </div>
                            <div>
                              <Label htmlFor="cvv">CVV</Label>
                              <Input id="cvv" placeholder="123" required />
                            </div>
                          </div>
                        </>
                      )}
                      <div className="text-sm text-gray-500">
                        Your personal data will be used to process your order,
                        support your experience throughout this website, and for
                        other purposes described in our{' '}
                        <button
                          type="button"
                          className="text-blue-500 hover:underline"
                          onClick={() => setIsTermsOpen(true)}
                        >
                          privacy policy
                        </button>
                        .
                      </div>
                      {/* Checkout Button and Tooltip for Minimum Order */}
                      <SheetFooter>
                        {!isEligibleForCheckout &&
                          pickupInfo_local.selectedTime && (
                            <div className="text-red-500 text-sm mb-2">
                              Minimum order value is $
                              {restaurant.data.minimumOrderValue}. Please add
                              more items to proceed.
                            </div>
                          )}

                        {!pickupInfo_local.selectedTime && (
                          <div className="text-red-500 text-sm mb-2">
                            Please Selected Your Pickup Time
                          </div>
                        )}
                        {loading && <Loading />}
                        <div
                          className={`transition-transform duration-300 ease-in-out px-4 py-2 ${
                            isSticky
                              ? 'fixed bottom-0 left-0 w-full z-50 bg-white shadow-md md:max-w-2xl md:left-1/2 md:transform md:-translate-x-1/2'
                              : 'relative'
                          }`}
                        >
                          <Button
                            type="submit"
                            className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 px-4 rounded-md transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={
                              loading ||
                              !isEligibleForCheckout ||
                              !pickupInfo_local.selectedTime
                            }
                          >
                            {loading ? 'Placing Order...' : 'Place Order'}
                          </Button>
                        </div>
                      </SheetFooter>
                    </form>
                  </CardContent>
                </Card>
              </div>
              <div>
                <Card className="w-full p-6 rounded-2xl shadow-lg checkmob ">
                  <CardHeader>
                    <CardTitle>Your order</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="w-full">
                      <div className="mb-4 sm:items-center">
                        <h2 className="text-lg font-bold">
                          Pickup Information
                        </h2>
                        <div className="text-gray-700">
                          <p>
                            <strong>Order Type:</strong> {pickupInfo.orderType}
                          </p>
                          {/* <p><strong>Pickup Time:</strong> {pickupInfo.orderTime}</p> */}
                          <p>
                            <strong>Pickup Time:</strong>{' '}
                            {pickupInfo.selectedTime}
                          </p>
                          <p>
                            <strong>Date:</strong> {pickupInfo.selectedDate}
                          </p>
                        </div>
                      </div>
                      {cart.map(item => {
                        const uniqueKey = generateUniqueKey(
                          item.id,
                          item.modifiers
                        )
                        //let singleunitprice = item.price/item.quantity;
                        const singleunitprice = productsWithTax.find(
                          product => product.id === item.id
                        )
                        //console.log("Cart Item Data ",item);
                        return (
                          <div
                            key={uniqueKey}
                            className={`p-0 border-b border-gray-200 bg-white rounded-lg shadow-sm transition-all duration-300 itemboxmob
                  ${animatedItemId === uniqueKey ? 'bg-green-100' : ''}`}
                          >
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start sm:items-center">
                              {/* Item Info */}
                              <div className="flex flex-col sm:flex-row sm:items-center">
                                <div className="text-lg font-medium">
                                  {item.name}
                                </div>
                                {item.note && (
                                  <p className="text-sm text-gray-600 mt-1 sm:ml-4">
                                    <strong>Note:</strong> {item.note}
                                  </p>
                                )}
                              </div>
                              {/* Price */}
                              <div className="text-gray-700 text-sm">
                                <span className="font-semibold">Price:</span> $
                                {item?.price?.toFixed(2)}
                              </div>
                              {/**
                               * Modifiers Details
                               */}
                              {item.modifiers &&
                                Object.keys(item.modifiers).length > 0 && (
                                  <div className="text-gray-500 text-sm">
                                    {Object.entries(item.modifiers).map(
                                      ([key, ids]) => (
                                        <div key={key} className="mb-1">
                                          <strong>{key}:</strong>
                                          <div className="ml-4">
                                            {ids.map(id => {
                                              const modifier =
                                                modifierDetails[id]
                                              return (
                                                <div
                                                  key={id}
                                                  className="text-gray-600"
                                                >
                                                  {modifier
                                                    ? `${modifier.name} (+$${modifier.priceAdjustment})`
                                                    : id}
                                                </div>
                                              )
                                            })}
                                          </div>
                                        </div>
                                      )
                                    )}
                                  </div>
                                )}
                            </div>
                            <div className="flex items-center space-x-2 quanmob">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateQuantity(uniqueKey, -1)}
                              >
                                <MinusIcon className="h-4 w-4" />
                              </Button>
                              <span className="w-8 text-center font-medium">
                                {item.quantity}
                              </span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateQuantity(uniqueKey, 1)}
                              >
                                <PlusIcon className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeFromCart(uniqueKey)}
                              >
                                <XIcon className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    <Separator className="my-4" />
                    <div className="mt-4 space-y-2">
                      <div className="flex justify-between">
                        <span>Subtotal</span>
                        <span>${subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tax</span>
                        <span>${estimatedTax.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tip</span>
                        <span>${tipAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total</span>
                        <span>${totalamount}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          {/** Terms and Condetions Data */}
          <Dialog open={isTermsOpen} onOpenChange={setIsTermsOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Privacy Policy</DialogTitle>
                <DialogDescription>
                  Please read our privacy policy carefully before placing your
                  order.
                </DialogDescription>
              </DialogHeader>
              <div className="mt-4 max-h-[60vh] overflow-y-auto">
                <h3 className="text-lg font-semibold mb-2">
                  1. Information Collection
                </h3>
                <p className="mb-4">
                  We collect personal information that you provide to us, such
                  as your name, address, email address, and payment information
                  when you place an order.
                </p>
                <h3 className="text-lg font-semibold mb-2">
                  2. Use of Information
                </h3>
                <p className="mb-4">
                  We use the information we collect to process your orders,
                  provide customer service, and improve our services.
                </p>
                <h3 className="text-lg font-semibold mb-2">
                  3. Information Sharing
                </h3>
                <p className="mb-4">
                  We do not sell or rent your personal information to third
                  parties. We may share your information with service providers
                  who assist us in operating our website and conducting our
                  business.
                </p>
                <h3 className="text-lg font-semibold mb-2">4. Data Security</h3>
                <p className="mb-4">
                  We implement a variety of security measures to maintain the
                  safety of your personal information.
                </p>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <Footer />
      </Suspense>
    </>
  )
}
